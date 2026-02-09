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

    const now = Date.now();
    if (!forceRefresh && lastFetchRef.current && (now - lastFetchRef.current) < CACHE_TTL_MS) {
      console.log('📊 Usando stats cacheados');
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      console.log("🔍 useAdminStats: cargando (queries directas)...");

      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.warn("⚠️ useAdminStats timeout (15s) - abortando");
        }
      }, FETCH_TIMEOUT_MS);

      // ✅ QUERIES DIRECTAS (sin vistas materializadas)
      const [
        usersCountRes,
        archivosActivosRes,
        archivosReportadosRes,
        profesoresCountRes,
        materiasCountRes,
        comisionesCountRes,
        ratingsCountRes,
        totalTamanioRes,
        totalDescargasRes,
        adminsCountRes,
        uploadersRes,
        archivosConTipoRes,
        donacionesRes,
      ] = await Promise.all([
        // 1. Total usuarios
        supabase.from('users').select('id', { count: 'exact', head: true })
          .abortSignal(abortControllerRef.current.signal),
        
        // 2. Archivos activos
        supabase.from('archivos').select('id', { count: 'exact', head: true })
          .eq('activo', true)
          .abortSignal(abortControllerRef.current.signal),
        
        // 3. Archivos reportados
        supabase.from('archivos').select('id', { count: 'exact', head: true })
          .eq('reportado', true)
          .abortSignal(abortControllerRef.current.signal),
        
        // 4. Total profesores
        supabase.from('profesores').select('id', { count: 'exact', head: true })
          .abortSignal(abortControllerRef.current.signal),
        
        // 5. Total materias
        supabase.from('materias').select('id', { count: 'exact', head: true })
          .abortSignal(abortControllerRef.current.signal),
        
        // 6. Total comisiones
        supabase.from('comisiones').select('id', { count: 'exact', head: true })
          .abortSignal(abortControllerRef.current.signal),
        
        // 7. Total ratings
        supabase.from('ratings').select('id', { count: 'exact', head: true })
          .abortSignal(abortControllerRef.current.signal),
        
        // 8. Espacio total (suma de tamaños)
        supabase.from('archivos').select('tamanio_mb')
          .eq('activo', true)
          .abortSignal(abortControllerRef.current.signal),
        
        // 9. Total descargas (suma)
        supabase.from('archivos').select('descargas')
          .eq('activo', true)
          .abortSignal(abortControllerRef.current.signal),
        
        // 10. Total admins
        supabase.from('users').select('id', { count: 'exact', head: true })
          .eq('is_admin', true)
          .abortSignal(abortControllerRef.current.signal),
        
        // 11. Top uploaders (agregación manual)
        supabase.from('users').select(`
          id,
          nombre,
          email,
          puntos_archivos,
          puntos_donaciones,
          archivos:archivos(id, tamanio_mb, descargas)
        `).gt('puntos_archivos', 0)
          .order('puntos_archivos', { ascending: false })
          .limit(10)
          .abortSignal(abortControllerRef.current.signal),
        
        // 12. Tipos de archivos
        supabase.from('archivos').select('tipo')
          .eq('activo', true)
          .abortSignal(abortControllerRef.current.signal),
        
        // 13. Usuarios con donaciones
        supabase.from('users').select('puntos_donaciones')
          .gt('puntos_donaciones', 0)
          .abortSignal(abortControllerRef.current.signal),
      ]);

      clearTimeout(timeoutId);

      // Verificar si fue abortado
      if (usersCountRes.error?.message?.includes('abort')) {
        console.log("⏹️ useAdminStats: requests abortadas");
        return;
      }

      // ✅ CALCULAR ESTADÍSTICAS GENERALES
      const totalUsuarios = usersCountRes.count || 0;
      const totalArchivosActivos = archivosActivosRes.count || 0;
      const totalArchivosReportados = archivosReportadosRes.count || 0;
      const totalProfesores = profesoresCountRes.count || 0;
      const totalMaterias = materiasCountRes.count || 0;
      const totalComisiones = comisionesCountRes.count || 0;
      const totalRatings = ratingsCountRes.count || 0;

      const espacioTotalMb = (totalTamanioRes.data || []).reduce(
        (sum: number, row: any) => sum + parseFloat(row.tamanio_mb || 0), 
        0
      );

      const totalDescargas = (totalDescargasRes.data || []).reduce(
        (sum: number, row: any) => sum + (row.descargas || 0), 
        0
      );

      setStatsGeneral({
        total_usuarios: totalUsuarios,
        total_archivos_activos: totalArchivosActivos,
        total_archivos_reportados: totalArchivosReportados,
        total_profesores: totalProfesores,
        total_materias: totalMaterias,
        total_comisiones: totalComisiones,
        total_ratings: totalRatings,
        espacio_total_mb: espacioTotalMb,
        total_descargas: totalDescargas,
      });

      // ✅ CALCULAR ESTADÍSTICAS DE USUARIOS
      const totalAdmins = adminsCountRes.count || 0;
      
      // Promedio puntos por archivos
      const promedioPuntosArchivos = totalUsuarios > 0 
        ? (uploadersRes.data || []).reduce((sum: number, u: any) => sum + (u.puntos_archivos || 0), 0) / totalUsuarios
        : 0;

      // Promedio archivos por usuario
      const promedioArchivosPorUsuario = totalUsuarios > 0 
        ? totalArchivosActivos / totalUsuarios 
        : 0;

      // Usuarios que donaron
      const usuariosQueDonaron = donacionesRes.data?.length || 0;
      const totalDonaciones = (donacionesRes.data || []).reduce(
        (sum: number, u: any) => sum + (u.puntos_donaciones || 0), 
        0
      );
      const promedioPuntosDonaciones = usuariosQueDonaron > 0 
        ? totalDonaciones / usuariosQueDonaron 
        : 0;
      const porcentajeUsuariosDonaron = totalUsuarios > 0 
        ? (usuariosQueDonaron / totalUsuarios) * 100 
        : 0;

      setStatsUsuarios({
        total_usuarios: totalUsuarios,
        total_admins: totalAdmins,
        promedio_puntos_archivos: promedioPuntosArchivos,
        promedio_puntos_donaciones: promedioPuntosDonaciones,
        promedio_archivos_por_usuario: promedioArchivosPorUsuario,
        usuarios_que_donaron: usuariosQueDonaron,
        porcentaje_usuarios_donaron: porcentajeUsuariosDonaron,
      });

      // ✅ TOP UPLOADERS (transformar datos agregados)
      const transformedUploaders: AdminTopUploader[] = (uploadersRes.data || []).map((user: any) => {
        const archivos = user.archivos || [];
        const totalArchivos = archivos.length;
        const totalMbSubidos = archivos.reduce((sum: number, a: any) => sum + parseFloat(a.tamanio_mb || 0), 0);
        const totalDescargasUser = archivos.reduce((sum: number, a: any) => sum + (a.descargas || 0), 0);

        return {
          id: user.id,
          nombre: user.nombre || 'Sin nombre',
          email: user.email,
          puntos_archivos: user.puntos_archivos || 0,
          total_archivos: totalArchivos,
          total_mb_subidos: totalMbSubidos,
          total_descargas: totalDescargasUser,
        };
      });
      setTopUploaders(transformedUploaders);

      // ✅ TIPOS DE ARCHIVOS (contar manualmente)
      const tipoCount: Record<string, number> = {};
      (archivosConTipoRes.data || []).forEach((archivo: any) => {
        const tipo = archivo.tipo || 'otro';
        tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
      });

      const total = archivosConTipoRes.data?.length || 0;
      const tiposStats: TipoArchivoStats[] = Object.entries(tipoCount)
        .map(([tipo, cantidad]) => ({
          tipo,
          cantidad,
          porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
        }))
        .sort((a, b) => b.cantidad - a.cantidad);

      setTiposArchivos(tiposStats);

      lastFetchRef.current = now;
      console.log("✅ useAdminStats: cargado con queries directas");
    } catch (err: any) {
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