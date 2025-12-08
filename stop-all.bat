@echo off
REM ============================================================================
REM STRIKE - Stop All Services
REM ============================================================================
REM Ferma tutti i processi Node.js e chiude tutte le finestre dei servizi
REM ============================================================================

chcp 65001 >nul
title Strike - Stop All Services

echo.
echo ============================================================================
echo   STRIKE - Stop All Services
echo ============================================================================
echo.

REM ============================================================================
REM Check if any Node.js processes are running
REM ============================================================================
echo [STEP 1/2] Controllo processi Node.js in esecuzione...
echo.

powershell -Command "$procs = Get-Process -Name node -ErrorAction SilentlyContinue; if ($procs) { Write-Host '[INFO] Trovati' $procs.Count 'processi Node.js'; exit 0 } else { Write-Host '[INFO] Nessun processo Node.js in esecuzione'; exit 1 }"

if %ERRORLEVEL% EQU 1 (
    echo.
    echo [OK] Nessun servizio da fermare.
    echo.
    pause
    exit /b 0
)

echo.
set /p CONFIRM="Fermare tutti i servizi Strike? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo [INFO] Operazione annullata.
    pause
    exit /b 0
)

echo.

REM ============================================================================
REM Kill all Node.js processes
REM ============================================================================
echo [STEP 2/2] Chiusura di tutti i processi Node.js...
echo.

taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Tutti i processi Node.js sono stati terminati.
) else (
    echo [WARNING] Nessun processo Node.js trovato o errore durante la chiusura.
)

echo.

REM Also kill tsx processes if any
taskkill /F /IM tsx.exe >nul 2>&1

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

echo.
echo ============================================================================
echo   STRIKE - TUTTI I SERVIZI FERMATI
echo ============================================================================
echo.
echo   Tutti i servizi Strike sono stati fermati.
echo   Per riavviare, esegui: start-all.bat
echo.
echo ============================================================================
echo.
pause
