@echo off
echo ================================================
echo FORCE PRISMA CLIENT REGENERATION
echo ================================================
echo.

echo Step 1: Cleaning Prisma client...
cd packages\shared-db
rmdir /s /q node_modules\.prisma 2>nul
rmdir /s /q node_modules\@prisma\client 2>nul

echo.
echo Step 2: Regenerating Prisma client...
call pnpm prisma generate

echo.
echo Step 3: Done!
echo.
echo ================================================
echo PRISMA CLIENT REGENERATED
echo ================================================
echo.
echo Next steps:
echo 1. Restart all services (Ctrl+C then start-all.bat)
echo 2. Test "Play Now"
echo.
pause
