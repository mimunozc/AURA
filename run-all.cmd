@echo off
start powershell -NoLogo -NoExit -ExecutionPolicy Bypass -File "%~dp0start-api.ps1"
start powershell -NoLogo -NoExit -ExecutionPolicy Bypass -File "%~dp0start-ai.ps1"
start powershell -NoLogo -NoExit -ExecutionPolicy Bypass -File "%~dp0start-frontend.ps1"
