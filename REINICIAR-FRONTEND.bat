@echo off
echo ========================================
echo   REINICIANDO FRONTEND
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [1/3] Limpiando cache de Next.js...
if exist .next (
    rmdir /s /q .next
    echo ✓ Cache eliminado
) else (
    echo ✓ No hay cache para eliminar
)

echo.
echo [2/3] Verificando configuracion...
if exist tsconfig.json (
    echo ✓ tsconfig.json presente
) else (
    echo ✗ tsconfig.json no encontrado
)

if exist next.config.js (
    echo ✓ next.config.js presente
) else (
    echo ✗ next.config.js no encontrado
)

echo.
echo [3/3] Iniciando servidor de desarrollo...
echo.
echo ========================================
echo   Servidor iniciando en puerto 3000
echo ========================================
echo.

npm run dev

pause
