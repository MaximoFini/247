import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya está logueado, redirigir (en useEffect, no en render)
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // La redirección la maneja Supabase automáticamente
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error al iniciar sesión.  Intentá de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Decorative grid background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 font-brutal text-6xl text-primary">247.</h1>
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            ACCESO A LA BASE DE DATOS
          </p>
        </div>

        {/* Login Box */}
        <div className="border-4 border-primary bg-background p-8 toxic-glow">
          <h2 className="mb-4 text-center font-mono text-xl uppercase tracking-widest text-foreground">
            INICIAR SESIÓN
          </h2>
          <p className="mb-6 text-center font-mono text-sm text-muted-foreground">
            Ingresá con tu cuenta de Google
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 border-2 border-destructive bg-destructive/10 p-3 text-center">
              <p className="font-mono text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="mb-6 flex w-full items-center justify-center gap-3 border-2 border-primary bg-white py-4 font-mono text-sm uppercase tracking-widest text-black transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-. 78-.07-1.53-. 2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isLoading ? "CARGANDO..." : "CONTINUAR CON GOOGLE"}
          </button>

          {/* Terms */}
          <p className="text-center font-mono text-xs text-muted-foreground">
            Al continuar, aceptás los{" "}
            <span className="text-primary">términos y condiciones de uso</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
