// src/routes/Protected.tsx
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

type Props = {
  children: React.ReactElement;
  allowedRoles?: string[]; // e.g. ['admin','bodeguero']
};

export default function Protected({ children, allowedRoles }: Props) {
  const { user, loading, fetchMe } = useAuthStore((s) => ({
    user: s.user,
    loading: s.loading,
    fetchMe: s.fetchMe,
  }));

  useEffect(() => {
    // intenta recuperar sesión en mount si no hay user
    if (user === null) {
      fetchMe().catch(() => {
        /* no-op */
      });
    }
  }, []);

  if (loading) return <div className="p-6">Cargando sesión...</div>;
  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-6">No autorizado — tu rol: {user.role}</div>;
  }

  return children;
}
