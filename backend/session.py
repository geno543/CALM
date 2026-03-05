"""
Per-user session store — persisted to disk as JSON so sessions survive backend restarts.
Each user has:
  - chat_history        : list of {role, content} dicts
  - student_concept_all : BKT state dict keyed by chapter file
  - data_student        : misc state dict
  - streak_days         : int — consecutive days active
  - last_active         : ISO date string — UTC date of last activity
  - total_hints         : int — cumulative hint interactions
"""
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from copy import deepcopy

_CHAPTERS_LIST = [
    "functions.pdf", "limits.pdf", "derivatives.pdf",
    "derivative_apps.pdf", "integrals.pdf", "integrals_apps.pdf",
]
_DEFAULT_CONCEPT     = {"P_mastery": 0.10, "P_guess": 0.25, "P_slip": 0.10}
_DEFAULT_CONCEPT_ALL = {ch: deepcopy(_DEFAULT_CONCEPT) for ch in _CHAPTERS_LIST}
_DEFAULT_DATA        = {"user_prompt": "", "llm_response": "", "following_action": "", "current_chapter": None, "learning_mode": True}

# Persist sessions next to this file
_SESSIONS_FILE = Path(__file__).parent / "sessions.json"

# username -> session dict (in-memory cache)
_sessions: dict[str, dict[str, Any]] = {}


def _load() -> None:
    """Load sessions from disk on first import."""
    global _sessions
    if _SESSIONS_FILE.exists():
        try:
            _sessions = json.loads(_SESSIONS_FILE.read_text(encoding="utf-8"))
        except Exception:
            _sessions = {}


def _save() -> None:
    """Persist sessions to disk."""
    try:
        _SESSIONS_FILE.write_text(
            json.dumps(_sessions, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    except Exception as e:
        print(f"[session] Could not save sessions: {e}")


_load()  # restore sessions on import


def get_session(username: str) -> dict:
    today = datetime.utcnow().date().isoformat()

    if username not in _sessions:
        _sessions[username] = {
            "chat_history":        [],
            "student_concept_all": deepcopy(_DEFAULT_CONCEPT_ALL),
            "data_student":        deepcopy(_DEFAULT_DATA),
            "streak_days":         1,
            "last_active":         today,
            "total_hints":         0,
        }
        _save()

    sess = _sessions[username]

    # ── Migrate old flat student_concept → per-chapter dict ──────────────────
    if "student_concept" in sess and "student_concept_all" not in sess:
        old = sess.pop("student_concept")
        sess["student_concept_all"] = {ch: deepcopy(old) for ch in _CHAPTERS_LIST}
        _save()

    # ── Add new fields if missing (existing sessions) ─────────────────────────
    dirty = False
    if "student_concept_all" not in sess:
        sess["student_concept_all"] = deepcopy(_DEFAULT_CONCEPT_ALL); dirty = True
    if "streak_days" not in sess:
        sess["streak_days"] = 1; dirty = True
    if "last_active" not in sess:
        sess["last_active"] = today; dirty = True
    if "total_hints" not in sess:
        sess["total_hints"] = 0; dirty = True
    if "learning_mode" not in sess.get("data_student", {}):
        sess.setdefault("data_student", {})["learning_mode"] = True; dirty = True

    # ── Update streak ─────────────────────────────────────────────────────────
    last = sess.get("last_active", "")
    if last != today:
        yesterday = (datetime.utcnow().date() - timedelta(days=1)).isoformat()
        sess["streak_days"] = sess.get("streak_days", 0) + 1 if last == yesterday else 1
        sess["last_active"]  = today
        dirty = True

    if dirty:
        _save()

    return sess


def save_session(username: str) -> None:
    """Call this after mutating a session to persist changes."""
    _save()


def reset_session(username: str) -> None:
    today = datetime.utcnow().date().isoformat()
    _sessions[username] = {
        "chat_history":        [],
        "student_concept_all": deepcopy(_DEFAULT_CONCEPT_ALL),
        "data_student":        deepcopy(_DEFAULT_DATA),
        "streak_days":         1,
        "last_active":         today,
        "total_hints":         0,
    }
    _save()
