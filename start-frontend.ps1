# AURA - Start Frontend
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Set-Location -Path (Join-Path $ScriptDir 'frontend')

if (-not (Test-Path .\node_modules)) { npm install }

npm run dev
