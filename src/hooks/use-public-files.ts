import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export interface PublicFile {
  id: string;
  name: string;
  subject: string;
  commission: string;
  fileType: string;
  size: string;
  downloads: number;
  uploadDate: string;
  uploadedBy: string;
  link: string;
  extension: string;
}

async function fetchPublicFiles(): Promise<PublicFile[]> {
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
      created_at,
      materia:materias(nombre),
      comision:comisiones(codigo),
      user:users!archivos_user_id_fkey(email)
    `
    )
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar archivos:", error);
    throw error;
  }

  // Transformar datos al formato esperado
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.map((file: any) => ({
      id: file.id,
      name: file.nombre,
      subject: file.materia?.nombre || "Sin materia",
      commission: file.comision?.codigo || "Sin comisión",
      fileType: file.tipo,
      size: `${file.tamanio_mb} MB`,
      downloads: file.descargas,
      uploadDate: new Date(file.created_at).toLocaleDateString(),
      uploadedBy: file.user?.email || "Anónimo",
      link: file.drive_link,
      extension: file.extension,
    })) || []
  );
}

export function usePublicFiles() {
  return useQuery({
    queryKey: ["public-files"],
    queryFn: fetchPublicFiles,
    staleTime: 1000 * 60 * 2, // 2 minutos frescos
    gcTime: 1000 * 60 * 10, // 10 minutos en caché
  });
}
