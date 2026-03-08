import sys
import os
import json
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from typing import AsyncGenerator

from dotenv import load_dotenv
load_dotenv()

# ── Add backend/ and deploy/ to path ─────────────────────────────────────────
BACKEND_DIR = Path(__file__).parent
DEPLOY_DIR  = BACKEND_DIR.parent / "deploy"
sys.path.insert(0, str(BACKEND_DIR))   # keep auth/session/models findable after chdir
sys.path.insert(0, str(DEPLOY_DIR))
os.chdir(str(DEPLOY_DIR))              # PDFs + ChromaDB dirs live here

import trail_4 as calm

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from auth    import get_current_user
from session import get_session, save_session, reset_session
from models  import UserOut, ChatRequest, StudentStateOut, BKTState, ChapterRequest, ModeRequest

# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="CALM API", version="1.0.0", description="Cognitive Apprenticeship via LLMs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mastery_to_level(mastery: float) -> tuple[int, str]:
    thresholds = [
        (0.20, 1, "Intuitive Primitive"),
        (0.35, 2, "Formal Axiomatic"),
        (0.50, 3, "Visualization"),
        (0.65, 4, "Heuristic Deconstruction"),
        (0.80, 5, "Heavyweight Synthesis"),
        (0.92, 6, "Theoretical Convergence"),
        (1.01, 7, "Frontier Research"),
    ]
    for threshold, lvl, label in thresholds:
        if mastery < threshold:
            return lvl, label
    return 7, "Frontier Research"


# ── Auth Routes ───────────────────────────────────────────────────────────────
# Register / Login are handled by Supabase directly from the frontend.
# This endpoint just validates the token and returns the current user.

@app.get("/auth/me", response_model=UserOut, tags=["auth"])
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user.get("full_name", ""),
    )


# ── Student State Routes ──────────────────────────────────────────────────────

@app.get("/student/state", response_model=StudentStateOut, tags=["student"])
async def student_state(current_user: dict = Depends(get_current_user)):
    sess    = get_session(current_user["username"])
    concept_all = sess["student_concept_all"]
    data    = sess["data_student"]
    current_ch  = data.get("current_chapter") or calm.CHAPTERS[0]
    concept     = concept_all.get(current_ch, {"P_mastery": 0.10, "P_guess": 0.25, "P_slip": 0.10})
    level, label = _mastery_to_level(concept["P_mastery"])
    return StudentStateOut(
        bkt=BKTState(**concept),
        chapter_mastery=concept_all,
        level=level,
        level_label=label,
        current_chapter=current_ch,
        following_action=data.get("following_action") or "",
        streak_days=sess.get("streak_days", 1),
        total_hints=sess.get("total_hints", 0),
        learning_mode=data.get("learning_mode", True),
    )


@app.post("/student/reset", tags=["student"])
async def student_reset(current_user: dict = Depends(get_current_user)):
    reset_session(current_user["username"])
    return {"message": "Session reset successfully"}


@app.patch("/student/chapter", response_model=StudentStateOut, tags=["student"])
async def student_set_chapter(
    body: ChapterRequest,
    current_user: dict = Depends(get_current_user),
):
    if body.chapter not in calm.CHAPTERS:
        raise HTTPException(status_code=400, detail=f"Unknown chapter: {body.chapter}")
    sess = get_session(current_user["username"])
    sess["data_student"]["current_chapter"] = body.chapter
    sess["data_student"]["following_action"] = ""
    save_session(current_user["username"])
    concept_all = sess["student_concept_all"]
    concept     = concept_all.get(body.chapter, {"P_mastery": 0.10, "P_guess": 0.25, "P_slip": 0.10})
    level, label = _mastery_to_level(concept["P_mastery"])
    return StudentStateOut(
        bkt=BKTState(**concept),
        chapter_mastery=concept_all,
        level=level,
        level_label=label,
        current_chapter=body.chapter,
        following_action="",
        streak_days=sess.get("streak_days", 1),
        total_hints=sess.get("total_hints", 0),
        learning_mode=sess["data_student"].get("learning_mode", True),
    )


@app.patch("/student/mode", response_model=StudentStateOut, tags=["student"])
async def student_set_mode(
    body: ModeRequest,
    current_user: dict = Depends(get_current_user),
):
    sess = get_session(current_user["username"])
    sess["data_student"]["learning_mode"] = body.learning_mode
    save_session(current_user["username"])
    concept_all = sess["student_concept_all"]
    data        = sess["data_student"]
    current_ch  = data.get("current_chapter") or calm.CHAPTERS[0]
    concept     = concept_all.get(current_ch, {"P_mastery": 0.10, "P_guess": 0.25, "P_slip": 0.10})
    level, label = _mastery_to_level(concept["P_mastery"])
    return StudentStateOut(
        bkt=BKTState(**concept),
        chapter_mastery=concept_all,
        level=level,
        level_label=label,
        current_chapter=current_ch,
        following_action=data.get("following_action") or "",
        streak_days=sess.get("streak_days", 1),
        total_hints=sess.get("total_hints", 0),
        learning_mode=body.learning_mode,
    )


# ── Chat History ──────────────────────────────────────────────────────────────

@app.get("/chat/history", tags=["chat"])
async def chat_history(current_user: dict = Depends(get_current_user)):
    sess = get_session(current_user["username"])
    return {"history": sess["chat_history"]}


# ── Streaming Chat ────────────────────────────────────────────────────────────

async def _stream_response(username: str, user_input: str, learning_mode: bool = True) -> AsyncGenerator[dict, None]:
    sess                = get_session(username)
    chat_history        = sess["chat_history"]
    student_concept_all = sess["student_concept_all"]
    data_student        = sess["data_student"]
    # Keep session in sync with whatever the client sent
    data_student["learning_mode"] = learning_mode

    loop = asyncio.get_running_loop()

    # ── Phase 1: Prep (chapter select, BKT update, controller routing) ────────
    # prepare_chat() does everything except the final tutor/normal LLM call.
    # Run it in a thread so we can send keepalive pings while it works.
    prep_future = loop.run_in_executor(
        None,
        lambda: calm.prepare_chat(user_input, chat_history, student_concept_all, data_student)
    )

    while not prep_future.done():
        yield {"event": "ping", "data": ""}
        done_set, _ = await asyncio.wait({prep_future}, timeout=3.0)
        if done_set:
            break

    try:
        prep = prep_future.result()
    except Exception as exc:
        yield {"event": "token", "data": f"[Error during preparation: {exc}]"}
        yield {"event": "done",  "data": "[DONE]"}
        return

    updated_concept_all = prep["student_concept_all"]
    updated_concept     = prep["current_concept"]
    updated_data        = prep["data_student"]
    control             = prep["control"]
    mode            = control.get("mode", "TUTOR_MODE")

    # Override to direct-answer mode if student has disabled Socratic learning
    # Use the request-level flag (authoritative) rather than session state alone
    if not learning_mode and mode == "TUTOR_MODE":
        mode = "DIRECT_MODE"

    # ── Phase 2: Stream the final LLM response token-by-token ─────────────────
    # astream() yields tokens as the model generates them — no waiting for the
    # full response. This also preserves markdown formatting naturally.
    if mode == "TUTOR_MODE":
        stream_chain = calm.tutor_chain
        chain_input  = {
            "prompt_user": user_input,
            "next_step":   prep["next_step"],
            "context":     prep["context"],
            "history":     prep["history"],
        }
    elif mode == "DIRECT_MODE":
        stream_chain = calm.direct_chain
        chain_input  = {
            "prompt_user": user_input,
            "context":     prep["context"],
            "history":     prep["history"],
        }
    else:
        stream_chain = calm.normal_chain
        chain_input  = {"input": user_input}

    response_text = ""
    # K2-Think-v2 emits a reasoning preamble (including stray chars before <think>)
    # followed by <think>…</think> and then the real answer.
    # Strategy: buffer ALL output until </think> is seen, then stream only what
    # comes after it.  If </think> never appears the full buffer is the answer.
    _pre_buf     = ""
    _after_think = False
    try:
        async for chunk in stream_chain.astream(chain_input):
            token = chunk.content if hasattr(chunk, "content") else str(chunk)
            if not token:
                continue

            if _after_think:
                # Past the reasoning block — stream normally
                response_text += token
                yield {"event": "token", "data": json.dumps(token)}
            else:
                _pre_buf += token
                if "</think>" in _pre_buf:
                    _after_think = True
                    _, after = _pre_buf.split("</think>", 1)
                    _pre_buf = ""
                    if after:
                        response_text += after
                        yield {"event": "token", "data": json.dumps(after)}

        # Stream ended without ever seeing </think> — whole buffer is the answer
        if not _after_think and _pre_buf:
            response_text = _pre_buf
            yield {"event": "token", "data": json.dumps(_pre_buf)}

    except Exception as exc:
        if not response_text:
            yield {"event": "token", "data": f"[Streaming error: {exc}]"}
        yield {"event": "done", "data": "[DONE]"}
        return

    # ── Persist state ──────────────────────────────────────────────────────────
    sess["student_concept_all"] = updated_concept_all
    sess["data_student"]        = updated_data
    sess["total_hints"]         = sess.get("total_hints", 0) + 1
    sess["chat_history"].append({"role": "user",      "content": user_input})
    sess["chat_history"].append({"role": "assistant", "content": response_text})
    save_session(username)

    level, label = _mastery_to_level(updated_concept["P_mastery"])
    meta = {
        "mode": mode,
        "eval": prep.get("eval_result", {}),
        "student_state": {
            "bkt":             updated_concept,
            "chapter_mastery": updated_concept_all,
            "level":           level,
            "level_label":     label,
            "current_chapter": updated_data.get("current_chapter") or calm.CHAPTERS[0],
            "streak_days":     sess.get("streak_days", 1),
            "total_hints":     sess.get("total_hints", 0),
        }
    }
    yield {"event": "meta", "data": json.dumps(meta)}
    yield {"event": "done", "data": "[DONE]"}


@app.post("/chat/stream", tags=["chat"])
async def chat_stream(
    body:         ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    return EventSourceResponse(
        _stream_response(current_user["username"], body.message.strip(), body.learning_mode)
    )
