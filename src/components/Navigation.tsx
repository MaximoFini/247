import { Link, useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, dbUser, signOut, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-primary bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="font-brutal text-2xl text-primary glitch-hover"
          >
            247
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/profesores"
              className="font-mono text-sm uppercase tracking-widest text-primary transition-all hover:text-primary/80"
            >
              PROFESORES
            </Link>
            <Link
              to="/subir"
              className="font-mono text-sm uppercase tracking-widest text-primary transition-all hover:text-primary/80"
            >
              SUBIR
            </Link>

            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="font-mono text-xs uppercase tracking-widest text-primary/50">
                  Cargando...
                </span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/perfil"
                  className="font-mono text-sm uppercase tracking-widest text-primary transition-all hover:text-primary/80"
                >
                  MI PERFIL
                </Link>
                <span className="font-mono text-xs uppercase tracking-widest text-primary">
                  {dbUser?.nombre || user.email?.split("@")[0] || "Usuario"}
                </span>

                {/* Botón Admin (solo si es admin) */}
                {dbUser?.is_admin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 border-2 border-primary bg-primary px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary glitch-hover"
                  >
                    <Shield className="h-3 w-3" />
                    ADMIN
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 border-2 border-primary bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground glitch-hover"
                >
                  <LogOut className="h-3 w-3" />
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="border-2 border-primary bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground glitch-hover"
              >
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
