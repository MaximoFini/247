import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

export interface UserFile {
  id: string;
  nombre: string;
  tipo: "apunte" | "resumen" | "parcial" | "final" | "tp" | "guia";
  extension: string;
  tamanio_mb: number;
  descargas: number;
  drive_link: string;
  drive_file_id: string;
  activo: boolean;
  reportado: boolean;
  created_at: string;
  materia_nombre: string;
  comision_codigo: string;
}

interface UseUserFilesReturn {
  files: UserFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserFiles(): UseUserFilesReturn {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!user?.id) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("archivos")
        .select(
          `
          id,
          nombre,
          tipo,
          extension,
          tamanio_mb,
          descargas,
          drive_link,
          drive_file_id,
          activo,
          reportado,
          created_at,
          materia:materias(nombre),
          comision:comisiones(codigo)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        console.error("Error al cargar archivos del usuario:", queryError);
        setError(queryError.message);
        setFiles([]);
        return;
      }

      // Transformar datos para aplanar los JOINs
      const transformedFiles: UserFile[] = (data || []).map((file: any) => ({
        id: file.id,
        nombre: file.nombre,
        tipo: file.tipo,
        extension: file.extension,
        tamanio_mb: file.tamanio_mb,
        descargas: file.descargas,
        drive_link: file.drive_link,
        drive_file_id: file.drive_file_id,
        activo: file.activo,
        reportado: file.reportado,
        created_at: file.created_at,
        materia_nombre: file.materia?.nombre || "Sin materia",
        comision_codigo: file.comision?.codigo || "Sin comisión",
      }));

      setFiles(transformedFiles);
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Error al cargar tus archivos");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cargar archivos cuando el usuario cambia
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
  };
}
