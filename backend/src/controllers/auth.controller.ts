import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { query } from '../config/database';
import { Usuario, JWTPayload } from '../types';
import { AuthRequest } from '../middleware/auth.middleware';

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('='.repeat(60));
    console.log('🔐 LOGIN ATTEMPT - Email:', email);

    // Validar campos
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
      return;
    }

    // Buscar usuario con información de clínica
    const usuarios = await query<any[]>(
      `SELECT u.*, c.nombre as clinica_nombre, c.ruc as clinica_ruc
       FROM usuarios u
       LEFT JOIN clinicas c ON u.clinica_id = c.id
       WHERE u.email = ? AND u.activo = true`,
      [email]
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuario no encontrado');
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
      return;
    }

    const usuario = usuarios[0];
    console.log('✅ Usuario encontrado:', {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
      clinica_id: usuario.clinica_id,
      clinica_nombre: usuario.clinica_nombre
    });

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    
    if (!passwordMatch) {
      console.log('❌ Contraseña incorrecta');
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
      return;
    }

    console.log('✅ Contraseña correcta');
    console.log('='.repeat(60));

    // Actualizar última sesión
    await query(
      'UPDATE usuarios SET ultima_sesion = NOW() WHERE id = ?',
      [usuario.id]
    );

    // Generar tokens
    const payload: JWTPayload = {
      id: usuario.id,
      clinica_id: usuario.clinica_id,
      email: usuario.email,
      rol: usuario.rol,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
    };

    const jwtSecret = (process.env.JWT_SECRET || 'default_secret') as Secret;
    const jwtRefreshSecret = (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret') as Secret;
    const accessExpiry: string = process.env.JWT_EXPIRES_IN || '24h';
    const refreshExpiry: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    // @ts-expect-error - jwt.sign tipos son demasiado estrictos
    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: accessExpiry,
    });

    // @ts-expect-error - jwt.sign tipos son demasiado estrictos
    const refreshToken = jwt.sign({ id: usuario.id }, jwtRefreshSecret, {
      expiresIn: refreshExpiry,
    });

    // Responder
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: usuario.id,
          clinica_id: usuario.clinica_id,
          clinica_nombre: usuario.clinica_nombre,
          clinica_ruc: usuario.clinica_ruc,
          email: usuario.email,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          rol: usuario.rol,
          especialidad: usuario.especialidad,
          foto_url: usuario.foto_url,
        }
      },
      message: 'Login exitoso'
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión'
    });
  }
};

// Registro (solo para admins crear usuarios)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clinica_id,
      email,
      password,
      nombres,
      apellidos,
      dni,
      telefono,
      rol,
      especialidad,
      numero_colegiatura
    } = req.body;

    // Validar campos obligatorios
    if (!clinica_id || !email || !password || !nombres || !apellidos || !rol) {
      res.status(400).json({
        success: false,
        error: 'Campos obligatorios faltantes'
      });
      return;
    }

    // Verificar si el email ya existe
    const existingUsers = await query<Usuario[]>(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
      return;
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await query(
      `INSERT INTO usuarios (
        clinica_id, email, password, nombres, apellidos, dni, telefono,
        rol, especialidad, numero_colegiatura, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        clinica_id,
        email,
        hashedPassword,
        nombres,
        apellidos,
        dni || null,
        telefono || null,
        rol,
        especialidad || null,
        numero_colegiatura || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: (result as any).insertId
      }
    });

  } catch (error: any) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar usuario'
    });
  }
};

// Obtener información del usuario autenticado
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
      return;
    }

    const usuarios = await query<Usuario[]>(
      `SELECT id, clinica_id, email, nombres, apellidos, dni, telefono, 
              foto_url, rol, especialidad, numero_colegiatura, activo, 
              ultima_sesion, created_at 
       FROM usuarios WHERE id = ? AND activo = true`,
      [req.user.id]
    );

    if (usuarios.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: usuarios[0]
    });

  } catch (error: any) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del usuario'
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token requerido'
      });
      return;
    }

    // Verificar refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { id: number };

    // Buscar usuario
    const usuarios = await query<Usuario[]>(
      'SELECT * FROM usuarios WHERE id = ? AND activo = true',
      [decoded.id]
    );

    if (usuarios.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    const usuario = usuarios[0];

    // Generar nuevo access token
    const payload: JWTPayload = {
      id: usuario.id,
      clinica_id: usuario.clinica_id,
      email: usuario.email,
      rol: usuario.rol,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
    };

    const jwtSecret = (process.env.JWT_SECRET || 'default_secret') as Secret;
    const accessExpiry: string = process.env.JWT_EXPIRES_IN || '24h';

    // @ts-expect-error - jwt.sign tipos son demasiado estrictos
    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: accessExpiry,
    });

    res.json({
      success: true,
      data: {
        accessToken
      }
    });

  } catch (error: any) {
    console.error('Error en refreshToken:', error);
    res.status(401).json({
      success: false,
      error: 'Refresh token inválido o expirado'
    });
  }
};
