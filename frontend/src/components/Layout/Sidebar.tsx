'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface MenuItem {
  icon: string;
  label: string;
  href: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard', href: '/dashboard', roles: ['admin', 'medico', 'enfermero', 'recepcionista', 'farmaceutico', 'administrativo'] },
  { icon: '👥', label: 'Pacientes', href: '/dashboard/pacientes', roles: ['admin', 'medico', 'enfermero', 'recepcionista'] },
  { icon: '📅', label: 'Citas', href: '/dashboard/citas', roles: ['admin', 'medico', 'enfermero', 'recepcionista'] },
  { icon: '🏥', label: 'Consultas', href: '/dashboard/consultas', roles: ['admin', 'medico', 'enfermero'] },
  { icon: '💊', label: 'Recetas', href: '/dashboard/recetas', roles: ['admin', 'medico', 'farmaceutico'] },
  { icon: '🧪', label: 'Laboratorio', href: '/dashboard/laboratorio', roles: ['admin', 'medico', 'enfermero'] },
  { icon: '🛏️', label: 'Internaciones', href: '/dashboard/internaciones', roles: ['admin', 'medico', 'enfermero'] },
  { icon: '💰', label: 'Pagos', href: '/dashboard/pagos', roles: ['admin', 'recepcionista', 'administrativo'] },
  { icon: '📊', label: 'Reportes', href: '/dashboard/reportes', roles: ['admin', 'administrativo'] },
  { icon: '👤', label: 'Usuarios', href: '/dashboard/usuarios', roles: ['admin', 'medico'] },
  { icon: '⚙️', label: 'Configuración', href: '/dashboard/configuracion', roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredMenuItems = menuItems.filter(item => 
    user?.rol && item.roles.includes(user.rol)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">NexusCreative</h1>
            <p className="text-xs text-gray-500">Sistema Médico</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.nombres?.[0]}{user?.apellidos?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.nombres} {user?.apellidos}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
