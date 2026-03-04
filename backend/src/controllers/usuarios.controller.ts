import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { Usuario } from '../types';

// Listar todos los usuarios (admin ve todos, médico ve solo de su clínica)
export const getAllUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const userRole = req.user?.rol;

    // Admin o médico pueden ver usuarios
    if (userRole !== 'admin' && userRole !== 'medico') {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta acción'
      });
      return;
    }

    // Admin ve TODOS los usuarios, médico solo de su clínica
    let usuarios;
    if (userRole === 'admin') {
      usuarios = await query<Usuario[]>(
        `SELECT u.id, u.clinica_id, u.email, u.nombres, u.apellidos, u.dni, 
                u.telefono, u.foto_url, u.rol, u.especialidad, u.numero_colegiatura,
                u.activo, u.ultima_sesion, u.created_at, u.updated_at,
                c.nombre as clinica_nombre
         FROM usuarios u
         LEFT JOIN clinicas c ON u.clinica_id = c.id
         ORDER BY u.created_at DESC`
      );
    } else {
      // Médico solo ve usuarios de su clínica
      usuarios = await query<Usuario[]>(
        `SELECT u.id, u.clinica_id, u.email, u.nombres, u.apellidos, u.dni, 
                u.telefono, u.foto_url, u.rol, u.especialidad, u.numero_colegiatura,
                u.activo, u.ultima_sesion, u.created_at, u.updated_at,
                c.nombre as clinica_nombre
         FROM usuarios u
         LEFT JOIN clinicas c ON u.clinica_id = c.id
         WHERE u.clinica_id = ?
         ORDER BY u.created_at DESC`,
        [clinicaId]
      );
    }

    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
};

// Obtener usuario por ID
export const getUsuarioById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const userRole = req.user?.rol;

    if (userRole !== 'admin' && Number(id) !== req.user?.id) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver este usuario'
      });
      return;
    }

    const usuarios = await query<Usuario[]>(
      `SELECT u.id, u.clinica_id, u.email, u.nombres, u.apellidos, u.dni,
              u.telefono, u.foto_url, u.rol, u.especialidad, u.numero_colegiatura,
              u.activo, u.ultima_sesion, u.created_at, u.updated_at,
              c.nombre as clinica_nombre, c.ruc as clinica_ruc
       FROM usuarios u
       LEFT JOIN clinicas c ON u.clinica_id = c.id
       WHERE u.id = ? AND u.clinica_id = ?`,
      [id, clinicaId]
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
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario'
    });
  }
};

// Crear nuevo usuario (admin o médico)
export const createUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuarioClinicaId = req.user?.clinica_id;
    const userRole = req.user?.rol;

    // Admin o médico pueden crear usuarios
    if (userRole !== 'admin' && userRole !== 'medico') {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear usuarios'
      });
      return;
    }

    const {
      clinica_id, // Para admin: puede especificar la clínica
      clinica_nombre, // Para crear nueva clínica on-the-fly
      clinica_ruc, // RUC de la nueva clínica
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

    // Validar campos requeridos
    if (!email || !password || !nombres || !apellidos || !dni || !rol) {
      res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: email, password, nombres, apellidos, dni, rol'
      });
      return;
    }

    // Validar que el email no exista
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

    // Validar rol
    const rolesValidos = ['admin', 'medico', 'enfermero', 'recepcionista', 'farmaceutico', 'administrativo'];
    if (!rolesValidos.includes(rol)) {
      res.status(400).json({
        success: false,
        error: 'Rol inválido'
      });
      return;
    }

    // Determinar la clínica del usuario
    let targetClinicaId = usuarioClinicaId; // Por defecto, la clínica del usuario que crea

    if (userRole === 'admin') {
      // Si es admin, puede especificar clínica o crear nueva
      if (clinica_nombre && clinica_ruc) {
        // Crear nueva clínica
        const existingClinica = await query<any[]>(
          'SELECT id FROM clinicas WHERE ruc = ?',
          [clinica_ruc]
        );

        if (existingClinica.length > 0) {
          // La clínica ya existe, usar su ID
          targetClinicaId = existingClinica[0].id;
        } else {
          // Crear la clínica
          const resultClinica: any = await query(
            `INSERT INTO clinicas (nombre, ruc, activo) VALUES (?, ?, true)`,
            [clinica_nombre, clinica_ruc]
          );
          targetClinicaId = resultClinica.insertId;
        }
      } else if (clinica_id) {
        // Admin especificó una clínica existente
        targetClinicaId = clinica_id;
      }
      // Si no especifica nada, usa su propia clínica
    }
    // Si es médico, siempre usa su propia clínica (targetClinicaId ya está configurado)

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result: any = await query(
      `INSERT INTO usuarios (
        clinica_id, email, password, nombres, apellidos, dni, telefono,
        rol, especialidad, numero_colegiatura, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        targetClinicaId,
        email,
        hashedPassword,
        nombres,
        apellidos,
        dni,
        telefono || null,
        rol,
        especialidad || null,
        numero_colegiatura || null
      ]
    );

    // Obtener el usuario creado
    const [nuevoUsuario] = await query<Usuario[]>(
      `SELECT u.id, u.clinica_id, u.email, u.nombres, u.apellidos, u.dni,
              u.telefono, u.rol, u.especialidad, u.numero_colegiatura, u.activo,
              c.nombre as clinica_nombre
       FROM usuarios u
       LEFT JOIN clinicas c ON u.clinica_id = c.id
       WHERE u.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: nuevoUsuario,
      message: 'Usuario creado exitosamente'
    });

  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario: ' + error.message
    });
  }
};

// Actualizar usuario
export const updateUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const userRole = req.user?.rol;

    // Solo admin puede editar cualquier usuario, otros solo pueden editarse a sí mismos
    if (userRole !== 'admin' && Number(id) !== req.user?.id) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar este usuario'
      });
      return;
    }

    const {
      email,
      password,
      nombres,
      apellidos,
      dni,
      telefono,
      rol,
      especialidad,
      numero_colegiatura,
      activo
    } = req.body;

    // Verificar que el usuario existe
    const usuarios = await query<Usuario[]>(
      'SELECT * FROM usuarios WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );

    if (usuarios.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    // Construir query de actualización dinámicamente
    const updates: string[] = [];
    const values: any[] = [];

    if (email !== undefined) {
      // Verificar que el email no esté en uso por otro usuario
      const existingUsers = await query<Usuario[]>(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, id]
      );
      if (existingUsers.length > 0) {
        res.status(400).json({
          success: false,
          error: 'El email ya está en uso por otro usuario'
        });
        return;
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (nombres !== undefined) {
      updates.push('nombres = ?');
      values.push(nombres);
    }

    if (apellidos !== undefined) {
      updates.push('apellidos = ?');
      values.push(apellidos);
    }

    if (dni !== undefined) {
      updates.push('dni = ?');
      values.push(dni);
    }

    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono || null);
    }

    if (rol !== undefined && userRole === 'admin') {
      updates.push('rol = ?');
      values.push(rol);
    }

    if (especialidad !== undefined) {
      updates.push('especialidad = ?');
      values.push(especialidad || null);
    }

    if (numero_colegiatura !== undefined) {
      updates.push('numero_colegiatura = ?');
      values.push(numero_colegiatura || null);
    }

    if (activo !== undefined && userRole === 'admin') {
      updates.push('activo = ?');
      values.push(activo);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar'
      });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(id);
    values.push(clinicaId);

    const updateQuery = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`;
    await query(updateQuery, values);

    // Obtener usuario actualizado
    const [usuarioActualizado] = await query<Usuario[]>(
      `SELECT u.id, u.clinica_id, u.email, u.nombres, u.apellidos, u.dni,
              u.telefono, u.rol, u.especialidad, u.numero_colegiatura, u.activo,
              c.nombre as clinica_nombre
       FROM usuarios u
       LEFT JOIN clinicas c ON u.clinica_id = c.id
       WHERE u.id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: usuarioActualizado,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario: ' + error.message
    });
  }
};

// Desactivar usuario (soft delete)
export const deleteUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const userRole = req.user?.rol;

    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar usuarios'
      });
      return;
    }

    // No permitir que el usuario se desactive a sí mismo
    if (Number(id) === req.user?.id) {
      res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propia cuenta'
      });
      return;
    }

    const result: any = await query(
      'UPDATE usuarios SET activo = false, updated_at = NOW() WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });

  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario: ' + error.message
    });
  }
};

// Obtener médicos activos de la clínica (para selects/dropdowns)
export const getMedicos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    console.log('🔍 GET MEDICOS - Clinica ID:', clinicaId);
    console.log('👤 Usuario:', req.user?.nombres, req.user?.apellidos, '- Rol:', req.user?.rol);

    const medicos = await query<Usuario[]>(
      `SELECT id, nombres, apellidos, especialidad
       FROM usuarios
       WHERE clinica_id = ? AND rol = 'medico' AND activo = true
       ORDER BY nombres, apellidos`,
      [clinicaId]
    );

    console.log('✅ Médicos encontrados:', medicos.length);
    if (medicos.length > 0) {
      console.log('👨‍⚕️ Médicos:', medicos.map(m => ({
        id: m.id,
        nombre: `${m.nombres} ${m.apellidos}`,
        especialidad: m.especialidad
      })));
    }

    res.json({
      success: true,
      data: medicos
    });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener médicos'
    });
  }
};
