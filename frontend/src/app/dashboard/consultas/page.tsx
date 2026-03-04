'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Consulta {
  id: number;
  fecha: string;
  paciente_nombres: string;
  paciente_apellidos: string;
  medico_nombres: string;
  medico_apellidos: string;
  motivo_consulta: string;
  diagnostico?: string;
  tratamiento?: string;
  presion_arterial?: string;
  temperatura?: string;
  frecuencia_cardiaca?: string;
  peso?: string;
  talla?: string;
  imc?: string;
  saturacion_oxigeno?: string;
}

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  numero_historia?: string;
  cita_fecha?: string;
}

export default function ConsultasPage() {
  const { accessToken } = useAuthStore();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: '',
    motivo_consulta: '',
    sintomas: '',
    diagnostico: '',
    tratamiento: '',
    presion_arterial: '',
    temperatura: '',
    frecuencia_cardiaca: '',
    peso: '',
    talla: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar consultas y pacientes por separado para que un fallo no bloquee al otro
      const headers = { Authorization: `Bearer ${accessToken}` };

      const [consultasResult, pacientesResult] = await Promise.allSettled([
        axios.get(`${API_URL}/api/consultas`, { headers }),
        axios.get(`${API_URL}/api/consultas/pacientes-confirmados`, { headers })
      ]);

      if (consultasResult.status === 'fulfilled') {
        setConsultas(consultasResult.value.data.data || []);
      } else {
        console.error('Error consultas:', consultasResult.reason?.response?.data?.error || consultasResult.reason?.message);
        setConsultas([]);
      }

      if (pacientesResult.status === 'fulfilled') {
        setPacientes(pacientesResult.value.data.data || []);
      } else {
        console.error('Error pacientes confirmados:', pacientesResult.reason?.response?.data?.error || pacientesResult.reason?.message);
        setPacientes([]);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/consultas`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowModal(false);
      loadData();
      // Reset form
      setFormData({
        paciente_id: '',
        motivo_consulta: '',
        sintomas: '',
        diagnostico: '',
        tratamiento: '',
        presion_arterial: '',
        temperatura: '',
        frecuencia_cardiaca: '',
        peso: '',
        talla: ''
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear consulta');
    }
  };

  const handleVerDetalle = async (id: number) => {
    setLoadingDetalle(true);
    try {
      const res = await axios.get(`${API_URL}/api/consultas/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const d = res.data.data || res.data;
      // Normalizar campos con nombres alternativos
      setSelectedConsulta({
        ...d,
        diagnostico: d.diagnostico ?? d.diagnosticos ?? '',
        tratamiento: d.tratamiento ?? d.plan_tratamiento ?? '',
      });
    } catch (error: any) {
      alert('Error al cargar detalle: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingDetalle(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultas Médicas</h1>
            <p className="text-gray-600 mt-1">Historia clínica de pacientes</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            ➕ Nueva Consulta
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
          ) : consultas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No hay consultas registradas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Médico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Diagnóstico
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultas.map((consulta) => (
                  <tr key={consulta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(consulta.fecha).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {consulta.paciente_nombres} {consulta.paciente_apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Dr. {consulta.medico_nombres} {consulta.medico_apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{consulta.motivo_consulta}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{consulta.diagnostico || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleVerDetalle(consulta.id)}
                        className="text-primary-600 hover:text-primary-900 font-medium text-sm">
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full my-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Consulta Médica</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paciente *
                  </label>
                  {pacientes.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No hay pacientes con citas confirmadas. Ve al módulo <strong>Citas</strong> y confirma una cita primero.
                      </p>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.paciente_id}
                      onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccionar paciente ({pacientes.length} con cita confirmada)</option>
                      {pacientes.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombres} {p.apellidos}
                          {p.cita_fecha ? ` — Cita: ${new Date(p.cita_fecha).toLocaleDateString('es-PE')}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de Consulta *
                  </label>
                  <textarea
                    required
                    value={formData.motivo_consulta}
                    onChange={(e) => setFormData({...formData, motivo_consulta: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presión Arterial
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={formData.presion_arterial}
                      onChange={(e) => setFormData({...formData, presion_arterial: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperatura (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperatura}
                      onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frec. Cardíaca
                    </label>
                    <input
                      type="number"
                      value={formData.frecuencia_cardiaca}
                      onChange={(e) => setFormData({...formData, frecuencia_cardiaca: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.peso}
                      onChange={(e) => setFormData({...formData, peso: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talla (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.talla}
                      onChange={(e) => setFormData({...formData, talla: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Síntomas
                  </label>
                  <textarea
                    value={formData.sintomas}
                    onChange={(e) => setFormData({...formData, sintomas: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <textarea
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({...formData, diagnostico: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tratamiento
                  </label>
                  <textarea
                    value={formData.tratamiento}
                    onChange={(e) => setFormData({...formData, tratamiento: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                  >
                    Guardar Consulta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {loadingDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {selectedConsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detalle de Consulta #{selectedConsulta.id}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(selectedConsulta.fecha).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setSelectedConsulta(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Paciente</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedConsulta.paciente_nombres} {selectedConsulta.paciente_apellidos}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Médico</p>
                  <p className="text-sm font-semibold text-gray-900">Dr. {selectedConsulta.medico_nombres} {selectedConsulta.medico_apellidos}</p>
                </div>
              </div>

              {(selectedConsulta.presion_arterial || selectedConsulta.temperatura || selectedConsulta.frecuencia_cardiaca || selectedConsulta.peso || selectedConsulta.talla || selectedConsulta.saturacion_oxigeno) && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Signos Vitales</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedConsulta.presion_arterial && (
                      <div className="bg-blue-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-blue-500">Presión</p>
                        <p className="text-sm font-bold text-blue-700">{selectedConsulta.presion_arterial}</p>
                      </div>
                    )}
                    {selectedConsulta.temperatura && (
                      <div className="bg-orange-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-orange-500">Temperatura</p>
                        <p className="text-sm font-bold text-orange-700">{selectedConsulta.temperatura}°C</p>
                      </div>
                    )}
                    {selectedConsulta.frecuencia_cardiaca && (
                      <div className="bg-red-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-red-500">Frec. Cardíaca</p>
                        <p className="text-sm font-bold text-red-700">{selectedConsulta.frecuencia_cardiaca} bpm</p>
                      </div>
                    )}
                    {selectedConsulta.peso && (
                      <div className="bg-green-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-green-500">Peso</p>
                        <p className="text-sm font-bold text-green-700">{selectedConsulta.peso} kg</p>
                      </div>
                    )}
                    {selectedConsulta.talla && (
                      <div className="bg-purple-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-purple-500">Talla</p>
                        <p className="text-sm font-bold text-purple-700">{selectedConsulta.talla} cm</p>
                      </div>
                    )}
                    {selectedConsulta.saturacion_oxigeno && (
                      <div className="bg-cyan-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-cyan-500">SatO₂</p>
                        <p className="text-sm font-bold text-cyan-700">{selectedConsulta.saturacion_oxigeno}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Motivo de consulta</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedConsulta.motivo_consulta}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Diagnóstico</p>
                  <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg">
                    {selectedConsulta.diagnostico || <span className="text-gray-400 italic">Sin registrar</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Tratamiento</p>
                  <p className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedConsulta.tratamiento || <span className="text-gray-400 italic">Sin registrar</span>}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={() => setSelectedConsulta(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
