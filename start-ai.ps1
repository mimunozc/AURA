Set-StrictMode -Version Latest
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root"

if (!(Test-Path .venv)) { python -m venv .venv }
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:OPENAI_API_KEY = $env:OPENAI_API_KEY
$env:OPENAI_MODEL  = "gpt-3.5-turbo"

uvicorn app.main:app --host 0.0.0.0 --port 8002
