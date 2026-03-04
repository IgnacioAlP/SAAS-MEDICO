import { Router } from 'express';
import {
  getAllConsultas,
  getConsultaById,
  createConsulta,
  updateConsulta,
  getPacientesConCitaConfirmada
} from '../controllers/consultas.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

router.use(authenticate);

router.get('/pacientes-confirmados', authorize('admin', 'medico', 'enfermero', 'recepcionista'), getPacientesConCitaConfirmada);
router.get('/', authorize('admin', 'medico', 'enfermero'), getAllConsultas);
router.get('/:id', authorize('admin', 'medico', 'enfermero'), getConsultaById);
router.post('/', authorize('admin', 'medico'), createConsulta);
router.put('/:id', authorize('admin', 'medico'), updateConsulta);

export default router;
