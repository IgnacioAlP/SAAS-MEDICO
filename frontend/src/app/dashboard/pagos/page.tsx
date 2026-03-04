'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Pago {
  id: number;
  fecha_pago: string;
  paciente_nombres: string;
  paciente_apellidos: string;
  concepto: string;
  monto: number;
  metodo_pago: string;
  estado: string;
  numero_operacion?: string;
}

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
}

export default function PagosPage() {
  const { accessToken } = useAuthStore();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: '',
    concepto: '',
    monto: '',
    metodo_pago: 'efectivo',
    numero_operacion: '',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagosRes, pacientesRes] = await Promise.all([
        axios.get(`${API_URL}/api/pagos`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get(`${API_URL}/api/pacientes`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);
      
      setPagos(pagosRes.data.data);
      setPacientes(pacientesRes.data.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/pagos`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowModal(false);
      loadData();
      // Reset form
      setFormData({
        paciente_id: '',
        concepto: '',
        monto: '',
        metodo_pago: 'efectivo',
        numero_operacion: '',
        observaciones: ''
      });
      alert('✅ Pago registrado exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar pago');
    }
  };

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo.toLowerCase()) {
      case 'efectivo': return '💵';
      case 'tarjeta': return '💳';
      case 'yape': return '📱';
      case 'plin': return '📲';
      case 'transferencia': return '🏦';
      default: return '💰';
    }
  };

  const total = pagos.reduce((sum, p) => sum + parseFloat(String(p.monto)), 0);

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
            <p className="text-gray-600 mt-1">Gestión de pagos y cobros</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            ➕ Registrar Pago
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">Total del Mes</p>
            <p className="text-2xl font-bold text-gray-900">S/ {total.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">Pagos Hoy</p>
            <p className="text-2xl font-bold text-gray-900">{pagos.filter(p => 
              new Date(p.fecha_pago).toDateString() === new Date().toDateString()
            ).length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">Efectivo</p>
            <p className="text-2xl font-bold text-gray-900">
              S/ {pagos.filter(p => p.metodo_pago === 'efectivo').reduce((sum, p) => sum + parseFloat(String(p.monto)), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">Digital (Yape/Plin)</p>
            <p className="text-2xl font-bold text-gray-900">
              S/ {pagos.filter(p => ['yape', 'plin'].includes(p.metodo_pago.toLowerCase())).reduce((sum, p) => sum + parseFloat(String(p.monto)), 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
          ) : pagos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No hay pagos registrados</p>
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
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Método
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    N° Operación
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(pago.fecha_pago).toLocaleDateString('es-PE')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pago.fecha_pago).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pago.paciente_nombres} {pago.paciente_apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{pago.concepto}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{getMetodoPagoIcon(pago.metodo_pago)}</span>
                        <span className="text-sm text-gray-900 capitalize">{pago.metodo_pago}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        S/ {parseFloat(String(pago.monto)).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{pago.numero_operacion || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button className="text-primary-600 hover:text-primary-900 font-medium text-sm">
                        🖨️ Recibo
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrar Pago</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paciente *
                  </label>
                  <select
                    required
                    value={formData.paciente_id}
                    onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Concepto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Consulta general, Examen laboratorio..."
                    value={formData.concepto}
                    onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto (S/) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.monto}
                      onChange={(e) => setFormData({...formData, monto: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago *
                    </label>
                    <select
                      required
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="yape">📱 Yape</option>
                      <option value="plin">📲 Plin</option>
                      <option value="transferencia">🏦 Transferencia</option>
                      <option value="otro">💰 Otro</option>
                    </select>
                  </div>
                </div>

                {['yape', 'plin', 'transferencia'].includes(formData.metodo_pago) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Operación
                    </label>
                    <input
                      type="text"
                      value={formData.numero_operacion}
                      onChange={(e) => setFormData({...formData, numero_operacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows={2}
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
                    💰 Registrar Pago
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
