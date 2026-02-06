import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminArchivoReportado } from '@/types/admin';

const FETCH_TIMEOUT_MS = 10000; // 10s timeout

export function useReportedFiles() {
  const { loading: authLoading, user } = useAuth();
  
  const [files, setFiles] = useState<AdminArchivoReportado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFiles = async () => {
    // ⚡ PATRÓN OBLIGATORIO: Verificar auth antes de cargar
    if (authLoading) {
      console.log("⏳ useReportedFiles: esperando auth...");
      return;
    }
    
    if (!user?.id) {
      console.log("⚠️ useReportedFiles: sin usuario, limpiando data");
      setFiles([]);
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
      console.log("🔍 useReportedFiles: cargando...");

      // Timeout para la request
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.warn("⚠️ useReportedFiles timeout (10s) - abortando");
        }
      }, FETCH_TIMEOUT_MS);

      const { data, error: fetchError } = await supabase
        .from('admin_archivos_reportados')
        .select('*')
        .abortSignal(abortControllerRef.current.signal);

      clearTimeout(timeoutId);

      if (fetchError) {
        // Ignorar errores de abort
        if (fetchError.message?.includes('abort')) {
          console.log("⏹️ useReportedFiles: request abortada");
          return;
        }
        throw fetchError;
      }

      setFiles(data || []);
      console.log("✅ useReportedFiles: cargados", data?.length || 0);
    } catch (err: any) {
      // Ignorar errores de abort
      if (err instanceof Error && err.message?.includes('abort')) {
        return;
      }
      console.error('Error fetching reported files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    // ⚡ PATRÓN OBLIGATORIO: esperar que auth esté listo
    if (authLoading) return;
    fetchFiles();
    
    // Cleanup: abortar requests pendientes al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, user?.id]);

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
  };
}