import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WEEKLY_LIMIT = 3;

interface CrearHiloInput {
  titulo: string;
  contenido: string;
  es_incognito: boolean;
}

interface UseCrearHiloReturn {
  creating: boolean;
  error: string | null;
  crearHilo: (input: CrearHiloInput) => Promise<string | null>;
}

export function useCrearHilo(): UseCrearHiloReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearHilo = async (input: CrearHiloInput): Promise<string | null> => {
    if (!user?.id) {
      setError("Debés iniciar sesión para crear un hilo.");
      return null;
    }

    setCreating(true);
    setError(null);

    try {
      // Chequear rate limit
      const { data: count, error: rpcError } = await supabase.rpc(
        "get_hilos_this_week",
        { target_user_id: user.id },
      );

      if (rpcError) throw rpcError;

      if ((count as number) >= WEEKLY_LIMIT) {
        setError(
          `Podés crear máximo ${WEEKLY_LIMIT} hilos por semana. Ya creaste ${count}.`,
        );
        return null;
      }

      const { data, error: insertError } = await supabase
        .from("hilos")
        .insert({
          user_id: user.id,
          titulo: input.titulo.trim(),
          contenido: input.contenido.trim(),
          es_incognito: input.es_incognito,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["foro"] });

      return data.id as string;
    } catch (err) {
      setError((err as Error).message ?? "Error al crear el hilo.");
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { creating, error, crearHilo };
}
