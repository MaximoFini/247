import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Hilo } from "@/types/database";

const PAGE_SIZE = 15;
const DEBOUNCE_MS = 300;

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

interface UseForoReturn {
  hilos: Hilo[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  search: string;
  setSearch: (v: string) => void;
  loadMore: () => void;
}

export function useForo(): UseForoReturn {
  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [allHilos, setAllHilos] = useState<Hilo[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(0);
      setAllHilos([]);
      setHasMore(true);
    }, DEBOUNCE_MS);
  }, []);

  const queryKey = ["foro", debouncedSearch, page];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const term = debouncedSearch.trim();
      let query = supabase
        .from("hilos")
        .select(HILO_SELECT)
        .eq("activo", true)
        .order("updated_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (term.length >= 2) {
        query = query.or(`titulo.ilike.%${term}%,contenido.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(transformHilo);
    },
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (!data) return;
    if (page === 0) {
      setAllHilos(data);
    } else {
      setAllHilos((prev) => [...prev, ...data]);
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || isLoading) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  }, [hasMore, loadingMore, isLoading]);

  return {
    hilos: allHilos,
    loading: isLoading && page === 0,
    loadingMore,
    error: error ? (error as Error).message : null,
    hasMore,
    search,
    setSearch,
    loadMore,
  };
}
