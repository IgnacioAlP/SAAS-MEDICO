import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  id: number;
  clinica_id: number;
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password,
          });

          const { user, accessToken, refreshToken } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
        } catch (error: any) {
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
    }
  )
);
