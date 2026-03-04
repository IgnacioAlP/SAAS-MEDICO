import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:5000';

// ---------- Transporter ----------

/** Lee la config SMTP de la BD (si clinicaId) o del .env */
const getSmtpConfig = async (clinicaId?: number) => {
  if (clinicaId) {
    try {
      const rows = await query(
        'SELECT * FROM configuracion_smtp WHERE clinica_id = ? AND activo = 1',
        [clinicaId]
      ) as any[];
      if (rows.length && rows[0].smtp_user && rows[0].smtp_password) {
        return {
          host:   rows[0].smtp_host,
          port:   rows[0].smtp_port,
          secure: !!rows[0].smtp_secure,
          user:   rows[0].smtp_user,
          pass:   rows[0].smtp_password,
          from:   rows[0].smtp_from || rows[0].smtp_user,
        };
      }
    } catch {
      // tabla aún no existe, cae al fallback
    }
  }

  // Fallback: .env
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  return {
    host,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    user,
    pass,
    from:   process.env.SMTP_FROM || user,
  };
};

const createTransporter = async (clinicaId?: number) => {
  const cfg = await getSmtpConfig(clinicaId);
  if (!cfg) {
    console.warn('⚠️  SMTP no configurado — emails deshabilitados');
    return null;
  }
  return {
    transporter: nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    }),
    from: cfg.from,
  };
};

// ---------- Helper base HTML ----------
const baseTemplate = (titulo: string, cuerpo: string, clinicaNombre: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${titulo}</title>
  <style>
    body { margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#f0f4f8; }
    .wrapper { max-width:620px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.10); }
    .header { background:linear-gradient(135deg,#0891b2,#0e7490); padding:28px 32px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; letter-spacing:.5px; }
    .header p  { margin:6px 0 0; color:#bae6fd; font-size:13px; }
    .content { padding:32px; color:#374151; }
    .content h2 { margin-top:0; color:#0e7490; font-size:18px; }
    .info-box { background:#f0f9ff; border-left:4px solid #0891b2; border-radius:6px; padding:16px 20px; margin:20px 0; }
    .info-box p { margin:6px 0; font-size:14px; }
    .info-box .label { color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing:.5px; }
    .info-box .value { font-weight:600; color:#111827; font-size:15px; }
    .btn { display:inline-block; margin:24px 0 8px; padding:14px 32px; background:linear-gradient(135deg,#0891b2,#0e7490); color:#fff!important; text-decoration:none; border-radius:8px; font-weight:700; font-size:15px; letter-spacing:.3px; }
    .btn:hover { opacity:.9; }
    .meds-box { background:#fefce8; border:1px solid #fde68a; border-radius:8px; padding:16px 20px; margin:16px 0; font-size:13px; white-space:pre-wrap; color:#78350f; }
    .divider { border:none; border-top:1px solid #e5e7eb; margin:24px 0; }
    .footer { background:#f9fafb; padding:20px 32px; text-align:center; font-size:12px; color:#9ca3af; }
    .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; }
    .badge-green  { background:#d1fae5; color:#065f46; }
    .badge-blue   { background:#dbeafe; color:#1e40af; }
    .badge-purple { background:#ede9fe; color:#5b21b6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏥 ${clinicaNombre}</h1>
      <p>Sistema de Gestión Médica</p>
    </div>
    <div class="content">
      ${cuerpo}
    </div>
    <div class="footer">
      Este correo fue enviado automáticamente por ${clinicaNombre}. No responder a este mensaje.
    </div>
  </div>
</body>
</html>`;

// ================================================================
// 1. EMAIL: NUEVA CITA AGENDADA
// ================================================================
export interface CitaEmailData {
  pacienteNombre: string;
  pacienteEmail: string;
  medicoNombre:  string;
  clinicaNombre: string;
  clinicaId?:    number;
  fecha:         string;
  motivo?:       string;
  citaId:        number;
}

export const sendEmailNuevaCita = async (data: CitaEmailData): Promise<void> => {
  const t = await createTransporter(data.clinicaId);
  if (!t) return;

  // Token de confirmación firmado con JWT (expira en 7 días)
  const token = jwt.sign(
    { citaId: data.citaId, action: 'confirmar' },
    process.env.JWT_SECRET || 'nexuscreative_secret',
    { expiresIn: '7d' }
  );

  const confirmUrl = `${BACKEND_URL}/api/citas/confirmar/${token}`;

  const fechaObj = new Date(data.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const horaFormateada = fechaObj.toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit'
  });

  const cuerpo = `
    <h2>📅 Nueva cita médica agendada</h2>
    <p>Hola <strong>${data.pacienteNombre}</strong>, se ha registrado una cita médica para usted con los siguientes detalles:</p>

    <div class="info-box">
      <p><span class="label">Clínica</span><br><span class="value">🏥 ${data.clinicaNombre}</span></p>
      <p><span class="label">Médico</span><br><span class="value">👨‍⚕️ Dr(a). ${data.medicoNombre}</span></p>
      <p><span class="label">Fecha</span><br><span class="value">📆 ${fechaFormateada}</span></p>
      <p><span class="label">Hora</span><br><span class="value">🕐 ${horaFormateada}</span></p>
      ${data.motivo ? `<p><span class="label">Motivo</span><br><span class="value">${data.motivo}</span></p>` : ''}
    </div>

    <p style="color:#6b7280;font-size:14px;">Por favor confirme su asistencia haciendo clic en el botón:</p>
    <div style="text-align:center;">
      <a href="${confirmUrl}" class="btn">✅ Confirmar mi cita</a>
    </div>
    <p style="text-align:center;font-size:12px;color:#9ca3af;">El enlace expira en 7 días</p>

    <hr class="divider"/>
    <p style="font-size:13px;color:#6b7280;">
      Si no esperaba este correo, puede ignorarlo. Para cancelar su cita, comuníquese directamente con la clínica.
    </p>`;

  await t.transporter.sendMail({
    from: `"${data.clinicaNombre}" <${t.from}>`,
    to: data.pacienteEmail,
    subject: `📅 Cita agendada – ${fechaFormateada} ${horaFormateada} | ${data.clinicaNombre}`,
    html: baseTemplate('Nueva Cita Médica', cuerpo, data.clinicaNombre),
  });

  console.log(`✉️ Email de cita enviado a ${data.pacienteEmail}`);
};

// ================================================================
// 2. EMAIL: CITA CONFIRMADA (respuesta tras hacer clic en botón)
// ================================================================
export const sendEmailCitaConfirmada = async (data: CitaEmailData): Promise<void> => {
  const t = await createTransporter(data.clinicaId);
  if (!t) return;

  const fechaObj = new Date(data.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const horaFormateada  = fechaObj.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });

  const cuerpo = `
    <h2>✅ Cita confirmada exitosamente</h2>
    <p>Hola <strong>${data.pacienteNombre}</strong>, su cita ha sido confirmada. Le esperamos.</p>
    <div class="info-box">
      <p><span class="label">Clínica</span><br><span class="value">🏥 ${data.clinicaNombre}</span></p>
      <p><span class="label">Médico</span><br><span class="value">👨‍⚕️ Dr(a). ${data.medicoNombre}</span></p>
      <p><span class="label">Fecha</span><br><span class="value">📆 ${fechaFormateada}</span></p>
      <p><span class="label">Hora</span><br><span class="value">🕐 ${horaFormateada}</span></p>
    </div>
    <p style="font-size:13px;color:#6b7280;">Recuerde llegar 10 minutos antes de su hora programada con su documento de identidad.</p>`;

  await t.transporter.sendMail({
    from: `"${data.clinicaNombre}" <${t.from}>`,
    to: data.pacienteEmail,
    subject: `✅ Cita confirmada – ${fechaFormateada} | ${data.clinicaNombre}`,
    html: baseTemplate('Cita Confirmada', cuerpo, data.clinicaNombre),
  });
};

// ================================================================
// 3. EMAIL: RESUMEN DE CONSULTA
// ================================================================
export interface ConsultaEmailData {
  pacienteNombre:  string;
  pacienteEmail:   string;
  medicoNombre:    string;
  clinicaNombre:   string;
  clinicaId?:      number;
  fecha:           string;
  motivo?:         string;
  diagnostico?:    string;
  tratamiento?:    string;
  observaciones?:  string;
  signosVitales?: {
    presion_arterial?: string;
    frecuencia_cardiaca?: string | number;
    temperatura?: string | number;
    peso?: string | number;
    talla?: string | number;
    saturacion_oxigeno?: string | number;
  };
  consultaId: number;
}

export const sendEmailConsulta = async (data: ConsultaEmailData): Promise<void> => {
  const t = await createTransporter(data.clinicaId);
  if (!t) return;

  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const sv = data.signosVitales || {};
  const signosHtml = [
    sv.presion_arterial    ? `<p><span class="label">Presión arterial</span><br><span class="value">${sv.presion_arterial} mmHg</span></p>` : '',
    sv.frecuencia_cardiaca ? `<p><span class="label">Frec. cardíaca</span><br><span class="value">${sv.frecuencia_cardiaca} lpm</span></p>` : '',
    sv.temperatura         ? `<p><span class="label">Temperatura</span><br><span class="value">${sv.temperatura} °C</span></p>` : '',
    sv.peso                ? `<p><span class="label">Peso</span><br><span class="value">${sv.peso} kg</span></p>` : '',
    sv.talla               ? `<p><span class="label">Talla</span><br><span class="value">${sv.talla} cm</span></p>` : '',
    sv.saturacion_oxigeno  ? `<p><span class="label">Saturación O₂</span><br><span class="value">${sv.saturacion_oxigeno}%</span></p>` : '',
  ].filter(Boolean).join('');

  const cuerpo = `
    <h2>🏥 Resumen de su consulta médica</h2>
    <p>Hola <strong>${data.pacienteNombre}</strong>, a continuación le enviamos el resumen de su consulta del día <strong>${fechaFormateada}</strong>.</p>

    <div class="info-box">
      <p><span class="label">Médico tratante</span><br><span class="value">👨‍⚕️ Dr(a). ${data.medicoNombre}</span></p>
      <p><span class="label">Clínica</span><br><span class="value">🏥 ${data.clinicaNombre}</span></p>
      ${data.motivo ? `<p><span class="label">Motivo de consulta</span><br><span class="value">${data.motivo}</span></p>` : ''}
    </div>

    ${signosHtml ? `
    <h3 style="color:#0e7490;font-size:15px;margin-bottom:8px;">📊 Signos Vitales</h3>
    <div class="info-box">${signosHtml}</div>` : ''}

    ${data.diagnostico ? `
    <h3 style="color:#0e7490;font-size:15px;margin-bottom:8px;">🔬 Diagnóstico</h3>
    <div class="info-box"><p style="font-size:14px;">${data.diagnostico}</p></div>` : ''}

    ${data.tratamiento ? `
    <h3 style="color:#0e7490;font-size:15px;margin-bottom:8px;">💊 Plan de tratamiento</h3>
    <div class="info-box"><p style="font-size:14px;">${data.tratamiento}</p></div>` : ''}

    ${data.observaciones ? `
    <h3 style="color:#0e7490;font-size:15px;margin-bottom:8px;">📝 Indicaciones</h3>
    <div class="info-box"><p style="font-size:14px;">${data.observaciones}</p></div>` : ''}

    <hr class="divider"/>
    <p style="font-size:12px;color:#9ca3af;">
      Consulta #${data.consultaId} registrada el ${fechaFormateada}. Guarde este correo para referencia futura.
    </p>`;

  await t.transporter.sendMail({
    from: `"${data.clinicaNombre}" <${t.from}>`,
    to: data.pacienteEmail,
    subject: `🏥 Resumen de consulta – ${fechaFormateada} | ${data.clinicaNombre}`,
    html: baseTemplate('Resumen de Consulta', cuerpo, data.clinicaNombre),
  });

  console.log(`✉️ Email de consulta enviado a ${data.pacienteEmail}`);
};

// ================================================================
// 4. EMAIL: DETALLE DE RECETA
// ================================================================
export interface RecetaEmailData {
  pacienteNombre: string;
  pacienteEmail:  string;
  medicoNombre:   string;
  clinicaNombre:  string;
  clinicaId?:     number;
  fecha:          string;
  diagnostico?:   string;
  medicamentos:   string;
  instrucciones?: string;
  vigenciaDias?:  number;
  recetaId:       number;
}

export const sendEmailReceta = async (data: RecetaEmailData): Promise<void> => {
  const t = await createTransporter(data.clinicaId);
  if (!t) return;

  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const cuerpo = `
    <h2>💊 Su receta médica</h2>
    <p>Hola <strong>${data.pacienteNombre}</strong>, el Dr(a). <strong>${data.medicoNombre}</strong> le ha emitido la siguiente receta médica:</p>

    <div class="info-box">
      <p><span class="label">Médico</span><br><span class="value">👨‍⚕️ Dr(a). ${data.medicoNombre}</span></p>
      <p><span class="label">Fecha de emisión</span><br><span class="value">📆 ${fechaFormateada}</span></p>
      ${data.vigenciaDias ? `<p><span class="label">Vigencia</span><br><span class="value">⏳ ${data.vigenciaDias} días</span></p>` : ''}
      ${data.diagnostico ? `<p><span class="label">Diagnóstico</span><br><span class="value">${data.diagnostico}</span></p>` : ''}
    </div>

    <h3 style="color:#0e7490;font-size:15px;margin-bottom:8px;">💊 Medicamentos prescritos</h3>
    <div class="meds-box">${data.medicamentos}</div>

    ${data.instrucciones ? `
    <h3 style="color:#0e7490;font-size:15px;margin-bottom:8px;">📋 Instrucciones adicionales</h3>
    <div class="info-box"><p style="font-size:14px;">${data.instrucciones}</p></div>` : ''}

    <hr class="divider"/>
    <p style="font-size:12px;color:#9ca3af;">
      ⚠️ Esta receta tiene validez únicamente en farmacias habilitadas. Receta #${data.recetaId} emitida en ${data.clinicaNombre}.
    </p>`;

  await t.transporter.sendMail({
    from: `"${data.clinicaNombre}" <${t.from}>`,
    to: data.pacienteEmail,
    subject: `💊 Receta médica #${data.recetaId} – ${data.clinicaNombre}`,
    html: baseTemplate('Receta Médica', cuerpo, data.clinicaNombre),
  });

  console.log(`✉️ Email de receta enviado a ${data.pacienteEmail}`);
};
