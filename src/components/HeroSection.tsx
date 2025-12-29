import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

const HeroSection = () => {
  const [stats, setStats] = useState({
    archivos: 0,
    materias: 0,
    descargas: 0,
  });
  const [loading, setLoading] = useState(true);

  const OBJETIVO_ARCHIVOS = 500;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Ejecutar todas las queries en paralelo para mayor velocidad
        const [archivosResult, materiasResult, descargasResult] =
          await Promise.all([
            // Contar archivos activos
            supabase
              .from("archivos")
              .select("*", { count: "exact", head: true })
              .eq("activo", true),
            // Contar materias
            supabase
              .from("materias")
              .select("*", { count: "exact", head: true }),
            // Sumar total de descargas (solo el campo necesario)
            supabase.from("archivos").select("descargas").eq("activo", true),
          ]);

        const totalDescargas =
          descargasResult.data?.reduce(
            (sum, file) => sum + (file.descargas || 0),
            0
          ) || 0;

        setStats({
          archivos: archivosResult.count || 0,
          materias: materiasResult.count || 0,
          descargas: totalDescargas,
        });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const progreso = Math.min((stats.archivos / OBJETIVO_ARCHIVOS) * 100, 100);

  return (
    <section className="relative overflow-hidden py-20">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-10">
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

      {/* Glitch decoration */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 rotate-90 font-brutal text-9xl text-primary/5">
        247
      </div>
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 -rotate-90 font-brutal text-9xl text-primary/5">
        247
      </div>

      <div className="container relative mx-auto px-4 text-center">
        {/* Main Headline */}
        <h1 className="mb-6 font-brutal text-6xl leading-none text-primary md:text-8xl lg:text-9xl">
          247.
        </h1>
        <h2 className="mb-8 font-brutal text-3xl leading-tight text-card-foreground md:text-4xl lg:text-5xl">
          <span className="text-primary">LA MANSION DEL ESTUDIANTE</span>
        </h2>

        {/* Subtext */}
        <p className="mx-auto max-w-2xl font-mono text-lg text-muted-foreground md:text-xl">
          De Sistemas <span className="text-primary">para</span>{" "}
          <span className="text-primary">Sistemas.</span>
        </p>

        {/* Stats */}
        <div className="mt-12 border-t-2 border-primary/30">
          <div className="flex flex-wrap items-center justify-center gap-8 py-6">
            <div className="text-center">
              <p className="font-brutal text-4xl text-primary">
                {loading ? "..." : stats.archivos.toLocaleString()}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                ARCHIVOS
              </p>
            </div>
            <div className="h-12 w-0.5 bg-primary/30" />
            <div className="text-center">
              <p className="font-brutal text-4xl text-primary">
                {loading ? "..." : stats.materias}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                MATERIAS
              </p>
            </div>
            <div className="h-12 w-0.5 bg-primary/30" />
            <div className="text-center">
              <p className="font-brutal text-3xl text-primary">
                {loading ? "..." : stats.descargas.toLocaleString()}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                DESCARGAS
              </p>
            </div>
          </div>

          {/* Barra de progreso hacia el objetivo */}
          <div className="flex flex-col gap-2 px-4 pb-4">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                {stats.archivos}/{OBJETIVO_ARCHIVOS}
              </span>
              <div className="flex-1 h-2 bg-primary/20 border border-primary/30">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <span className="font-mono text-xs text-primary whitespace-nowrap">
                {progreso.toFixed(0)}%
              </span>
            </div>
            <p className="font-mono text-xs text-center text-muted-foreground">
              Sorteo de departamento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
