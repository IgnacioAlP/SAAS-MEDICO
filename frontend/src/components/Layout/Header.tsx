'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Bienvenido, {user?.nombres} 👋
          </h2>
          <div className="flex items-center space-x-4 text-sm mt-1">
            <p className="text-gray-500">
              {new Date().toLocaleDateString('es-PE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {user?.clinica_nombre && (
              <>
                <span className="text-gray-300">•</span>
                <p className="text-primary-600 font-medium">
                  🏥 {user.clinica_nombre}
                </p>
              </>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
