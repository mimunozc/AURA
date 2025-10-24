$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path (Join-Path $ScriptDir 'ai')

if (-not (Test-Path .\.venv\Scripts\Activate.ps1)) { python -m venv .venv }
. .\.venv\Scripts\Activate.ps1

$env:MODEL_PROVIDER = 'openai'
$env:OPENAI_API_KEY = 'API_KEY'
$env:OPENAI_MODEL = 'gpt-4o-mini'

$env:OLLAMA_URL = 'http://localhost:11434'
$env:OLLAMA_MODEL = 'phi3'

if (-not (Get-Command uvicorn -ErrorAction SilentlyContinue)) { pip install -r requirements.txt }
uvicorn app.main:app --reload --port 8002
