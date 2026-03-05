from pydantic import BaseModel, EmailStr
from typing import Optional, List


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message:       str
    learning_mode: bool = True  # passed per-request so mode takes effect immediately


class ConversationMessage(BaseModel):
    role: str          # "user" | "assistant" | "system"
    content: str
    timestamp: Optional[str] = None


# ── Student State ─────────────────────────────────────────────────────────────

class BKTState(BaseModel):
    P_mastery: float = 0.10
    P_guess:   float = 0.25
    P_slip:    float = 0.10


class ChapterRequest(BaseModel):
    chapter: str


class ModeRequest(BaseModel):
    learning_mode: bool


class StudentStateOut(BaseModel):
    bkt:              BKTState
    chapter_mastery:  dict          # {chapter_file: BKTState}
    level:            int
    level_label:      str
    current_chapter:  str
    following_action: str
    streak_days:      int = 1
    total_hints:      int = 0
    learning_mode:    bool = True
