import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

// Listar todos los pagos
export const getAllPagos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const { fecha_inicio, fecha_fin, metodo_pago } = req.query;

    let sql = `
      SELECT p.*, 
        pac.nombres as paciente_nombres, pac.apellidos as paciente_apellidos,
        pac.numero_documento
      FROM pagos p
      INNER JOIN pacientes pac ON p.paciente_id = pac.id
      WHERE p.clinica_id = ?
    `;
    
    const params: any[] = [clinicaId];

    if (fecha_inicio) {
      sql += ' AND DATE(p.fecha_pago) >= ?';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      sql += ' AND DATE(p.fecha_pago) <= ?';
      params.push(fecha_fin);
    }

    if (metodo_pago) {
      sql += ' AND p.metodo_pago = ?';
      params.push(metodo_pago);
    }

    sql += ' ORDER BY p.fecha_pago DESC';

    const pagos = await query(sql, params);

    res.json({
      success: true,
      data: pagos
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pagos'
    });
  }
};

// Obtener pago por ID
export const getPagoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    const pagos = await query(
      `SELECT p.*, 
        pac.nombres as paciente_nombres, pac.apellidos as paciente_apellidos,
        pac.numero_documento, pac.telefono as paciente_telefono,
        u.nombres as registrado_por_nombres, u.apellidos as registrado_por_apellidos
       FROM pagos p
       INNER JOIN pacientes pac ON p.paciente_id = pac.id
       INNER JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = ? AND p.clinica_id = ?`,
      [id, clinicaId]
    );

    if (!Array.isArray(pagos) || pagos.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: pagos[0]
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pago'
    });
  }
};

// Crear nuevo pago
export const createPago = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const usuarioId = req.user?.id;
    const {
      paciente_id,
      concepto,
      monto,
      metodo_pago,
      numero_operacion,
      observaciones,
      cita_id,
      consulta_id
    } = req.body;

    // Validar campos requeridos
    if (!paciente_id || !concepto || !monto || !metodo_pago) {
      res.status(400).json({
        success: false,
        error: 'Paciente, concepto, monto y método de pago son requeridos'
      });
      return;
    }

    // Validar método de pago
    const metodosValidos = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia', 'otro'];
    if (!metodosValidos.includes(metodo_pago.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: 'Método de pago no válido'
      });
      return;
    }

    const result = await query(
      `INSERT INTO pagos (
        clinica_id, paciente_id, usuario_id, concepto, monto,
        metodo_pago, numero_operacion, observaciones, cita_id, consulta_id,
        fecha_pago, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'completado')`,
      [
        clinicaId, paciente_id, usuarioId, concepto, monto,
        metodo_pago, numero_operacion, observaciones, cita_id, consulta_id
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: (result as any).insertId,
        message: 'Pago registrado exitosamente'
      }
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar pago'
    });
  }
};

// Obtener estadísticas de pagos
export const getEstadisticasPagos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    const { mes, anio } = req.query;

    const mesActual = mes || new Date().getMonth() + 1;
    const anioActual = anio || new Date().getFullYear();

    const [totalMes, porMetodo, ultimos] = await Promise.all([
      // Total del mes
      query(
        `SELECT SUM(monto) as total FROM pagos 
         WHERE clinica_id = ? AND MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ?`,
        [clinicaId, mesActual, anioActual]
      ),
      // Por método de pago
      query(
        `SELECT metodo_pago, COUNT(*) as cantidad, SUM(monto) as total 
         FROM pagos 
         WHERE clinica_id = ? AND MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ?
         GROUP BY metodo_pago`,
        [clinicaId, mesActual, anioActual]
      ),
      // Últimos 10 pagos
      query(
        `SELECT p.*, pac.nombres, pac.apellidos 
         FROM pagos p 
         INNER JOIN pacientes pac ON p.paciente_id = pac.id
         WHERE p.clinica_id = ? 
         ORDER BY p.fecha_pago DESC LIMIT 10`,
        [clinicaId]
      )
    ]);

    res.json({
      success: true,
      data: {
        total_mes: Array.isArray(totalMes) && totalMes[0] ? totalMes[0].total || 0 : 0,
        por_metodo: porMetodo,
        ultimos_pagos: ultimos
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
};
