'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ConfirmarCitaContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error   = searchParams.get('error');
  const id      = searchParams.get('id');

  const [estado, setEstado] = useState<'loading' | 'success' | 'error'>('loading');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (success === 'true') {
      setEstado('success');
      setMensaje('Su cita ha sido confirmada exitosamente. Le esperamos.');
    } else if (error) {
      setEstado('error');
      const errores: Record<string, string> = {
        token_invalido:      'El enlace de confirmación no es válido o ha expirado.',
        cita_no_encontrada:  'No se encontró la cita especificada.',
        cita_cancelada:      'Esta cita ha sido cancelada y no puede confirmarse.',
        error_interno:       'Ocurrió un error interno. Por favor contacte a la clínica.',
      };
      setMensaje(errores[error] || 'Error desconocido.');
    }
  }, [success, error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">

        {estado === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-6"></div>
            <h1 className="text-xl font-bold text-gray-700">Procesando confirmación…</h1>
          </>
        )}

        {estado === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-700 mb-3">¡Cita confirmada!</h1>
            {id && <p className="text-sm text-gray-400 mb-2">Cita #{id}</p>}
            <p className="text-gray-600 mb-6">{mensaje}</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
              Se le enviará un correo de confirmación con los detalles de su cita.
            </div>
            <p className="text-xs text-gray-400">Puede cerrar esta ventana.</p>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-700 mb-3">No se pudo confirmar</h1>
            <p className="text-gray-600 mb-6">{mensaje}</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800">
              Si necesita ayuda, comuníquese directamente con la clínica.
            </div>
            <p className="text-xs text-gray-400">Puede cerrar esta ventana.</p>
          </>
        )}

      </div>
    </div>
  );
}

export default function ConfirmarCitaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    }>
      <ConfirmarCitaContent />
    </Suspense>
  );
}
