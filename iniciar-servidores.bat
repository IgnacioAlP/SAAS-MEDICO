@echo off
echo.
echo ================================
echo   NexusCreative Medical SaaS
echo   Iniciando servidores...
echo ================================
echo.

cd /d "C:\Users\User\Desktop\SAAS MEDICO"

echo [1/2] Iniciando Backend (Puerto 5000)...
start "Backend-NexusCreative" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Iniciando Frontend (Puerto 3000)...
start "Frontend-NexusCreative" cmd /k "cd frontend && npm run dev"

echo.
echo ================================
echo   Servidores iniciados:
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:3000
echo ================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
echo (Los servidores seguiran ejecutandose)
pause >nul
