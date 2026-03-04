'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Internacion {
  id: number;
  paciente_nombres: string;
  paciente_apellidos: string;
  medico_nombres: string;
  medico_apellidos: string;
  fecha_ingreso: string;
  fecha_egreso?: string;
  motivo: string;
  diagnostico?: string;
  habitacion?: string;
  cama?: string;
  estado: string;
  observaciones?: string;
}

interface Paciente { id: number; nombres: string; apellidos: string; }

export default function InternacionesPage() {
  const { accessToken, user } = useAuthStore();
  const [internaciones, setInternaciones] = useState<Internacion[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInternacion, setSelectedInternacion] = useState<Internacion | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('activa');
  const [formData, setFormData] = useState({ paciente_id: '', motivo: '', diagnostico: '', habitacion: '', cama: '', observaciones: '' });

  const headers = { Authorization: `Bearer ${accessToken}` };

  useEffect(() => { loadData(); }, [filtroEstado]);

  const loadData = async () => {
    setLoading(true);
    try {
      const url = filtroEstado ? `${API_URL}/api/internaciones?estado=${filtroEstado}` : `${API_URL}/api/internaciones`;
      const [intRes, pacRes] = await Promise.allSettled([
        axios.get(url, { headers }),
        axios.get(`${API_URL}/api/pacientes`, { headers })
      ]);
      if (intRes.status === 'fulfilled') setInternaciones(intRes.value.data.data || []);
      if (pacRes.status === 'fulfilled') setPacientes(pacRes.value.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/internaciones`, formData, { headers });
      alert('✅ Internación registrada');
      setShowModal(false);
      setFormData({ paciente_id: '', motivo: '', diagnostico: '', habitacion: '', cama: '', observaciones: '' });
      loadData();
    } catch (error: any) { alert('❌ ' + (error.response?.data?.error || 'Error')); }
  };

  const handleDarAlta = async (id: number) => {
    const diag = prompt('Diagnóstico de egreso (opcional):');
    if (diag === null) return;
    try {
      await axios.post(`${API_URL}/api/internaciones/${id}/alta`, { diagnostico_egreso: diag }, { headers });
      alert('✅ Alta registrada');
      loadData();
    } catch (error: any) { alert('❌ ' + (error.response?.data?.error || 'Error')); }
  };

  const getDias = (ingreso: string, egreso?: string) => {
    const ini = new Date(ingreso), fin = egreso ? new Date(egreso) : new Date();
    return Math.floor((fin.getTime() - ini.getTime()) / 86400000);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800';
      case 'alta': return 'bg-blue-100 text-blue-800';
      case 'traslado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activas = internaciones.filter(i => i.estado === 'activa');

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🛏️ Internaciones</h1>
            <p className="text-gray-600 mt-1">Gestión de pacientes hospitalizados</p>
          </div>
          {(user?.rol === 'admin' || user?.rol === 'medico') && (
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">
              ➕ Nueva Internación
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-700">{activas.length}</p>
            <p className="text-sm font-medium text-green-700">Internados activos</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-700">
              {activas.length > 0 ? Math.round(activas.reduce((a, i) => a + getDias(i.fecha_ingreso), 0) / activas.length) : 0}
            </p>
            <p className="text-sm font-medium text-blue-700">Días promedio</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-purple-700">
              {internaciones.filter(i => i.estado === 'alta' && i.fecha_egreso && new Date(i.fecha_egreso).getMonth() === new Date().getMonth()).length}
            </p>
            <p className="text-sm font-medium text-purple-700">Altas este mes</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3 items-center flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Estado:</span>
          {[{ v: '', l: 'Todos' }, { v: 'activa', l: 'Activas' }, { v: 'alta', l: 'Alta' }, { v: 'traslado', l: 'Traslado' }].map(f => (
            <button key={f.v} onClick={() => setFiltroEstado(f.v)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filtroEstado === f.v ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{f.l}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div></div>
          ) : internaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay internaciones registradas</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingreso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hab/Cama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {internaciones.map((int) => (
                  <tr key={int.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{int.paciente_nombres} {int.paciente_apellidos}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{int.motivo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">Dr. {int.medico_nombres} {int.medico_apellidos}</td>
                    <td className="px-4 py-3 text-sm">{new Date(int.fecha_ingreso).toLocaleDateString('es-PE')}</td>
                    <td className="px-4 py-3 text-sm font-medium">{getDias(int.fecha_ingreso, int.fecha_egreso)} día(s)</td>
                    <td className="px-4 py-3 text-sm">{int.habitacion ? `Hab. ${int.habitacion}${int.cama ? ` / Cama ${int.cama}` : ''}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getEstadoColor(int.estado)}`}>{int.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm space-x-2">
                      <button onClick={() => setSelectedInternacion(int)} className="text-primary-600 hover:text-primary-900 font-medium">Ver</button>
                      {int.estado === 'activa' && (user?.rol === 'admin' || user?.rol === 'medico') && (
                        <button onClick={() => handleDarAlta(int.id)} className="text-blue-600 hover:text-blue-900 font-medium">Dar Alta</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Nueva Internación</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                  <select required value={formData.paciente_id} onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                  <textarea required rows={2} value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    placeholder="Motivo de hospitalización" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico inicial</label>
                  <input type="text" value={formData.diagnostico} onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                    placeholder="Diagnóstico de ingreso" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Habitación</label>
                    <input type="text" value={formData.habitacion} onChange={(e) => setFormData({ ...formData, habitacion: e.target.value })}
                      placeholder="Ej: 101" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cama</label>
                    <input type="text" value={formData.cama} onChange={(e) => setFormData({ ...formData, cama: e.target.value })}
                      placeholder="Ej: A" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea rows={2} value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedInternacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Internación #{selectedInternacion.id}</h2>
              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getEstadoColor(selectedInternacion.estado)}`}>{selectedInternacion.estado}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Paciente:</span><p className="font-medium">{selectedInternacion.paciente_nombres} {selectedInternacion.paciente_apellidos}</p></div>
                <div><span className="text-gray-500">Médico:</span><p className="font-medium">Dr. {selectedInternacion.medico_nombres} {selectedInternacion.medico_apellidos}</p></div>
                <div><span className="text-gray-500">Ingreso:</span><p className="font-medium">{new Date(selectedInternacion.fecha_ingreso).toLocaleString('es-PE')}</p></div>
                {selectedInternacion.fecha_egreso && <div><span className="text-gray-500">Egreso:</span><p className="font-medium">{new Date(selectedInternacion.fecha_egreso).toLocaleString('es-PE')}</p></div>}
                <div><span className="text-gray-500">Días:</span><p className="font-medium">{getDias(selectedInternacion.fecha_ingreso, selectedInternacion.fecha_egreso)}</p></div>
                {(selectedInternacion.habitacion || selectedInternacion.cama) && <div><span className="text-gray-500">Ubicación:</span><p className="font-medium">Hab. {selectedInternacion.habitacion} / Cama {selectedInternacion.cama}</p></div>}
              </div>
              <div><span className="text-gray-500">Motivo:</span><p className="font-medium mt-1">{selectedInternacion.motivo}</p></div>
              {selectedInternacion.diagnostico && <div><span className="text-gray-500">Diagnóstico:</span><p className="font-medium mt-1">{selectedInternacion.diagnostico}</p></div>}
              {selectedInternacion.observaciones && <div><span className="text-gray-500">Observaciones:</span><p className="font-medium mt-1">{selectedInternacion.observaciones}</p></div>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {selectedInternacion.estado === 'activa' && (user?.rol === 'admin' || user?.rol === 'medico') && (
                <button onClick={() => { setSelectedInternacion(null); handleDarAlta(selectedInternacion.id); }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">Dar Alta</button>
              )}
              <button onClick={() => setSelectedInternacion(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
