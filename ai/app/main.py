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

class Msg(BaseModel):
    role: Literal["user","assistant"]
    content: str

class ChatIn(BaseModel):
    system: Optional[str] = None
    history: Optional[List[dict]] = None
    user: str
    followup: Optional[str] = None

class ChatOut(BaseModel):
    reply: str

def _normalize(t: str) -> str:
    x = unicodedata.normalize("NFD", t)
    x = "".join(ch for ch in x if unicodedata.category(ch) != "Mn")
    x = x.lower().strip()
    x = re.sub(r"\s+"," ",x)
    return x

def _system_prompt() -> str:
    return (
        "Eres AURA, un acompañante de bienestar. Responde breve, empático, en español, "
        "con preguntas abiertas cuando sea útil. Evita diagnósticos y consejos médicos. "
        "Si hay riesgo, sugiere buscar ayuda inmediata de un adulto de confianza o emergencia."
    )

async def _call_openai(message: str, history: List[Msg], system: Optional[str]) -> str:
    api_key = os.getenv("OPENAI_API_KEY","")
    model = os.getenv("OPENAI_MODEL","gpt-4o-mini")
    if not api_key:
        return ""

    msgs = []
    sys = system or _system_prompt()
    msgs.append({"role":"system","content":sys})
    for m in history:
        if m.role in ("user","assistant"):
            msgs.append({"role":m.role,"content":m.content})
    msgs.append({"role":"user","content":message})

    headers = {"Authorization":f"Bearer {api_key}","Content-Type":"application/json"}
    body = {"model":model,"messages":msgs}
    url = "https://api.openai.com/v1/chat/completions"

    max_attempts = 4
    backoff = 1.5

    async with httpx.AsyncClient(timeout=120.0) as client:
        for attempt in range(1, max_attempts+1):
            try:
                r = await client.post(url, json=body, headers=headers)
                if r.status_code == 429:
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
                raise
            except Exception:
                if attempt < max_attempts:
                    wait_s = backoff ** attempt
                    await asyncio.sleep(wait_s)
                    continue
                raise

    return ""

async def _call_ollama(message: str, history: List[Msg], system: Optional[str]) -> str:
    base = os.getenv("OLLAMA_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "phi3")
    url = f"{base}/api/chat"

    msgs = []
    sys = system or _system_prompt()
    msgs.append({"role": "system", "content": sys})
    for m in history:
        if m.role in ("user","assistant"):
            msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": message})

    body = {"model": model, "messages": msgs, "stream": False}

    async with httpx.AsyncClient(timeout=300.0) as client:
        r = await client.post(url, json=body)
        r.raise_for_status()
        data = r.json()
        return (data.get("message") or {}).get("content", "").strip()


@app.get("/health")
def health():
    return {"status":"ok"}

@app.get("/")
def root():
    return {"service":"aura-ai","status":"ok"}

def _model_banner() -> str:
    p = os.getenv("MODEL_PROVIDER", "ollama").lower()
    if p == "openai":
        return f"provider: openai | model: {os.getenv('OPENAI_MODEL','gpt-4o-mini')}"
    return f"provider: ollama | model: {os.getenv('OLLAMA_MODEL','llama3.1')} | base: {os.getenv('OLLAMA_URL','http://localhost:11434')}"

print("AURA-AI using", _model_banner())

@app.post("/chat", response_model=ChatOut)
async def chat(payload: ChatIn):
    user_msg = payload.user.strip()
    if not user_msg:
        return ChatOut(reply="Te leo. Si te sirve, cuéntame un poco más.")

    hist = [Msg(role=(m.get("role") or "user"), content=(m.get("content") or "")) for m in (payload.history or [])]

    try:
        print("🔹 Intentando OpenAI...")
        ans = await _call_openai(user_msg, hist, payload.system)
        if ans:
            return ChatOut(reply=ans)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            print(" Límite de tasa en OpenAI, cambiando a Ollama...")
        else:
            print(f" Error HTTP {e.response.status_code} con OpenAI, usando Ollama...")
    except Exception as e:
        print(f" Error en OpenAI: {e}, usando Ollama...")

    try:
        print("🔹 Intentando Ollama (fallback)...")
        ans = await _call_ollama(user_msg, hist, payload.system)
        if ans:
            return ChatOut(reply=ans + "\n\n(Pasé al modelo local por límite de solicitudes o error en red.)")
    except Exception as e:
        print(f" Falla también en Ollama: {e}")
        return ChatOut(reply="No pude conectar con ningún modelo por ahora. ¿Intentamos más tarde?")

    return ChatOut(reply="El modelo no devolvió respuesta. Probemos de nuevo.")


@app.on_event("startup")
async def warmup():
    if os.getenv("AURA_SKIP_WARMUP","0") == "1":
        print("Warm-up skipped by env.")
        return
    print("Warming up model, please wait...")
    p = os.getenv("MODEL_PROVIDER", "ollama").lower()
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
