@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo Installazione dipendenze in corso, attendere...
    call npm install
)

start "Gestionale Forniture - Server" cmd /k npm run dev
timeout /t 5 /nobreak >nul
start http://localhost:3000
