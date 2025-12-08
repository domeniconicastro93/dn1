@echo off
REM ============================================================================
REM STRIKE - Start All Services
REM ============================================================================
REM Avvia tutti i servizi Strike nell'ordine corretto
REM ============================================================================

chcp 65001 >nul
setlocal enabledelayedexpansion
title Strike - Start All Services

REM Change to script directory
cd /d "%~dp0"

echo.
echo ============================================================================
echo   STRIKE - Start All Services
echo ============================================================================
echo.

REM ============================================================================
REM Check if services are already running
REM ============================================================================
echo [STEP 1/3] Controllo servizi esistenti...
echo.

powershell -Command "$procs = Get-Process -Name node -ErrorAction SilentlyContinue; if ($procs) { Write-Host '[WARNING] Processi Node.js rilevati!'; Write-Host '[INFO] Esegui stop-all.bat per fermare tutti i servizi prima di riavviare.'; exit 1 } else { exit 0 }"
if %ERRORLEVEL% EQU 1 (
    echo.
    set /p CONTINUE="Continuare comunque? (S/N): "
    if /i not "!CONTINUE!"=="S" (
        echo [INFO] Avvio annullato.
        pause
        exit /b 0
    )
    echo.
)

echo [OK] Nessun servizio in esecuzione
echo.

REM ============================================================================
REM Start Services in Correct Order
REM ============================================================================
echo [STEP 2/3] Avvio servizi backend...
echo.

REM Useful absolute path
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=!SCRIPT_DIR:~0,-1!"

echo [1/6] Avvio Auth Service (porta 3001)...
start /MIN "Strike Auth Service" cmd /c "cd /d "!SCRIPT_DIR!\services\auth-service" && timeout /t 2 /nobreak >nul && pnpm run dev"
timeout /t 3 /nobreak >nul

echo [2/6] Avvio Game Service (porta 3003)...
start /MIN "Strike Game Service" cmd /c "cd /d "!SCRIPT_DIR!\services\game-service" && pnpm run dev"
timeout /t 2 /nobreak >nul

echo [3/6] Avvio Steam Library Service (porta 3022)...
start /MIN "Strike Steam Library Service" cmd /c "cd /d "!SCRIPT_DIR!\services\steam-library-service" && pnpm run dev"
timeout /t 2 /nobreak >nul

echo [4/6] Avvio Orchestrator Service (porta 3012)...
start /MIN "Strike Orchestrator Service" cmd /c "cd /d "!SCRIPT_DIR!\services\orchestrator-service" && pnpm run dev"
timeout /t 2 /nobreak >nul

echo [5/6] Avvio Gateway Service (porta 3000)...
start /MIN "Strike Gateway Service" cmd /c "cd /d "!SCRIPT_DIR!\services\gateway-service" && pnpm run dev"
timeout /t 2 /nobreak >nul

echo [6/6] Avvio Web App (porta 3005)...
start "Strike Web App" cmd /k "cd /d "!SCRIPT_DIR!\apps\web" && pnpm run dev"
timeout /t 5 /nobreak >nul

echo.
echo [OK] Tutti i servizi avviati!
echo.

REM ============================================================================
REM Verify Services
REM ============================================================================
echo [STEP 3/3] Verifica servizi...
echo.

timeout /t 5 /nobreak >nul

netstat -ano | findstr ":3001 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Auth Service        - http://localhost:3001
) else (
    echo [WARNING] Auth Service non risponde
)

netstat -ano | findstr ":3003 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Game Service        - http://localhost:3003
) else (
    echo [WARNING] Game Service non risponde
)

netstat -ano | findstr ":3022 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Steam Library       - http://localhost:3022
) else (
    echo [WARNING] Steam Library Service non risponde
)

netstat -ano | findstr ":3012 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Orchestrator Service - http://localhost:3012
) else (
    echo [WARNING] Orchestrator Service non risponde
)

netstat -ano | findstr ":3000 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Gateway Service     - http://localhost:3000
) else (
    echo [WARNING] Gateway Service non risponde
)

netstat -ano | findstr ":3005 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Web App             - http://localhost:3005
) else (
    echo [WARNING] Web App non risponde
)

echo.
echo ============================================================================
echo   STRIKE - TUTTI I SERVIZI AVVIATI
echo ============================================================================
echo.
echo   URL Principali:
echo   - Web App:        http://localhost:3005
echo   - Games Page:     http://localhost:3005/it/games
echo   - Gateway API:    http://localhost:3000/health
echo   - Orchestrator:   http://localhost:3012/health
echo.
echo   Per fermare tutti i servizi: stop-all.bat
echo.
echo   Questa finestra puo' essere chiusa; i servizi continueranno.
echo ============================================================================
echo.
echo Premi un tasto per chiudere questa finestra...
pause >nul
