import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmailReceta } from '../services/email.service';

// Helper: detecta columnas reales de la tabla recetas
const getRecetaColumns = async () => {
  const cols = await query(`SHOW COLUMNS FROM recetas`) as any[];
  const names: string[] = cols.map((c: any) => c.Field);
  const medCol   = names.find(c => ['medicamentos', 'prescripcion', 'medicacion', 'detalle_medicamentos', 'detalle', 'indicaciones_generales'].includes(c)) || null;
  const fechaCol = names.find(c => ['fecha_emision', 'fecha', 'fecha_receta'].includes(c)) || null;
  return { names, medCol, fechaCol };
};

// Listar recetas
export const getAllRecetas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const { paciente_id } = req.query;
    const { names, medCol, fechaCol } = await getRecetaColumns();

    const medSelect  = medCol   ? `r.${medCol} as medicamentos,`   : `'' as medicamentos,`;
    const fechaSel   = fechaCol ? `r.${fechaCol} as fecha_emision,` : `r.created_at as fecha_emision,`;
    const diagSel    = names.includes('diagnostico')   ? 'r.diagnostico,'                    :
                       names.includes('diagnosticos')  ? 'r.diagnosticos as diagnostico,'    : `'' as diagnostico,`;
    const instrSel   = names.includes('instrucciones') ? 'r.instrucciones,'                  : `'' as instrucciones,`;
    const estadoSel  = names.includes('estado')        ? 'r.estado,'                         : `'activa' as estado,`;

    let sql = `
      SELECT r.id, r.clinica_id, r.paciente_id, r.medico_id,
        ${fechaSel} ${diagSel} ${medSelect} ${instrSel} ${estadoSel}
        r.created_at,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
      FROM recetas r
      LEFT JOIN pacientes p ON r.paciente_id = p.id
      LEFT JOIN usuarios u ON r.medico_id = u.id
      WHERE r.clinica_id = ?
    `;
    const params: any[] = [clinicaId];
    if (paciente_id) { sql += ' AND r.paciente_id = ?'; params.push(paciente_id); }
    sql += ' ORDER BY r.id DESC';

    const recetas = await query(sql, params);
    res.json({ success: true, data: recetas });
  } catch (error: any) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Obtener receta por ID
export const getRecetaById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    const recetas = await query(
      `SELECT r.*,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
       FROM recetas r
       LEFT JOIN pacientes p ON r.paciente_id = p.id
       LEFT JOIN usuarios u ON r.medico_id = u.id
       WHERE r.id = ? AND r.clinica_id = ?`,
      [id, clinicaId]
    ) as any[];

    if (!Array.isArray(recetas) || recetas.length === 0) {
      res.status(404).json({ success: false, error: 'Receta no encontrada' });
      return;
    }
    const row = recetas[0];
    res.json({ success: true, data: {
      ...row,
      medicamentos: row.medicamentos ?? row.prescripcion ?? row.medicacion ?? row.detalle ?? '',
      diagnostico:  row.diagnostico  ?? row.diagnosticos ?? '',
    }});
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Crear receta
export const createReceta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const medicoId  = req.user?.id;
    const { paciente_id, consulta_id, diagnostico, medicamentos, instrucciones } = req.body;

    if (!paciente_id || !medicamentos) {
      res.status(400).json({ success: false, error: 'Paciente y medicamentos son requeridos' });
      return;
    }

    const { names, medCol, fechaCol } = await getRecetaColumns();
    console.log('Columnas reales de recetas:', names);
    console.log('Columna medicamentos detectada:', medCol);

    if (!medCol) {
      res.status(500).json({ success: false, error: `No se encontro columna de medicamentos. Columnas: ${names.join(', ')}` });
      return;
    }

    const insertCols: string[] = ['clinica_id', 'paciente_id', 'medico_id'];
    const insertVals: any[]    = [clinicaId, paciente_id, medicoId];

    if (names.includes('consulta_id') && consulta_id) { insertCols.push('consulta_id'); insertVals.push(consulta_id); }
    if (fechaCol && fechaCol !== 'created_at') { insertCols.push(fechaCol); insertVals.push(new Date().toISOString().split('T')[0]); }

    const dCol = names.includes('diagnostico') ? 'diagnostico' : names.includes('diagnosticos') ? 'diagnosticos' : null;
    if (dCol) { insertCols.push(dCol); insertVals.push(diagnostico ?? null); }

    insertCols.push(medCol); insertVals.push(medicamentos);

    const iCol = names.includes('instrucciones') ? 'instrucciones' : names.includes('indicaciones') ? 'indicaciones' : null;
    if (iCol) { insertCols.push(iCol); insertVals.push(instrucciones ?? null); }

    if (names.includes('estado')) { insertCols.push('estado'); insertVals.push('activa'); }

    const ph = insertCols.map(() => '?').join(', ');
    const result = await query(`INSERT INTO recetas (${insertCols.join(', ')}) VALUES (${ph})`, insertVals);

    const recetaId = (result as any).insertId;

    // Enviar email al paciente con el detalle de la receta
    try {
      const pacientes = await query(
        'SELECT nombres, apellidos, email FROM pacientes WHERE id = ? AND clinica_id = ?',
        [paciente_id, clinicaId]
      ) as any[];

      const clinicas = await query(
        'SELECT nombre FROM clinicas WHERE id = ?',
        [clinicaId]
      ) as any[];

      const paciente = pacientes[0];
      const clinica  = clinicas[0];
      const medico   = req.user;

      if (paciente?.email) {
        sendEmailReceta({
          pacienteNombre: `${paciente.nombres} ${paciente.apellidos}`,
          pacienteEmail:  paciente.email,
          medicoNombre:   `${medico?.nombres || ''} ${medico?.apellidos || ''}`.trim(),
          clinicaNombre:  clinica?.nombre || 'Clínica',
          clinicaId:      clinicaId as number,
          fecha:          new Date().toISOString(),
          diagnostico:    diagnostico ?? undefined,
          medicamentos:   medicamentos,
          instrucciones:  instrucciones ?? undefined,
          recetaId,
        }).catch(err => console.error('Error al enviar email receta:', err));
      }
    } catch (emailErr) {
      console.error('Error al preparar email de receta:', emailErr);
    }

    res.status(201).json({ success: true, data: { id: recetaId, message: 'Receta creada exitosamente' } });
  } catch (error: any) {
    console.error('Error al crear receta:', error);
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Actualizar receta
export const updateReceta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const { estado, diagnostico, medicamentos, instrucciones } = req.body;
    const { names, medCol } = await getRecetaColumns();

    const updates: string[] = [];
    const values:  any[]    = [];

    if (estado && names.includes('estado')) { updates.push('estado = ?'); values.push(estado); }

    const dCol = names.includes('diagnostico') ? 'diagnostico' : names.includes('diagnosticos') ? 'diagnosticos' : null;
    if (diagnostico !== undefined && dCol) { updates.push(`${dCol} = ?`); values.push(diagnostico); }

    if (medicamentos && medCol) { updates.push(`${medCol} = ?`); values.push(medicamentos); }

    const iCol = names.includes('instrucciones') ? 'instrucciones' : names.includes('indicaciones') ? 'indicaciones' : null;
    if (instrucciones !== undefined && iCol) { updates.push(`${iCol} = ?`); values.push(instrucciones); }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
      return;
    }

    values.push(id, clinicaId);
    await query(`UPDATE recetas SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`, values);
    res.json({ success: true, message: 'Receta actualizada' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};

// Anular receta
export const deleteReceta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    await query(`UPDATE recetas SET estado = 'anulada' WHERE id = ? AND clinica_id = ?`, [id, clinicaId]);
    res.json({ success: true, message: 'Receta anulada' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.sqlMessage || error.message });
  }
};
