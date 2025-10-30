@echo off
setlocal
set mode=%1

echo Iniciando AURA (%mode%)...

start powershell -NoExit -Command ".\start-api.ps1"
start powershell -NoExit -Command ".\start-ai.ps1"

if "%mode%"=="lan" (
    start powershell -NoExit -Command ".\start-frontend.ps1 lan"
) else (
    start powershell -NoExit -Command ".\start-frontend.ps1"
)

endlocal
