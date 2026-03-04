'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Cita {
  id: number;
  paciente_id: number;
  medico_id: number;
  fecha_hora: string;
  paciente_nombres: string;
  paciente_apellidos: string;
  medico_nombres: string;
  medico_apellidos: string;
  motivo?: string;
  estado: string;
  tipo_cita?: string;
}

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  numero_historia: string;
  dni: string;
  total_citas?: number;
}

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  especialidad?: string;
}

export default function CitasPage() {
  const { accessToken, user } = useAuthStore();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterMisPacientes, setFilterMisPacientes] = useState(false);
  const [misPacientesIds, setMisPacientesIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    paciente_id: '',
    medico_id: '',
    fecha_hora: '',
    motivo: '',
    tipo_cita: 'consulta',
    duracion_minutos: 30
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Cargando datos de citas...');
      console.log('👤 Usuario actual:', user?.nombres, user?.apellidos, '- Rol:', user?.rol);
      console.log('🏥 Clínica:', user?.clinica_nombre, '- ID:', user?.clinica_id);
      
      const [citasRes, pacientesRes, medicosRes] = await Promise.all([
        axios.get(`${API_URL}/api/citas`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get(`${API_URL}/api/pacientes`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get(`${API_URL}/api/usuarios/medicos`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);
      
      console.log('📋 Pacientes cargados:', pacientesRes.data.data.length);
      console.log('📅 Citas cargadas:', citasRes.data.data.length);
      console.log('👨‍⚕️ Médicos cargados:', medicosRes.data.data.length);
      
      if (pacientesRes.data.data.length === 0) {
        console.warn('⚠️ No hay pacientes en esta clínica. Crea pacientes primero en el módulo de Pacientes.');
      }
      
      if (medicosRes.data.data.length === 0) {
        console.warn('⚠️ No hay médicos en esta clínica. Crea usuarios médicos primero.');
      }
      
      setCitas(citasRes.data.data);
      setPacientes(pacientesRes.data.data);
      setMedicos(medicosRes.data.data);
      
      // Si es médico, pre-seleccionar su ID en el formulario
      if (user?.rol === 'medico') {
        setFormData(prev => ({ ...prev, medico_id: user.id.toString() }));
      }
      
      // Identificar mis pacientes (pacientes que tienen citas conmigo)
      if (user?.rol === 'medico') {
        const misCitas = citasRes.data.data.filter((c: Cita) => c.medico_id === user.id);
        const idsUnicos: number[] = [];
        misCitas.forEach((c: Cita) => {
          if (!idsUnicos.includes(c.paciente_id)) {
            idsUnicos.push(c.paciente_id);
          }
        });
        setMisPacientesIds(idsUnicos);
        console.log('👨‍⚕️ Mis pacientes:', idsUnicos.length);
      }
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que la fecha no sea en el pasado
    const fechaSeleccionada = new Date(formData.fecha_hora);
    const ahora = new Date();
    
    if (fechaSeleccionada < ahora) {
      alert('❌ No se pueden agendar citas en fechas pasadas');
      return;
    }
    
    try {
      console.log('Enviando datos de cita:', formData);
      await axios.post(`${API_URL}/api/citas`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      alert('✅ Cita creada exitosamente');
      setShowModal(false);
      loadData();
      setFormData({
        paciente_id: '',
        medico_id: user?.rol === 'medico' ? user.id.toString() : '',
        fecha_hora: '',
        motivo: '',
        tipo_cita: 'consulta',
        duracion_minutos: 30
      });
    } catch (error: any) {
      console.error('Error al crear cita:', error);
      alert('❌ ' + (error.response?.data?.error || 'Error al crear cita'));
    }
  };

  const handleConfirmar = async (id: number) => {
    if (!confirm('¿Confirmar esta cita?')) return;
    try {
      await axios.post(`${API_URL}/api/citas/${id}/confirmar`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      alert('✅ Cita confirmada');
      loadData();
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.error || 'Error al confirmar cita'));
    }
  };

  const handleCancelar = async (id: number) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await axios.post(`${API_URL}/api/citas/${id}/cancelar`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      alert('✅ Cita cancelada');
      loadData();
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.error || 'Error al cancelar cita'));
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'completada': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Citas</h1>
            <p className="text-gray-600 mt-1">Gestiona las citas médicas</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            ➕ Nueva Cita
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
          ) : citas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No hay citas registradas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha/Hora
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
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(cita.fecha_hora).toLocaleDateString('es-PE')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(cita.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cita.paciente_nombres} {cita.paciente_apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Dr. {cita.medico_nombres} {cita.medico_apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{cita.motivo || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getEstadoColor(cita.estado || 'pendiente')}`}>
                        {cita.estado || 'pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(() => {
                        const estado = cita.estado || 'pendiente';
                        if (estado === 'cancelada' || estado === 'completada') {
                          return <span className="text-gray-400 text-sm">Sin acciones</span>;
                        }
                        return (
                          <>
                            {estado === 'pendiente' && (
                              <button
                                onClick={() => handleConfirmar(cita.id)}
                                className="text-green-600 hover:text-green-900 font-medium text-sm mr-3"
                              >
                                ✅ Confirmar
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelar(cita.id)}
                              className="text-red-600 hover:text-red-900 font-medium text-sm"
                            >
                              ❌ Cancelar
                            </button>
                          </>
                        );
                      })()}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Cita</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paciente *
                  </label>
                  
                  {pacientes.length === 0 && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No hay pacientes registrados en tu clínica. 
                        <br />
                        Ve al módulo <strong>Pacientes</strong> para crear uno primero.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {user?.rol === 'medico' && pacientes.length > 5 && (
                      <div className="flex items-center space-x-4 text-sm">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filterMisPacientes}
                            onChange={(e) => setFilterMisPacientes(e.target.checked)}
                            className="mr-2"
                          />
                          Solo mis pacientes ({misPacientesIds.length})
                        </label>
                      </div>
                    )}
                    <select
                      required
                      value={formData.paciente_id}
                      onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      disabled={pacientes.length === 0}
                    >
                      <option value="">
                        {pacientes.length === 0 
                          ? 'No hay pacientes disponibles' 
                          : `Seleccionar paciente (${filterMisPacientes ? misPacientesIds.length : pacientes.length} disponibles)`
                        }
                      </option>
                      {(filterMisPacientes 
                        ? pacientes.filter(p => misPacientesIds.includes(p.id))
                        : pacientes
                      ).map(p => {
                        const esMiPaciente = misPacientesIds.includes(p.id);
                        return (
                          <option key={p.id} value={p.id}>
                            {esMiPaciente && user?.rol === 'medico' ? '⭐ ' : ''}
                            {p.nombres} {p.apellidos} - {p.numero_historia}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-gray-500">
                      {user?.rol === 'medico' && '⭐ indica tus pacientes con citas previas'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y Hora *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    value={formData.fecha_hora}
                    onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Solo se pueden agendar citas desde hoy en adelante
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médico *
                  </label>
                  
                  {medicos.length === 0 && user?.rol !== 'medico' && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No hay médicos registrados en tu clínica. 
                        <br />
                        Ve al módulo <strong>Usuarios</strong> para crear usuarios con rol "Médico".
                      </p>
                    </div>
                  )}
                  
                  <select
                    required
                    value={formData.medico_id}
                    onChange={(e) => setFormData({...formData, medico_id: e.target.value})}
                    disabled={user?.rol === 'medico' || medicos.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {medicos.length === 0 ? 'No hay médicos disponibles' : 'Seleccionar médico'}
                    </option>
                    {medicos.map(m => (
                      <option key={m.id} value={m.id}>
                        Dr(a). {m.nombres} {m.apellidos} {m.especialidad ? `- ${m.especialidad}` : ''}
                      </option>
                    ))}
                  </select>
                  {user?.rol === 'medico' && (
                    <p className="text-xs text-gray-500 mt-1">Autoasignado como médico responsable</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>
                  <textarea
                    value={formData.motivo}
                    onChange={(e) => setFormData({...formData, motivo: e.target.value})}
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
                    Guardar Cita
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
