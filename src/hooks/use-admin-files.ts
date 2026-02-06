import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AdminArchivo } from '@/types/admin';

// Configuración de paginación
const PAGE_SIZE = 30; // Archivos por página

// Campos a seleccionar (optimizado - sin SELECT *)
const FILE_SELECT_FIELDS = `
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
`;

interface UseAdminFilesReturn {
  files: AdminArchivo[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  deleteFile: (id: string) => Promise<boolean>;
  toggleActive: (id: string, activo: boolean) => Promise<boolean>;
  updateFile: (id: string, updates: Partial<AdminArchivo>) => Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformFile(file: any): AdminArchivo {
  return {
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
  };
}

export function useAdminFiles(): UseAdminFilesReturn {
  const [files, setFiles] = useState<AdminArchivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Ref para tracking de offset (evita re-renders)
  const offsetRef = useRef(0);

  // Cargar primera página
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;

    try {
      // Primero obtener el count total (query separada, más eficiente)
      const { count } = await supabase
        .from('archivos')
        .select('id', { count: 'exact', head: true });
      
      setTotalCount(count || 0);

      // Luego obtener primera página de datos
      const { data, error: queryError } = await supabase
        .from('archivos')
        .select(FILE_SELECT_FIELDS)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (queryError) {
        console.error('Error al cargar archivos:', queryError);
        setError(queryError.message);
        setFiles([]);
        return;
      }

      const transformedFiles = (data || []).map(transformFile);
      setFiles(transformedFiles);
      setHasMore(transformedFiles.length === PAGE_SIZE);
      offsetRef.current = transformedFiles.length;
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error al cargar archivos');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar más archivos (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const { data, error: queryError } = await supabase
        .from('archivos')
        .select(FILE_SELECT_FIELDS)
        .order('created_at', { ascending: false })
        .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);

      if (queryError) {
        console.error('Error al cargar más archivos:', queryError);
        return;
      }

      const newFiles = (data || []).map(transformFile);
      
      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        offsetRef.current += newFiles.length;
      }
      
      setHasMore(newFiles.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error inesperado al cargar más:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

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
      setTotalCount((prev) => prev - 1);
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
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadMore,
    refetch: fetchFiles,
    deleteFile,
    toggleActive,
    updateFile,
  };
}
