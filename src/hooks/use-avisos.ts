/**
 * Hook para cargar avisos del administrador
 * Utiliza React Query para cachear y optimizar las requests
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface AvisoAdmin {
  id: number;
  motivo: string;
  mensaje: string;
  fecha: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const CACHE_TIME = 1000 * 60 * 5; // 5 minutos

/**
 * Hook para obtener avisos activos del administrador
 * Los avisos se ordenan por fecha descendente (más recientes primero)
 */
export function useAvisos() {
  return useQuery({
    queryKey: ['avisos-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avisos_admin')
        .select('*')
        .eq('activo', true)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al cargar avisos:', error);
        throw error;
      }

      return (data || []) as AvisoAdmin[];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
