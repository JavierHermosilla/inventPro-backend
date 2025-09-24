Guía de Configuración y Solución de Problemas
Este documento resume los pasos clave para configurar el proyecto de frontend con React, Vite y TypeScript. Cubre las soluciones a problemas comunes relacionados con el enrutamiento, la gestión del estado y la configuración de Tailwind CSS.

1. Configuración de Archivos Esenciales
src/main.tsx
El archivo main.tsx es el punto de entrada de la aplicación. Es crucial que solo renderice el componente principal (<App />) y que importe el CSS global.

TypeScript

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Asegúrate de que la ruta sea correcta

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
src/App.tsx
Este archivo maneja la lógica de enrutamiento principal. Contiene el <BrowserRouter> (y debe ser el único en toda la aplicación) y las rutas protegidas.

TypeScript

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuthStore } from './store/auth';

const App = () => {
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
2. Gestión del Estado de Autenticación (zustand)
El estado de autenticación se gestiona en el archivo src/store/auth.ts. Aquí está el código con la lógica para pruebas sin backend.

src/store/auth.ts
TypeScript

import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
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
    // Lógica para prueba en frontend (sin backend)
    if (email === "test@test.com" && password === "123456") {
      set({ 
        user: { id: "1", email: "test@test.com" },
        loading: false,
      });
      return Promise.resolve();
    } else {
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
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));
3. Configuración y Solución de Problemas con Tailwind CSS
Muchos de los problemas visuales se debían a una configuración incorrecta o corrupta de Tailwind. La solución más confiable es crear los archivos de configuración manualmente.

Paso 3.1: Crear los Archivos de Configuración
En la raíz de tu proyecto, crea los siguientes dos archivos y pega el código:

tailwind.config.js
JavaScript

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
postcss.config.js
JavaScript

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
Paso 3.2: Verificar las Directivas CSS
Asegúrate de que tu archivo src/index.css tenga las directivas de Tailwind en la parte superior.

CSS

@tailwind base;
@tailwind components;
@tailwind utilities;
Paso 3.3: Reinstalar Dependencias (Limpieza Profunda)
Para eliminar cualquier problema de caché o instalación corrupta, usa este comando para hacer una instalación limpia.

Bash

# Para PowerShell en Windows
Remove-Item -Recurse -Force node_modules, package-lock.json

# Para macOS/Linux
# rm -rf node_modules package-lock.json

# Después, instala de nuevo
npm install
4. Checklist para Solución de Problemas
Error de Router duplicado: Asegúrate de que solo hay un <BrowserRouter> en toda la aplicación.

CSS no carga: Confirma que index.css está en la carpeta src y que la importación en main.tsx es correcta.

Estilos no se aplican: Revisa que tailwind.config.js y postcss.config.js estén en la raíz y contengan el código exacto.

Problemas de npx: Si los comandos de npx fallan, la solución es crear los archivos de configuración manualmente.