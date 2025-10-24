from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Literal
from uuid import uuid4
import httpx
from ..security.auth import verify_token

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    dependencies=[Depends(verify_token)]
)

class ChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str

class BootResponse(BaseModel):
    session_id: str
    messages: List[ChatMessage]

class SendRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

class SendResponse(BaseModel):
    session_id: str
    reply: ChatMessage

_SESSIONS: dict[str, List[ChatMessage]] = {}

AI_URL = "http://localhost:8002"

@router.get("/boot", response_model=BootResponse)
def boot():
    session_id = str(uuid4())
    _SESSIONS[session_id] = []
    return BootResponse(session_id=session_id, messages=[])

@router.get("/history/{session_id}", response_model=List[ChatMessage])
def history(session_id: str):
    return _SESSIONS.get(session_id, [])

@router.post("/send", response_model=SendResponse)
def send(req: SendRequest):
    session_id = req.session_id or str(uuid4())
    history = _SESSIONS.setdefault(session_id, [])

    user_msg = ChatMessage(id=str(uuid4()), role="user", content=req.message)
    history.append(user_msg)

    payload = {
        "user": req.message,
        "history": [{"role": m.role, "content": m.content} for m in history],
        "followup": None
    }

    answer = None
    try:
        with httpx.Client(timeout=120.0) as client:
            r = client.post(f"{AI_URL}/chat", json=payload)
            r.raise_for_status()
            data = r.json()
            answer = data.get("reply")
    except Exception as e:
        answer = None

    if not answer:
        answer = "No pude conectar con la IA ahora mismo, pero te sigo leyendo. ¿Quieres contarme un poco más?"

    assistant_msg = ChatMessage(id=str(uuid4()), role="assistant", content=answer)
    history.append(assistant_msg)
    return SendResponse(session_id=session_id, reply=assistant_msg)
