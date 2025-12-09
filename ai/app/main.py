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

class SpecialistSummaryIn(BaseModel):
    user_label: str
    mood_trend: str
    alerts: str
    notes: str
    timeframe: Optional[str] = None


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
        "Eres AURA, un acompañante de bienestar emocional basado en IA.\n\n"
        "TU ESTILO:\n"
        "- Hablas en un tono cercano, claro y directo, como un buen amigo o familiar de confianza.\n"
        "- No eres condescendiente ni repites frases vacías. Eres cálido, pero honesto.\n"
        "- No das la razón en todo \n"
        "- No estés siempre de acuerdo\n"
        "- No repites constantemente \"¿cómo te sientes?\"; solo preguntas por el estado emocional cuando es útil.\n"
        "- Puedes usar historias breves, ejemplos y metáforas para que la persona se sienta comprendida.\n"
        "- No actúas como terapeuta profesional, pero sí como un acompañante que escucha, ordena ideas y sugiere próximos pasos.\n\n"
        "OBJETIVOS:\n"
        "- Ayudar a la persona a entender lo que siente, lo que desea y hacia dónde quiere ir.\n"
        "- Responder en máximo 6-8 líneas, evita respuestas largas.\n"
        "- Hacer preguntas sobre futuro, metas, deseos, sueños y cambios que le gustaría lograr.\n"
        "- Detectar si la persona quiere desahogo emocional, orientación práctica o simplemente hablar de otros temas como música, libros o lugares.\n"
        "- Proponer acciones concretas y alcanzables, siempre dentro de límites seguros.\n\n"
        "RECOMENDACIONES:\n"
        "- Puedes sugerir música, libros, películas, lugares o actividades que encajen con los gustos que la persona vaya mostrando.\n"
        "- Puedes invitar a experimentar cosas nuevas que amplíen su mundo, siempre que no sean peligrosas ni dañinas para la persona ni para otros.\n"
        "- Si la persona expresa miedos al cambio, ayúdala a desarmar esos miedos paso a paso y sugiere formas graduales de avanzar.\n\n"
        "LÍMITES Y SEGURIDAD:\n"
        "- No animes ni normalices conductas peligrosas, ilegales, autolesivas ni que dañen a otros.\n"
        "- Si aparecen ideas de hacerse daño, valida el dolor con empatía, recuerda que no sustituyes a un profesional y sugiere contactar ayuda humana.\n"
        "- No des diagnósticos médicos ni psiquiátricos; puedes hablar de patrones y posibilidades y animar a consultar con profesionales cuando corresponda.\n\n"
        "INTERACCIÓN:\n"
        "- Evita hacer demasiadas preguntas seguidas. Alterna entre reflejar lo que entendiste, hacer una pregunta significativa y ofrecer una propuesta concreta o historia.\n"
        "- No sobreanalices todo; a veces la persona solo quiere compañía y conversación ligera.\n"
        "- Adapta tu respuesta al contexto y evita forzar una conversación terapéutica cuando la persona pide algo puntual.\n"
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
    p = os.getenv("MODEL_PROVIDER", "openai").lower()  
    if p == "openai":
        return f"provider: openai | model: {os.getenv('OPENAI_MODEL','gpt-4o-mini')}"
    return f"provider: ollama | model: {os.getenv('OLLAMA_MODEL','llama3')}"

@app.post("/chat")
async def chat(payload: ChatIn):
    user_msg = payload.user
    history = payload.history or []
    system = payload.system

    provider = os.getenv("MODEL_PROVIDER", "openai").lower()  

    if provider == "openai":
        reply = await _call_openai(user_msg, history, system)
    else:
        reply = await _call_ollama(user_msg, history, system)

    return {"reply": reply, "provider": provider}

@app.post("/analyze")
async def analyze_message(request: dict):
    user_message = request.get("message", "")

    analysis_prompt = f"""
Eres un asistente que analiza mensajes para detectar señales de bienestar emocional.

Instrucciones:
- No diagnostiques.
- Solo identifica señales potenciales.
- Sé objetivo.

Devuelve un JSON EXACTO con este formato:

{{
  "risk_self_harm": "none|low|medium|high",
  "risk_harm_others": "none|low|medium|high",
  "possible_signals": [
    {{
      "category": "depression|anxiety|adhd_like|tea_like|loneliness|postpartum|cognitive_decline|paranoia|other",
      "level": "none|low|medium|high"
    }}
  ]
}}

Mensaje del usuario:
\"\"\"{user_message}\"\"\"
"""

    headers = {
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
        "Content-Type": "application/json",
    }

    body = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": analysis_prompt}
        ]
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]

@app.post("/specialist/summary")
async def specialist_summary(payload: SpecialistSummaryIn):
    provider = os.getenv("MODEL_PROVIDER", "openai").lower()

    system = (
        "Eres un asistente que ayuda a psicólogos y psiquiatras a resumir la información de usuarios de AURA. "
        "Recibes datos agregados del usuario y debes devolver un JSON estructurado para uso clínico. "
        "No diagnostiques, solo describe patrones y riesgos percibidos.\n\n"
        "Devuelve un JSON EXACTO con este formato:\n\n"
        "{\n"
        '  "global_risk": "none|low|medium|high",\n'
        '  "main_themes": [ "texto_corto" ],\n'
        '  "emotional_trend": "texto_corto",\n'
        '  "protective_factors": [ "texto_corto" ],\n'
        '  "risk_factors": [ "texto_corto" ],\n'
        '  "suggested_focus_for_next_session": [ "texto_corto" ]\n'
        "}\n"
    )

    text = (
        f"Usuario: {payload.user_label}\n"
        f"Periodo: {payload.timeframe or 'últimas semanas'}\n\n"
        f"Tendencia emocional:\n{payload.mood_trend}\n\n"
        f"Alertas y análisis previos:\n{payload.alerts}\n\n"
        f"Notas clínicas anteriores:\n{payload.notes}\n"
    )

    if provider == "openai":
        reply = await _call_openai(text, [], system)
    else:
        reply = await _call_ollama(text, [], system)

    return {"summary_json": reply}

class SpecialistSummaryIn(BaseModel):
    user_label: str
    mood_trend: str
    alerts: str
    notes: str
    timeframe: str

class SpecialistSummaryOut(BaseModel):
    summary_json: str

@app.post("/specialist/summary", response_model=SpecialistSummaryOut)
async def specialist_summary(body: SpecialistSummaryIn):
    summary_prompt = f"""
Genera un resumen clínico estructurado para un especialista en salud mental.

Instrucciones:
- No diagnostiques.
- Resume de forma objetiva el patrón emocional, señales relevantes y riesgos.
- Usa lenguaje profesional y claro.
- Devuelve un JSON válido con el siguiente formato:

{{
  "overview": "texto breve describiendo el estado general",
  "mood_trend": "patrón de ánimo en el periodo",
  "risk": "ninguno|bajo|medio|alto",
  "key_signals": ["lista de señales relevantes"],
  "recommendations": ["lista de recomendaciones de seguimiento o sugerencias para el especialista"]
}}

Datos:
- Usuario: {body.user_label}
- Periodo: {body.timeframe}
- Tendencia de ánimo: {body.mood_trend}
- Alertas: {body.alerts}
- Notas clínicas: {body.notes}
"""
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
        "Content-Type": "application/json",
    }
    body_req = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": summary_prompt}
        ]
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body_req)
        r.raise_for_status()
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        return SpecialistSummaryOut(summary_json=content)

# -----------------------------
# WARMUP
# -----------------------------
@app.on_event("startup")
async def warmup():
    if os.getenv("AURA_SKIP_WARMUP", "false").lower() == "true":
        return
    print("Warming up model, please wait...")
    p = os.getenv("MODEL_PROVIDER", "openai").lower()  
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
