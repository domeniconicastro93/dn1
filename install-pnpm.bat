@echo off
REM ============================================================================
REM Install pnpm globally (required for workspace dependencies)
REM ============================================================================

echo.
echo ========================================
echo Installing pnpm Package Manager
echo ========================================
echo.
echo This project uses workspace dependencies (workspace:*)
echo npm does not support this, so pnpm or yarn is required.
echo.
echo Installing pnpm globally...
echo.

call npm install -g pnpm

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] pnpm installed successfully!
    echo.
    echo You can now run:
    echo   - start-all.bat
    echo   - start-essential.bat
    echo.
    echo Verifying installation...
    pnpm --version
    echo.
) else (
    echo.
    echo [ERROR] Failed to install pnpm
    echo.
    echo Try running as administrator or install manually:
    echo   npm install -g pnpm
    echo.
)

pause

