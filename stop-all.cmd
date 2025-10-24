@echo off
taskkill /f /im dotnet.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1