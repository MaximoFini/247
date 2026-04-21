import { useState, useEffect, memo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Constantes
const OBJETIVO_ARCHIVOS = 500;
const STATS_CACHE_TIME = 1000 * 60 * 15; // 15 minutos de cache

// Tipo para stats
interface HeroStats {
  archivos: number;
  materias: number;
  descargas: number;
}

// Función de fetch optimizada (usa una sola query para descargas)
async function fetchHeroStats(): Promise<HeroStats> {
  const [archivosResult, materiasResult, descargasResult] = await Promise.all([
    // Contar archivos activos (solo count, sin datos)
    supabase
      .from("archivos")
      .select("id", { count: "exact", head: true })
      .eq("activo", true),
    // Contar materias (solo count, sin datos)
    supabase.from("materias").select("id", { count: "exact", head: true }),
    // Solo traer descargas para sumar (campo mínimo)
    supabase.from("archivos").select("descargas").eq("activo", true),
  ]);

  const totalDescargas =
    descargasResult.data?.reduce(
      (sum, file) => sum + (file.descargas || 0),
      0,
    ) || 0;

  return {
    archivos: archivosResult.count || 0,
    materias: materiasResult.count || 0,
    descargas: totalDescargas,
  };
}

// ⚡ FASE 2: Hook para stats con cache agresivo
// Incluye user.id y enabled para sincronizar con auth
function useHeroStats() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["hero-stats", user?.id ?? "anonymous"],
    queryFn: fetchHeroStats,
    enabled: !loading, // ⚡ Solo ejecutar cuando auth termine
    staleTime: STATS_CACHE_TIME,
    gcTime: STATS_CACHE_TIME * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: 1000,
  });
}

// Componente de estadística individual (memoizado)
const StatItem = memo(
  ({
    value,
    label,
    loading,
  }: {
    value: number | string;
    label: string;
    loading: boolean;
  }) => (
    <div className="text-center min-w-[80px] sm:min-w-[100px]">
      <p className="font-brutal text-2xl sm:text-3xl md:text-4xl text-primary">
        {loading
          ? "..."
          : typeof value === "number"
            ? value.toLocaleString("es-AR")
            : value}
      </p>
      <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  ),
);
StatItem.displayName = "StatItem";

// Componente principal memoizado
const HeroSection = memo(() => {
  const { data: stats, isLoading: loading } = useHeroStats();

  // Valores por defecto mientras carga
  const archivos = stats?.archivos ?? 0;
  const materias = stats?.materias ?? 0;
  const descargas = stats?.descargas ?? 0;

  const progreso = Math.min((archivos / OBJETIVO_ARCHIVOS) * 100, 100);

  return (
    <section className="relative overflow-hidden py-20">
      {/* Decorative grid lines - optimizado con will-change */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ willChange: "auto" }}
      >
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

      {/* Glitch decoration - hidden on mobile for performance */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 rotate-90 font-brutal text-9xl text-primary/5 hidden md:block">
        247
      </div>
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 -rotate-90 font-brutal text-9xl text-primary/5 hidden md:block">
        247
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 text-center">
        {/* Main Headline */}
        <h1 className="mb-4 sm:mb-6 font-brutal text-5xl sm:text-6xl leading-none text-primary md:text-8xl lg:text-9xl">
          247.
        </h1>
        <h2 className="mb-6 sm:mb-8 font-brutal text-2xl sm:text-3xl leading-tight text-card-foreground md:text-4xl lg:text-5xl px-2">
          <span className="text-primary">LA MANSION DEL ESTUDIANTE</span>
        </h2>

        {/* Subtext */}
        <p className="mx-auto max-w-2xl font-mono text-base sm:text-lg text-muted-foreground md:text-xl px-2">
          De Sistemas <span className="text-primary">para</span>{" "}
          <span className="text-primary">Sistemas.</span>
        </p>

        {/* Stats */}
        <div className="mt-8 sm:mt-12 border-t-2 border-primary/30">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 py-4 sm:py-6">
            <StatItem value={archivos} label="ARCHIVOS" loading={loading} />
            <div className="h-12 w-0.5 bg-primary/30 hidden sm:block" />
            <StatItem value={materias} label="MATERIAS" loading={loading} />
            <div className="h-12 w-0.5 bg-primary/30 hidden sm:block" />
            <StatItem value={descargas} label="DESCARGAS" loading={loading} />
          </div>

          {/* Barra de progreso hacia el objetivo */}
          <div className="flex flex-col gap-2 px-2 sm:px-4 pb-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="font-mono text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                {archivos}/{OBJETIVO_ARCHIVOS}
              </span>
              <div className="flex-1 h-2 bg-primary/20 border border-primary/30">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <span className="font-mono text-[10px] sm:text-xs text-primary whitespace-nowrap">
                {progreso.toFixed(0)}%
              </span>
            </div>
            <p className="font-mono text-[10px] sm:text-xs text-center text-muted-foreground px-2">
              Sorteo de departamento (es verdad)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
