import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './config/database';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARES ==========

// Seguridad
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Permitir cualquier subdominio de vercel.app y railway.app
    if (origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true,
}));

// Parseo de JSON y URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compresión de respuestas
app.use(compression());

// Logging de peticiones HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ========== RUTAS ==========

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Ruta principal
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🏥 NexusCreative - API Sistema Médico SaaS',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/health',
  });
});

// Importar rutas de módulos
import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import clinicasRoutes from './routes/clinicas.routes';
import pacientesRoutes from './routes/pacientes.routes';
import consultasRoutes from './routes/consultas.routes';
import citasRoutes from './routes/citas.routes';
import pagosRoutes from './routes/pagos.routes';
import recetasRoutes from './routes/recetas.routes';
import laboratorioRoutes from './routes/laboratorio.routes';
import internacionesRoutes from './routes/internaciones.routes';
import configuracionRoutes from './routes/configuracion.routes';

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clinicas', clinicasRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/recetas', recetasRoutes);
app.use('/api/laboratorio', laboratorioRoutes);
app.use('/api/internaciones', internacionesRoutes);
app.use('/api/configuracion', configuracionRoutes);

// ========== MANEJO DE ERRORES ==========

// Ruta no encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
  });
});

// Manejador de errores global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ========== INICIAR SERVIDOR ==========

const startServer = async () => {
  try {
    // Probar conexión a base de datos
    await testConnection();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n╔═══════════════════════════════════════════════════════╗');
      console.log('║     🏥 NexusCreative - Sistema Médico SaaS          ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log(`\n🚀 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Hora: ${new Date().toLocaleString('es-PE')}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📍 Endpoints disponibles:');
      console.log('   GET  /              - Información de la API');
      console.log('   GET  /health        - Estado del servidor');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de cierre
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Iniciar
startServer();

export default app;
