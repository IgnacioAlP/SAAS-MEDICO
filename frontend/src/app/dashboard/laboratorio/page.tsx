'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Examen {
  id: number;
  paciente_nombres: string;
  paciente_apellidos: string;
  medico_nombres: string;
  medico_apellidos: string;
  fecha_solicitud: string;
  fecha_resultado?: string;
  tipo_examen: string;
  descripcion?: string;
  resultado?: string;
  estado: string;
}

interface Paciente { id: number; nombres: string; apellidos: string; }

const TIPOS_EXAMEN = ['Hemograma completo','Glucosa en sangre','Perfil lipídico','Función renal','Función hepática','Análisis de orina','Cultivo de orina','Radiografía de tórax','Electrocardiograma','Ecografía abdominal','Tomografía computarizada','Resonancia magnética','Prueba de embarazo','VIH / SIDA','Otro'];

export default function LaboratorioPage() {
  const { accessToken, user } = useAuthStore();
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null);
  const [showResultadoModal, setShowResultadoModal] = useState(false);
  const [resultado, setResultado] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [formData, setFormData] = useState({ paciente_id: '', tipo_examen: '', descripcion: '' });

  const headers = { Authorization: `Bearer ${accessToken}` };

  useEffect(() => { loadData(); }, [filtroEstado]);

  const loadData = async () => {
    setLoading(true);
    try {
      const url = filtroEstado ? `${API_URL}/api/laboratorio?estado=${filtroEstado}` : `${API_URL}/api/laboratorio`;
      const [exRes, pacRes] = await Promise.allSettled([
        axios.get(url, { headers }),
        axios.get(`${API_URL}/api/pacientes`, { headers })
      ]);
      if (exRes.status === 'fulfilled') setExamenes(exRes.value.data.data || []);
      if (pacRes.status === 'fulfilled') setPacientes(pacRes.value.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/laboratorio`, formData, { headers });
      alert('✅ Examen solicitado');
      setShowModal(false);
      setFormData({ paciente_id: '', tipo_examen: '', descripcion: '' });
      loadData();
    } catch (error: any) { alert('❌ ' + (error.response?.data?.error || 'Error')); }
  };

  const handleCargarResultado = async () => {
    if (!selectedExamen || !resultado.trim()) return;
    try {
      await axios.put(`${API_URL}/api/laboratorio/${selectedExamen.id}`, { resultado }, { headers });
      alert('✅ Resultado cargado');
      setShowResultadoModal(false); setSelectedExamen(null); setResultado('');
      loadData();
    } catch (error: any) { alert('❌ ' + (error.response?.data?.error || 'Error')); }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🧪 Laboratorio</h1>
            <p className="text-gray-600 mt-1">Solicitudes y resultados de exámenes</p>
          </div>
          {(user?.rol === 'admin' || user?.rol === 'medico') && (
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">
              ➕ Solicitar Examen
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3 items-center flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Estado:</span>
          {['', 'pendiente', 'en_proceso', 'completado'].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filtroEstado === e ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {e === '' ? 'Todos' : e.replace('_', ' ')}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">{examenes.length} resultado(s)</span>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div></div>
          ) : examenes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay exámenes registrados</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de examen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {examenes.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{ex.id}</td>
                    <td className="px-4 py-3 text-sm">{new Date(ex.fecha_solicitud).toLocaleDateString('es-PE')}</td>
                    <td className="px-4 py-3 text-sm">{ex.paciente_nombres} {ex.paciente_apellidos}</td>
                    <td className="px-4 py-3 text-sm">{ex.tipo_examen}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(ex.estado)}`}>
                        {ex.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm space-x-2">
                      <button onClick={() => setSelectedExamen(ex)} className="text-primary-600 hover:text-primary-900 font-medium">Ver</button>
                      {ex.estado !== 'completado' && (
                        <button onClick={() => { setSelectedExamen(ex); setShowResultadoModal(true); }}
                          className="text-green-600 hover:text-green-900 font-medium">Cargar resultado</button>
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
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Solicitar Examen</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de examen *</label>
                <select required value={formData.tipo_examen} onChange={(e) => setFormData({ ...formData, tipo_examen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option value="">Seleccionar tipo</option>
                  {TIPOS_EXAMEN.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indicaciones clínicas</label>
                <textarea rows={3} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Motivo o indicaciones" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">Solicitar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedExamen && !showResultadoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Examen #{selectedExamen.id}</h2>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(selectedExamen.estado)}`}>{selectedExamen.estado.replace('_', ' ')}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Paciente:</span><p className="font-medium">{selectedExamen.paciente_nombres} {selectedExamen.paciente_apellidos}</p></div>
                <div><span className="text-gray-500">Tipo:</span><p className="font-medium">{selectedExamen.tipo_examen}</p></div>
                <div><span className="text-gray-500">Solicitado:</span><p className="font-medium">{new Date(selectedExamen.fecha_solicitud).toLocaleDateString('es-PE')}</p></div>
              </div>
              {selectedExamen.descripcion && <div><span className="text-gray-500">Indicaciones:</span><p className="font-medium mt-1">{selectedExamen.descripcion}</p></div>}
              {selectedExamen.resultado && <div><span className="text-gray-500">Resultado:</span><pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded mt-1 text-xs">{selectedExamen.resultado}</pre></div>}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setSelectedExamen(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showResultadoModal && selectedExamen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Cargar Resultado</h2>
            <p className="text-sm text-gray-600 mb-3">{selectedExamen.tipo_examen} — {selectedExamen.paciente_nombres} {selectedExamen.paciente_apellidos}</p>
            <textarea rows={5} value={resultado} onChange={(e) => setResultado(e.target.value)}
              placeholder="Ingrese los resultados del examen..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-4" />
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowResultadoModal(false); setResultado(''); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCargarResultado} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium">Guardar Resultado</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
