import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { Clinica } from '../types';

// Listar todas las clínicas (solo admin)
export const getAllClinicas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.rol;

    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para listar todas las clínicas'
      });
      return;
    }

    const clinicas = await query<Clinica[]>(
      'SELECT id, nombre, ruc, direccion, telefono, email, activo FROM clinicas WHERE activo = true ORDER BY nombre',
      []
    );

    res.json({
      success: true,
      data: clinicas
    });
  } catch (error) {
    console.error('Error al obtener clínicas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener clínicas'
    });
  }
};

// Obtener información de la clínica del usuario
export const getClinica = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;

    const clinicas = await query<Clinica[]>(
      'SELECT * FROM clinicas WHERE id = ?',
      [clinicaId]
    );

    if (clinicas.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Clínica no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: clinicas[0]
    });
  } catch (error) {
    console.error('Error al obtener clínica:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener clínica'
    });
  }
};

// Crear nueva clínica (admin o doctor)
export const createClinica = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.rol;

    if (userRole !== 'admin' && userRole !== 'medico') {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear clínicas'
      });
      return;
    }

    const { nombre, ruc, direccion, telefono, email } = req.body;

    // Validar campos requeridos
    if (!nombre || !ruc) {
      res.status(400).json({
        success: false,
        error: 'Nombre y RUC son requeridos'
      });
      return;
    }

    // Validar que el RUC no exista
    const existingClinicas = await query<Clinica[]>(
      'SELECT id FROM clinicas WHERE ruc = ?',
      [ruc]
    );

    if (existingClinicas.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Ya existe una clínica con ese RUC'
      });
      return;
    }

    // Insertar clínica
    const result: any = await query(
      `INSERT INTO clinicas (nombre, ruc, direccion, telefono, email, activo)
       VALUES (?, ?, ?, ?, ?, true)`,
      [nombre, ruc, direccion || null, telefono || null, email || null]
    );

    // Obtener la clínica creada
    const [nuevaClinica] = await query<Clinica[]>(
      'SELECT * FROM clinicas WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: nuevaClinica,
      message: 'Clínica creada exitosamente'
    });

  } catch (error: any) {
    console.error('Error al crear clínica:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear clínica: ' + error.message
    });
  }
};

// Actualizar información de la clínica (solo admin o de su propia clínica)
export const updateClinica = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const userRole = req.user?.rol;

    if (userRole !== 'admin' && userRole !== 'medico') {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar la clínica'
      });
      return;
    }

    const {
      nombre,
      ruc,
      direccion,
      telefono,
      email
    } = req.body;

    // Construir query de actualización dinámicamente
    const updates: string[] = [];
    const values: any[] = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }

    if (ruc !== undefined) {
      updates.push('ruc = ?');
      values.push(ruc);
    }

    if (direccion !== undefined) {
      updates.push('direccion = ?');
      values.push(direccion || null);
    }

    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono || null);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email || null);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar'
      });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(clinicaId);

    const updateQuery = `UPDATE clinicas SET ${updates.join(', ')} WHERE id = ?`;
    await query(updateQuery, values);

    // Obtener clínica actualizada
    const [clinicaActualizada] = await query<Clinica[]>(
      'SELECT * FROM clinicas WHERE id = ?',
      [clinicaId]
    );

    res.json({
      success: true,
      data: clinicaActualizada,
      message: 'Clínica actualizada exitosamente'
    });

  } catch (error: any) {
    console.error('Error al actualizar clínica:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar clínica: ' + error.message
    });
  }
};
