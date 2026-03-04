# NexusCreative - Sistema SaaS Médico

Sistema integral de gestión médica para clínicas multiespecialidad con historias clínicas electrónicas.

## 🏥 Características Principales

### Módulos Implementados
- ✅ Gestión de Pacientes
- ✅ Historia Clínica Electrónica (HCE)
- ✅ Agenda y Citas
- ✅ Prescripciones y Recetas Médicas
- ✅ Laboratorio e Imágenes
- ✅ Farmacia Interna
- ✅ Internación/Hospitalización
- ✅ Gestión de Usuarios y Roles
- ✅ Reportes y Estadísticas
- ✅ Telemedicina
- ✅ Portal del Paciente
- ✅ Facturación (sin facturación electrónica)

### Medios de Pago Soportados
- 💵 Efectivo
- 💳 Tarjeta (Débito/Crédito)
- 📱 Yape/Plin
- 🔄 Multi-pago (combinación de medios)

## 🛠️ Stack Tecnológico

### Backend
- Node.js + Express
- TypeScript
- MySQL (XAMPP - Puerto 3306)
- Redis (caché)
- JWT (autenticación)
- Socket.io (notificaciones en tiempo real)

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- React Query
- Zustand

### Base de Datos
- MySQL 8.0+ (XAMPP)
- Puerto: 3306

## 📦 Instalación

### Requisitos Previos
- Node.js 18+
- XAMPP instalado y corriendo
- MySQL en puerto 3306

### Instalación Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev
```

### Instalación Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configurar variables de entorno
npm run dev
```

### Configuración Base de Datos

1. Iniciar XAMPP y activar MySQL
2. Importar el schema inicial:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

## 🚀 Iniciar Proyecto

### Desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

El frontend estará disponible en: http://localhost:3000
El backend estará disponible en: http://localhost:5000

## 👥 Usuarios por Defecto

### Administrador
- Email: admin@nexuscreative.com
- Password: admin123

### Médico
- Email: doctor@nexuscreative.com
- Password: doctor123

### Recepcionista
- Email: recepcion@nexuscreative.com
- Password: recepcion123

## 📁 Estructura del Proyecto

```
SAAS-MEDICO/
├── backend/                 # API REST
│   ├── src/
│   │   ├── config/         # Configuraciones
│   │   ├── controllers/    # Controladores
│   │   ├── models/         # Modelos de DB
│   │   ├── routes/         # Rutas API
│   │   ├── middleware/     # Middlewares
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades
│   │   └── types/          # Tipos TypeScript
│   ├── database/
│   │   ├── migrations/     # Migraciones DB
│   │   └── seeders/        # Datos iniciales
│   └── uploads/            # Archivos subidos
├── frontend/               # Aplicación Next.js
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # Componentes React
│   │   ├── lib/           # Librerías
│   │   ├── hooks/         # Custom Hooks
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilidades
│   └── public/            # Archivos estáticos
└── docs/                  # Documentación

```

## 🔐 Seguridad

- Autenticación JWT con refresh tokens
- Bcrypt para hash de contraseñas
- CORS configurado
- Rate limiting
- Validación de inputs
- SQL injection prevention
- XSS protection

## 📝 Licencia

Propietario - NexusCreative © 2026

## 🤝 Soporte

Para soporte técnico, contactar a: soporte@nexuscreative.com
