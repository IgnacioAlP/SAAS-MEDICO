import { Router } from 'express';
import {
  getAllClinicas,
  getClinica,
  createClinica,
  updateClinica
} from '../controllers/clinicas.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de clínica
router.get('/all', authorize('admin'), getAllClinicas); // Solo admin puede ver todas las clínicas
router.get('/', authenticate, getClinica); // Cualquier usuario autenticado puede ver su clínica
router.post('/', authorize('admin', 'medico'), createClinica); // Admin o médico pueden crear clínicas
router.put('/', authorize('admin', 'medico'), updateClinica); // Admin o médico pueden editar su clínica

export default router;
