@echo off
echo ========================================
echo   SISTEMA MEDICO SAAS - NEXUSCREATIVE
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Iniciando Backend (Puerto 5000)...
start "Backend - NexusCreative" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Iniciando Frontend (Puerto 3000)...
start "Frontend - NexusCreative" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   SERVIDORES INICIADOS
echo ========================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo.
echo Espera 10-15 segundos y abre:
echo   http://localhost:3000
echo.
echo Usuario de prueba:
echo   Email: admin@nexuscreative.com
echo   Password: admin123
echo.
echo ========================================
echo.
pause
