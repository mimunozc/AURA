Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root\ai"

if (!(Test-Path ".venv")) {
    python -m venv .venv
}

. .\.venv\Scripts\Activate.ps1

if (Test-Path "requirements.txt") {
    pip install -r requirements.txt
}

# 👇 AQUI forzamos a usar OpenAI SIEMPRE
$env:MODEL_PROVIDER = "openai"

# 👇 NO escribo tu key aquí, uso la que ya tienes en variables de sistema
# (solo si no está, podrías poner una de prueba)
if (-not $env:OPENAI_MODEL) {
    # puedes dejar gpt-4o-mini si lo tienes habilitado
    $env:OPENAI_MODEL = "gpt-4o-mini"
}

uvicorn app.main:app --host 0.0.0.0 --port 8002
