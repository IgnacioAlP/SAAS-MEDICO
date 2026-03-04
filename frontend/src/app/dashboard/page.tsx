'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Stats {
  pacientes: number;
  citas_hoy: number;
  consultas_mes: number;
  pagos_pendientes: string;
  pagos_mes: string;
}

interface Actividad {
  tipo: 'cita' | 'consulta' | 'pago' | 'paciente';
  descripcion: string;
  detalle: string;
  fecha: Date;
  icono: string;
  color: string;
}

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    pacientes: 0,
    citas_hoy: 0,
    consultas_mes: 0,
    pagos_pendientes: 'S/ 0',
    pagos_mes: 'S/ 0'
  });
  const [actividad, setActividad] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) loadStats();
  }, [accessToken]);

  const loadStats = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${accessToken}` };
    try {
      const [pacientesRes, citasRes, consultasRes, pagosRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/pacientes`, { headers }),
        axios.get(`${API_URL}/api/citas`, { headers }),
        axios.get(`${API_URL}/api/consultas`, { headers }),
        axios.get(`${API_URL}/api/pagos`, { headers })
      ]);

      const pacientes = pacientesRes.status === 'fulfilled' ? (pacientesRes.value.data.data || []) : [];
      const citas = citasRes.status === 'fulfilled' ? (citasRes.value.data.data || []) : [];
      const consultas = consultasRes.status === 'fulfilled' ? (consultasRes.value.data.data || []) : [];
      const pagos = pagosRes.status === 'fulfilled' ? (pagosRes.value.data.data || []) : [];

      const today = new Date().toDateString();
      const citasHoy = citas.filter((c: any) =>
        new Date(c.fecha_hora).toDateString() === today
      ).length;

      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const consultasMes = consultas.filter((c: any) => {
        const fecha = new Date(c.fecha_hora || c.fecha);
        return fecha.getMonth() === thisMonth && fecha.getFullYear() === thisYear;
      }).length;

      const pagosMes = pagos.filter((p: any) => {
        const fecha = new Date(p.fecha_pago);
        return fecha.getMonth() === thisMonth && fecha.getFullYear() === thisYear;
      });
      const totalPagosMes = pagosMes.reduce((sum: number, p: any) =>
        sum + parseFloat(p.monto || '0'), 0
      );

      setStats({
        pacientes: pacientes.length,
        citas_hoy: citasHoy,
        consultas_mes: consultasMes,
        pagos_pendientes: 'S/ 0',
        pagos_mes: `S/ ${totalPagosMes.toFixed(2)}`
      });

      // Construir feed de actividad reciente
      const items: Actividad[] = [];

      citas.slice(0, 20).forEach((c: any) => {
        const fechaStr = c.fecha_hora || c.fecha;
        if (!fechaStr) return;
        const estadoLabel: Record<string, string> = { pendiente: 'pendiente', confirmada: 'confirmada', cancelada: 'cancelada', completada: 'completada' };
        items.push({
          tipo: 'cita',
          descripcion: `Cita ${estadoLabel[c.estado] || c.estado || ''}`,
          detalle: `${c.paciente_nombres || ''} ${c.paciente_apellidos || ''} — ${new Date(fechaStr).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
          fecha: new Date(fechaStr),
          icono: '📅',
          color: 'bg-green-100 text-green-700',
        });
      });

      consultas.slice(0, 20).forEach((c: any) => {
        const fechaStr = c.fecha_hora || c.fecha;
        if (!fechaStr) return;
        items.push({
          tipo: 'consulta',
          descripcion: 'Consulta médica',
          detalle: `${c.paciente_nombres || ''} ${c.paciente_apellidos || ''} — ${new Date(fechaStr).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
          fecha: new Date(fechaStr),
          icono: '🏥',
          color: 'bg-purple-100 text-purple-700',
        });
      });

      pagos.slice(0, 20).forEach((p: any) => {
        const fechaStr = p.fecha_pago || p.created_at;
        if (!fechaStr) return;
        items.push({
          tipo: 'pago',
          descripcion: `Pago registrado — S/ ${parseFloat(p.monto || '0').toFixed(2)}`,
          detalle: `${p.paciente_nombres || ''} ${p.paciente_apellidos || ''} — ${new Date(fechaStr).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
          fecha: new Date(fechaStr),
          icono: '💳',
          color: 'bg-orange-100 text-orange-700',
        });
      });

      pacientes.slice(0, 10).forEach((p: any) => {
        const fechaStr = p.created_at;
        if (!fechaStr) return;
        items.push({
          tipo: 'paciente',
          descripcion: 'Nuevo paciente registrado',
          detalle: `${p.nombres || ''} ${p.apellidos || ''} — ${new Date(fechaStr).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
          fecha: new Date(fechaStr),
          icono: '👤',
          color: 'bg-blue-100 text-blue-700',
        });
      });

      items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      setActividad(items.slice(0, 10));
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido de vuelta, {user?.nombres}! 👋
          </h2>
          <p className="text-gray-600">
            Estás conectado como <span className="font-semibold capitalize">{user?.rol}</span> en la clínica
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <div className="col-span-4 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
          ) : (
            <>
              <Link href="/dashboard/pacientes">
                <StatCard
                  title="Pacientes Activos"
                  value={stats.pacientes.toString()}
                  icon="👥"
                  color="from-blue-500 to-blue-600"
                />
              </Link>
              <Link href="/dashboard/citas">
                <StatCard
                  title="Citas Hoy"
                  value={stats.citas_hoy.toString()}
                  icon="📅"
                  color="from-green-500 to-green-600"
                />
              </Link>
              <Link href="/dashboard/consultas">
                <StatCard
                  title="Consultas Mes"
                  value={stats.consultas_mes.toString()}
                  icon="🏥"
                  color="from-purple-500 to-purple-600"
                />
              </Link>
              <Link href="/dashboard/pagos">
                <StatCard
                  title="Ingresos del Mes"
                  value={stats.pagos_mes}
                  icon="💰"
                  color="from-orange-500 to-orange-600"
                />
              </Link>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton icon="📅" label="Citas" href="/dashboard/citas" />
            <QuickActionButton icon="🏥" label="Consultas" href="/dashboard/consultas" />
            <QuickActionButton icon="👤" label="Pacientes" href="/dashboard/pacientes" />
            <QuickActionButton icon="💊" label="Recetas" href="/dashboard/recetas" />
            <QuickActionButton icon="🧪" label="Laboratorio" href="/dashboard/laboratorio" />
            <QuickActionButton icon="💳" label="Pagos" href="/dashboard/pagos" />
            <QuickActionButton icon="📊" label="Reportes" href="/dashboard/reportes" />
            <QuickActionButton icon="⚙️" label="Configuración" href="/dashboard/configuracion" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : actividad.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📋</p>
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {actividad.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 py-3">
                  <span className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-lg ${item.color}`}>
                    {item.icono}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.descripcion}</p>
                    <p className="text-xs text-gray-500 truncate">{item.detalle}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {item.fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className={`bg-gradient-to-r ${color} p-4`}>
        <div className="text-4xl">{icon}</div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: string;
  label: string;
  href: string;
}

function QuickActionButton({ icon, label, href }: QuickActionButtonProps) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-lg transition-all duration-200 hover:shadow-md group">
      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 text-center">
        {label}
      </span>
    </Link>
  );
}
