// src/components/ProtectedRoute.tsx
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const user     = useAuthStore((s) => s.user);
  const loading  = useAuthStore((s) => s.loading);
  const hydrated = useAuthStore((s) => s.hydrated);

  // ⏳ Aún no sabemos si hay sesión (primera hidratación en curso o pendiente)
  if (!hydrated || loading) {
    return <div className="p-6 text-gray-500">Verificando sesión...</div>;
  }

  // ❌ No autenticado luego de hidratar → al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 Restricción por rol (opcional)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-6 text-red-600">Acceso denegado para tu rol.</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
