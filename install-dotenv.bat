@echo off
REM ============================================================================
REM Add dotenv to all services
REM ============================================================================

echo Adding dotenv to all services...
echo.

cd services\auth-service
call npm install dotenv
cd ..\..

cd services\game-service
call npm install dotenv
cd ..\..

cd services\gateway-service
call npm install dotenv
cd ..\..

cd services\orchestrator-service
call npm install dotenv
cd ..\..

cd services\steam-library-service
call npm install dotenv
cd ..\..

cd services\user-service
call npm install dotenv
cd ..\..

echo.
echo Done! dotenv installed in all services.
pause
