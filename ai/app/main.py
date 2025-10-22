from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import json, re

app = FastAPI(title="AURA AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA = Path(__file__).parent.parent / "data"
DATA.mkdir(exist_ok=True)

class ChatIn(BaseModel):
    user_id: str | None = "demo"
    message: str

class ChatOut(BaseModel):
    reply: str

def load_mem(uid: str):
    f = DATA / f"{uid}.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    return {"name": None, "last_mood": None, "history": []}

def save_mem(uid: str, data: dict):
    f = DATA / f"{uid}.json"
    f.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

@app.get("/health")
def health():
    return {"ok": True, "service": "ai"}

@app.post("/chat", response_model=ChatOut)
def chat(payload: ChatIn):
    uid = payload.user_id or "demo"
    mem = load_mem(uid)
    mem["history"].append({"user": payload.message})

    if mem["name"] is None:
        name = extract_name(payload.message)
        if not name:
            save_mem(uid, mem)
            return ChatOut(reply="Hola, soy AURA. ¿Cómo te gustaría que te llame?")
        mem["name"] = name
        save_mem(uid, mem)
        return ChatOut(reply=f"Encantada, {name}. ¿Cómo te sientes hoy del 1 al 10?")

    if mem["last_mood"] is None:
        mood = extract_mood(payload.message)
        if not mood:
            save_mem(uid, mem)
            return ChatOut(reply="¿Cómo calificarías tu ánimo hoy (1 a 10) y por qué?")
        mem["last_mood"] = mood
        save_mem(uid, mem)
        return ChatOut(reply=f"Gracias por contarme. Si quieres, dime qué influyó en ese {mood}/10.")

    save_mem(uid, mem)
    return ChatOut(reply="Te escucho. Puedo ayudarte con respiración, registro de ánimo o hábitos.")

def extract_name(text: str):
    t = text.lower()
    if "me llamo " in t:
        return text.split("me llamo ",1)[1].split()[0].strip(".,!¡¿?")
    if "soy " in t:
        return text.split("soy ",1)[1].split()[0].strip(".,!¡¿?")
    return None

def extract_mood(text: str):
    m = re.search(r"\b([1-9]|10)\b", text)
    return int(m.group(1)) if m else None

@app.get("/healthz")
def healthz():
    # mismo resultado que /health
    return {"ok": True, "service": "ai"}

@app.post("/generate", response_model=ChatOut)
def generate(payload: ChatIn):
    # reutiliza la lógica actual de /chat
    return chat(payload)
