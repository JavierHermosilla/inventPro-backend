// src/components/ProtectedRoute.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    // Si no hay un usuario autenticado, redirigir al login
    return <Navigate to="/login" replace />;
  }

  // Si el usuario está autenticado, renderizar la ruta hija (el dashboard)
  return children;
};

export default ProtectedRoute;