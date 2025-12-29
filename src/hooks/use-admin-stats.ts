import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AdminStatsGeneral, AdminStatsUsuarios, AdminTopUploader } from '@/types/admin';

export interface TipoArchivoStats {
  tipo: string;
  cantidad: number;
  porcentaje: number;
}

export function useAdminStats() {
  const [statsGeneral, setStatsGeneral] = useState<AdminStatsGeneral | null>(null);
  const [statsUsuarios, setStatsUsuarios] = useState<AdminStatsUsuarios | null>(null);
  const [topUploaders, setTopUploaders] = useState<AdminTopUploader[]>([]);
  const [tiposArchivos, setTiposArchivos] = useState<TipoArchivoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch de las vistas existentes + datos adicionales
      const [generalRes, usuariosRes, uploadersRes, archivosRes, donacionesRes] = await Promise.all([
        supabase.from('admin_stats_general').select('*').single(),
        supabase.from('admin_stats_usuarios').select('*').single(),
        supabase.from('admin_top_uploaders').select('*').limit(10),
        supabase.from('archivos').select('tipo', { count: 'exact' }),
        supabase.from('users').select('puntos_donaciones'),
      ]);

      if (generalRes.error) throw generalRes.error;
      if (usuariosRes.error) throw usuariosRes.error;
      if (uploadersRes.error) throw uploadersRes.error;

      setStatsGeneral(generalRes.data);
      setTopUploaders(uploadersRes.data || []);

      // Calcular estadísticas de tipos de archivos
      if (archivosRes.data) {
        const tipoCount: Record<string, number> = {};
        archivosRes.data.forEach((archivo: any) => {
          const tipo = archivo.tipo || 'otro';
          tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
        });

        const total = archivosRes.data.length;
        const tiposStats: TipoArchivoStats[] = Object.entries(tipoCount)
          .map(([tipo, cantidad]) => ({
            tipo,
            cantidad,
            porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
          }))
          .sort((a, b) => b.cantidad - a.cantidad);

        setTiposArchivos(tiposStats);
      }

      // Calcular estadísticas de usuarios corregidas
      const totalUsuarios = generalRes.data?.total_usuarios || 0;
      const totalArchivos = generalRes.data?.total_archivos_activos || 0;

      // Promedio de archivos por usuario = total_archivos / total_usuarios
      const promedioArchivosPorUsuario = totalUsuarios > 0 
        ? totalArchivos / totalUsuarios 
        : 0;

      // Calcular usuarios que donaron y donación promedio
      let usuariosQueDonaron = 0;
      let totalDonaciones = 0;

      if (donacionesRes.data) {
        donacionesRes.data.forEach((usuario: any) => {
          const puntos = usuario.puntos_donaciones || 0;
          if (puntos > 0) {
            usuariosQueDonaron++;
            totalDonaciones += puntos;
          }
        });
      }

      // Promedio de puntos por donaciones = total de donaciones / usuarios que donaron
      const promedioPuntosDonaciones = usuariosQueDonaron > 0 
        ? totalDonaciones / usuariosQueDonaron 
        : 0;

      // Porcentaje de usuarios que donaron
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