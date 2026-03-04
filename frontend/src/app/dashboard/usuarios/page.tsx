'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Usuario {
  id: number;
  clinica_id: number;
  clinica_nombre?: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  rol: string;
  especialidad?: string;
  numero_colegiatura?: string;
  activo: boolean;
  ultima_sesion?: string;
}

interface Clinica {
  id: number;
  nombre: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export default function UsuariosPage() {
  const { accessToken, user } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [clinicas, setClinicas] = useState<Clinica[]>([]); // Para que admin seleccione
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showClinicaModal, setShowClinicaModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [modoClinica, setModoClinica] = useState<'existente' | 'nueva'>('nueva'); // Para admin
  const [formData, setFormData] = useState({
    clinica_id: '', // Para seleccionar clínica existente
    clinica_nombre: '', // Para crear nueva clínica
    clinica_ruc: '', // Para crear nueva clínica
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    rol: 'recepcionista',
    especialidad: '',
    numero_colegiatura: ''
  });
  const [clinicaFormData, setClinicaFormData] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    if (user?.rol === 'admin' || user?.rol === 'medico') {
      loadUsuarios();
      loadClinica();
      if (user?.rol === 'admin') {
        loadClinicas(); // Solo admin puede ver todas las clínicas
      }
    }
  }, []);

  const loadClinicas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clinicas/all`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setClinicas(response.data.data);
    } catch (error) {
      console.error('Error al cargar clínicas:', error);
    }
  };

  const loadClinica = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clinicas`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setClinica(response.data.data);
      setClinicaFormData({
        nombre: response.data.data.nombre || '',
        ruc: response.data.data.ruc || '',
        direccion: response.data.data.direccion || '',
        telefono: response.data.data.telefono || '',
        email: response.data.data.email || ''
      });
    } catch (error) {
      console.error('Error al cargar clínica:', error);
    }
  };

  const loadUsuarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsuarios(response.data.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && selectedUsuario) {
        // Editar usuario existente
        await axios.put(
          `${API_URL}/api/usuarios/${selectedUsuario.id}`,
          formData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        alert('✅ Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await axios.post(`${API_URL}/api/usuarios`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        alert('✅ Usuario creado exitosamente');
      }
      
      setShowModal(false);
      setEditMode(false);
      setSelectedUsuario(null);
      loadUsuarios();
      resetForm();
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ ' + (error.response?.data?.error || 'Error al procesar usuario'));
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setFormData({
      email: usuario.email,
      password: '', // No mostramos la contraseña
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      dni: usuario.dni,
      telefono: usuario.telefono || '',
      rol: usuario.rol,
      especialidad: usuario.especialidad || '',
      numero_colegiatura: usuario.numero_colegiatura || '',
      clinica_id: (usuario as any).clinica_id || '',
      clinica_nombre: (usuario as any).clinica_nombre || '',
      clinica_ruc: (usuario as any).clinica_ruc || '',
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      alert('✅ Usuario desactivado exitosamente');
      loadUsuarios();
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ ' + (error.response?.data?.error || 'Error al desactivar usuario'));
    }
  };

  const handleClinicaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/clinicas`, clinicaFormData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      alert('✅ Clínica actualizada exitosamente');
      setShowClinicaModal(false);
      loadClinica();
      // Recargar para actualizar el header
      window.location.reload();
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ ' + (error.response?.data?.error || 'Error al actualizar clínica'));
    }
  };

  const resetForm = () => {
    setFormData({
      clinica_id: '',
      clinica_nombre: '',
      clinica_ruc: '',
      email: '',
      password: '',
      nombres: '',
      apellidos: '',
      dni: '',
      telefono: '',
      rol: 'recepcionista',
      especialidad: '',
      numero_colegiatura: ''
    });
    setModoClinica('nueva');
  };

  const openNewModal = () => {
    resetForm();
    setEditMode(false);
    setSelectedUsuario(null);
    setShowModal(true);
  };

  if (user?.rol !== 'admin' && user?.rol !== 'medico') {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">⚠️ No tienes permisos para acceder a esta sección</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-600 mt-1">Gestiona los usuarios del sistema</p>
          </div>
          <button
            onClick={openNewModal}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium flex items-center"
          >
            <span className="mr-2">+</span>
            Nuevo Usuario
          </button>
        </div>
        {/* Información de la Clínica */}
        {clinica && (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl shadow-md p-6 mb-6 border border-primary-100">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-500 text-white rounded-full p-3 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{clinica.nombre}</h2>
                    <p className="text-sm text-gray-600">RUC: {clinica.ruc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {clinica.direccion && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Dirección</p>
                        <p className="text-sm text-gray-700">{clinica.direccion}</p>
                      </div>
                    </div>
                  )}
                  {clinica.telefono && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                        <p className="text-sm text-gray-700">{clinica.telefono}</p>
                      </div>
                    </div>
                  )}
                  {clinica.email && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm text-gray-700">{clinica.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowClinicaModal(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-primary-600 rounded-lg font-medium border border-primary-200 flex items-center shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Clínica
              </button>
            </div>
          </div>
        )}
        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Especialidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clínica
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
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                            {usuario.nombres[0]}{usuario.apellidos[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.nombres} {usuario.apellidos}
                            </div>
                            <div className="text-sm text-gray-500">{usuario.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {usuario.dni}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.especialidad || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {usuario.clinica_nombre || 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          usuario.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="text-primary-600 hover:text-primary-900 font-medium text-sm"
                        >
                          Editar
                        </button>
                        {usuario.id !== user.id && usuario.activo && (
                          <button
                            onClick={() => handleDelete(usuario.id)}
                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                          >
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editMode ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Asignación de Clínica - Solo para Admin al crear usuario */}
                  {!editMode && user?.rol === 'admin' && (
                    <>
                      <div className="col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                          Asignación de Clínica
                        </h3>
                      </div>

                      <div className="col-span-2">
                        <div className="flex space-x-4 mb-3">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={modoClinica === 'nueva'}
                              onChange={() => setModoClinica('nueva')}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium">Crear nueva clínica</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={modoClinica === 'existente'}
                              onChange={() => setModoClinica('existente')}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium">Clínica existente</span>
                          </label>
                        </div>

                        {modoClinica === 'nueva' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de Clínica/Consultorio *
                              </label>
                              <input
                                type="text"
                                required={modoClinica === 'nueva'}
                                value={formData.clinica_nombre}
                                onChange={(e) => setFormData({...formData, clinica_nombre: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="Ej: Clínica San Rafael"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                RUC *
                              </label>
                              <input
                                type="text"
                                required={modoClinica === 'nueva'}
                                maxLength={11}
                                value={formData.clinica_ruc}
                                onChange={(e) => setFormData({...formData, clinica_ruc: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="20123456789"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Seleccionar Clínica *
                            </label>
                            <select
                              required={modoClinica === 'existente'}
                              value={formData.clinica_id}
                              onChange={(e) => setFormData({...formData, clinica_id: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">Seleccionar...</option>
                              {clinicas.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre} - RUC: {c.ruc}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Info para médico */}
                  {!editMode && user?.rol === 'medico' && (
                    <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>📍 Clínica asignada:</strong> El usuario será creado en tu clínica: <strong>{user.clinica_nombre}</strong>
                      </p>
                    </div>
                  )}

                  {/* Información Personal */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                      Información Personal
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombres}
                      onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={formData.dni}
                      onChange={(e) => setFormData({...formData, dni: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Información de Acceso */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                      Información de Acceso
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña {editMode && '(dejar vacío para mantener actual)'}
                    </label>
                    <input
                      type="password"
                      required={!editMode}
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder={editMode ? 'Dejar vacío para no cambiar' : ''}
                    />
                  </div>

                  {/* Información Profesional */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                      Información Profesional
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol *
                    </label>
                    <select
                      required
                      value={formData.rol}
                      onChange={(e) => setFormData({...formData, rol: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="admin">Administrador</option>
                      <option value="medico">Médico</option>
                      <option value="enfermero">Enfermero</option>
                      <option value="recepcionista">Recepcionista</option>
                      <option value="farmaceutico">Farmacéutico</option>
                      <option value="administrativo">Administrativo</option>
                    </select>
                  </div>

                  {formData.rol === 'medico' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Especialidad
                        </label>
                        <input
                          type="text"
                          value={formData.especialidad}
                          onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="ej: Medicina General, Pediatría, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          N° Colegiatura
                        </label>
                        <input
                          type="text"
                          value={formData.numero_colegiatura}
                          onChange={(e) => setFormData({...formData, numero_colegiatura: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditMode(false);
                      setSelectedUsuario(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                  >
                    {editMode ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Clínica */}
      {showClinicaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Editar Información de la Clínica
              </h2>
              
              <form onSubmit={handleClinicaSubmit}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Clínica/Consultorio *
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicaFormData.nombre}
                      onChange={(e) => setClinicaFormData({...clinicaFormData, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Clínica San Rafael"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RUC *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={clinicaFormData.ruc}
                        onChange={(e) => setClinicaFormData({...clinicaFormData, ruc: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="20123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={clinicaFormData.telefono}
                        onChange={(e) => setClinicaFormData({...clinicaFormData, telefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="(01) 234-5678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={clinicaFormData.email}
                      onChange={(e) => setClinicaFormData({...clinicaFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="contacto@clinica.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <textarea
                      value={clinicaFormData.direccion}
                      onChange={(e) => setClinicaFormData({...clinicaFormData, direccion: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Av. Principal 123, Lima"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Nota:</strong> Esta información aparecerá en el encabezado del sistema y en los documentos generados.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowClinicaModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                  >
                    Guardar Cambios
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
