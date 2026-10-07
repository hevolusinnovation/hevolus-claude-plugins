@echo off
REM Avvia xrcopilotlab-demo su Windows: la logica sta nello script PowerShell accanto.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0xrcopilotlab-demo.ps1" %*
