# 🚀 Guía de Instalación - NexusCreative Medical SaaS

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **XAMPP** 
   - Descargar desde: https://www.apachefriends.org/
   - Puerto MySQL: 3306

3. **Git** (opcional)
   - Descargar desde: https://git-scm.com/

---

## 📦 Paso 1: Configurar XAMPP y MySQL

### 1.1 Iniciar XAMPP
1. Abrir el Panel de Control de XAMPP
2. Iniciar el servicio **MySQL** (clic en "Start")
3. Verificar que el puerto sea **3306**

### 1.2 (Opcional) Verificar MySQL
1. Clic en "Admin" del módulo MySQL
2. Se abrirá phpMyAdmin en el navegador
3. El sistema creará automáticamente la base de datos

---

## 🔧 Paso 2: Configurar el Backend

### 2.1 Instalar dependencias
Abrir PowerShell o CMD en la carpeta del proyecto y ejecutar:

```powershell
cd backend
npm install
```

### 2.2 Configurar variables de entorno
1. Copiar el archivo `.env.example` y renombrarlo a `.env`:
```powershell
Copy-Item .env.example .env
```

2. Abrir el archivo `.env` y verificar la configuración:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=nexuscreative_medical
```

> ⚠️ **Nota:** Si configuraste una contraseña en MySQL de XAMPP, agrégala en `DB_PASSWORD`

### 2.3 Crear la base de datos y tablas
```powershell
npm run db:migrate
```

### 2.4 Poblar con datos iniciales
```powershell
npm run db:seed
```

**✅ Al finalizar verás las credenciales de prueba:**
```
👤 Admin:       admin@nexuscreative.com / 12345678
🩺 Médico:      doctor@nexuscreative.com / 12345678
❤️  Cardiólogo: dra.cardio@nexuscreative.com / 12345678
```

### 2.5 Iniciar el servidor backend
```powershell
npm run dev
```

**✅ El servidor debe estar corriendo en:** `http://localhost:5000`

---

## 🎨 Paso 3: Configurar el Frontend

### 3.1 Abrir una NUEVA terminal/PowerShell
Dejar el backend corriendo y abrir otra terminal.

### 3.2 Instalar dependencias
```powershell
cd frontend
npm install
```

### 3.3 Configurar variables de entorno
1. Copiar el archivo `.env.local.example` y renombrarlo a `.env.local`:
```powershell
Copy-Item .env.local.example .env.local
```

2. Verificar que contenga:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3.4 Iniciar el servidor frontend
```powershell
npm run dev
```

**✅ El frontend debe estar corriendo en:** `http://localhost:3000`

---

## ✨ Paso 4: Acceder al Sistema

1. **Abrir el navegador** y visitar: `http://localhost:3000`

2. **Iniciar sesión** con alguna de las credenciales:
   - **Admin:** admin@nexuscreative.com / 12345678
   - **Médico:** doctor@nexuscreative.com / 12345678
   - **Recepción:** recepcion@nexuscreative.com / 12345678

---

## 🔍 Verificar que todo funcione

### ✅ Checklist
- [ ] XAMPP MySQL está corriendo (puerto 3306)
- [ ] Backend está corriendo en http://localhost:5000
- [ ] Frontend está corriendo en http://localhost:3000
- [ ] Puedes ver la página de login
- [ ] Puedes iniciar sesión con las credenciales de prueba

### 🧪 Probar endpoints del backend
Abrir en el navegador:
- http://localhost:5000 (debe mostrar información de la API)
- http://localhost:5000/health (debe mostrar "status: ok")

---

## ⚠️ Solución de Problemas Comunes

### Error: "Cannot find module"
```powershell
# Eliminar node_modules y reinstalar
rm -r node_modules
npm install
```

### Error: "ECONNREFUSED" o conexión rechazada
- Verificar que XAMPP MySQL esté corriendo
- Verificar el puerto 3306 en XAMPP
- Revisar la configuración en el archivo `.env`

### Error: "Table doesn't exist"
```powershell
# Volver a ejecutar las migraciones
cd backend
npm run db:migrate
npm run db:seed
```

### Puerto 3000 o 5000 ya en uso
```powershell
# Windows - Encontrar proceso en puerto
netstat -ano | findstr :3000
# Matar proceso (reemplazar PID)
taskkill /PID <numero_pid> /F
```

### El frontend no se conecta al backend
- Verificar que `NEXT_PUBLIC_API_URL` en `.env.local` sea correcto
- Verificar que el backend esté corriendo
- Limpiar caché del navegador (Ctrl + Shift + R)

---

## 📝 Comandos Útiles

### Backend
```powershell
cd backend
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar TypeScript
npm start            # Iniciar servidor en producción
npm run db:migrate   # Crear tablas
npm run db:seed      # Poblar datos iniciales
```

### Frontend
```powershell
cd frontend
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm start            # Iniciar servidor de producción
npm run lint         # Verificar código
```

---

## 📚 Estructura del Proyecto

```
SAAS MEDICO/
├── backend/                 # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Configuración de DB
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middlewares
│   │   ├── database/       # Migraciones y seeds
│   │   └── types/          # Tipos TypeScript
│   └── .env                # Variables de entorno
│
├── frontend/               # Aplicación Next.js
│   ├── src/
│   │   ├── app/           # Páginas (App Router)
│   │   ├── components/    # Componentes React
│   │   ├── lib/           # Utilidades
│   │   └── store/         # Estado global (Zustand)
│   └── .env.local         # Variables de entorno
│
└── README.md              # Documentación principal
```

---

## 🎯 Próximos Pasos

1. **Explorar el sistema**: Login con diferentes roles
2. **Revisar la documentación**: Leer `README.md`
3. **Personalizar**: Ajustar colores, logo, textos
4. **Desarrollar módulos**: Agregar funcionalidades específicas

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa la sección "Solución de Problemas"
2. Verifica que todos los servicios estén corriendo
3. Revisa los logs en las terminales
4. Consulta la documentación de cada tecnología

---

## ✅ ¡Listo!

Tu sistema médico SaaS está configurado y listo para usar.

**Endpoints principales:**
- 🏠 Frontend: http://localhost:3000
- 🔌 API Backend: http://localhost:5000
- 📊 phpMyAdmin: http://localhost/phpmyadmin

**¡Feliz desarrollo! 🎉**
