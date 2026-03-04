import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

type UserRole = 'admin' | 'medico' | 'enfermero' | 'recepcionista' | 'farmaceutico' | 'administrativo';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
      return;
    }

    const userRole = req.user.rol;

    if (!allowedRoles.includes(userRole as UserRole)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso'
      });
      return;
    }

    next();
  };
};

// Helpers para verificar permisos específicos
export const canManagePatients = (role: string): boolean => {
  return ['admin', 'medico', 'enfermero', 'recepcionista'].includes(role);
};

export const canCreateConsultations = (role: string): boolean => {
  return ['admin', 'medico'].includes(role);
};

export const canPrescribe = (role: string): boolean => {
  return ['admin', 'medico'].includes(role);
};

export const canManagePayments = (role: string): boolean => {
  return ['admin', 'recepcionista', 'administrativo'].includes(role);
};

export const canManageUsers = (role: string): boolean => {
  return role === 'admin';
};

export const canViewReports = (role: string): boolean => {
  return ['admin', 'administrativo'].includes(role);
};
