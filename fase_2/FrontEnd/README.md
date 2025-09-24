
# 📌 Guía de Configuración y Solución de Problemas

Este documento resume los pasos clave para configurar el proyecto **frontend** con **React**, **Vite** y **TypeScript**, además de soluciones a problemas comunes con **enrutamiento**, **estado** y **Tailwind CSS**.

---

## 1️⃣ Configuración de Archivos Esenciales

### `src/main.tsx`

El archivo `main.tsx` es el punto de entrada. Debe **solo renderizar `<App />`** e importar el CSS global.

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // ✅ Asegúrate que la ruta sea correcta

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

---

### `src/App.tsx`

Este archivo maneja el **enrutamiento principal**. Contiene **un único `<BrowserRouter>`** y rutas protegidas.

```typescript
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

  if (loading) return <div>Cargando...</div>;

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
```

---

## 2️⃣ Gestión del Estado de Autenticación (Zustand)

Archivo: `src/store/auth.ts`. Permite **pruebas sin backend**:

```typescript
import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

interface User { id: string; email: string; }
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
    if (email === "test@test.com" && password === "123456") {
      set({ user: { id: "1", email }, loading: false });
      return Promise.resolve();
    } else {
      set({ user: null });
      return Promise.reject(new Error("❌ Credenciales inválidas"));
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
```

---

## 3️⃣ Configuración y Solución de Problemas con Tailwind CSS

Muchos problemas visuales provienen de **configuración incorrecta o corrupta**. La forma más confiable es crear manualmente los archivos de configuración.

### Paso 3.1: Archivos de Configuración

#### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
```

#### `postcss.config.js`

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

---

### Paso 3.2: Verificar Directivas CSS

Archivo: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Paso 3.3: Reinstalar Dependencias

Eliminar caché y módulos corruptos:

```bash
# PowerShell (Windows)
Remove-Item -Recurse -Force node_modules, package-lock.json

# macOS/Linux
# rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

---

## 4️⃣ Checklist de Problemas Comunes

| Problema | Solución |
|-----------|----------|
| ⚠️ Router duplicado | Solo debe haber un `<BrowserRouter>` en la app |
| ❌ CSS no carga | Confirma que `index.css` esté en `src` y se importe en `main.tsx` |
| 🎨 Estilos no se aplican | Revisa `tailwind.config.js` y `postcss.config.js` en la raíz |
| 🛠 Problemas con `npx` | Crear manualmente los archivos de configuración como se indicó |

---

**💡 Tip:** Mantén siempre **un solo punto de entrada** (`main.tsx`) y un **único `<BrowserRouter>`**. Esto evita errores de enrutamiento y conflictos de estado.
