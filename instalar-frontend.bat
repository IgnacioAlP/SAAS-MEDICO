@echo off
echo ========================================
echo   INSTALACION DEL FRONTEND
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [1/4] Limpiando instalaciones anteriores...
if exist node_modules (
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del /f package-lock.json
)
if exist .next (
    rmdir /s /q .next
)

echo [2/4] Instalando dependencias (esto puede tomar 3-5 minutos)...
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo   ERROR EN LA INSTALACION
    echo ========================================
    echo.
    echo Intenta ejecutar manualmente:
    echo cd "%~dp0frontend"
    echo npm install --legacy-peer-deps
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] Verificando instalacion...
if not exist "node_modules\next\dist\bin\next" (
    echo ERROR: Next.js no se instalo correctamente
    pause
    exit /b 1
)

echo [4/4] Instalacion completada!
echo.
echo ========================================
echo   FRONTEND LISTO PARA INICIAR
echo ========================================
echo.
echo Ahora ejecuta: INICIAR-SISTEMA.bat
echo.
pause
