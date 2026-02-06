import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminStatsGeneral, AdminStatsUsuarios, AdminTopUploader } from '@/types/admin';

export interface TipoArchivoStats {
  tipo: string;
  cantidad: number;
  porcentaje: number;
}

// Cache de stats para evitar re-fetch innecesarios (5 minutos)
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15000; // 15s timeout (stats pueden ser lentos)

export function useAdminStats() {
  const { loading: authLoading, user } = useAuth();
  
  const [statsGeneral, setStatsGeneral] = useState<AdminStatsGeneral | null>(null);
  const [statsUsuarios, setStatsUsuarios] = useState<AdminStatsUsuarios | null>(null);
  const [topUploaders, setTopUploaders] = useState<AdminTopUploader[]>([]);
  const [tiposArchivos, setTiposArchivos] = useState<TipoArchivoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const lastFetchRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = async (forceRefresh = false) => {
    // ⚡ PATRÓN OBLIGATORIO: Verificar auth antes de cargar
    if (authLoading) {
      console.log("⏳ useAdminStats: esperando auth...");
      return;
    }
    
    if (!user?.id) {
      console.log("⚠️ useAdminStats: sin usuario, limpiando data");
      setStatsGeneral(null);
      setStatsUsuarios(null);
      setTopUploaders([]);
      setTiposArchivos([]);
      setLoading(false);
      return;
    }

    // Evitar refetch si está en cache
    const now = Date.now();
    if (!forceRefresh && lastFetchRef.current && (now - lastFetchRef.current) < CACHE_TTL_MS) {
      console.log('📊 Usando stats cacheados');
      setLoading(false);
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      console.log("🔍 useAdminStats: cargando...");

      // Timeout para las requests
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.warn("⚠️ useAdminStats timeout (15s) - abortando");
        }
      }, FETCH_TIMEOUT_MS);

      // Optimización: usar vistas pre-calculadas + queries agregados en lugar de SELECT *
      const [generalRes, usuariosRes, uploadersRes, tiposRes, donacionesStatsRes] = await Promise.all([
        // Vista pre-calculada (ya optimizada en la BD)
        supabase.from('admin_stats_general').select('*').single().abortSignal(abortControllerRef.current.signal),
        supabase.from('admin_stats_usuarios').select('*').single().abortSignal(abortControllerRef.current.signal),
        // Top 10 uploaders (ya limitado)
        supabase.from('admin_top_uploaders').select('*').limit(10).abortSignal(abortControllerRef.current.signal),
        // OPTIMIZADO: Usar RPC o GROUP BY si existe, sino limitar
        supabase.rpc('get_tipos_archivos_stats').abortSignal(abortControllerRef.current.signal).catch(() => 
          // Fallback: query limitada solo con tipo (no SELECT *)
          supabase.from('archivos').select('tipo').limit(500).abortSignal(abortControllerRef.current!.signal)
        ),
        // OPTIMIZADO: Agregado en lugar de traer todos los usuarios
        supabase.rpc('get_donaciones_stats').abortSignal(abortControllerRef.current.signal).catch(() =>
          // Fallback: solo traer puntos_donaciones (1 columna)
          supabase.from('users').select('puntos_donaciones').gt('puntos_donaciones', 0).abortSignal(abortControllerRef.current!.signal)
        ),
      ]);

      clearTimeout(timeoutId);

      // Verificar si fue abortado
      if (generalRes.error?.message?.includes('abort') || 
          usuariosRes.error?.message?.includes('abort') ||
          uploadersRes.error?.message?.includes('abort')) {
        console.log("⏹️ useAdminStats: requests abortadas");
        return;
      }

      if (generalRes.error) throw generalRes.error;
      if (usuariosRes.error) throw usuariosRes.error;
      if (uploadersRes.error) throw uploadersRes.error;

      setStatsGeneral(generalRes.data);
      setTopUploaders(uploadersRes.data || []);
      console.log("✅ useAdminStats: cargado");

      // Calcular estadísticas de tipos de archivos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tiposData = (tiposRes as any)?.data;
      if (tiposData && Array.isArray(tiposData)) {
        // Si viene de RPC, ya viene procesado
        if (tiposData[0]?.cantidad !== undefined) {
          const total = tiposData.reduce((sum: number, t: any) => sum + t.cantidad, 0);
          setTiposArchivos(tiposData.map((t: any) => ({
            tipo: t.tipo,
            cantidad: t.cantidad,
            porcentaje: total > 0 ? (t.cantidad / total) * 100 : 0,
          })));
        } else {
          // Fallback: calcular manualmente
          const tipoCount: Record<string, number> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tiposData.forEach((archivo: any) => {
            const tipo = archivo.tipo || 'otro';
            tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
          });

          const total = tiposData.length;
          const tiposStats: TipoArchivoStats[] = Object.entries(tipoCount)
            .map(([tipo, cantidad]) => ({
              tipo,
              cantidad,
              porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
            }))
            .sort((a, b) => b.cantidad - a.cantidad);

          setTiposArchivos(tiposStats);
        }
      }

      // Calcular estadísticas de usuarios
      const totalUsuarios = generalRes.data?.total_usuarios || 0;
      const totalArchivos = generalRes.data?.total_archivos_activos || 0;
      const promedioArchivosPorUsuario = totalUsuarios > 0 
        ? totalArchivos / totalUsuarios 
        : 0;

      // Calcular usuarios que donaron
      let usuariosQueDonaron = 0;
      let totalDonaciones = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const donacionesData = (donacionesStatsRes as any)?.data;
      if (donacionesData) {
        // Si viene de RPC, ya viene procesado
        if (donacionesData.usuarios_que_donaron !== undefined) {
          usuariosQueDonaron = donacionesData.usuarios_que_donaron;
          totalDonaciones = donacionesData.total_donaciones;
        } else if (Array.isArray(donacionesData)) {
          // Fallback: solo usuarios con donaciones > 0 (ya filtrado en query)
          usuariosQueDonaron = donacionesData.length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          donacionesData.forEach((usuario: any) => {
            totalDonaciones += usuario.puntos_donaciones || 0;
          });
        }
      }

      const promedioPuntosDonaciones = usuariosQueDonaron > 0 
        ? totalDonaciones / usuariosQueDonaron 
        : 0;

      const porcentajeUsuariosDonaron = totalUsuarios > 0 
        ? (usuariosQueDonaron / totalUsuarios) * 100 
        : 0;

      setStatsUsuarios({
        ...usuariosRes.data,
        promedio_archivos_por_usuario: promedioArchivosPorUsuario,
        promedio_puntos_donaciones: promedioPuntosDonaciones,
        usuarios_que_donaron: usuariosQueDonaron,
        porcentaje_usuarios_donaron: porcentajeUsuariosDonaron,
      });

      lastFetchRef.current = now;

    } catch (err: any) {
      // Ignorar errores de abort
      if (err instanceof Error && err.message?.includes('abort')) {
        return;
      }
      console.error('Error fetching admin stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    // ⚡ PATRÓN OBLIGATORIO: esperar que auth esté listo
    if (authLoading) return;
    fetchStats();
    
    // Cleanup: abortar requests pendientes al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, user?.id]);

  return {
    statsGeneral,
    statsUsuarios,
    topUploaders,
    tiposArchivos,
    loading,
    error,
    refetch: fetchStats,
  };
}