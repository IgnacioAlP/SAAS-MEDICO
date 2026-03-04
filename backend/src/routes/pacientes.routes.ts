import { Router } from 'express';
import {
  getAllPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  searchPacientes
} from '../controllers/pacientes.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de pacientes
router.get('/', authorize('admin', 'medico', 'enfermero', 'recepcionista'), getAllPacientes);
router.get('/search', authorize('admin', 'medico', 'enfermero', 'recepcionista'), searchPacientes);
router.get('/:id', authorize('admin', 'medico', 'enfermero', 'recepcionista'), getPacienteById);
router.post('/', authorize('admin', 'medico', 'recepcionista'), createPaciente);
router.put('/:id', authorize('admin', 'medico', 'recepcionista'), updatePaciente);
router.delete('/:id', authorize('admin'), deletePaciente);

export default router;
