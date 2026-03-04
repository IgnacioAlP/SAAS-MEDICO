'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Tab = 'smtp' | 'perfil';

export default function ConfiguracionPage() {
  const { accessToken, user, setUser } = useAuthStore();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [tab, setTab] = useState<Tab>('perfil');

  // ── Estado SMTP ─────────────────────────────────────────────
  const [smtp, setSmtp] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
    smtp_secure: false,
    activo: false,
  });
  const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [emailPrueba, setEmailPrueba] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  // ── Estado Perfil ───────────────────────────────────────────
  const [perfil, setPerfil] = useState({
    email: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    especialidad: '',
    numero_colegiatura: '',
    clinica_nombre: '',
    rol: '',
  });
  const [passForm, setPassForm] = useState({
    password_actual: '',
    password_nuevo: '',
    password_confirmar: '',
  });
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    loadPerfil();
    if (user?.rol === 'admin') loadSmtp();
  }, []);

  // ── Loaders ─────────────────────────────────────────────────
  const loadSmtp = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/configuracion/smtp`, { headers });
      const d = res.data.data;
      setSmtp({
        smtp_host: d.smtp_host,
        smtp_port: d.smtp_port,
        smtp_user: d.smtp_user,
        smtp_password: '',
        smtp_from: d.smtp_from,
        smtp_secure: d.smtp_secure,
        activo: d.activo,
      });
      setSmtpPasswordSet(d.password_set);
    } catch {}
  };

  const loadPerfil = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/configuracion/perfil`, { headers });
      const d = res.data.data;
      setPerfil({
        email: d.email,
        nombres: d.nombres,
        apellidos: d.apellidos,
        telefono: d.telefono || '',
        especialidad: d.especialidad || '',
        numero_colegiatura: d.numero_colegiatura || '',
        clinica_nombre: d.clinica_nombre || '',
        rol: d.rol,
      });
      setEmailPrueba(d.email || '');
    } catch {}
  };

  // ── Handlers SMTP ───────────────────────────────────────────
  const handleSmtpSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpMsg(null);
    try {
      await axios.put(`${API_URL}/api/configuracion/smtp`, smtp, { headers });
      setSmtpMsg({ type: 'ok', text: '✅ Configuración SMTP guardada correctamente' });
      loadSmtp();
    } catch (err: any) {
      setSmtpMsg({ type: 'err', text: '❌ ' + (err.response?.data?.error || 'Error al guardar') });
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleSmtpTest = async () => {
    if (!emailPrueba) return alert('Ingrese un email de destino');
    setTestLoading(true);
    setSmtpMsg(null);
    try {
      await axios.post(`${API_URL}/api/configuracion/smtp/test`, { email_destino: emailPrueba }, { headers });
      setSmtpMsg({ type: 'ok', text: `✅ Email de prueba enviado a ${emailPrueba}` });
    } catch (err: any) {
      setSmtpMsg({ type: 'err', text: '❌ ' + (err.response?.data?.error || 'Error al enviar prueba') });
    } finally {
      setTestLoading(false);
    }
  };

  // ── Handlers Perfil ─────────────────────────────────────────
  const handlePerfilSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPerfilLoading(true);
    setPerfilMsg(null);
    try {
      const payload: any = {
        email: perfil.email,
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        telefono: perfil.telefono,
        especialidad: perfil.especialidad,
        numero_colegiatura: perfil.numero_colegiatura,
      };
      if (passForm.password_nuevo) {
        if (passForm.password_nuevo !== passForm.password_confirmar) {
          setPerfilMsg({ type: 'err', text: '❌ Las contraseñas nuevas no coinciden' });
          setPerfilLoading(false);
          return;
        }
        payload.password_actual = passForm.password_actual;
        payload.password_nuevo = passForm.password_nuevo;
      }
      const res = await axios.put(`${API_URL}/api/configuracion/perfil`, payload, { headers });
      setPerfilMsg({ type: 'ok', text: '✅ Perfil actualizado correctamente' });
      setPassForm({ password_actual: '', password_nuevo: '', password_confirmar: '' });
      if (res.data.data) {
        const d = res.data.data;
        setUser({ ...user!, email: d.email, nombres: d.nombres, apellidos: d.apellidos });
      }
      loadPerfil();
    } catch (err: any) {
      setPerfilMsg({ type: 'err', text: '❌ ' + (err.response?.data?.error || 'Error al guardar') });
    } finally {
      setPerfilLoading(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────
  const InputField = ({
    label, type = 'text', value, onChange, placeholder = '', required = false, help = '',
  }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
      />
      {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}
    </div>
  );

  const Alert = ({ msg }: { msg: { type: 'ok' | 'err'; text: string } | null }) =>
    msg ? (
      <div
        className={`rounded-lg px-4 py-3 text-sm mb-4 ${
          msg.type === 'ok'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}
      >
        {msg.text}
      </div>
    ) : null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración</h1>
          <p className="text-gray-600 mt-1">Gestiona tu perfil y ajustes del sistema</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setTab('perfil')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === 'perfil' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👤 Mi Perfil
          </button>
          {user?.rol === 'admin' && (
            <button
              onClick={() => setTab('smtp')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tab === 'smtp' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📧 Email / SMTP
            </button>
          )}
        </div>

        {/* ─────────── TAB: MI PERFIL ─────────── */}
        {tab === 'perfil' && (
          <div className="space-y-6">
            {/* Avatar / resumen */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-5 border border-primary-100 flex items-center gap-4">
              <div className="bg-primary-500 text-white rounded-full w-14 h-14 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {perfil.nombres?.[0]}{perfil.apellidos?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{perfil.nombres} {perfil.apellidos}</p>
                <p className="text-sm text-gray-500">{perfil.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full capitalize font-medium">
                    {perfil.rol}
                  </span>
                  {perfil.clinica_nombre && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      🏥 {perfil.clinica_nombre}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handlePerfilSave} className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Información personal</h2>
              <Alert msg={perfilMsg} />

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Nombres" required value={perfil.nombres}
                  onChange={(e: any) => setPerfil({ ...perfil, nombres: e.target.value })}
                />
                <InputField
                  label="Apellidos" required value={perfil.apellidos}
                  onChange={(e: any) => setPerfil({ ...perfil, apellidos: e.target.value })}
                />
              </div>

              <InputField
                label="Email" type="email" required value={perfil.email}
                onChange={(e: any) => setPerfil({ ...perfil, email: e.target.value })}
                help="Este correo se usa para iniciar sesión. Recibirás notificaciones del sistema aquí."
              />

              <InputField
                label="Teléfono" type="tel" value={perfil.telefono}
                onChange={(e: any) => setPerfil({ ...perfil, telefono: e.target.value })}
              />

              {(perfil.rol === 'medico' || perfil.rol === 'admin') && (
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Especialidad" value={perfil.especialidad}
                    onChange={(e: any) => setPerfil({ ...perfil, especialidad: e.target.value })}
                  />
                  <InputField
                    label="N° Colegiatura" value={perfil.numero_colegiatura}
                    onChange={(e: any) => setPerfil({ ...perfil, numero_colegiatura: e.target.value })}
                  />
                </div>
              )}

              <hr className="border-gray-100" />
              <h3 className="text-sm font-bold text-gray-700">
                🔒 Cambiar contraseña{' '}
                <span className="text-gray-400 font-normal">(dejar en blanco para no cambiar)</span>
              </h3>

              <InputField
                label="Contraseña actual" type="password" value={passForm.password_actual}
                onChange={(e: any) => setPassForm({ ...passForm, password_actual: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Nueva contraseña" type="password" value={passForm.password_nuevo}
                  onChange={(e: any) => setPassForm({ ...passForm, password_nuevo: e.target.value })}
                />
                <InputField
                  label="Confirmar contraseña" type="password" value={passForm.password_confirmar}
                  onChange={(e: any) => setPassForm({ ...passForm, password_confirmar: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={perfilLoading}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {perfilLoading ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─────────── TAB: EMAIL / SMTP ─────────── */}
        {tab === 'smtp' && user?.rol === 'admin' && (
          <div className="space-y-6">
            {/* Guía rápida */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
              <h3 className="font-bold mb-2">📋 ¿Cómo configurar el correo con Gmail?</h3>
              <ol className="list-decimal list-inside space-y-1 text-amber-900">
                <li>Ve a <strong>myaccount.google.com</strong> → Seguridad</li>
                <li>Activa la <strong>Verificación en 2 pasos</strong></li>
                <li>Ve a <strong>Contraseñas de aplicaciones</strong></li>
                <li>Crea una para "Correo / Windows" → copia los 16 caracteres</li>
                <li>Úsala como Contraseña SMTP (no tu contraseña normal de Gmail)</li>
              </ol>
              <p className="mt-3 text-xs">También puedes usar Outlook (smtp.office365.com:587), Hostinger, Mailgun, etc.</p>
            </div>

            <form onSubmit={handleSmtpSave} className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-gray-900">Servidor SMTP</h2>
                {/* Toggle activo */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors ${smtp.activo ? 'bg-primary-500' : 'bg-gray-300'}`}
                    onClick={() => setSmtp({ ...smtp, activo: !smtp.activo })}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${smtp.activo ? 'translate-x-5' : ''}`}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{smtp.activo ? 'Activo' : 'Inactivo'}</span>
                </label>
              </div>

              <Alert msg={smtpMsg} />

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <InputField
                    label="Servidor SMTP (Host)" required value={smtp.smtp_host}
                    onChange={(e: any) => setSmtp({ ...smtp, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <InputField
                  label="Puerto" type="number" required value={smtp.smtp_port}
                  onChange={(e: any) => setSmtp({ ...smtp, smtp_port: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                />
              </div>

              <InputField
                label="Usuario / Email del remitente" type="email" required value={smtp.smtp_user}
                onChange={(e: any) => setSmtp({ ...smtp, smtp_user: e.target.value })}
                placeholder="correo@gmail.com"
                help="El correo desde el que se enviarán todos los emails del sistema."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña de aplicación
                  {smtpPasswordSet && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ✅ Ya configurada — dejar en blanco para mantenerla
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={smtp.smtp_password}
                  onChange={(e) => setSmtp({ ...smtp, smtp_password: e.target.value })}
                  placeholder={smtpPasswordSet ? '••••••••••••••••' : 'Contraseña de aplicación (16 caracteres para Gmail)'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              <InputField
                label="Nombre del remitente (From)" value={smtp.smtp_from}
                onChange={(e: any) => setSmtp({ ...smtp, smtp_from: e.target.value })}
                placeholder='Mi Clínica <correo@gmail.com>'
                help="Opcional. Si está vacío se usa el usuario SMTP."
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtp.smtp_secure}
                  onChange={(e) => setSmtp({ ...smtp, smtp_secure: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">SSL/TLS (puerto 465)</span>
                  <p className="text-xs text-gray-500">Activar solo si el puerto es 465. Para el puerto 587 déjalo desactivado (STARTTLS).</p>
                </div>
              </label>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={smtpLoading}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium text-sm"
                >
                  {smtpLoading ? 'Guardando…' : '💾 Guardar configuración'}
                </button>
              </div>
            </form>

            {/* Test email */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-1">🧪 Enviar email de prueba</h3>
              <p className="text-sm text-gray-500 mb-4">Verifica que la configuración funcione enviando un correo de prueba.</p>
              <div className="flex gap-3">
                <input
                  type="email" value={emailPrueba}
                  onChange={(e) => setEmailPrueba(e.target.value)}
                  placeholder="destino@ejemplo.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button
                  onClick={handleSmtpTest}
                  disabled={testLoading || !smtp.activo}
                  title={!smtp.activo ? 'Activa el SMTP primero' : ''}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium text-sm whitespace-nowrap"
                >
                  {testLoading ? 'Enviando…' : '📤 Enviar prueba'}
                </button>
              </div>
              {!smtp.activo && (
                <p className="text-xs text-amber-600 mt-2">⚠️ Guarda y activa el SMTP antes de enviar la prueba.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
