import { useQuery } from "@tanstack/react-query";
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

/**
 * ⚡ FASE 2: Hook optimizado con React Query
 * Se re-ejecuta automáticamente cuando user cambia de null → definido
 */
export function useUserFiles() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["files", "user", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("No user ID");
      }

      const { data, error } = await supabase
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

      if (error) throw error;

      // Transformar datos
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

      return transformedFiles;
    },
    enabled: !loading && !!user?.id, // ⚡ Solo cuando auth termine Y haya user
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
}
