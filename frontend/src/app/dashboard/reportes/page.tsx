'use client';

import DashboardLayout from '@/components/Layout/DashboardLayout';

export default function ReportesPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Reportes</h1>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg mb-4">Módulo de Reportes en Desarrollo</p>
          <p className="text-sm text-gray-500">
            Próximamente: Reportes estadísticos, gráficas de ingresos, reportes de atenciones, exportación a Excel/PDF.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
