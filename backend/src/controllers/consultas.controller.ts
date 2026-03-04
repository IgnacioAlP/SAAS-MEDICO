import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmailConsulta } from '../services/email.service';

// Pacientes con cita confirmada (para dropdown de nueva consulta)
export const getPacientesConCitaConfirmada = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const medicoId = req.user?.id;
    const userRole = req.user?.rol;

    console.log('🔍 getPacientesConCitaConfirmada - clinicaId:', clinicaId, '| medicoId:', medicoId, '| rol:', userRole);

    // Debug: ver todos los estados de citas en esta clínica
    const debug = await query(
      `SELECT estado, COUNT(*) as total FROM citas WHERE clinica_id = ? GROUP BY estado`,
      [clinicaId]
    );
    console.log('📊 Estados de citas en clínica', clinicaId, ':', JSON.stringify(debug));

    let sql = `
      SELECT DISTINCT p.id, p.nombres, p.apellidos, p.numero_historia,
        ci.id as cita_id, ci.fecha as cita_fecha
      FROM citas ci
      INNER JOIN pacientes p ON ci.paciente_id = p.id
      WHERE ci.clinica_id = ?
        AND ci.estado = 'confirmada'
    `;
    const params: any[] = [clinicaId];

    // Si es médico, solo sus pacientes con cita confirmada
    if (userRole === 'medico') {
      sql += ' AND ci.medico_id = ?';
      params.push(medicoId);
    }

    sql += ' ORDER BY p.apellidos ASC';

    console.log('📝 SQL pacientes confirmados:', sql);
    console.log('📝 Params:', params);

    const pacientes = await query(sql, params);
    console.log('✅ Pacientes con cita confirmada encontrados:', Array.isArray(pacientes) ? (pacientes as any[]).length : 0);

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error: any) {
    console.error('Error al obtener pacientes con cita confirmada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pacientes: ' + (error.sqlMessage || error.message)
    });
  }
};

// Listar todas las consultas
export const getAllConsultas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const { paciente_id, medico_id } = req.query;

    // Detectar nombre real de la columna de fecha
    const columns = await query(`SHOW COLUMNS FROM consultas`) as any[];
    const colNames = columns.map((c: any) => c.Field);
    console.log('📋 Columnas de tabla consultas:', colNames);

    const fechaCol = colNames.find((c: string) => c.includes('fecha')) || 'created_at';
    console.log('📅 Columna fecha detectada:', fechaCol);

    // Detectar columna de diagnóstico (puede ser 'diagnostico' o 'diagnosticos')
    const diagCol = colNames.includes('diagnosticos') ? 'diagnosticos' :
                    colNames.includes('diagnostico') ? 'diagnostico' : null;
    // Detectar columna de tratamiento
    const tratCol = colNames.includes('plan_tratamiento') ? 'plan_tratamiento' :
                    colNames.includes('tratamiento') ? 'tratamiento' : null;

    const diagSelect = diagCol ? `c.${diagCol} as diagnostico,` : "'' as diagnostico,";
    const tratSelect = tratCol ? `c.${tratCol} as tratamiento,` : "'' as tratamiento,";

    let sql = `
      SELECT c.id, c.clinica_id, c.paciente_id, c.medico_id,
        c.${fechaCol} as fecha, c.motivo_consulta,
        ${diagSelect}
        ${tratSelect}
        c.created_at,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
      FROM consultas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.medico_id = u.id
      WHERE c.clinica_id = ?
    `;
    
    const params: any[] = [clinicaId];

    if (paciente_id) {
      sql += ' AND c.paciente_id = ?';
      params.push(paciente_id);
    }

    if (medico_id) {
      sql += ' AND c.medico_id = ?';
      params.push(medico_id);
    }

    sql += ' ORDER BY c.id DESC';

    const consultas = await query(sql, params);

    res.json({
      success: true,
      data: consultas
    });
  } catch (error: any) {
    console.error('❌ Error al obtener consultas:', error.sqlMessage || error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener consultas: ' + (error.sqlMessage || error.message)
    });
  }
};

// Obtener consulta por ID (con detalles completos)
export const getConsultaById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    const consultas = await query(
      `SELECT c.*, 
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
       FROM consultas c
       INNER JOIN pacientes p ON c.paciente_id = p.id
       INNER JOIN usuarios u ON c.medico_id = u.id
       WHERE c.id = ? AND c.clinica_id = ?`,
      [id, clinicaId]
    );

    if (!Array.isArray(consultas) || consultas.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Consulta no encontrada'
      });
      return;
    }

    // Obtener recetas y laboratorios asociados (si las tablas existen)
    const [recetasResult, laboratoriosResult] = await Promise.allSettled([
      query('SELECT * FROM recetas WHERE consulta_id = ?', [id]),
      query('SELECT * FROM laboratorio WHERE consulta_id = ?', [id])
    ]);

    const recetas = recetasResult.status === 'fulfilled' ? recetasResult.value : [];
    const laboratorios = laboratoriosResult.status === 'fulfilled' ? laboratoriosResult.value : [];

    const row = consultas[0] as any;

    console.log('🔍 Consulta row raw:', {
      id: row.id,
      diagnostico: row.diagnostico,
      diagnosticos: row.diagnosticos,
      tratamiento: row.tratamiento,
      plan_tratamiento: row.plan_tratamiento,
    });

    res.json({
      success: true,
      data: {
        ...row,
        // Normalizar nombres de columnas alternativos
        diagnostico: row.diagnostico ?? row.diagnosticos ?? '',
        tratamiento: row.tratamiento ?? row.plan_tratamiento ?? '',
        sintomas: row.sintomas ?? row.enfermedad_actual ?? '',
        observaciones: row.observaciones ?? row.indicaciones ?? '',
        recetas,
        laboratorios
      }
    });
  } catch (error: any) {
    console.error('Error al obtener consulta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener consulta: ' + (error.sqlMessage || error.message)
    });
  }
};

// Crear nueva consulta
export const createConsulta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const medicoId = req.user?.id;
    const {
      paciente_id,
      motivo_consulta,
      sintomas,
      diagnostico,
      tratamiento,
      observaciones,
      presion_arterial,
      temperatura,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      saturacion_oxigeno,
      peso,
      talla,
      imc
    } = req.body;

    if (!paciente_id || !motivo_consulta) {
      res.status(400).json({
        success: false,
        error: 'Paciente y motivo de consulta son requeridos'
      });
      return;
    }

    // Detectar columnas reales de la tabla consultas
    const columns = await query(`SHOW COLUMNS FROM consultas`) as any[];
    const colNames = columns.map((c: any) => c.Field);
    const fechaCol = colNames.find((c: string) => c.includes('fecha')) || 'created_at';

    // Mapear campos del frontend a nombres reales de columnas en la BD
    // (el frontend puede enviar 'sintomas' pero la tabla usa 'enfermedad_actual', etc.)
    const fieldMap: Record<string, any> = {
      // campo_frontend: valor  — se intentará con el nombre real de la columna
      sintomas,
      enfermedad_actual: sintomas,          // alias alternativo
      diagnostico,
      diagnosticos: diagnostico,            // alias alternativo
      tratamiento,
      plan_tratamiento: tratamiento,        // alias alternativo
      observaciones,
      indicaciones: observaciones,          // alias alternativo
      presion_arterial,
      temperatura,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      saturacion_oxigeno,
      peso,
      talla,
      imc
    };

    // Construir INSERT dinámico según columnas existentes
    const optionalFields: Record<string, any> = {};
    for (const [col, val] of Object.entries(fieldMap)) {
      if (colNames.includes(col) && !(col in optionalFields)) {
        optionalFields[col] = val ?? null;
      }
    }

    const insertCols = ['clinica_id', 'paciente_id', 'medico_id', fechaCol, 'motivo_consulta'];
    const insertVals: any[] = [clinicaId, paciente_id, medicoId];
    // fechaCol usa NOW() — se agrega al SQL directamente, no como param
    insertVals.push(motivo_consulta);

    const extraCols: string[] = [];
    const extraVals: any[] = [];
    for (const [col, val] of Object.entries(optionalFields)) {
      if (colNames.includes(col)) {
        extraCols.push(col);
        extraVals.push(val ?? null);
      }
    }

    const allCols = [...insertCols, ...extraCols];
    // Reemplazar el fechaCol placeholder por NOW() en los VALUES
    const valPlaceholders = allCols.map(c => c === fechaCol ? 'NOW()' : '?').join(', ');
    const allVals = [clinicaId, paciente_id, medicoId, motivo_consulta, ...extraVals];

    const result = await query(
      `INSERT INTO consultas (${allCols.join(', ')}) VALUES (${valPlaceholders})`,
      allVals
    );

    const consultaId = (result as any).insertId;

    // Enviar email al paciente con el resumen de la consulta (no bloquea respuesta)
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
        sendEmailConsulta({
          pacienteNombre: `${paciente.nombres} ${paciente.apellidos}`,
          pacienteEmail:  paciente.email,
          medicoNombre:   `${medico?.nombres || ''} ${medico?.apellidos || ''}`.trim(),
          clinicaNombre:  clinica?.nombre || 'Cl\u00ednica',          clinicaId:      clinicaId as number,          fecha:          new Date().toISOString(),
          motivo:         motivo_consulta,
          diagnostico:    diagnostico ?? undefined,
          tratamiento:    tratamiento ?? undefined,
          observaciones:  observaciones ?? undefined,
          signosVitales: {
            presion_arterial,
            frecuencia_cardiaca,
            temperatura,
            peso,
            talla,
            saturacion_oxigeno,
          },
          consultaId,
        }).catch(err => console.error('Error al enviar email consulta:', err));
      }
    } catch (emailErr) {
      console.error('Error al preparar email de consulta:', emailErr);
    }

    res.status(201).json({
      success: true,
      data: {
        id: consultaId,
        message: 'Consulta creada exitosamente'
      }
    });
  } catch (error: any) {
    console.error('Error al crear consulta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear consulta: ' + (error.sqlMessage || error.message)
    });
  }
};

// Actualizar consulta
export const updateConsulta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const updateData = req.body;

    const allowedFields = [
      'motivo_consulta', 'sintomas', 'diagnostico', 'tratamiento', 'observaciones',
      'presion_arterial', 'temperatura', 'frecuencia_cardiaca', 'frecuencia_respiratoria',
      'peso', 'talla', 'imc'
    ];

    const updates: string[] = [];
    const values: any[] = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No hay campos válidos para actualizar'
      });
      return;
    }

    values.push(id, clinicaId);

    await query(
      `UPDATE consultas SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Consulta actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar consulta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar consulta'
    });
  }
};
