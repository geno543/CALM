from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from copy import deepcopy
import json
import os
import re

# constant variables — loaded from environment (set in backend/.env)
API_KEY  = os.getenv("API_KEY", "")           # hackclub — used for embeddings
BASE_URL = os.getenv("BASE_URL", "https://ai.hackclub.com/proxy/v1")

# K2 Think — used for chat LLM
K2_API_KEY  = os.getenv("K2_API_KEY",  "IFM-ZasUfxMEHkOsoyFw")
K2_BASE_URL = os.getenv("K2_BASE_URL", "https://api.k2think.ai/v1")

CHAPTERS = [
    "functions.pdf",
    "limits.pdf",
    "derivatives.pdf",
    "derivative_apps.pdf",
    "integrals.pdf",
    "integrals_apps.pdf",
]

# RAG

def _get_embeddings():
    return OpenAIEmbeddings(
        model="openai/text-embedding-3-small",
        api_key=os.getenv("API_KEY", API_KEY),
        base_url=os.getenv("BASE_URL", BASE_URL)
    )

# Lazy-loaded vector stores — built on first access per chapter
_stores: dict = {}

def _get_store(pdf: str):
    if pdf not in _stores:
        embeddings = _get_embeddings()
        db_path = f"./db_{pdf.replace('.pdf','')}"
        if os.path.exists(db_path):
            try:
                _stores[pdf] = Chroma(persist_directory=db_path, embedding_function=embeddings)
            except Exception:
                # Incompatible persisted DB — rebuild from PDF
                import shutil
                shutil.rmtree(db_path, ignore_errors=True)
                _build_store(pdf, embeddings, db_path)
        else:
            _build_store(pdf, embeddings, db_path)
    return _stores[pdf]

def _build_store(pdf: str, embeddings, db_path: str):
    chunks = RecursiveCharacterTextSplitter(
        chunk_size=500, chunk_overlap=100
    ).split_documents(PyPDFLoader(pdf).load())
    _stores[pdf] = Chroma.from_documents(
        chunks, embedding=embeddings, persist_directory=db_path
    )


# retriever
def get_context(pdf_file, query):
    docs = _get_store(pdf_file).as_retriever(search_kwargs={"k": 10}).invoke(query)
    parts = []
    for doc in docs:
        page = doc.metadata.get("page", "?")
        parts.append(f"[Page: {page}]\n{doc.page_content}")
    return "\n\n".join(parts) if parts else "No context found."



# ── JSON helper: strips markdown fences and <think> blocks before parsing ─────
def _parse_json(content: str) -> dict:
    """Robustly extract the first well-formed JSON object from a model response.

    Handles:
    - <think>…</think> reasoning preambles (K2-Think-v2)
    - ```json … ``` markdown fences
    - Extra prose / multiple JSON objects (takes only the first balanced one)
    """
    content = content.strip()
    # 1. Remove ALL <think>…</think> blocks (may be multiple)
    content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
    # 2. Strip markdown code fences
    if content.startswith("```"):
        content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
        content = re.sub(r"\n?```\s*$", "", content.strip())
    content = content.strip()
    # 3. Extract the FIRST balanced {...} block using brace counting
    #    (avoids greedy regex spanning multiple JSON objects)
    start = content.find("{")
    if start == -1:
        return json.loads(content)   # let json.loads raise a clear error
    depth = 0
    for i, ch in enumerate(content[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(content[start:i + 1])
    # Fallback: try parsing whatever we have
    return json.loads(content[start:])


#main LLM

llm = ChatOpenAI(
    model="MBZUAI-IFM/K2-Think-v2",
    base_url=K2_BASE_URL,
    api_key=K2_API_KEY
)

# llm for choose the particular file

chapter_selector_prompt = ChatPromptTemplate.from_messages([
    ("system", f"""
You are a chapter selector for a calculus tutoring system.
Given the student message, return the PDF file that should be used.

Available files:
{chr(10).join(f"- {f}" for f in CHAPTERS)}

Rules:
- If the student is asking about a NEW topic -> return the matching file
- If the student is CONTINUING the same topic -> return the SAME file as before
- Only switch files when the student clearly asks about a different topic

Return ONLY valid JSON:
{{
    "file": "derivatives.pdf",
    "reason": "student asked about derivatives"
}}
"""),
    ("user", """
Current file in use: {current_file}
Student message: {user_input}
""")
])

chapter_selector_chain = chapter_selector_prompt | llm

# function of selecting

def select_chapter(user_input, current_file):
    try:
        result = _parse_json(
            chapter_selector_chain.invoke({
                "user_input":   user_input,
                "current_file": current_file or "none"
            }).content
        )
        selected = result.get("file", current_file)
        if selected in CHAPTERS:
            return selected
    except Exception:
        pass
    return current_file or CHAPTERS[0]

# Prompts 



evaluator_prompt = ChatPromptTemplate.from_messages([
    ("system", """
You are a strict educational evaluator for a calculus tutoring system.
Your job is to assess the student's response and estimate their knowledge state.
Return ONLY valid JSON - no markdown, no extra text.
"""),
    ("user", """
Analyze the interaction below carefully.

Tasks:
1. Extract every question the tutor asked.
2. Determine if the student answered each one.
3. Evaluate correctness (consider partial understanding).
4. Identify the calculus concept being tested.
5. Estimate BKT parameters:
   - P_mastery : probability student truly knows the concept (0.0 - 1.0)
   - P_guess   : probability a correct answer was just a lucky guess (0.05 - 0.30)
   - P_slip    : probability student knows it but made a mistake (0.05 - 0.20)

Tutor Response:
{teacher_response}

Student Response:
{student_response}

Return ONLY valid JSON in this exact format:
{{
  "questions": [
    {{
      "question_text": "...",
      "student_answered": true,
      "is_correct": true,
      "concept_name": "..."
    }}
  ],
  "student_concept": {{
    "P_mastery": 0.0,
    "P_guess":   0.0,
    "P_slip":    0.0
  }}
}}
""")
])

tutor_prompt = ChatPromptTemplate.from_messages([
    ("system", """
YOU ARE: MCSE - Meta-Cognitive Socratic Engine, the operational core of CALM.
REFERENCE: Thomas's Calculus (14th edition). Every claim must be grounded here.
MISSION: Build rigorous mathematical cognition. Not to simplify - to construct.

===========================================================
CRI PROTOCOL - CONSTRAINT REASONING INTERFACE (MANDATORY)
===========================================================
You are FORBIDDEN from:
  X Providing final answers or completed derivations
  X Giving direct formulas without building them from first principles
  X Skipping prerequisite concepts
  X Using motivational filler ("Great job!", "Almost there!")

If the student asks for a direct answer -> refuse and give a Structural Hint instead.
If the student is stuck -> decompose the problem one level down, never solve it.

===========================================================
FOUNDATION FIRST PROTOCOL (STEP 0 - ALWAYS)
===========================================================
Before ANY explanation, start with:

  -- STEP 0: FOUNDATIONAL CONCEPTS --
  List every prerequisite concept the student needs.
  Give a short, precise, plain-language primer for each.
  Only AFTER Step 0 -> proceed to the main explanation.

===========================================================
7-LEVEL PROGRESSION (BKT-DRIVEN - DO NOT CHOOSE MANUALLY)
===========================================================
The Adaptive Instruction below tells you the current level. Follow it strictly.

  Level 1 (mastery < 0.20) - Intuitive Primitive
    Use a "Sovereign Metaphor" before any math. No symbols yet.

  Level 2 (mastery < 0.35) - Formal Axiomatic Transition
    Introduce variables, domain restrictions, formal notation.

  Level 3 (mastery < 0.50) - Multi-Dimensional Visualization
    Force the student to predict graph behavior. Use Vertical Line Test.

  Level 4 (mastery < 0.65) - Heuristic Deconstruction
    Edge cases, removable discontinuities, pathological examples.

  Level 5 (mastery < 0.80) - Global Heavyweight Synthesis
    JEE Advanced / Putnam difficulty. At least 2 theorems required.

  Level 6 (mastery < 0.92) - Theoretical Convergence
    Graduate entrance level. Cite Thomas theorem by name.

  Level 7 (mastery >= 0.92) - Frontier Research
    PhD-level: Neural ODEs, Lyapunov Stability, Functional Spaces.

===========================================================
MANDATORY RESPONSE STRUCTURE (every response, in order)
===========================================================

-- STEP 0: FOUNDATIONAL CONCEPTS --
  List prerequisites with plain-language primers.

-- STEP 1: THINK-ALOUD PHASE --
  "Let's look at this together..."
  IMPORTANT: Questions must be OPEN-ENDED. Never hint at the answer.
  BAD:  "Do you see why X means Y?"
  GOOD: "What do you think happens when X?"

-- STEP 2: STRUCTURAL EXPLANATION --
  Formal definition -> derive every formula from scratch.

-- STEP 3: MULTI-LAYER EXAMPLES --
  Elementary / Algebraic / Pathological / Counterexample / Real-world

-- STEP 4: MISCONCEPTION RADAR --
  3 common mistakes. WRONG -> CORRECT side by side.

-- STEP 5: STRATEGIC SUMMARY --
  Core Strategy / Execution Path / Formulaic Key / Sovereign Context

-- STEP 6: SOCRATIC CHALLENGE (exactly ONE) --
  "What if?" question. Do NOT solve it. Wait for the student.

===========================================================
LANGUAGE RULES
===========================================================
- Arabic input  -> explain in Arabic, ALL math and theorems in English.
- English input -> respond fully in English.
- Math expressions: use $...$ for inline and $$...$$ for display/block math.
- NEVER use \\(...\\) or \\[...\\] delimiters — the renderer only understands $ and $$.
- NEVER use \\begin{{cases}} or other raw LaTeX environments.
  Write piecewise rules as a markdown bullet list, e.g.:
    - $h(x) = -x$ when $x < 0$
    - $h(x) = x^2$ when $0 \\le x \\le 1$
    - $h(x) = 1$ when $x > 1$

===========================================================
CITATION RULES
===========================================================
- ONLY cite a page number if it appears in the RETRIEVED CONTEXT.
- NEVER invent page numbers.
"""),
    ("user", """
ADAPTIVE INSTRUCTION:
{next_step}

RETRIEVED TEXTBOOK CONTEXT:
{context}

CONVERSATION HISTORY:
{history}

STUDENT INPUT:
{prompt_user}
""")
])

controller_prompt = ChatPromptTemplate.from_messages([
    ("system", """
You are a conversation router for a calculus tutoring system.
Return ONLY valid JSON. No markdown, no extra text.

Rules:
- mode:
    TUTOR_MODE -> math, calculus, formulas, exercises, problems
    QA_MODE    -> greetings, off-topic, questions about the system

- should_evaluate:
    true  -> student is clearly answering a question the tutor just asked
    false -> new topic, greeting, or a question (not an answer)

JSON format:
{{
    "mode": "TUTOR_MODE",
    "should_evaluate": false
}}
"""),
    ("user", """
Previous Tutor Message: {last_ai_message}
Current Student Message: {user_input}
""")
])

normal_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are MCSE (Meta-Cognitive Socratic Engine), the AI tutor of CALM.
CALM is a calculus tutoring system based on Thomas's Calculus (14th edition).

For greetings and off-topic messages, respond briefly and warmly as MCSE.
Remind the student this is a calculus tutoring system and invite them to ask a calculus question.
Do NOT pretend to be a general-purpose assistant. Keep replies short (2-3 sentences max).
No emoji. No bullet lists. Plain conversational tone."""),
    ("user", "{input}")
])

cri_prompt = ChatPromptTemplate.from_messages([
    ("system", """
You are the CRI guard for a Socratic tutoring system.
Check if the AI response violates the NO-DIRECT-ANSWER rule.

VIOLATES if it:
  - Gives the final answer or completed derivation
  - States a formula directly without building it

VALID if it:
  - Gives hints or scaffolding
  - Asks a guiding question
  - Explains prerequisites without solving

Return ONLY valid JSON:
{{
  "violation": false,
  "reason": "response uses scaffolding"
}}
"""),
    ("user", "AI Response to check:\n{response}")
])

evaluator_chain    = evaluator_prompt    | llm
tutor_chain        = tutor_prompt        | llm
controller_chain   = controller_prompt   | llm
normal_chain       = normal_prompt       | llm
cri_chain          = cri_prompt          | llm

direct_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are MCSE (Meta-Cognitive Socratic Engine), the AI tutor of CALM.
CALM is a calculus tutoring system built on Thomas's Calculus (14th edition).

The student has switched to Direct Answer Mode — give clear, complete, accurate answers.
You MAY provide full derivations, formulas, step-by-step solutions, and theorems.
Use the retrieved textbook context when relevant.

MATH FORMATTING (strictly enforced):
- Use $...$ for ALL inline math expressions.
- Use $$...$$ for display/block equations.
- NEVER use \\(...\\) or \\[...\\] — these are NOT supported by the renderer.
- NEVER write raw LaTeX like (\\varepsilon) or [\\frac{{a}}{{b}}] outside of $ delimiters.

Match the student's language: Arabic input → Arabic explanations with English math;
English input → full English."""),
    ("user", """RETRIEVED TEXTBOOK CONTEXT:
{context}

CONVERSATION HISTORY:
{history}

STUDENT INPUT:
{prompt_user}
""")
])
direct_chain = direct_prompt | llm

# cri

def cri_check(response_text):
    
    try:
        result = json.loads(cri_chain.invoke({"response": response_text}).content)
        if not result.get("violation"):
            return response_text

        print("[CRI] Violation detected - rewriting...")
        fix_chain = ChatPromptTemplate.from_messages([
            ("system", (
                "You are the MCSE tutor. Your response was rejected - it gave a direct answer. "
                "Rewrite it: no final answers, ask ONE Socratic question, give a hint only. "
                "Keep Foundation First and Think-Aloud style. Use the same language."
            )),
            ("user", "Rejected:\n{response}\n\nRewrite as scaffolding:")
        ]) | llm
        return fix_chain.invoke({"response": response_text}).content
    except Exception:
        return response_text

#  BKT 
P_transit = 0.10

def update_dlm(evaluation_output, student_concept):
    P_g = max(0.05, min(0.30, student_concept.get("P_guess", 0.25)))
    P_s = max(0.05, min(0.20, student_concept.get("P_slip",  0.10)))
    P_L = student_concept["P_mastery"]

    questions     = evaluation_output.get("questions", [])
    correct_count = sum(1 for q in questions if q.get("is_correct", False))
    answered      = sum(1 for q in questions if q.get("student_answered", False))
    is_correct    = (correct_count / answered) >= 0.5 if answered > 0 else False

    if is_correct:
        numerator   = P_L * (1 - P_s)
        denominator = P_L * (1 - P_s) + (1 - P_L) * P_g
    else:
        numerator   = P_L * P_s
        denominator = P_L * P_s + (1 - P_L) * (1 - P_g)

    P_L_posterior = numerator / denominator if denominator > 0 else P_L
    P_L_new       = P_L_posterior + (1 - P_L_posterior) * P_transit
    return {
        "P_mastery":  max(0.0, min(1.0, P_L_new)),
        "P_guess":    P_g,
        "P_slip":     P_s,
        "_is_correct": is_correct,
    }

def decide_next_action(student_concept):
    mastery = student_concept["P_mastery"]
    if mastery < 0.20: 
        
        level = 1
        desc = "LEVEL 1 - INTUITIVE PRIMITIVE. Use a Sovereign Metaphor. No symbols yet."
        
    elif mastery < 0.35: 
        
        level= 2
        desc ="LEVEL 2 - FORMAL AXIOMATIC. Introduce variables and domain restrictions."
        
    elif mastery < 0.50:
        
        level = 3
        desc ="LEVEL 3 - VISUALIZATION. Predict graph behavior. Use Vertical Line Test."
        
    elif mastery < 0.65:
        
        level = 4
        desc ="LEVEL 4 - HEURISTIC DECONSTRUCTION. Edge cases and pathological examples."
        
    elif mastery < 0.80:
        
        level =5
        desc ="LEVEL 5 - HEAVYWEIGHT SYNTHESIS. JEE/Putnam difficulty. 2 theorems min."
    
    elif mastery < 0.92:
        
        level= 6
        desc ="LEVEL 6 - THEORETICAL CONVERGENCE. Graduate level. Cite theorem by name."
        
    else:         
             
        level= 7
        
        desc ="LEVEL 7 - FRONTIER RESEARCH. PhD level: Neural ODEs, Lyapunov Stability."
        
    return f"[LEVEL: {level} | MASTERY: {mastery:.0%}] {desc}"


#main
def chat(user_input, chat_history, student_concept, data_student):
    data_student["user_prompt"] = user_input

    if not data_student["following_action"]:
        data_student["following_action"] = decide_next_action(student_concept)

    current_file = data_student.get("current_chapter", CHAPTERS[0])
    selected_file = select_chapter(user_input, current_file)
    data_student["current_chapter"] = selected_file
    print(f"[Chapter] Using: {selected_file}")

    history_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in chat_history[-20:]
    )
    last_ai_message = next(
        (m["content"] for m in reversed(chat_history) if m["role"] == "assistant"), ""
    )

    try:
        control = json.loads(controller_chain.invoke({
            "user_input":      user_input,
            "last_ai_message": last_ai_message
        }).content)
    except Exception:
        control = {"mode": "TUTOR_MODE", "should_evaluate": False}

    if control.get("should_evaluate") and last_ai_message:
        try:
            eval_data       = json.loads(evaluator_chain.invoke({
                "student_response": user_input,
                "teacher_response": last_ai_message
            }).content)
            student_concept = update_dlm(eval_data, student_concept)
            data_student["following_action"] = decide_next_action(student_concept)
        except Exception as e:
            print(f"[Eval error: {e}]")

    if control.get("mode") == "TUTOR_MODE":
        context_text  = get_context(selected_file, user_input)
        response_text = tutor_chain.invoke({
            "prompt_user": user_input,
            "next_step":   data_student["following_action"],
            "context":     context_text,
            "history":     history_text
        }).content
        response_text = cri_check(response_text)
    else:
        response_text = normal_chain.invoke({"input": user_input}).content

    data_student["llm_response"] = response_text
    return response_text, student_concept, data_student, control


_DEFAULT_CONCEPT = {"P_mastery": 0.10, "P_guess": 0.25, "P_slip": 0.10}


def prepare_chat(user_input, chat_history, student_concept_all, data_student):
    """
    Run all fast preparation steps (chapter select, controller routing, BKT evaluation)
    WITHOUT calling the final tutor/normal LLM.
    student_concept_all: dict keyed by chapter file, e.g. {"functions.pdf": {P_mastery, ...}, ...}
    Returns a dict with everything needed to stream the response directly.
    """
    data_student["user_prompt"] = user_input

    current_file  = data_student.get("current_chapter", CHAPTERS[0])
    selected_file = select_chapter(user_input, current_file)
    data_student["current_chapter"] = selected_file
    print(f"[Chapter] Using: {selected_file}")

    # Per-chapter BKT — extract just this chapter's state
    student_concept = deepcopy(student_concept_all.get(selected_file, _DEFAULT_CONCEPT))

    if not data_student["following_action"]:
        data_student["following_action"] = decide_next_action(student_concept)

    history_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in chat_history[-20:]
    )
    last_ai_message = next(
        (m["content"] for m in reversed(chat_history) if m["role"] == "assistant"), ""
    )

    try:
        control = _parse_json(controller_chain.invoke({
            "user_input":      user_input,
            "last_ai_message": last_ai_message,
        }).content)
    except Exception:
        control = {"mode": "TUTOR_MODE", "should_evaluate": False}

    eval_result = {"evaluated": False, "is_correct": None, "mastery_before": None, "mastery_after": None}
    # Always evaluate in TUTOR_MODE — don't rely on controller's should_evaluate flag
    # (unreliable with reasoning models like K2-Think-v2). The evaluator's own
    # student_answered field decides whether BKT actually changes.
    if control.get("mode", "TUTOR_MODE") == "TUTOR_MODE" and last_ai_message:
        # Truncate teacher_response — full STEP 0-6 is thousands of tokens
        teacher_snippet = last_ai_message[-1500:] if len(last_ai_message) > 1500 else last_ai_message
        print(f"[BKT] Evaluating | mastery={student_concept['P_mastery']:.3f} | input_len={len(user_input)} | teacher_len={len(teacher_snippet)}")
        try:
            raw_eval = evaluator_chain.invoke({
                "student_response": user_input,
                "teacher_response": teacher_snippet,
            }).content
            print(f"[BKT] Raw (first 300): {raw_eval[:300]}")
            eval_data = _parse_json(raw_eval)
            print(f"[BKT] Parsed: {eval_data}")
            mastery_before = student_concept["P_mastery"]
            updated = update_dlm(eval_data, student_concept)
            student_concept = updated
            data_student["following_action"] = decide_next_action(student_concept)
            eval_result = {
                "evaluated":     True,
                "is_correct":    updated.get("_is_correct"),
                "mastery_before": mastery_before,
                "mastery_after":  updated["P_mastery"],
            }
            print(f"[BKT] {mastery_before:.3f} -> {updated['P_mastery']:.3f} | correct={updated.get('_is_correct')}")
        except Exception as e:
            print(f"[BKT] Eval error: {e}")

    # Write updated BKT back into the full dict
    student_concept_all[selected_file] = student_concept

    mode         = control.get("mode", "TUTOR_MODE")
    context_text = get_context(selected_file, user_input) if mode == "TUTOR_MODE" else ""

    return {
        "mode":                mode,
        "control":             control,
        "next_step":           data_student["following_action"],
        "context":             context_text,
        "history":             history_text,
        "student_concept_all": student_concept_all,
        "current_concept":     student_concept,
        "data_student":        data_student,
        "eval_result":         eval_result,
    }