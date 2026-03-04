import { Router } from 'express';
import { login, register, getMe, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Autenticación
router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', refreshToken);

// Usuario autenticado
router.get('/me', authenticate, getMe);

export default router;
