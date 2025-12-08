@echo off
REM ============================================================================
REM Fix all workspace:* dependencies to * for npm compatibility
REM ============================================================================

echo.
echo Fixing workspace dependencies for npm compatibility...
echo.

powershell -ExecutionPolicy Bypass -File fix-workspaces.ps1

echo.
echo Done! All workspace:* dependencies have been changed to * for npm compatibility.
echo.
echo Now you can run: npm install
echo.
pause

