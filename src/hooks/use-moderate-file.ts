import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type ModerationAction =
  | "activate"
  | "deactivate"
  | "approve"
  | "reject"
  | "delete";

export function useModerateFile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moderateFile = async (
    archivoId: string,
    action: ModerationAction,
    r2Key?: string,
  ) => {
    if (!user) {
      setError("No autenticado");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) throw new Error("No hay token");

      if (action === "delete") {
        // Intentar borrar de R2 primero (falla en silencio si no hay r2Key o falla el request)
        if (r2Key) {
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/delete-r2-file`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ r2Key }),
            });
          } catch (r2Err) {
            console.error("Error al eliminar de R2 (no crítico):", r2Err);
          }
        }

        const { error: deleteError } = await supabase
          .from("archivos")
          .delete()
          .eq("id", archivoId);

        if (deleteError) throw deleteError;
        setLoading(false);
        return true;
      }

      if (action === "reject") {
        const { error: rejectError } = await supabase
          .from("archivos")
          .update({
            reportado: false,
            motivo_reporte: null,
            reportado_at: null,
            reportado_por: null,
          })
          .eq("id", archivoId);

        if (rejectError) throw rejectError;
        setLoading(false);
        return true;
      }

      if (action === "activate" || action === "deactivate") {
        const { error: updateError } = await supabase
          .from("archivos")
          .update({ activo: action === "activate" })
          .eq("id", archivoId);

        if (updateError) throw updateError;
        setLoading(false);
        return true;
      }

      if (action === "approve") {
        const { error: approveError } = await supabase
          .from("archivos")
          .update({
            reportado: false,
            motivo_reporte: null,
            reportado_at: null,
            reportado_por: null,
            activo: true,
          })
          .eq("id", archivoId);

        if (approveError) throw approveError;
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (err: any) {
      console.error("Error moderando archivo:", err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  return {
    moderateFile,
    loading,
    error,
  };
}
