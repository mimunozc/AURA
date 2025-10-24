# AURA - Start API
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Variables de entorno (solo para esta sesión)
$env:API_DEV_TOKEN = 'dev-token-123'
$env:AUTH_HEADER   = 'Authorization'
$env:AUTH_SCHEME   = 'Bearer'

# Ir a la carpeta api
Set-Location -Path (Join-Path $ScriptDir 'api')

# Activar venv (crear si no existe)
if (-not (Test-Path .\.venv\Scripts\Activate.ps1)) { python -m venv .venv }
. .\.venv\Scripts\Activate.ps1

# Dependencias (opcional, solo si hace falta)
if (-not (Get-Command uvicorn -ErrorAction SilentlyContinue)) { pip install -r requirements.txt }

# Ejecutar API
uvicorn app.main:app --reload --port 8001
