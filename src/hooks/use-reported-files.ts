import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AdminArchivoReportado } from '@/types/admin';

export function useReportedFiles() {
  const [files, setFiles] = useState<AdminArchivoReportado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('admin_archivos_reportados')
        .select('*');

      if (fetchError) throw fetchError;

      setFiles(data || []);
    } catch (err: any) {
      console.error('Error fetching reported files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
  };
}