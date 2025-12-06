@echo off
echo ================================================
echo    RentEase 2.0 - Database Setup
echo ================================================
echo.

echo [1/3] Checking MongoDB installation...
echo.

:: Check if MongoDB is installed
where mongod >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MongoDB is NOT installed!
    echo.
    echo Please install MongoDB:
    echo 1. Download from: https://www.mongodb.com/try/download/community
    echo 2. Choose Windows x64
    echo 3. Run the installer with default settings
    echo 4. Make sure to install as a Windows Service
    echo.
    pause
    exit /b 1
)

echo ✅ MongoDB is installed
echo.

echo [2/3] Starting MongoDB service...
echo.
net start MongoDB 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB service started
) else (
    echo ℹ️  MongoDB service is already running or failed to start
    echo    If you get an error, try running this script as Administrator
)
echo.

echo [3/3] Seeding test users into database...
echo.
node seed-users.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo    ✅ Setup Complete!
    echo ================================================
    echo.
    echo You can now:
    echo 1. Start the backend server: node server.js
    echo 2. Open quick-login.html to test login
    echo.
) else (
    echo.
    echo ❌ Failed to seed database
    echo Please make sure MongoDB is running
)

pause
