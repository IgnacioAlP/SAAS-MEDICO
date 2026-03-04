import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

// Listar internaciones
export const getAllInternaciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const { estado } = req.query;

    let sql = `
      SELECT i.id, i.clinica_id, i.paciente_id, i.medico_id,
        i.fecha_ingreso, i.fecha_egreso, i.motivo, i.diagnostico,
        i.habitacion, i.cama, i.estado, i.observaciones, i.created_at,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
      FROM internaciones i
      LEFT JOIN pacientes p ON i.paciente_id = p.id
      LEFT JOIN usuarios u ON i.medico_id = u.id
      WHERE i.clinica_id = ?
    `;
    const params: any[] = [clinicaId];

    if (estado) { sql += ' AND i.estado = ?'; params.push(estado); }

    sql += ' ORDER BY i.id DESC';

    const internaciones = await query(sql, params);
    res.json({ success: true, data: internaciones });
  } catch (error: any) {
    console.error('Error al obtener internaciones:', error);
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Obtener internación por ID
export const getInternacionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    const internaciones = await query<any[]>(
      `SELECT i.*,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos, p.dni,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
       FROM internaciones i
       LEFT JOIN pacientes p ON i.paciente_id = p.id
       LEFT JOIN usuarios u ON i.medico_id = u.id
       WHERE i.id = ? AND i.clinica_id = ?`,
      [id, clinicaId]
    );

    if (!Array.isArray(internaciones) || internaciones.length === 0) {
      res.status(404).json({ success: false, error: 'Internación no encontrada' });
      return;
    }
    res.json({ success: true, data: internaciones[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Registrar internación
export const createInternacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const medicoId = req.user?.id;
    const { paciente_id, motivo, diagnostico, habitacion, cama, observaciones } = req.body;

    if (!paciente_id || !motivo) {
      res.status(400).json({ success: false, error: 'Paciente y motivo son requeridos' });
      return;
    }

    // Verificar si el paciente ya tiene una internación activa
    const activas = await query<any[]>(
      `SELECT id FROM internaciones WHERE paciente_id = ? AND clinica_id = ? AND estado = 'activa'`,
      [paciente_id, clinicaId]
    );
    if (Array.isArray(activas) && activas.length > 0) {
      res.status(400).json({ success: false, error: 'El paciente ya tiene una internación activa' });
      return;
    }

    const result = await query(
      `INSERT INTO internaciones (clinica_id, paciente_id, medico_id, fecha_ingreso, motivo, diagnostico, habitacion, cama, observaciones, estado)
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, 'activa')`,
      [clinicaId, paciente_id, medicoId, motivo, diagnostico ?? null, habitacion ?? null, cama ?? null, observaciones ?? null]
    );

    res.status(201).json({ success: true, data: { id: (result as any).insertId, message: 'Internación registrada exitosamente' } });
  } catch (error: any) {
    console.error('Error al crear internación:', error);
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Actualizar internación (dar alta, agregar notas)
export const updateInternacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const { diagnostico, habitacion, cama, observaciones, estado } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (diagnostico !== undefined) { updates.push('diagnostico = ?'); values.push(diagnostico); }
    if (habitacion !== undefined) { updates.push('habitacion = ?'); values.push(habitacion); }
    if (cama !== undefined) { updates.push('cama = ?'); values.push(cama); }
    if (observaciones !== undefined) { updates.push('observaciones = ?'); values.push(observaciones); }
    if (estado) {
      updates.push('estado = ?');
      values.push(estado);
      // Si se da de alta, registrar fecha de egreso
      if (estado === 'alta' || estado === 'traslado') {
        updates.push('fecha_egreso = NOW()');
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
      return;
    }

    values.push(id, clinicaId);
    await query(`UPDATE internaciones SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`, values);

    res.json({ success: true, message: 'Internación actualizada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Dar alta a paciente
export const darAltaInternacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const { diagnostico_egreso } = req.body;

    await query(
      `UPDATE internaciones SET estado = 'alta', fecha_egreso = NOW(),
        diagnostico = COALESCE(?, diagnostico)
       WHERE id = ? AND clinica_id = ? AND estado = 'activa'`,
      [diagnostico_egreso ?? null, id, clinicaId]
    );

    res.json({ success: true, message: 'Alta médica registrada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};
