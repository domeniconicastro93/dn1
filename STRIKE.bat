@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo.
echo ========================================
echo   STRIKE GAMING CLOUD - CONTROL CENTER
echo ========================================
echo.
echo [1] Quick Start          - Start all services
echo [2] Full Setup           - First time setup (DB + Build + Start)
echo [3] Stop All             - Stop all running services
echo [4] Rebuild + Start      - Clean build and restart
echo [5] Setup Database       - Reset and migrate database
echo [6] Exit
echo.
echo ========================================
echo.
set /p choice="Select option (1-6): "

if "%choice%"=="1" goto QUICK_START
if "%choice%"=="2" goto FULL_SETUP
if "%choice%"=="3" goto STOP_ALL
if "%choice%"=="4" goto REBUILD_START
if "%choice%"=="5" goto SETUP_DB
if "%choice%"=="6" goto END
goto MENU

:QUICK_START
echo.
echo ========================================
echo [QUICK START]
echo ========================================
echo.
echo [1/2] Copying environment variables...
call :COPY_ENV
echo.
echo [2/2] Starting all services...
call START.bat
goto END

:FULL_SETUP
echo.
echo ========================================
echo [FULL SETUP - First Time]
echo ========================================
echo.
echo This will:
echo - Setup PostgreSQL database
echo - Copy environment variables
echo - Build all packages
echo - Start all services
echo.
pause
echo.
echo [1/4] Setting up PostgreSQL database...
call :SETUP_DATABASE
echo.
echo [2/4] Copying environment variables...
call :COPY_ENV
echo.
echo [3/4] Building packages...
call :BUILD_PACKAGES
echo.
echo [4/4] Starting all services...
call START.bat
goto END

:STOP_ALL
echo.
echo ========================================
echo [STOP ALL SERVICES]
echo ========================================
echo.
echo Stopping all Node.js processes...
taskkill /IM node.exe /F 2>nul
if %errorlevel%==0 (
    echo ✓ All services stopped
) else (
    echo ℹ No services running
)
echo.
pause
goto MENU

:REBUILD_START
echo.
echo ========================================
echo [REBUILD + START]
echo ========================================
echo.
echo [1/4] Stopping services...
taskkill /IM node.exe /F 2>nul
echo.
echo [2/4] Copying environment variables...
call :COPY_ENV
echo.
echo [3/4] Building packages...
call :BUILD_PACKAGES
echo.
echo [4/4] Starting services...
call START.bat
goto END

:SETUP_DB
echo.
echo ========================================
echo [DATABASE SETUP]
echo ========================================
echo.
call :SETUP_DATABASE
echo.
pause
goto MENU

REM ============================================
REM SUBROUTINES
REM ============================================

:COPY_ENV
echo Copying .env to all services...
copy /Y .env services\auth-service\.env >nul 2>&1
copy /Y .env services\game-service\.env >nul 2>&1
copy /Y .env services\steam-library-service\.env >nul 2>&1
copy /Y .env services\orchestrator-service\.env >nul 2>&1
copy /Y .env services\gateway-service\.env >nul 2>&1
copy /Y .env services\webrtc-streaming-service\.env >nul 2>&1
copy /Y .env apps\web\.env.local >nul 2>&1
echo ✓ Environment variables copied
exit /b 0

:BUILD_PACKAGES
echo Building shared packages...
cd packages\shared-i18n
call pnpm run build
cd ..\shared-types
call pnpm run build
cd ..\shared-utils
call pnpm run build
cd ..\shared-db
call pnpm exec prisma generate
call pnpm run build
cd ..\..
echo ✓ Packages built
exit /b 0

:SETUP_DATABASE
echo Cleaning old migrations...
cd packages\shared-db
if exist prisma\migrations rd /s /q prisma\migrations
echo Creating migration...
call pnpm exec prisma migrate dev --name init --skip-generate
echo Generating Prisma client...
call pnpm exec prisma generate
cd ..\..
echo ✓ Database ready at localhost:5432
exit /b 0

:END
echo.
echo ========================================
echo Press any key to exit...
pause >nul
exit
