import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Hilo, Respuesta } from "@/types/database";

const HILO_SELECT_ADMIN = `
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

const RESPUESTA_SELECT_ADMIN = `
  id,
  hilo_id,
  user_id,
  contenido,
  es_incognito,
  activo,
  created_at,
  autor:users!respuestas_user_id_fkey(id, nombre),
  hilo:hilos!respuestas_hilo_id_fkey(titulo)
`;

export function useAdminForo() {
  const queryClient = useQueryClient();

  const hilosQuery = useQuery({
    queryKey: ["admin-foro-hilos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hilos")
        .select(HILO_SELECT_ADMIN)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as (Hilo & {
        autor: { id: string; nombre: string } | null;
      })[];
    },
    staleTime: 1000 * 60 * 1,
  });

  const respuestasQuery = useQuery({
    queryKey: ["admin-foro-respuestas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("respuestas")
        .select(RESPUESTA_SELECT_ADMIN)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []) as (Respuesta & {
        autor: { id: string; nombre: string } | null;
        hilo: { titulo: string } | null;
      })[];
    },
    staleTime: 1000 * 60 * 1,
  });

  const deactivateHilo = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("hilos")
        .update({ activo: false })
        .eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-foro-hilos"] });
      await queryClient.invalidateQueries({ queryKey: ["foro"] });
    },
    [queryClient],
  );

  const activateHilo = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("hilos")
        .update({ activo: true })
        .eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-foro-hilos"] });
      await queryClient.invalidateQueries({ queryKey: ["foro"] });
    },
    [queryClient],
  );

  const deleteHilo = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("hilos").delete().eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-foro-hilos"] });
      await queryClient.invalidateQueries({ queryKey: ["foro"] });
    },
    [queryClient],
  );

  const deactivateRespuesta = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("respuestas")
        .update({ activo: false })
        .eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ["admin-foro-respuestas"],
      });
    },
    [queryClient],
  );

  const deleteRespuesta = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("respuestas").delete().eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ["admin-foro-respuestas"],
      });
    },
    [queryClient],
  );

  return {
    hilos: hilosQuery.data ?? [],
    respuestas: respuestasQuery.data ?? [],
    loadingHilos: hilosQuery.isLoading,
    loadingRespuestas: respuestasQuery.isLoading,
    errorHilos: hilosQuery.error ? (hilosQuery.error as Error).message : null,
    errorRespuestas: respuestasQuery.error
      ? (respuestasQuery.error as Error).message
      : null,
    deactivateHilo,
    activateHilo,
    deleteHilo,
    deactivateRespuesta,
    deleteRespuesta,
  };
}
