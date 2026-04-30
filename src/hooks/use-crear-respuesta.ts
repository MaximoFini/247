import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CrearRespuestaInput {
  hilo_id: string;
  contenido: string;
  es_incognito: boolean;
}

interface UseCrearRespuestaReturn {
  creating: boolean;
  error: string | null;
  crearRespuesta: (input: CrearRespuestaInput) => Promise<boolean>;
}

export function useCrearRespuesta(): UseCrearRespuestaReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearRespuesta = async (
    input: CrearRespuestaInput,
  ): Promise<boolean> => {
    if (!user?.id) {
      setError("Debés iniciar sesión para responder.");
      return false;
    }

    setCreating(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("respuestas").insert({
        hilo_id: input.hilo_id,
        user_id: user.id,
        contenido: input.contenido.trim(),
        es_incognito: input.es_incognito,
      });

      if (insertError) throw insertError;

      await queryClient.invalidateQueries({
        queryKey: ["hilo", input.hilo_id],
      });

      return true;
    } catch (err) {
      setError((err as Error).message ?? "Error al enviar la respuesta.");
      return false;
    } finally {
      setCreating(false);
    }
  };

  return { creating, error, crearRespuesta };
}
