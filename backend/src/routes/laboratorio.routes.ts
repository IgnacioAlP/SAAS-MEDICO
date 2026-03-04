import { Router } from 'express';
import { getAllLaboratorio, getLaboratorioById, createLaboratorio, updateLaboratorio } from '../controllers/laboratorio.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();
router.use(authenticate);

router.get('/', authorize('admin', 'medico', 'enfermero'), getAllLaboratorio);
router.get('/:id', authorize('admin', 'medico', 'enfermero'), getLaboratorioById);
router.post('/', authorize('admin', 'medico'), createLaboratorio);
router.put('/:id', authorize('admin', 'medico', 'enfermero'), updateLaboratorio);

export default router;
