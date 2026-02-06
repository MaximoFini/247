import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AdminStatsGeneral, AdminStatsUsuarios, AdminTopUploader } from '@/types/admin';

export interface TipoArchivoStats {
  tipo: string;
  cantidad: number;
  porcentaje: number;
}

// Cache de stats para evitar re-fetch innecesarios (5 minutos)
const CACHE_TTL_MS = 5 * 60 * 1000;

export function useAdminStats() {
  const [statsGeneral, setStatsGeneral] = useState<AdminStatsGeneral | null>(null);
  const [statsUsuarios, setStatsUsuarios] = useState<AdminStatsUsuarios | null>(null);
  const [topUploaders, setTopUploaders] = useState<AdminTopUploader[]>([]);
  const [tiposArchivos, setTiposArchivos] = useState<TipoArchivoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const lastFetchRef = useRef<number>(0);

  const fetchStats = async (forceRefresh = false) => {
    // Evitar refetch si está en cache
    const now = Date.now();
    if (!forceRefresh && lastFetchRef.current && (now - lastFetchRef.current) < CACHE_TTL_MS) {
      console.log('📊 Usando stats cacheados');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Optimización: usar vistas pre-calculadas + queries agregados en lugar de SELECT *
      const [generalRes, usuariosRes, uploadersRes, tiposRes, donacionesStatsRes] = await Promise.all([
        // Vista pre-calculada (ya optimizada en la BD)
        supabase.from('admin_stats_general').select('*').single(),
        supabase.from('admin_stats_usuarios').select('*').single(),
        // Top 10 uploaders (ya limitado)
        supabase.from('admin_top_uploaders').select('*').limit(10),
        // OPTIMIZADO: Usar RPC o GROUP BY si existe, sino limitar
        supabase.rpc('get_tipos_archivos_stats').catch(() => 
          // Fallback: query limitada solo con tipo (no SELECT *)
          supabase.from('archivos').select('tipo').limit(500)
        ),
        // OPTIMIZADO: Agregado en lugar de traer todos los usuarios
        supabase.rpc('get_donaciones_stats').catch(() =>
          // Fallback: solo traer puntos_donaciones (1 columna)
          supabase.from('users').select('puntos_donaciones').gt('puntos_donaciones', 0)
        ),
      ]);

      if (generalRes.error) throw generalRes.error;
      if (usuariosRes.error) throw usuariosRes.error;
      if (uploadersRes.error) throw uploadersRes.error;

      setStatsGeneral(generalRes.data);
      setTopUploaders(uploadersRes.data || []);

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
      console.error('Error fetching admin stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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