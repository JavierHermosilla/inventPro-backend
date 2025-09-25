  import { useEffect } from 'react';
  import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
  import LoginPage from './pages/Login';
  import RegisterPage from './pages/Register';
  import ForgotPasswordPage from './pages/ForgotPassword';
  import DashboardPage from './pages/Dashboard';
  import ProtectedRoute from './components/ProtectedRoute';
  import { useAuthStore } from './store/auth';
  import Layout from './components/Layout';

  const App = () => {
    const fetchMe = useAuthStore((state) => state.fetchMe);
    const loading = useAuthStore((state) => state.loading);

    useEffect(() => {
      // Al cargar la aplicación, verifica si el usuario ya está autenticado
      fetchMe();
    }, [fetchMe]);

    if (loading) {
      // Si aún está verificando el estado de autenticación, muestra un mensaje de carga
      return <div>Cargando...</div>;
    }
    return (
      <BrowserRouter>
        <Routes>
          {/* Ruta para la página de login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Ruta protegida para el dashboard. 
            Solo se renderizará si el usuario está autenticado.
          */}
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

          {/* Ruta por defecto para redirigir.
            Cualquier otra ruta no definida (como la raíz '/') redirigirá al dashboard.
          */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    );
  };

  export default App;