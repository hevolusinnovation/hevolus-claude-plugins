@echo off
REM Avvia xrcopilotlab-bp su Windows: la logica sta nello script PowerShell accanto.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0xrcopilotlab-bp.ps1" %*
