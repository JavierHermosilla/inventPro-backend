import { create } from 'zustand';
import axios from 'axios';

// Configura la instancia de Axios con la URL base de tu backend
const api = axios.create({
  baseURL: 'http://localhost:3000', // Asegúrate de que esta URL sea correcta para tu backend
  withCredentials: true, // Esto es crucial para enviar cookies de sesión
});

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  
  login: async (email, password) => {
    // Simular una llamada a la API exitosa con credenciales de prueba
    if (email === "test@test.com" && password === "123456") {
      set({ 
        user: { id: "1", email: "test@test.com" },
        loading: false,
      });
      // La promesa se resuelve exitosamente
      return Promise.resolve();
    } else {
      // Simular un error de la API si las credenciales son incorrectas
      set({ user: null });
      return Promise.reject(new Error("Credenciales inválidas"));
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null });
    } catch (error) {
      throw error;
    }
  },
  
  fetchMe: async () => {
    set({ loading: true });
    try {
      // Intenta obtener los datos del usuario de la API
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      // Si falla, el usuario no está autenticado
      set({ user: null });
    } finally {
      // Esta línea garantiza que el estado de carga siempre se desactive
      set({ loading: false });
    }
  },
}));