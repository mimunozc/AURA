from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal, Optional
import os, re, unicodedata, httpx
import asyncio

app = FastAPI(title="AURA AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# MODELOS
# -----------------------------
class Msg(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatIn(BaseModel):
    system: Optional[str] = None
    history: Optional[List[Msg]] = None
    user: str
    followup: Optional[str] = None


# -----------------------------
# HELPERS
# -----------------------------
def _normalize(t: str) -> str:
    x = unicodedata.normalize("NFD", t)
    x = "".join(ch for ch in x if unicodedata.category(ch) != "Mn")
    x = x.lower().strip()
    x = re.sub(r"\s+", " ", x)
    return x

def _system_prompt() -> str:
    return (
        "Eres AURA, un acompañante de bienestar. Responde breve, empático, en español, "
        "con preguntas abiertas cuando sea útil. Evita diagnósticos y consejos médicos. "
        "Si hay riesgo, sugiere buscar ayuda inmediata de un adulto de confianza o emergencia."
    )

# -----------------------------
# LLAMAR A OPENAI
# -----------------------------
async def _call_openai(message: str, history: List[Msg], system: Optional[str]) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    if not api_key:
        # si no hay key, devolvemos un mensaje visible para el front
        return "⚠️ El servicio AURA no tiene configurada la variable OPENAI_API_KEY."

    # armamos el historial en formato OpenAI
    msgs = []
    sys = system or _system_prompt()
    msgs.append({"role": "system", "content": sys})
    for m in history or []:
        if m.role in ("user", "assistant"):
            msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": message})

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {"model": model, "messages": msgs}
    url = "https://api.openai.com/v1/chat/completions"

    max_attempts = 4
    backoff = 1.5

    async with httpx.AsyncClient(timeout=120.0) as client:
        for attempt in range(1, max_attempts + 1):
            try:
                r = await client.post(url, headers=headers, json=body)
                if r.status_code == 429 and attempt < max_attempts:
                    retry_after = r.headers.get("Retry-After")
                    wait_s = float(retry_after) if retry_after else backoff ** attempt
                    print(f"OpenAI 429. Waiting {wait_s:.1f}s before retry {attempt}/{max_attempts}...")
                    await asyncio.sleep(wait_s)
                    continue
                r.raise_for_status()
                data = r.json()
                return data["choices"][0]["message"]["content"].strip()
            except httpx.HTTPStatusError as e:
                if 500 <= e.response.status_code < 600 and attempt < max_attempts:
                    wait_s = backoff ** attempt
                    print(f"OpenAI {e.response.status_code}. Retrying in {wait_s:.1f}s...")
                    await asyncio.sleep(wait_s)
                    continue
                # error no recuperable
                print("OpenAI error:", e)
                return "⚠️ No pude obtener respuesta de OpenAI en este momento."
            except Exception as e:
                print("OpenAI unexpected error:", e)
                return "⚠️ Ocurrió un error al contactar la IA."

# -----------------------------
# LLAMAR A OLLAMA (lo dejamos por si vuelves)
# -----------------------------
async def _call_ollama(message: str, history: List[Msg], system: Optional[str]) -> str:
    base = os.getenv("OLLAMA_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "phi3")
    url = f"{base}/api/chat"

    msgs = []
    sys = system or _system_prompt()
    msgs.append({"role": "system", "content": sys})
    for m in history or []:
        if m.role in ("user", "assistant"):
            msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": message})

    body = {"model": model, "messages": msgs, "stream": False}

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            r = await client.post(url, json=body)
            r.raise_for_status()
            data = r.json()
            return data.get("message", {}).get("content", "").strip() or "Ok."
        except Exception as e:
            print("Ollama error:", e)
            return "⚠️ No pude contactar al modelo local."

# -----------------------------
# ENDPOINTS
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"service": "aura-ai", "status": "ok"}

def _model_banner() -> str:
    p = os.getenv("MODEL_PROVIDER", "openai").lower()  # 👈 AHORA OPENAI POR DEFECTO
    if p == "openai":
        return f"provider: openai | model: {os.getenv('OPENAI_MODEL','gpt-4o-mini')}"
    return f"provider: ollama | model: {os.getenv('OLLAMA_MODEL','llama3')}"

@app.post("/chat")
async def chat(payload: ChatIn):
    user_msg = payload.user
    history = payload.history or []
    system = payload.system

    provider = os.getenv("MODEL_PROVIDER", "openai").lower()  # 👈 AHORA OPENAI POR DEFECTO

    if provider == "openai":
        reply = await _call_openai(user_msg, history, system)
    else:
        reply = await _call_ollama(user_msg, history, system)

    return {"reply": reply, "provider": provider}

# -----------------------------
# WARMUP
# -----------------------------
@app.on_event("startup")
async def warmup():
    if os.getenv("AURA_SKIP_WARMUP", "false").lower() == "true":
        return
    print("Warming up model, please wait...")
    p = os.getenv("MODEL_PROVIDER", "openai").lower()  # 👈 AHORA OPENAI POR DEFECTO
    tries = 1
    for i in range(tries):
        try:
            if p == "openai":
                _ = await _call_openai("Hola", [], None)
            else:
                _ = await _call_ollama("Hola", [], None)
            print("Warm-up complete.")
            return
        except Exception as e:
            print(f"Warm-up attempt {i+1}/{tries} failed: {e}")
    print("Warm-up failed (continuing).")
