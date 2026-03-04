
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Receta {
  id: number;
  paciente_id: number;
  paciente_nombres: string;
  paciente_apellidos: string;
  medico_nombres: string;
  medico_apellidos: string;
  fecha_emision: string;
  diagnostico?: string;
  medicamentos: string;
  instrucciones?: string;
  estado: string;
}

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
}

export default function RecetasPage() {
  const { accessToken, user } = useAuthStore();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [formData, setFormData] = useState({
    paciente_id: '',
    diagnostico: '',
    medicamentos: '',
    instrucciones: ''
  });

  const headers = { Authorization: `Bearer ${accessToken}` };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [recetasRes, pacientesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/recetas`, { headers }),
        axios.get(`${API_URL}/api/pacientes`, { headers })
      ]);
      if (recetasRes.status === 'fulfilled') setRecetas(recetasRes.value.data.data || []);
      if (pacientesRes.status === 'fulfilled') setPacientes(pacientesRes.value.data.data || []);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/recetas`, formData, { headers });
      alert('✅ Receta creada exitosamente');
      setShowModal(false);
      setFormData({ paciente_id: '', diagnostico: '', medicamentos: '', instrucciones: '' });
      loadData();
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.error || 'Error al crear receta'));
    }
  };

  const handleAnular = async (id: number) => {
    if (!confirm('¿Anular esta receta?')) return;
    try {
      await axios.delete(`${API_URL}/api/recetas/${id}`, { headers });
      alert('✅ Receta anulada');
      loadData();
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.error || 'Error al anular receta'));
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800';
      case 'dispensada': return 'bg-blue-100 text-blue-800';
      case 'anulada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💊 Recetas</h1>
            <p className="text-gray-600 mt-1">Gestión de prescripciones médicas</p>
          </div>
          {(user?.rol === 'admin' || user?.rol === 'medico') && (
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
              ➕ Nueva Receta
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
          ) : recetas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay recetas registradas</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicamentos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recetas.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{r.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(r.fecha_emision).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.paciente_nombres} {r.paciente_apellidos}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Dr. {r.medico_nombres} {r.medico_apellidos}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{r.medicamentos}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getEstadoColor(r.estado)}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedReceta(r)}
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium mr-3">Ver</button>
                      {r.estado === 'activa' && (user?.rol === 'admin' || user?.rol === 'medico') && (
                        <button onClick={() => handleAnular(r.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium">Anular</button>
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
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Receta</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                  <select required value={formData.paciente_id}
                    onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                  <input type="text" value={formData.diagnostico}
                    onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                    placeholder="Diagnóstico del paciente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos *</label>
                  <textarea required rows={4} value={formData.medicamentos}
                    onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                    placeholder="Ej: Amoxicilina 500mg - 1 cápsula cada 8 horas por 7 días"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones adicionales</label>
                  <textarea rows={2} value={formData.instrucciones}
                    onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                    placeholder="Tomar con alimentos, evitar sol, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit"
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">Guardar Receta</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedReceta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Receta #{selectedReceta.id}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getEstadoColor(selectedReceta.estado)}`}>{selectedReceta.estado}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-500">Paciente:</span><p className="font-medium">{selectedReceta.paciente_nombres} {selectedReceta.paciente_apellidos}</p></div>
                  <div><span className="text-gray-500">Médico:</span><p className="font-medium">Dr. {selectedReceta.medico_nombres} {selectedReceta.medico_apellidos}</p></div>
                  <div><span className="text-gray-500">Fecha:</span><p className="font-medium">{new Date(selectedReceta.fecha_emision).toLocaleDateString('es-PE')}</p></div>
                </div>
                {selectedReceta.diagnostico && (
                  <div><span className="text-gray-500">Diagnóstico:</span><p className="font-medium mt-1">{selectedReceta.diagnostico}</p></div>
                )}
                <div>
                  <span className="text-gray-500">Medicamentos:</span>
                  <pre className="font-medium mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg text-xs">{selectedReceta.medicamentos}</pre>
                </div>
                {selectedReceta.instrucciones && (
                  <div><span className="text-gray-500">Instrucciones:</span><p className="font-medium mt-1">{selectedReceta.instrucciones}</p></div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setSelectedReceta(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
