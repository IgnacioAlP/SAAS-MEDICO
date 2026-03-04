'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  numero_historia: string;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  genero?: string;
  total_citas?: number;
  total_consultas?: number;
}

export default function PacientesPage() {
  const { accessToken, user } = useAuthStore();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMisPacientes, setFilterMisPacientes] = useState(false);
  const [misPacientesIds, setMisPacientesIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    tipo_documento: 'DNI',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    grupo_sanguineo: ''
  });

  useEffect(() => {
    loadPacientes();
    if (user?.rol === 'medico') {
      loadMisPacientes();
    }
  }, []);

  const loadPacientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pacientes`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPacientes(response.data.data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMisPacientes = async () => {
    try {
      // Cargar mis citas para identificar mis pacientes
      const response = await axios.get(`${API_URL}/api/citas`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const misCitas = response.data.data.filter((c: any) => c.medico_id === user?.id);
      const pacientesUnicosIds = Array.from(new Set(misCitas.map((c: any) => c.paciente_id))) as number[];
      setMisPacientesIds(pacientesUnicosIds);
      console.log('👨‍⚕️ Mis pacientes:', pacientesUnicosIds.length);
    } catch (error: any) {
      console.error('Error al cargar mis pacientes:', error.response?.data?.error || error.message);
      // Si no hay citas o hay un error, simplemente no filtramos
      setMisPacientesIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Enviando datos:', formData);
      console.log('Token:', accessToken);
      
      const response = await axios.post(`${API_URL}/api/pacientes`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      console.log('Respuesta:', response.data);
      alert('✅ Paciente creado exitosamente');
      setShowModal(false);
      loadPacientes();
      
      // Reset form
      setFormData({
        tipo_documento: 'DNI',
        numero_documento: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        genero: '',
        telefono: '',
        email: '',
        direccion: '',
        grupo_sanguineo: ''
      });
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || error.message || 'Error al crear paciente';
      alert('❌ ' + errorMsg);
    }
  };

  const loadPacienteDetalle = async (id: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/pacientes/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSelectedPaciente(response.data.data);
      setShowDetalleModal(true);
      setEditMode(false);
    } catch (error: any) {
      console.error('Error al cargar detalles:', error);
      alert('❌ Error al cargar detalles del paciente');
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      nombres: selectedPaciente.nombres || '',
      apellidos: selectedPaciente.apellidos || '',
      dni: selectedPaciente.dni || '',
      fecha_nacimiento: selectedPaciente.fecha_nacimiento ? selectedPaciente.fecha_nacimiento.split('T')[0] : '',
      genero: selectedPaciente.genero || '',
      telefono: selectedPaciente.telefono || '',
      email: selectedPaciente.email || '',
      direccion: selectedPaciente.direccion || '',
      distrito: selectedPaciente.distrito || '',
      provincia: selectedPaciente.provincia || '',
      departamento: selectedPaciente.departamento || '',
      grupo_sanguineo: selectedPaciente.grupo_sanguineo || ''
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `${API_URL}/api/pacientes/${selectedPaciente.id}`,
        editFormData,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      alert('✅ Paciente actualizado exitosamente');
      setEditMode(false);
      loadPacienteDetalle(selectedPaciente.id);
      loadPacientes();
    } catch (error: any) {
      console.error('Error al actualizar:', error);
      alert('❌ ' + (error.response?.data?.error || 'Error al actualizar paciente'));
    }
  };

  const filteredPacientes = pacientes
    .filter(p => {
      // Filtro de búsqueda
      const matchesSearch = p.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm) ||
        p.numero_historia.includes(searchTerm);
      
      // Filtro de "Mis Pacientes" (solo para médicos)
      const matchesMisPacientes = !filterMisPacientes || misPacientesIds.includes(p.id);
      
      return matchesSearch && matchesMisPacientes;
    });

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
            <p className="text-gray-600 mt-1">Gestiona los pacientes de la clínica</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            ➕ Nuevo Paciente
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          {/* Filtro Mis Pacientes (solo para médicos) */}
          {user?.rol === 'medico' && misPacientesIds.length > 0 && (
            <div className="mt-3 flex items-center space-x-4">
              <button
                onClick={() => setFilterMisPacientes(!filterMisPacientes)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterMisPacientes 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⭐ {filterMisPacientes ? 'Mostrando' : 'Ver'} Mis Pacientes ({misPacientesIds.length})
              </button>
              <span className="text-sm text-gray-500">
                {filteredPacientes.length} de {pacientes.length} pacientes
              </span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
          ) : filteredPacientes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No se encontraron pacientes</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Citas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold">
                          {paciente.nombres[0]}{paciente.apellidos[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {user?.rol === 'medico' && misPacientesIds.includes(paciente.id) && (
                              <span className="mr-1" title="Tu paciente">⭐</span>
                            )}
                            {paciente.nombres} {paciente.apellidos}
                          </div>
                          {paciente.genero && (
                            <div className="text-sm text-gray-500 capitalize">{paciente.genero}</div>
                          )}
                          <div className="text-xs text-gray-400">{paciente.numero_historia}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">DNI: {paciente.dni}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{paciente.telefono || '-'}</div>
                      <div className="text-sm text-gray-500">{paciente.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {paciente.total_citas || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {paciente.total_consultas || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => loadPacienteDetalle(paciente.id)}
                        className="text-primary-600 hover:text-primary-900 font-medium text-sm"
                      >
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

      {/* Modal Nuevo Paciente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Paciente</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Doc.
                    </label>
                    <select
                      value={formData.tipo_documento}
                      onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Nacimiento
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Género
                    </label>
                    <select
                      value={formData.genero}
                      onChange={(e) => setFormData({...formData, genero: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo Sanguíneo
                  </label>
                  <select
                    value={formData.grupo_sanguineo}
                    onChange={(e) => setFormData({...formData, grupo_sanguineo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
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
                    Guardar Paciente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles del Paciente */}
      {showDetalleModal && selectedPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedPaciente.nombres[0]}{selectedPaciente.apellidos[0]}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedPaciente.nombres} {selectedPaciente.apellidos}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedPaciente.numero_historia}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetalleModal(false);
                    setEditMode(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Contenido condicional: Formulario de edición o vista de detalles */}
              {editMode ? (
                /* MODO EDICIÓN */
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ✏️ Editar Información del Paciente
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Nombres y Apellidos */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombres *
                        </label>
                        <input
                          type="text"
                          value={editFormData.nombres}
                          onChange={(e) => setEditFormData({...editFormData, nombres: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          value={editFormData.apellidos}
                          onChange={(e) => setEditFormData({...editFormData, apellidos: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                    </div>

                    {/* DNI y Fecha Nacimiento */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DNI
                        </label>
                        <input
                          type="text"
                          value={editFormData.dni}
                          onChange={(e) => setEditFormData({...editFormData, dni: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha Nacimiento
                        </label>
                        <input
                          type="date"
                          value={editFormData.fecha_nacimiento}
                          onChange={(e) => setEditFormData({...editFormData, fecha_nacimiento: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Género y Grupo Sanguíneo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Género
                        </label>
                        <select
                          value={editFormData.genero}
                          onChange={(e) => setEditFormData({...editFormData, genero: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccionar</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grupo Sanguíneo
                        </label>
                        <select
                          value={editFormData.grupo_sanguineo}
                          onChange={(e) => setEditFormData({...editFormData, grupo_sanguineo: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccionar</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>

                    {/* Teléfono y Email */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={editFormData.telefono}
                          onChange={(e) => setEditFormData({...editFormData, telefono: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Dirección */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={editFormData.direccion}
                        onChange={(e) => setEditFormData({...editFormData, direccion: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Distrito, Provincia, Departamento */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distrito
                        </label>
                        <input
                          type="text"
                          value={editFormData.distrito}
                          onChange={(e) => setEditFormData({...editFormData, distrito: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Provincia
                        </label>
                        <input
                          type="text"
                          value={editFormData.provincia}
                          onChange={(e) => setEditFormData({...editFormData, provincia: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departamento
                        </label>
                        <input
                          type="text"
                          value={editFormData.departamento}
                          onChange={(e) => setEditFormData({...editFormData, departamento: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Botones de Acción - Modo Edición */}
                    <div className="flex justify-end space-x-4 pt-4 border-t mt-6">
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                      >
                        💾 Guardar Cambios
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODO VISTA */
                <div>
              {/* Información Personal */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  👤 Información Personal
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-500">DNI</p>
                    <p className="font-medium">{selectedPaciente.dni || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Género</p>
                    <p className="font-medium capitalize">{selectedPaciente.genero || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha Nacimiento</p>
                    <p className="font-medium">
                      {selectedPaciente.fecha_nacimiento 
                        ? new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString('es-PE')
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grupo Sanguíneo</p>
                    <p className="font-medium">{selectedPaciente.grupo_sanguineo || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  📞 Contacto
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{selectedPaciente.telefono || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedPaciente.email || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="font-medium">{selectedPaciente.direccion || '-'}</p>
                  </div>
                  {selectedPaciente.distrito && (
                    <div>
                      <p className="text-sm text-gray-500">Distrito</p>
                      <p className="font-medium">{selectedPaciente.distrito}</p>
                    </div>
                  )}
                  {selectedPaciente.provincia && (
                    <div>
                      <p className="text-sm text-gray-500">Provincia</p>
                      <p className="font-medium">{selectedPaciente.provincia}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Seguro */}
              {selectedPaciente.seguro && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    🏥 Información de Seguro
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-sm text-gray-500">Seguro</p>
                      <p className="font-medium">{selectedPaciente.seguro}</p>
                    </div>
                    {selectedPaciente.numero_seguro && (
                      <div>
                        <p className="text-sm text-gray-500">Número de Póliza</p>
                        <p className="font-medium">{selectedPaciente.numero_seguro}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Alergias */}
              {selectedPaciente.alergias && selectedPaciente.alergias.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    ⚠️ Alergias
                  </h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    {selectedPaciente.alergias.map((alergia: any, index: number) => (
                      <div key={index} className="mb-2 last:mb-0">
                        {alergia.tipo && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-sm rounded mr-2">
                            {alergia.tipo}
                          </span>
                        )}
                        <span className="text-gray-700">{alergia.descripcion || alergia}</span>
                        {alergia.gravedad && (
                          <span className="ml-2 text-xs text-red-600 font-medium">
                            ({alergia.gravedad})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contactos de Emergencia */}
              {selectedPaciente.contactos_emergencia && selectedPaciente.contactos_emergencia.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    🚨 Contactos de Emergencia
                  </h3>
                  <div className="grid gap-4">
                    {selectedPaciente.contactos_emergencia.map((contacto: any, index: number) => (
                      <div key={index} className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{contacto.nombre}</p>
                            <p className="text-sm text-gray-600">{contacto.relacion}</p>
                          </div>
                          <p className="font-medium text-primary-600">{contacto.telefono}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tratamientos Actuales */}
              {selectedPaciente.tratamientos_actuales && selectedPaciente.tratamientos_actuales.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    💊 Tratamientos Actuales
                  </h3>
                  <div className="grid gap-4">
                    {selectedPaciente.tratamientos_actuales.map((tratamiento: any, index: number) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">
                          {tratamiento.medicamento || tratamiento.descripcion || tratamiento}
                        </p>
                        {tratamiento.dosis && (
                          <p className="text-sm text-gray-600">
                            Dosis: {tratamiento.dosis} {tratamiento.frecuencia && `- ${tratamiento.frecuencia}`}
                          </p>
                        )}
                        {tratamiento.fecha_inicio && (
                          <p className="text-xs text-gray-500 mt-1">
                            Desde: {new Date(tratamiento.fecha_inicio).toLocaleDateString('es-PE')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Condiciones Crónicas */}
              {selectedPaciente.condiciones_cronicas && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    🏥 Condiciones Crónicas
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedPaciente.condiciones_cronicas}</p>
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  📊 Estadísticas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedPaciente.total_citas || 0}
                    </p>
                    <p className="text-sm text-gray-600">Citas Registradas</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {selectedPaciente.total_consultas || 0}
                    </p>
                    <p className="text-sm text-gray-600">Consultas Realizadas</p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {selectedPaciente.observaciones && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    📝 Observaciones
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedPaciente.observaciones}</p>
                  </div>
                </div>
              )}

                {/* Botones de Acción - Modo Vista */}
                <div className="flex justify-end space-x-4 pt-4 border-t mt-6">
                  <button
                    onClick={() => {
                      setShowDetalleModal(false);
                      setEditMode(false);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={handleEditClick}
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                  >
                    ✏️ Editar Información
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
