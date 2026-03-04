import { Router } from 'express';
import {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getMedicos
} from '../controllers/usuarios.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de usuarios
router.get('/', authorize('admin', 'medico'), getAllUsuarios); // Admin y médico pueden ver usuarios
router.get('/medicos', authorize('admin', 'medico', 'recepcionista', 'enfermero'), getMedicos); // Médicos también necesitan ver otros médicos para citas
router.get('/:id', authenticate, getUsuarioById); // Cualquier usuario autenticado puede ver su propio perfil
router.post('/', authorize('admin', 'medico'), createUsuario); // Admin y médico pueden crear usuarios
router.put('/:id', authenticate, updateUsuario); // Admin puede editar a todos, usuarios pueden editarse a sí mismos
router.delete('/:id', authorize('admin'), deleteUsuario);

export default router;
