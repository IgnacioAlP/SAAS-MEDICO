import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// Extender Request para incluir usuario
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Middleware para verificar autenticación
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
      return;
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no configurado');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Agregar usuario al request
    req.user = decoded;
    
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
      return;
    }
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
};

// Middleware para verificar roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso'
      });
      return;
    }

    next();
  };
};

// Middleware para verificar que el usuario pertenece a la misma clínica
export const verifyClinica = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Este middleware se puede usar para verificar que los recursos
  // a los que accede el usuario pertenecen a su clínica
  // Por ahora solo pasa al siguiente middleware
  next();
};
