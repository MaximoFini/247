import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AdminArchivo } from '@/types/admin';

interface UseAdminFilesReturn {
  files: AdminArchivo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteFile: (id: string) => Promise<boolean>;
  toggleActive: (id: string, activo: boolean) => Promise<boolean>;
  updateFile: (id: string, updates: Partial<AdminArchivo>) => Promise<boolean>;
}

export function useAdminFiles(): UseAdminFilesReturn {
  const [files, setFiles] = useState<AdminArchivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('archivos')
        .select(`
          id,
          nombre,
          tipo,
          extension,
          drive_link,
          tamanio_mb,
          descargas,
          activo,
          reportado,
          created_at,
          materia:materias(nombre),
          comision:comisiones(codigo),
          usuario:users!archivos_user_id_fkey(nombre, email)
        `)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error al cargar archivos:', queryError);
        setError(queryError.message);
        setFiles([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedFiles: AdminArchivo[] = (data || []).map((file: any) => ({
        id: file.id,
        nombre: file.nombre,
        tipo: file.tipo,
        extension: file.extension,
        drive_link: file.drive_link,
        tamanio_mb: file.tamanio_mb,
        descargas: file.descargas,
        activo: file.activo,
        reportado: file.reportado,
        created_at: file.created_at,
        materia_nombre: file.materia?.nombre || null,
        comision_codigo: file.comision?.codigo || null,
        uploader_nombre: file.usuario?.nombre || null,
        uploader_email: file.usuario?.email || null,
      }));

      setFiles(transformedFiles);
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error al cargar archivos');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('archivos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar archivo:', error);
        return false;
      }

      setFiles((prev) => prev.filter((f) => f.id !== id));
      return true;
    } catch (err) {
      console.error('Error inesperado:', err);
      return false;
    }
  };

  const toggleActive = async (id: string, activo: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('archivos')
        .update({ activo })
        .eq('id', id);

      if (error) {
        console.error('Error al actualizar archivo:', error);
        return false;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, activo } : f))
      );
      return true;
    } catch (err) {
      console.error('Error inesperado:', err);
      return false;
    }
  };

  const updateFile = async (id: string, updates: Partial<AdminArchivo>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('archivos')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error al actualizar archivo:', error);
        return false;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
      return true;
    } catch (err) {
      console.error('Error inesperado:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
    deleteFile,
    toggleActive,
    updateFile,
  };
}
