@echo off
title RentEase Backend Server
echo ========================================
echo   Starting RentEase 2.0 Backend Server
echo ========================================
echo.

cd /d "%~dp0"

:restart
echo [%date% %time%] Starting server...
node server.js

echo.
echo [%date% %time%] Server stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak > nul
goto restart
