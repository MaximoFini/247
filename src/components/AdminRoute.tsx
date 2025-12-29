import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, dbUser, loading } = useAuth();

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="font-mono text-primary">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir a home si no es admin
  if (!dbUser?.is_admin) {
    return <Navigate to="/" replace />;
  }

  // Si es admin, mostrar el contenido
  return <>{children}</>;
};
