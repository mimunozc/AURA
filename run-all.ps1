<#
    run-all.ps1
    Inicia los tres servicios de AURA: IA (FastAPI), API (.NET) y Frontend (React)
    Autor: Matías Muñoz
    Fecha: 2025-10-21
#>

# Configura los puertos
$aiPort = 8000
$apiPort = 5080
$frontPort = 3000

Write-Host "==========================" -ForegroundColor Cyan
Write-Host "  AURA - Arranque Local   " -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# --- IA (FastAPI) ---
Write-Host "`n[1/3] Iniciando servicio de IA (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd ./ai; .\.venv\Scripts\activate; uvicorn app.main:app --reload --host 0.0.0.0 --port $aiPort" -WindowStyle Minimized

# --- API (.NET) ---
Write-Host "`n[2/3] Iniciando API (.NET)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd ./api/src/Aura.WebApi; dotnet run --no-launch-profile --urls http://localhost:$apiPort" -WindowStyle Minimized

# --- Frontend (React/Next.js) ---
Write-Host "`n[3/3] Iniciando Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd ./frontend; npm run dev" -WindowStyle Minimized

# --- Abrir navegador ---
Start-Sleep -Seconds 6
Start-Process "http://localhost:$frontPort"

Write-Host "`n✅ Todos los servicios fueron iniciados."
Write-Host "   - IA:        http://localhost:$aiPort"
Write-Host "   - API:       http://localhost:$apiPort"
Write-Host "   - Frontend:  http://localhost:$frontPort"
Write-Host "`nPresiona Ctrl + C para cerrar este script."
