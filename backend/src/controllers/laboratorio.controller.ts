import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

// Listar exámenes de laboratorio
export const getAllLaboratorio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const { paciente_id, estado } = req.query;

    let sql = `
      SELECT l.id, l.clinica_id, l.paciente_id, l.medico_id, l.consulta_id,
        l.fecha_solicitud, l.fecha_resultado, l.tipo_examen,
        l.descripcion, l.resultado, l.estado, l.created_at,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
      FROM laboratorio l
      LEFT JOIN pacientes p ON l.paciente_id = p.id
      LEFT JOIN usuarios u ON l.medico_id = u.id
      WHERE l.clinica_id = ?
    `;
    const params: any[] = [clinicaId];

    if (paciente_id) { sql += ' AND l.paciente_id = ?'; params.push(paciente_id); }
    if (estado) { sql += ' AND l.estado = ?'; params.push(estado); }

    sql += ' ORDER BY l.id DESC';

    const examenes = await query(sql, params);
    res.json({ success: true, data: examenes });
  } catch (error: any) {
    console.error('Error al obtener laboratorio:', error);
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Obtener examen por ID
export const getLaboratorioById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    const examenes = await query<any[]>(
      `SELECT l.*,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos, p.dni,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
       FROM laboratorio l
       LEFT JOIN pacientes p ON l.paciente_id = p.id
       LEFT JOIN usuarios u ON l.medico_id = u.id
       WHERE l.id = ? AND l.clinica_id = ?`,
      [id, clinicaId]
    );

    if (!Array.isArray(examenes) || examenes.length === 0) {
      res.status(404).json({ success: false, error: 'Examen no encontrado' });
      return;
    }
    res.json({ success: true, data: examenes[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Solicitar examen
export const createLaboratorio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const medicoId = req.user?.id;
    const { paciente_id, consulta_id, tipo_examen, descripcion } = req.body;

    if (!paciente_id || !tipo_examen) {
      res.status(400).json({ success: false, error: 'Paciente y tipo de examen son requeridos' });
      return;
    }

    const result = await query(
      `INSERT INTO laboratorio (clinica_id, paciente_id, medico_id, consulta_id, fecha_solicitud, tipo_examen, descripcion, estado)
       VALUES (?, ?, ?, ?, CURDATE(), ?, ?, 'pendiente')`,
      [clinicaId, paciente_id, medicoId, consulta_id ?? null, tipo_examen, descripcion ?? null]
    );

    res.status(201).json({ success: true, data: { id: (result as any).insertId, message: 'Examen solicitado exitosamente' } });
  } catch (error: any) {
    console.error('Error al crear examen:', error);
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Cargar resultado de examen
export const updateLaboratorio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const { resultado, estado, fecha_resultado, tipo_examen, descripcion } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (tipo_examen) { updates.push('tipo_examen = ?'); values.push(tipo_examen); }
    if (descripcion !== undefined) { updates.push('descripcion = ?'); values.push(descripcion); }
    if (resultado !== undefined) { updates.push('resultado = ?'); values.push(resultado); }
    if (estado) { updates.push('estado = ?'); values.push(estado); }
    if (fecha_resultado) { updates.push('fecha_resultado = ?'); values.push(fecha_resultado); }

    // Si carga resultado, marcar como completado automáticamente
    if (resultado && !estado) {
      updates.push("estado = 'completado'");
      updates.push('fecha_resultado = CURDATE()');
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
      return;
    }

    values.push(id, clinicaId);
    await query(`UPDATE laboratorio SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`, values);

    res.json({ success: true, message: 'Examen actualizado' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};
