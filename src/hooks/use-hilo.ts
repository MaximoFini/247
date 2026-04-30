import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Hilo, Respuesta } from "@/types/database";

const HILO_SELECT = `
  id,
  user_id,
  titulo,
  contenido,
  es_incognito,
  activo,
  respuestas_count,
  created_at,
  updated_at,
  autor:users!hilos_user_id_fkey(id, nombre)
`;

const RESPUESTA_SELECT = `
  id,
  hilo_id,
  user_id,
  contenido,
  es_incognito,
  activo,
  created_at,
  autor:users!respuestas_user_id_fkey(id, nombre)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformHilo(h: any): Hilo {
  return {
    id: h.id,
    user_id: h.user_id,
    titulo: h.titulo,
    contenido: h.contenido,
    es_incognito: h.es_incognito,
    activo: h.activo,
    respuestas_count: h.respuestas_count,
    created_at: h.created_at,
    updated_at: h.updated_at,
    autor: h.es_incognito ? null : (h.autor ?? null),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRespuesta(r: any): Respuesta {
  return {
    id: r.id,
    hilo_id: r.hilo_id,
    user_id: r.user_id,
    contenido: r.contenido,
    es_incognito: r.es_incognito,
    activo: r.activo,
    created_at: r.created_at,
    autor: r.es_incognito ? null : (r.autor ?? null),
  };
}

export function useHilo(id: string) {
  const hiloQuery = useQuery({
    queryKey: ["hilo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hilos")
        .select(HILO_SELECT)
        .eq("id", id)
        .single();
      if (error) throw error;
      return transformHilo(data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

  const respuestasQuery = useQuery({
    queryKey: ["hilo", id, "respuestas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("respuestas")
        .select(RESPUESTA_SELECT)
        .eq("hilo_id", id)
        .eq("activo", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(transformRespuesta);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });

  return {
    hilo: hiloQuery.data ?? null,
    respuestas: respuestasQuery.data ?? [],
    loading: hiloQuery.isLoading,
    loadingRespuestas: respuestasQuery.isLoading,
    error: hiloQuery.error ? (hiloQuery.error as Error).message : null,
  };
}
