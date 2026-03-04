import { Router } from 'express';
import {
  getSmtpConfig,
  updateSmtpConfig,
  testSmtpConfig,
  getMiPerfil,
  updateMiPerfil,
} from '../controllers/configuracion.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// SMTP
router.get('/smtp',         getSmtpConfig);
router.put('/smtp',         updateSmtpConfig);
router.post('/smtp/test',   testSmtpConfig);

// Mi Perfil
router.get('/perfil',       getMiPerfil);
router.put('/perfil',       updateMiPerfil);

export default router;
