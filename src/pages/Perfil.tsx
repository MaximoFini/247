import {
  Loader2,
  Upload,
  Download,
  ExternalLink,
  AlertCircle,
  Award,
  Mail,
  User,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFiles } from "@/hooks/use-user-files";
import { useMemo } from "react";
import { getRandomApodo } from "@/data/mockData";

const Perfil = () => {
  const { user, dbUser, loading: authLoading } = useAuth();
  const { files, loading: filesLoading, error: filesError } = useUserFiles();

  // Generar apodo aleatorio una sola vez por sesión
  const apodoAleatorio = useMemo(() => getRandomApodo(), []);

  // Solo mostrar loading si está cargando auth (no esperar dbUser)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="font-mono text-primary">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Error: Usuario no encontrado</div>;
  }

  // Usar valores por defecto si dbUser no ha cargado
  const totalPoints =
    (dbUser?.puntos_archivos || 0) + (dbUser?.puntos_donaciones || 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="container relative mx-auto px-4 text-center">
            <h1 className="mb-4 font-brutal text-6xl text-primary md:text-7xl">
              MI PERFIL
            </h1>
            <p className="mb-12 font-mono text-lg text-muted-foreground md:text-xl">
              Tus datos y estadísticas
            </p>
          </div>
        </section>

        {/* Profile Content */}
        <div className="container mx-auto px-4 pb-20">
          {/* Main Profile Card */}
          <div className="mx-auto max-w-4xl border-4 border-primary bg-card p-8 mb-12">
            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="mb-2 font-brutal text-5xl text-primary">
                {apodoAleatorio}
              </h2>
              <p className="font-mono text-sm text-muted-foreground">
                Tu apodo en la comunidad
              </p>
            </div>

            {/* User Info Grid */}
            <div className="space-y-6 border-t-2 border-primary/30 pt-8">
              {/* Nombre */}
              <div className="flex items-center gap-4 border-b-2 border-primary/20 pb-4">
                <User className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Nombre
                  </p>
                  <p className="font-mono text-lg text-foreground">
                    {dbUser?.nombre ||
                      user?.user_metadata?.full_name ||
                      "Usuario"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 border-b-2 border-primary/20 pb-4">
                <Mail className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Email
                  </p>
                  <p className="font-mono text-lg text-foreground">
                    {user?.email || "usuario@example.com"}
                  </p>
                </div>
              </div>

              {/* Points Section */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {/* Puntos por archivos */}
                <div className="border-2 border-primary bg-primary/5 p-6 text-center">
                  <Award className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Puntos por Archivos
                  </p>
                  <p className="font-brutal text-4xl text-primary">
                    {dbUser?.puntos_archivos || 0}
                  </p>
                </div>

                {/* Puntos por donaciones */}
                <div className="border-2 border-primary bg-primary/5 p-6 text-center">
                  <Gift className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Puntos por Donaciones
                  </p>
                  <p className="font-brutal text-4xl text-primary">
                    {dbUser?.puntos_donaciones || 0}
                  </p>
                </div>

                {/* Total Points */}
                <div className="border-2 border-primary bg-primary p-6 text-center">
                  <Award className="mx-auto mb-3 h-8 w-8 text-primary-foreground" />
                  <p className="font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Puntos Totales
                  </p>
                  <p className="font-brutal text-4xl text-primary-foreground">
                    {totalPoints}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="mt-8 border-2 border-primary/30 bg-primary/5 p-4">
              <p className="text-center font-mono text-sm text-muted-foreground">
                Los puntos se generan automáticamente al cargar archivos y hacer
                donaciones a la comunidad.
              </p>
            </div>
          </div>

          {/* Stats Cards (Archivos subidos) */}
          <div className="mx-auto max-w-4xl mb-12">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Archivos subidos */}
              <div className="border-2 border-primary bg-background p-6">
                <div className="flex items-center gap-4">
                  <Upload className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-mono text-3xl text-primary">
                      {files.length}
                    </p>
                    <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                      Archivos subidos
                    </p>
                  </div>
                </div>
              </div>

              {/* Descargas totales */}
              <div className="border-2 border-primary bg-background p-6">
                <div className="flex items-center gap-4">
                  <Download className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-mono text-3xl text-primary">
                      {files.reduce(
                        (sum, file) => sum + (file.descargas || 0),
                        0
                      )}
                    </p>
                    <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                      Descargas totales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de archivos */}
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-brutal text-3xl text-primary">
                TUS ARCHIVOS
              </h2>
              <Link
                to="/subir"
                className="border-2 border-primary bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
              >
                + SUBIR NUEVO
              </Link>
            </div>

            {filesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filesError ? (
              <div className="border-2 border-destructive bg-destructive/10 p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="font-mono text-sm text-destructive">
                  {filesError}
                </p>
              </div>
            ) : files.length === 0 ? (
              <div className="border-2 border-muted bg-muted/5 p-12 text-center">
                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <p className="font-mono text-muted-foreground mb-4">
                  Todavía no subiste ningún archivo
                </p>
                <Link
                  to="/subir"
                  className="inline-block border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary"
                >
                  Subir mi primer archivo →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="border-2 border-primary bg-background p-6 transition-all hover:bg-primary/5 hover:border-primary/80"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[250px]">
                        <h3 className="mb-3 font-mono text-lg text-primary break-words">
                          {file.nombre}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p className="font-mono text-xs text-muted-foreground">
                            <span className="text-primary">MATERIA: </span>{" "}
                            {file.materia_nombre || "N/A"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            <span className="text-primary">COMISIÓN:</span>{" "}
                            {file.comision_codigo || "N/A"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            <span className="text-primary">TIPO:</span>{" "}
                            {file.tipo?.toUpperCase()}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            <span className="text-primary">TAMAÑO:</span>{" "}
                            {file.tamanio_mb} MB
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            <span className="text-primary">DESCARGAS:</span>{" "}
                            {file.descargas || 0}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            <span className="text-primary">EXTENSIÓN:</span>{" "}
                            {file.extension?.toUpperCase()}
                          </p>
                        </div>
                        {file.reportado && (
                          <p className="mt-3 font-mono text-xs text-destructive border-l-2 border-destructive pl-2">
                            ⚠️ REPORTADO
                          </p>
                        )}
                        {!file.activo && (
                          <p className="mt-3 font-mono text-xs text-muted-foreground border-l-2 border-muted pl-2">
                            🚫 DESACTIVADO
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2">
                        <a
                          href={file.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 border-2 border-primary bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                        >
                          <ExternalLink className="h-3 w-3" />
                          VER EN DRIVE
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Perfil;
