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
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link
            to="/"
            className="font-brutal text-xl sm:text-2xl text-primary glitch-hover shrink-0"
          >
            247
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-wrap justify-end">
            <Link
              to="/profesores"
              className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider lg:tracking-widest text-primary transition-all hover:text-primary/80 whitespace-nowrap"
            >
              PROFESORES
            </Link>
            <Link
              to="/quecurso"
              className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider lg:tracking-widest text-primary transition-all hover:text-primary/80 whitespace-nowrap"
            >
              ¿QUÉ CURSO?
            </Link>
            <Link
              to="/avisos"
              className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider lg:tracking-widest text-primary transition-all hover:text-primary/80 whitespace-nowrap"
            >
              AVISOS
            </Link>
            <Link
              to="/foro"
              className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider lg:tracking-widest text-primary transition-all hover:text-primary/80 whitespace-nowrap"
            >
              FORO
            </Link>
            <Link
              to="/subir"
              className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider lg:tracking-widest text-primary transition-all hover:text-primary/80 whitespace-nowrap"
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
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <Link
                  to="/perfil"
                  className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider lg:tracking-widest text-primary transition-all hover:text-primary/80 whitespace-nowrap"
                >
                  PERFIL
                </Link>
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider lg:tracking-widest text-primary hidden md:inline truncate max-w-[100px] lg:max-w-none">
                  {dbUser?.nombre || user.email?.split("@")[0] || "Usuario"}
                </span>

                {/* Botón Admin (solo si es admin) */}
                {dbUser?.is_admin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1 sm:gap-2 border-2 border-primary bg-primary px-2 sm:px-3 py-1 font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary glitch-hover"
                  >
                    <Shield className="h-3 w-3" />
                    <span className="hidden sm:inline">ADMIN</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 border-2 border-primary bg-transparent px-2 sm:px-4 py-1 sm:py-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground glitch-hover"
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="border-2 border-primary bg-transparent px-3 sm:px-4 py-1 sm:py-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground glitch-hover whitespace-nowrap"
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
