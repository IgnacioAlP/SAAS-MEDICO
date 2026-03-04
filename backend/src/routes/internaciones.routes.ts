import { Router } from 'express';
import { getAllInternaciones, getInternacionById, createInternacion, updateInternacion, darAltaInternacion } from '../controllers/internaciones.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();
router.use(authenticate);

router.get('/', authorize('admin', 'medico', 'enfermero'), getAllInternaciones);
router.get('/:id', authorize('admin', 'medico', 'enfermero'), getInternacionById);
router.post('/', authorize('admin', 'medico'), createInternacion);
router.put('/:id', authorize('admin', 'medico', 'enfermero'), updateInternacion);
router.post('/:id/alta', authorize('admin', 'medico'), darAltaInternacion);

export default router;
