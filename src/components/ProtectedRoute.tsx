import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("🛡️ ProtectedRoute:", {
      loading,
      hasUser: !!user,
      email: user?.email,
      userId: user?.id,
    });
  }, [loading, user]);

  // Mientras está cargando, mostrar pantalla de carga
  if (loading) {
    console.log("⏳ ProtectedRoute: Cargando...");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 font-brutal text-4xl text-primary animate-pulse">
            247.
          </div>
          <p className="font-mono text-sm uppercase tracking-widest text-primary">
            CARGANDO...
          </p>
        </div>
      </div>
    );
  }

  // Si terminó de cargar y NO hay usuario, redirigir a login
  if (!loading && !user) {
    console.log(
      "🚫 ProtectedRoute: No hay user (loading=false), redirigiendo a /login"
    );
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, renderizar children
  console.log("✅ ProtectedRoute: Usuario autenticado, renderizando children");
  return <>{children}</>;
};
