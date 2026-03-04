'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('¡Bienvenido!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Logo y Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A1628] via-[#0D2040] to-[#050d1a] relative overflow-hidden">
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,201,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,201,255,0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo animado */}
          <div className="icon-wrap relative w-32 h-32 mb-8">
            {/* Anillo exterior giratorio */}
            <div className="absolute inset-[-8px] border border-cyan-500/20 rounded-full animate-spin-slow" />
            
            {/* Anillo principal */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-br from-cyan-400 to-blue-600 animate-spin-slower">
              <div className="absolute inset-[2px] rounded-full bg-[#0A1628]" />
            </div>
            
            {/* Icono interno */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/10 flex items-center justify-center">
              <div className="relative w-10 h-10">
                {/* Cruz médica */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-10 bg-white rounded-md shadow-lg shadow-white/50" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-2.5 bg-white rounded-md shadow-lg shadow-white/50" />
              </div>
            </div>

            {/* Línea ECG */}
            <div className="absolute -bottom-6 left-0 right-0 h-8 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 200 40">
                <polyline
                  points="0,20 30,20 40,10 50,30 60,15 70,20 200,20"
                  fill="none"
                  stroke="url(#ecg-grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00C9FF" stopOpacity="0" />
                    <stop offset="50%" stopColor="#00C9FF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#00C9FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Nombre de la marca */}
          <div className="text-center mt-8">
            <h1 className="text-6xl font-serif font-bold mb-2">
              <span className="text-white">Nexus</span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                Creative
              </span>
            </h1>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent my-4" />
            <p className="text-cyan-400/70 text-xs tracking-[0.3em] uppercase font-mono">
              Clinical Records · SaaS Platform
            </p>
          </div>

          {/* Características */}
          <div className="mt-16 space-y-4">
            {[
              'Historia Clínica Electrónica',
              'Gestión de Citas y Agenda',
              'Recetas y Prescripciones',
              'Telemedicina Integrada',
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 text-cyan-100/80">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de Login */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo móvil */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold">
              <span className="text-gray-900">Nexus</span>
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Creative
              </span>
            </h2>
          </div>

          {/* Título */}
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:z-10 sm:text-sm"
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:z-10 sm:text-sm pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>

            {/* Credenciales de prueba */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">
                🔐 Credenciales de prueba:
              </p>
              <div className="space-y-1 text-xs text-blue-800">
                <p><strong>Admin:</strong> admin@nexuscreative.com / 12345678</p>
                <p><strong>Médico:</strong> doctor@nexuscreative.com / 12345678</p>
                <p><strong>Recepción:</strong> recepcion@nexuscreative.com / 12345678</p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-slower {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
