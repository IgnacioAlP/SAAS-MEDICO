import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/** Asegura que exista la tabla configuracion_smtp */
const ensureTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS configuracion_smtp (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      clinica_id  INT NOT NULL UNIQUE,
      smtp_host   VARCHAR(255) DEFAULT 'smtp.gmail.com',
      smtp_port   INT         DEFAULT 587,
      smtp_user   VARCHAR(255) DEFAULT '',
      smtp_password VARCHAR(255) DEFAULT '',
      smtp_from   VARCHAR(255) DEFAULT '',
      smtp_secure TINYINT(1)  DEFAULT 0,
      activo      TINYINT(1)  DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

// -------------------------------------------------------------------
// GET /api/configuracion/smtp
// -------------------------------------------------------------------
export const getSmtpConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    await ensureTable();

    const rows = await query(
      'SELECT smtp_host, smtp_port, smtp_user, smtp_from, smtp_secure, activo FROM configuracion_smtp WHERE clinica_id = ?',
      [clinicaId]
    ) as any[];

    if (!rows.length) {
      // Devolver valores por defecto (sin password)
      res.json({
        success: true,
        data: {
          smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtp_port: parseInt(process.env.SMTP_PORT || '587'),
          smtp_user: process.env.SMTP_USER || '',
          smtp_from: process.env.SMTP_FROM || '',
          smtp_secure: false,
          activo: false,
          password_set: !!(process.env.SMTP_PASSWORD),
        }
      });
      return;
    }

    const row = rows[0];
    res.json({
      success: true,
      data: {
        smtp_host:    row.smtp_host,
        smtp_port:    row.smtp_port,
        smtp_user:    row.smtp_user,
        smtp_from:    row.smtp_from,
        smtp_secure:  !!row.smtp_secure,
        activo:       !!row.activo,
        password_set: !!(row.smtp_password),  // No enviar password, solo indicar si está seteado
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------------------------------------------------------
// PUT /api/configuracion/smtp
// -------------------------------------------------------------------
export const updateSmtpConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ success: false, error: 'Solo administradores pueden modificar la configuración SMTP' });
      return;
    }

    const clinicaId = req.user?.clinica_id;
    const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_from, smtp_secure, activo } = req.body;

    await ensureTable();

    const existing = await query(
      'SELECT id, smtp_password FROM configuracion_smtp WHERE clinica_id = ?',
      [clinicaId]
    ) as any[];

    // Usar contraseña existente si no se envía una nueva
    const passwordToSave = smtp_password && smtp_password !== ''
      ? smtp_password
      : (existing[0]?.smtp_password || '');

    if (existing.length === 0) {
      await query(
        `INSERT INTO configuracion_smtp (clinica_id, smtp_host, smtp_port, smtp_user, smtp_password, smtp_from, smtp_secure, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [clinicaId, smtp_host, smtp_port || 587, smtp_user, passwordToSave, smtp_from, smtp_secure ? 1 : 0, activo ? 1 : 0]
      );
    } else {
      await query(
        `UPDATE configuracion_smtp SET smtp_host=?, smtp_port=?, smtp_user=?, smtp_password=?, smtp_from=?, smtp_secure=?, activo=?
         WHERE clinica_id=?`,
        [smtp_host, smtp_port || 587, smtp_user, passwordToSave, smtp_from, smtp_secure ? 1 : 0, activo ? 1 : 0, clinicaId]
      );
    }

    res.json({ success: true, message: 'Configuración SMTP guardada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------------------------------------------------------
// POST /api/configuracion/smtp/test  — Enviar email de prueba
// -------------------------------------------------------------------
export const testSmtpConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ success: false, error: 'Solo administradores pueden probar el SMTP' });
      return;
    }

    const clinicaId = req.user?.clinica_id;
    const { email_destino } = req.body;

    if (!email_destino) {
      res.status(400).json({ success: false, error: 'Ingrese un email de destino para la prueba' });
      return;
    }

    // Obtener config de BD (activo o no — para pruebas se permite aunque esté inactivo)
    await ensureTable();
    const rows = await query(
      'SELECT * FROM configuracion_smtp WHERE clinica_id = ?',
      [clinicaId]
    ) as any[];

    // Determinar credenciales: DB primero, luego variables de entorno
    let smtpHost: string;
    let smtpPort: number;
    let smtpUser: string;
    let smtpPassword: string;
    let smtpFrom: string;
    let smtpSecure: boolean;

    const dbCfg = rows[0];
    if (dbCfg && dbCfg.smtp_user && dbCfg.smtp_password) {
      smtpHost     = dbCfg.smtp_host     || 'smtp.gmail.com';
      smtpPort     = dbCfg.smtp_port     || 587;
      smtpUser     = dbCfg.smtp_user;
      smtpPassword = dbCfg.smtp_password;
      smtpFrom     = dbCfg.smtp_from     || dbCfg.smtp_user;
      smtpSecure   = !!dbCfg.smtp_secure;
    } else if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      // Fallback a variables de entorno
      smtpHost     = process.env.SMTP_HOST     || 'smtp.gmail.com';
      smtpPort     = parseInt(process.env.SMTP_PORT || '587');
      smtpUser     = process.env.SMTP_USER;
      smtpPassword = process.env.SMTP_PASSWORD;
      smtpFrom     = process.env.SMTP_FROM     || process.env.SMTP_USER;
      smtpSecure   = process.env.SMTP_SECURE === 'true';
    } else {
      res.status(400).json({
        success: false,
        error: 'No hay configuración SMTP disponible. Configure el SMTP en esta página o establezca las variables de entorno SMTP_USER y SMTP_PASSWORD.'
      });
      return;
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true para 465, false para 587
      requireTLS: !smtpSecure && smtpPort === 587,
      family: 4, // Forzar IPv4 (Railway no soporta IPv6 a Gmail)
      auth: {
        user: smtpUser,
        pass: smtpPassword.replace(/\s/g, ''), // Eliminar espacios de app passwords de Gmail
      },
      tls: {
        rejectUnauthorized: false, // Evitar errores de certificado en Railway
      },
    });

    // Verificar conexión antes de enviar
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      res.status(500).json({
        success: false,
        error: `No se pudo conectar al servidor SMTP: ${verifyError.message}. Verifique host, puerto y credenciales.`,
        detail: verifyError.code || ''
      });
      return;
    }

    const clinicas = await query('SELECT nombre FROM clinicas WHERE id = ?', [clinicaId]) as any[];
    const clinicaNombre = clinicas[0]?.nombre || 'Clínica';

    await transporter.sendMail({
      from: smtpFrom,
      to: email_destino,
      subject: `✅ Prueba de email – ${clinicaNombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f0f9ff;border-radius:12px;">
          <h2 style="color:#0e7490;">✅ Configuración de email correcta</h2>
          <p>Este es un correo de prueba enviado desde <strong>${clinicaNombre}</strong>.</p>
          <p>La configuración SMTP funciona correctamente.</p>
          <hr style="border:none;border-top:1px solid #bae6fd;margin:24px 0;"/>
          <p style="font-size:12px;color:#6b7280;">Sistema SaaS Médico NexusCreative</p>
        </div>`
    });

    res.json({ success: true, message: `Email de prueba enviado a ${email_destino}` });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error al enviar email de prueba: ' + error.message,
      detail: error.code || ''
    });
  }
};

// -------------------------------------------------------------------
// GET /api/configuracion/perfil  — Perfil del usuario logueado
// -------------------------------------------------------------------
export const getMiPerfil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.user?.id;
    const rows = await query(
      `SELECT u.id, u.email, u.nombres, u.apellidos, u.dni, u.telefono, u.rol, u.especialidad, u.numero_colegiatura,
              c.nombre as clinica_nombre
       FROM usuarios u
       LEFT JOIN clinicas c ON u.clinica_id = c.id
       WHERE u.id = ?`,
      [id]
    ) as any[];

    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------------------------------------------------------
// PUT /api/configuracion/perfil  — Actualizar perfil propio
// -------------------------------------------------------------------
export const updateMiPerfil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id      = req.user?.id;
    const clinicaId = req.user?.clinica_id;
    const { email, nombres, apellidos, telefono, especialidad, numero_colegiatura, password_actual, password_nuevo } = req.body;

    const updates: string[] = [];
    const values:  any[]    = [];

    // Cambiar email: verificar que no esté en uso
    if (email) {
      const dup = await query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]) as any[];
      if (dup.length) {
        res.status(400).json({ success: false, error: 'Ese email ya está en uso por otro usuario' });
        return;
      }
      updates.push('email = ?'); values.push(email);
    }

    if (nombres)           { updates.push('nombres = ?');            values.push(nombres); }
    if (apellidos)         { updates.push('apellidos = ?');           values.push(apellidos); }
    if (telefono !== undefined) { updates.push('telefono = ?');       values.push(telefono || null); }
    if (especialidad !== undefined) { updates.push('especialidad = ?'); values.push(especialidad || null); }
    if (numero_colegiatura !== undefined) { updates.push('numero_colegiatura = ?'); values.push(numero_colegiatura || null); }

    // Cambiar contraseña
    if (password_nuevo) {
      if (!password_actual) {
        res.status(400).json({ success: false, error: 'Ingrese su contraseña actual para cambiarla' });
        return;
      }
      const usuario = await query('SELECT password FROM usuarios WHERE id = ?', [id]) as any[];
      const ok = await bcrypt.compare(password_actual, usuario[0]?.password || '');
      if (!ok) {
        res.status(400).json({ success: false, error: 'Contraseña actual incorrecta' });
        return;
      }
      const hashed = await bcrypt.hash(password_nuevo, 10);
      updates.push('password = ?'); values.push(hashed);
    }

    if (!updates.length) {
      res.status(400).json({ success: false, error: 'No hay cambios que guardar' });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(id);
    await query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await query(
      `SELECT u.id, u.email, u.nombres, u.apellidos, u.dni, u.telefono, u.rol, u.especialidad, u.numero_colegiatura,
              c.nombre as clinica_nombre, c.id as clinica_id
       FROM usuarios u LEFT JOIN clinicas c ON u.clinica_id = c.id WHERE u.id = ?`,
      [id]
    ) as any[];

    res.json({ success: true, data: updated, message: 'Perfil actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
