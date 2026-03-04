import { Router } from 'express';
import {
  getAllCitas,
  getCitaById,
  createCita,
  updateCita,
  cancelCita,
  confirmCita,
  confirmarCitaPorToken
} from '../controllers/citas.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

// Ruta pública: confirmar cita desde enlace de email (sin autenticación)
router.get('/confirmar/:token', confirmarCitaPorToken);

router.use(authenticate);

router.get('/', authorize('admin', 'medico', 'enfermero', 'recepcionista'), getAllCitas);
router.get('/:id', authorize('admin', 'medico', 'enfermero', 'recepcionista'), getCitaById);
router.post('/', authorize('admin', 'medico', 'recepcionista'), createCita);
router.put('/:id', authorize('admin', 'medico', 'recepcionista'), updateCita);
router.post('/:id/cancelar', authorize('admin', 'medico', 'recepcionista'), cancelCita);
router.post('/:id/confirmar', authorize('admin', 'medico', 'recepcionista'), confirmCita);

export default router;

