import { Router } from 'express';
import { getAllRecetas, getRecetaById, createReceta, updateReceta, deleteReceta } from '../controllers/recetas.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();
router.use(authenticate);

router.get('/', authorize('admin', 'medico', 'enfermero', 'farmaceutico'), getAllRecetas);
router.get('/:id', authorize('admin', 'medico', 'enfermero', 'farmaceutico'), getRecetaById);
router.post('/', authorize('admin', 'medico'), createReceta);
router.put('/:id', authorize('admin', 'medico'), updateReceta);
router.delete('/:id', authorize('admin', 'medico'), deleteReceta);

export default router;
