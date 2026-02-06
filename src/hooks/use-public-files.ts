import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { sanitizeSearchInput, INPUT_LIMITS } from "@/lib/validation";

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

// Límites optimizados para rendimiento
const TOP_FILES_LIMIT = 20;
const SEARCH_RESULTS_LIMIT = 30; // Reducido de 50 para menor payload
const DEBOUNCE_MS = 300;

// Campos mínimos necesarios (evitar SELECT *)
const FILE_SELECT_FIELDS = `
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
`;

// Transformador optimizado (inline para evitar llamadas de función)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformFile = (file: any): PublicFile => ({
  id: file.id,
  name: file.nombre,
  subject: file.materia?.nombre || "Sin materia",
  commission: file.comision?.codigo || "Sin comisión",
  fileType: file.tipo,
  size: `${file.tamanio_mb} MB`,
  downloads: file.descargas,
  uploadDate: new Date(file.created_at).toLocaleDateString("es-AR"),
  uploadedBy: file.user?.email || "Anónimo",
  link: file.drive_link,
  extension: file.extension,
});

/**
 * CARGA INICIAL: TOP 20 archivos ordenados por descargas
 * Optimizado con campos específicos y límite
 */
async function fetchTopFiles(): Promise<PublicFile[]> {
  const { data, error } = await supabase
    .from("archivos")
    .select(FILE_SELECT_FIELDS)
    .eq("activo", true)
    .order("descargas", { ascending: false })
    .limit(TOP_FILES_LIMIT);

  if (error) {
    console.error("Error al cargar top archivos:", error);
    throw error;
  }

  return data?.map(transformFile) || [];
}

/**
 * BÚSQUEDA: Buscar por nombre con ILIKE
 * Limitado a 30 resultados para performance
 * Sanitiza el input para prevenir inyecciones
 */
async function searchFiles(searchTerm: string): Promise<PublicFile[]> {
  // Sanitizar término de búsqueda (escapa %, _, \)
  const sanitizedTerm = sanitizeSearchInput(searchTerm, INPUT_LIMITS.SEARCH);
  
  // Si después de sanitizar queda vacío, retornar vacío
  if (!sanitizedTerm) {
    return [];
  }
  
  const { data, error } = await supabase
    .from("archivos")
    .select(FILE_SELECT_FIELDS)
    .eq("activo", true)
    .ilike("nombre", `%${sanitizedTerm}%`)
    .order("descargas", { ascending: false })
    .limit(SEARCH_RESULTS_LIMIT);

  if (error) {
    console.error("Error al buscar archivos:", error);
    throw error;
  }

  return data?.map(transformFile) || [];
}

/**
 * Hook para carga inicial de TOP 20 archivos
 * Cache agresivo de 10 minutos
 */
export function usePublicFiles() {
  return useQuery({
    queryKey: ["public-files-top"],
    queryFn: fetchTopFiles,
    staleTime: 1000 * 60 * 10, // 10 minutos frescos (aumentado)
    gcTime: 1000 * 60 * 30, // 30 minutos en caché
    refetchOnMount: false, // No refetch en mount si hay cache
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para búsqueda
 * Cache de 5 minutos por término
 */
export function usePublicFilesSearch(searchTerm: string) {
  return useQuery({
    queryKey: ["public-files-search", searchTerm],
    queryFn: () => searchFiles(searchTerm),
    enabled: searchTerm.length >= 2, // Mínimo 2 caracteres para buscar
    staleTime: 1000 * 60 * 5, // 5 minutos frescos
    gcTime: 1000 * 60 * 15, // 15 minutos en caché
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook combinado optimizado con debounce nativo
 */
export function useFilesWithSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Query para TOP 20 (carga inicial)
  const topFilesQuery = usePublicFiles();
  
  // Query para búsqueda
  const searchQuery = usePublicFilesSearch(debouncedSearch);

  // Cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Función de búsqueda con debounce optimizado
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Si está vacío, limpiar inmediatamente
    if (term.trim() === "") {
      setDebouncedSearch("");
      return;
    }

    // Debounce de 300ms para búsqueda
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(term.trim());
    }, DEBOUNCE_MS);
  }, []);

  // Determinar qué datos mostrar
  const isSearching = debouncedSearch.length >= 2;
  const files = isSearching ? (searchQuery.data || []) : (topFilesQuery.data || []);
  const isLoading = isSearching ? searchQuery.isLoading : topFilesQuery.isLoading;
  const isSearchPending = searchTerm !== debouncedSearch && searchTerm.length > 0;

  return {
    files,
    isLoading,
    isSearchPending, // True mientras se espera el debounce
    isShowingTopFiles: !isSearching, // True cuando muestra TOP 20
    searchTerm,
    handleSearch,
    refetch: isSearching ? searchQuery.refetch : topFilesQuery.refetch,
  };
}
