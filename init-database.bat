@echo off
REM ============================================================================
REM Initialize Database for Strike Gaming Cloud
REM ============================================================================

echo.
echo ========================================
echo Strike Gaming Cloud - Database Initialization
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo [INFO] Creating .env from env.example...
    if exist "env.example" (
        copy "env.example" ".env" >nul
        echo [SUCCESS] .env file created. Please edit it with your database credentials.
    ) else (
        echo [ERROR] env.example not found!
        pause
        exit /b 1
    )
)

REM Check if pnpm is available
pnpm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] pnpm is not installed
    echo [INFO] Please install pnpm: npm install -g pnpm
    pause
    exit /b 1
)

echo [INFO] Generating Prisma client...
cd packages\shared-db
call pnpm prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate Prisma client
    cd ..\..
    pause
    exit /b 1
)

echo.
echo [INFO] Running database migrations...
call pnpm prisma migrate dev --name init
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Migration failed. This might be normal if database doesn't exist yet.
    echo [INFO] Make sure PostgreSQL is running and DATABASE_URL is correct in .env
)

cd ..\..

echo.
echo ========================================
echo Database Initialization Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Check DATABASE_URL in .env file
echo 3. Run this script again if migrations failed
echo.
pause

