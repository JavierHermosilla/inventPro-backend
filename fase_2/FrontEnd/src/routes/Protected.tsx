import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

type Props = {
  children: ReactElement;
  allowedRoles?: string[];
};

export default function Protected({ children, allowedRoles }: Props) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated || loading) {
    return <div className="p-6">Cargando sesion...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-6">No autorizado - tu rol: {user.role}</div>;
  }

  return children;
}
