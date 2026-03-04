import { Router } from 'express';
import {
  getAllPagos,
  getPagoById,
  createPago,
  getEstadisticasPagos
} from '../controllers/pagos.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'recepcionista', 'administrativo'), getAllPagos);
router.get('/estadisticas', authorize('admin', 'administrativo'), getEstadisticasPagos);
router.get('/:id', authorize('admin', 'recepcionista', 'administrativo'), getPagoById);
router.post('/', authorize('admin', 'recepcionista'), createPago);

export default router;
