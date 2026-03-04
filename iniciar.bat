@echo off
echo.
echo ====================================================
echo   NexusCreative Medical SaaS - Iniciando...
echo ====================================================
echo.

REM Verificar que existan las carpetas
if not exist backend (
    echo ERROR: No se encuentra la carpeta backend
    pause
    exit /b 1
)

if not exist frontend (
    echo ERROR: No se encuentra la carpeta frontend
    pause
    exit /b 1
)

echo Iniciando Backend en puerto 5000...
start "NexusCreative Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Iniciando Frontend en puerto 3000...
start "NexusCreative Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================
echo   Servidores iniciados!
echo ====================================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana
echo (Los servidores seguiran corriendo en sus propias ventanas)
echo.

pause >nul
