@echo off
title RentEase Frontend Server
echo ========================================
echo  Starting RentEase 2.0 Frontend Server
echo ========================================
echo.
echo Frontend running at: http://localhost:3000
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0"
python -m http.server 3000
