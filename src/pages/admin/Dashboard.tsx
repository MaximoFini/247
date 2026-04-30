import {
  Users,
  FileText,
  AlertTriangle,
  Database,
  TrendingUp,
  Award,
  PieChart,
  Heart,
  Link2,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { statsGeneral, statsUsuarios, topUploaders, tiposArchivos, loading } =
    useAdminStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <p className="font-mono text-primary">Cargando estadísticas...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-12 border-b-2 border-primary">
          <div className="container mx-auto px-4">
            <h1 className="font-brutal text-5xl text-primary">PANEL ADMIN</h1>
            <p className="font-mono text-sm text-muted-foreground mt-2">
              Dashboard y estadísticas generales
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {/* Usuarios */}
            <div className="border-2 border-primary bg-background p-6">
              <Users className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-3xl text-primary">
                {statsGeneral?.total_usuarios || 0}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Usuarios registrados
              </p>
            </div>

            {/* Archivos activos */}
            <div className="border-2 border-primary bg-background p-6">
              <FileText className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-3xl text-primary">
                {statsGeneral?.total_archivos_activos || 0}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Archivos activos
              </p>
            </div>

            {/* Archivos reportados */}
            <Link
              to="/admin/archivos-reportados"
              className="border-2 border-destructive bg-destructive/10 p-6 hover:bg-destructive/20 transition-all"
            >
              <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
              <p className="font-mono text-3xl text-destructive">
                {statsGeneral?.total_archivos_reportados || 0}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Archivos reportados →
              </p>
            </Link>

            {/* Espacio total */}
            <div className="border-2 border-primary bg-background p-6">
              <Database className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-3xl text-primary">
                {((statsGeneral?.espacio_total_mb || 0) / 1024).toFixed(1)} GB
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Espacio usado
              </p>
            </div>
          </div>

          {/* Stats Usuarios */}
          <div className="border-2 border-primary bg-card p-8 mb-12">
            <h2 className="font-brutal text-2xl text-primary mb-6">
              ESTADÍSTICAS DE USUARIOS
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Promedio puntos por archivos
                </p>
                <p className="font-mono text-2xl text-primary">
                  {statsUsuarios?.promedio_puntos_archivos?.toFixed(1) || 0}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Donación promedio
                </p>
                <p className="font-mono text-2xl text-primary">
                  {statsUsuarios?.promedio_puntos_donaciones?.toFixed(0) || 0}{" "}
                  pts
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  (media de donaciones realizadas)
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Promedio archivos por usuario
                </p>
                <p className="font-mono text-2xl text-primary">
                  {statsUsuarios?.promedio_archivos_por_usuario?.toFixed(2) ||
                    0}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  ({statsGeneral?.total_archivos_activos || 0} archivos /{" "}
                  {statsGeneral?.total_usuarios || 0} usuarios)
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Usuarios que donaron
                </p>
                <p className="font-mono text-2xl text-primary">
                  {statsUsuarios?.usuarios_que_donaron || 0}
                  <span className="text-lg ml-2">
                    (
                    {statsUsuarios?.porcentaje_usuarios_donaron?.toFixed(1) ||
                      0}
                    %)
                  </span>
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  del total de usuarios registrados
                </p>
              </div>
            </div>
          </div>

          {/* Tipos de archivos más cargados */}
          <div className="border-2 border-primary bg-card p-8 mb-12">
            <h2 className="font-brutal text-2xl text-primary mb-6 flex items-center gap-3">
              <PieChart className="h-6 w-6" />
              TIPOS DE ARCHIVOS MÁS CARGADOS
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tiposArchivos.map((tipo, idx) => (
                <div
                  key={tipo.tipo}
                  className="flex items-center justify-between border border-primary/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-brutal text-xl text-primary">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-sm uppercase">
                      {tipo.tipo}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg text-primary">
                      {tipo.cantidad}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {tipo.porcentaje.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Uploaders */}
          <div className="border-2 border-primary bg-card p-8">
            <h2 className="font-brutal text-2xl text-primary mb-6 flex items-center gap-3">
              <Award className="h-6 w-6" />
              TOP 10 COLABORADORES
            </h2>
            <div className="space-y-3">
              {topUploaders.map((uploader, idx) => (
                <div
                  key={uploader.id}
                  className="flex items-center justify-between border-b border-primary/20 pb-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-brutal text-2xl text-primary w-8">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-mono text-sm text-foreground">
                        {uploader.nombre}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {uploader.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg text-primary">
                      {uploader.total_archivos} archivos
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {uploader.total_mb_subidos.toFixed(1)} MB •{" "}
                      {uploader.puntos_archivos} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <Link
              to="/admin/archivos"
              className="border-2 border-primary bg-background p-6 hover:bg-primary/10 transition-all"
            >
              <FileText className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-lg text-primary">
                Gestionar Archivos
              </p>
            </Link>
            <Link
              to="/admin/profesores"
              className="border-2 border-primary bg-background p-6 hover:bg-primary/10 transition-all"
            >
              <Users className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-lg text-primary">
                Gestionar Profesores
              </p>
            </Link>
            <Link
              to="/admin/materias"
              className="border-2 border-primary bg-background p-6 hover:bg-primary/10 transition-all"
            >
              <Database className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-lg text-primary">
                Gestionar Materias
              </p>
            </Link>
            <Link
              to="/admin/asignaciones"
              className="border-2 border-primary bg-background p-6 hover:bg-primary/10 transition-all"
            >
              <Link2 className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-lg text-primary">
                Gestionar Asignaciones
              </p>
            </Link>
            <Link
              to="/admin/avisos"
              className="border-2 border-primary bg-background p-6 hover:bg-primary/10 transition-all"
            >
              <Megaphone className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-lg text-primary">Gestionar Avisos</p>
            </Link>
            <Link
              to="/admin/foro"
              className="border-2 border-primary bg-background p-6 hover:bg-primary/10 transition-all"
            >
              <MessageSquare className="h-8 w-8 text-primary mb-3" />
              <p className="font-mono text-lg text-primary">Moderar Foro</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
