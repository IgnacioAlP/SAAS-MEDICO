import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Debug: Ver la URL que se está usando
if (typeof window !== 'undefined') {
  console.log('🔍 API URL configurada:', API_URL);
}

interface User {
  id: number;
  clinica_id: number;
  clinica_nombre?: string;
  clinica_ruc?: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
  especialidad?: string;
  foto_url?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      login: async (email: string, password: string) => {
        try {
          console.log('🚀 Intentando login a:', `${API_URL}/api/auth/login`);
          
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password,
          });

          console.log('✅ Login exitoso:', response.data);

          const { user, accessToken, refreshToken } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
        } catch (error: any) {
          console.error('❌ Error en login:', error);
          console.error('URL intentada:', `${API_URL}/api/auth/login`);
          console.error('Response:', error.response);
          
          const message = error.response?.data?.error || 'Error al iniciar sesión';
          throw new Error(message);
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
