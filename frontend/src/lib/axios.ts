import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es un retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const { state } = JSON.parse(authStorage);
            if (state.refreshToken) {
              const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
                refreshToken: state.refreshToken,
              });

              const { accessToken } = response.data.data;

              // Actualizar el token en el storage
              const updatedState = {
                ...state,
                accessToken,
              };
              localStorage.setItem('auth-storage', JSON.stringify({ state: updatedState }));

              // Reintentar la petición original
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return apiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        // Si falla el refresh, cerrar sesión
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
