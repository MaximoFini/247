import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

async function fetchFilterOptions() {
  const [materiasRes, comisionesRes] = await Promise.all([
    supabase.from("materias").select("nombre").order("nombre"),
    supabase.from("comisiones").select("codigo").order("codigo"),
  ]);

  if (materiasRes.error) throw materiasRes.error;
  if (comisionesRes.error) throw comisionesRes.error;

  return {
    subjects: (materiasRes.data ?? []).map((m) => m.nombre as string),
    commissions: (comisionesRes.data ?? []).map((c) => c.codigo as string),
  };
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
