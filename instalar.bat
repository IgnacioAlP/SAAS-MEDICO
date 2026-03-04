@echo off
echo.
echo ====================================================
echo   NexusCreative Medical SaaS - Instalador
echo ====================================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado.
    echo Por favor instalar desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js encontrado: 
node --version
echo.

REM Verificar MySQL
netstat -ano | findstr :3306 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ADVERTENCIA: MySQL no parece estar corriendo en el puerto 3306
    echo Por favor iniciar XAMPP MySQL antes de continuar
    pause
)

echo.
echo ====================================================
echo   Instalando Backend...
echo ====================================================
echo.

cd backend

REM Instalar dependencias
echo Instalando dependencias del backend...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR al instalar dependencias del backend
    pause
    exit /b 1
)

REM Crear archivo .env
if not exist .env (
    echo Creando archivo .env...
    copy .env.example .env
)

REM Crear base de datos y tablas
echo.
echo Creando base de datos y tablas...
call npm run db:migrate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR al crear la base de datos
    pause
    exit /b 1
)

REM Poblar datos iniciales
echo.
echo Insertando datos iniciales...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ERROR al poblar datos
    pause
    exit /b 1
)

cd ..

echo.
echo ====================================================
echo   Instalando Frontend...
echo ====================================================
echo.

cd frontend

REM Instalar dependencias
echo Instalando dependencias del frontend...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR al instalar dependencias del frontend
    pause
    exit /b 1
)

REM Crear archivo .env.local
if not exist .env.local (
    echo Creando archivo .env.local...
    copy .env.local.example .env.local
)

cd ..

echo.
echo ====================================================
echo   INSTALACION COMPLETADA!
echo ====================================================
echo.
echo Para iniciar el sistema:
echo.
echo 1. Backend:
echo    cd backend
echo    npm run dev
echo.
echo 2. Frontend (en otra terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Abrir navegador en: http://localhost:3000
echo.
echo Credenciales de prueba:
echo - Admin:    admin@nexuscreative.com / 12345678
echo - Medico:   doctor@nexuscreative.com / 12345678
echo - Recepcion: recepcion@nexuscreative.com / 12345678
echo.
echo ====================================================

pause
