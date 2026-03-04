import { Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { Cita } from '../types';
import { sendEmailNuevaCita, sendEmailCitaConfirmada } from '../services/email.service';

// Listar todas las citas
export const getAllCitas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const { fecha, medico_id, estado } = req.query;

    console.log('🔍 GET ALL CITAS - Clinica ID:', clinicaId);
    console.log('👤 Usuario:', req.user?.nombres, req.user?.apellidos, '- Rol:', req.user?.rol);

    let sql = `
      SELECT 
        c.id, c.clinica_id, c.paciente_id, c.medico_id,
        c.fecha, c.fecha as fecha_hora,
        c.motivo, c.estado,
        c.created_at, c.updated_at,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos, 
        p.numero_historia, p.dni,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
      FROM citas c
      INNER JOIN pacientes p ON c.paciente_id = p.id
      INNER JOIN usuarios u ON c.medico_id = u.id
      WHERE c.clinica_id = ?
    `;
    
    const params: any[] = [clinicaId];

    if (fecha) {
      sql += ' AND DATE(c.fecha) = ?';
      params.push(fecha);
    }

    if (medico_id) {
      sql += ' AND c.medico_id = ?';
      params.push(medico_id);
    }

    if (estado) {
      sql += ' AND c.estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY c.id DESC';

    console.log('📝 SQL:', sql);
    console.log('📝 Params:', params);

    const citas = await query<Cita[]>(sql, params);

    console.log('✅ Citas encontradas:', citas.length);

    res.json({
      success: true,
      data: citas
    });
  } catch (error: any) {
    console.error('❌ Error al obtener citas:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error sqlMessage:', error.sqlMessage);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al obtener citas: ' + (error.sqlMessage || error.message || 'Error desconocido')
    });
  }
};

// Obtener cita por ID
export const getCitaById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    const citas = await query<Cita[]>(
      `SELECT c.*, 
        c.fecha as fecha_hora,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos, 
        p.telefono as paciente_telefono, p.numero_documento,
        u.nombres as medico_nombres, u.apellidos as medico_apellidos
       FROM citas c
       INNER JOIN pacientes p ON c.paciente_id = p.id
       INNER JOIN usuarios u ON c.medico_id = u.id
       WHERE c.id = ? AND c.clinica_id = ?`,
      [id, clinicaId]
    );

    if (citas.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: citas[0]
    });
  } catch (error) {
    console.error('Error al obtener cita:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cita'
    });
  }
};

// Crear nueva cita
export const createCita = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const {
      paciente_id,
      medico_id,
      fecha_hora,
      motivo,
      tipo_cita,
      duracion_minutos,
      observaciones
    } = req.body;

    console.log('📝 Crear cita - Clinica ID:', clinicaId);
    console.log('📝 Datos recibidos:', { paciente_id, medico_id, fecha_hora, motivo });

    // La columna en la BD se llama 'fecha', no 'fecha_hora'
    const fecha = fecha_hora;

    // Validar campos requeridos
    if (!paciente_id || !medico_id || !fecha) {
      console.log('❌ Faltan campos requeridos');
      res.status(400).json({
        success: false,
        error: 'Paciente, médico y fecha/hora son requeridos'
      });
      return;
    }

    // Verificar disponibilidad del médico
    const citasExistentes = await query(
      `SELECT id FROM citas 
       WHERE medico_id = ? 
       AND fecha = ? 
       AND estado != 'cancelada'`,
      [medico_id, fecha]
    );

    if (Array.isArray(citasExistentes) && citasExistentes.length > 0) {
      console.log('❌ Médico ya tiene cita en ese horario');
      res.status(400).json({
        success: false,
        error: 'El médico ya tiene una cita agendada en ese horario'
      });
      return;
    }

    console.log('✅ Insertando cita en BD...');
    const result = await query(
      `INSERT INTO citas (
        clinica_id, paciente_id, medico_id, fecha, motivo,
        tipo_cita, duracion_minutos, observaciones, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        clinicaId ?? null,
        paciente_id ?? null,
        medico_id ?? null,
        fecha ?? null,
        motivo ?? null,
        tipo_cita || 'consulta',
        duracion_minutos || 30,
        observaciones ?? null
      ]
    );

    const citaId = (result as any).insertId;
    console.log('✅ Cita creada exitosamente, ID:', citaId);

    // Enviar email al paciente (no bloquea la respuesta)
    try {
      const pacientes = await query(
        'SELECT p.nombres, p.apellidos, p.email FROM pacientes p WHERE p.id = ? AND p.clinica_id = ?',
        [paciente_id, clinicaId]
      ) as any[];

      const medicos = await query(
        'SELECT u.nombres, u.apellidos FROM usuarios u WHERE u.id = ?',
        [medico_id]
      ) as any[];

      const clinicas = await query(
        'SELECT c.nombre FROM clinicas c WHERE c.id = ?',
        [clinicaId]
      ) as any[];

      const paciente  = pacientes[0];
      const medico    = medicos[0];
      const clinica   = clinicas[0];

      if (paciente?.email) {
        sendEmailNuevaCita({
          pacienteNombre: `${paciente.nombres} ${paciente.apellidos}`,
          pacienteEmail:  paciente.email,
          medicoNombre:   `${medico?.nombres || ''} ${medico?.apellidos || ''}`.trim(),
          clinicaNombre:  clinica?.nombre || 'Clínica',
          clinicaId:      clinicaId as number,
          fecha:          fecha,
          motivo:         motivo,
          citaId,
        }).catch(err => console.error('Error al enviar email cita:', err));
      }
    } catch (emailErr) {
      console.error('Error al preparar email de cita:', emailErr);
    }

    res.status(201).json({
      success: true,
      data: {
        id: citaId,
        message: 'Cita creada exitosamente'
      }
    });
  } catch (error: any) {
    console.error('❌ Error al crear cita:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error sqlMessage:', error.sqlMessage);
    res.status(500).json({
      success: false,
      error: 'Error al crear cita: ' + (error.sqlMessage || error.message || 'Error desconocido')
    });
  }
};

// Actualizar cita
export const updateCita = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const updateData = req.body;

    // Mapear fecha_hora a fecha si viene del frontend
    if (updateData.fecha_hora && !updateData.fecha) {
      updateData.fecha = updateData.fecha_hora;
      delete updateData.fecha_hora;
    }

    const allowedFields = [
      'fecha', 'motivo', 'tipo_cita', 'duracion_minutos', 
      'observaciones', 'estado'
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
      `UPDATE citas SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar cita'
    });
  }
};

// Cancelar cita
export const cancelCita = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const { motivo_cancelacion } = req.body;

    await query(
      `UPDATE citas SET estado = 'cancelada' WHERE id = ? AND clinica_id = ?`,
      [id, clinicaId]
    );

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar cita'
    });
  }
};

// Confirmar cita desde enlace de EMAIL (sin autenticación JWT de usuario)
export const confirmarCitaPorToken = async (req: Request, res: Response): Promise<void> => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  try {
    const { token } = req.params;
    let payload: any;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'nexuscreative_secret');
    } catch {
      res.redirect(`${FRONTEND_URL}/confirmar-cita?error=token_invalido`);
      return;
    }

    if (payload.action !== 'confirmar' || !payload.citaId) {
      res.redirect(`${FRONTEND_URL}/confirmar-cita?error=token_invalido`);
      return;
    }

    const citas = await query(
      `SELECT c.*, p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
              p.email as paciente_email, u.nombres as medico_nombres, u.apellidos as medico_apellidos,
              cl.nombre as clinica_nombre
       FROM citas c
       INNER JOIN pacientes p ON c.paciente_id = p.id
       INNER JOIN usuarios u ON c.medico_id = u.id
       LEFT JOIN clinicas cl ON c.clinica_id = cl.id
       WHERE c.id = ?`,
      [payload.citaId]
    ) as any[];

    if (!citas.length) {
      res.redirect(`${FRONTEND_URL}/confirmar-cita?error=cita_no_encontrada`);
      return;
    }

    const cita = citas[0];

    if (cita.estado === 'cancelada') {
      res.redirect(`${FRONTEND_URL}/confirmar-cita?error=cita_cancelada`);
      return;
    }

    // Actualizar estado a confirmada
    await query("UPDATE citas SET estado = 'confirmada' WHERE id = ?", [payload.citaId]);

    // Enviar email de confirmación al paciente
    if (cita.paciente_email) {
      sendEmailCitaConfirmada({
        pacienteNombre: `${cita.paciente_nombres} ${cita.paciente_apellidos}`,
        pacienteEmail:  cita.paciente_email,
        medicoNombre:   `${cita.medico_nombres} ${cita.medico_apellidos}`,
        clinicaNombre:  cita.clinica_nombre || 'Clínica',
        fecha:          cita.fecha,
        citaId:         payload.citaId,
      }).catch(err => console.error('Error email confirmación:', err));
    }

    console.log(`✅ Cita #${payload.citaId} confirmada por email`);
    res.redirect(`${FRONTEND_URL}/confirmar-cita?success=true&id=${payload.citaId}`);
  } catch (error: any) {
    console.error('Error al confirmar cita por token:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmar-cita?error=error_interno`);
  }
};

// Confirmar cita
export const confirmCita = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    await query(
      "UPDATE citas SET estado = 'confirmada' WHERE id = ? AND clinica_id = ?",
      [id, clinicaId]
    );

    res.json({
      success: true,
      message: 'Cita confirmada exitosamente'
    });
  } catch (error) {
    console.error('Error al confirmar cita:', error);
    res.status(500).json({
      success: false,
      error: 'Error al confirmar cita'
    });
  }
};
