import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type ModerationAction = 'activate' | 'deactivate' | 'approve' | 'reject' | 'delete';

export function useModerateFile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moderateFile = async (archivoId: string, action:  ModerationAction) => {
    if (!user) {
      setError('No autenticado');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth. getSession();
      const token = session.data.session?. access_token;

      if (! token) throw new Error('No hay token');

      // Si es delete, usar directamente Supabase (no hace falta Edge Function)
      if (action === 'delete') {
        const { error: deleteError } = await supabase
          .from('archivos')
          .delete()
          .eq('id', archivoId);

        if (deleteError) throw deleteError;
        setLoading(false);
        return true;
      }

      // Si es reject, quitar el estado de reportado directamente en Supabase
      if (action === 'reject') {
        const { error: rejectError } = await supabase
          .from('archivos')
          .update({
            reportado: false,
            motivo_reporte: null,
            reportado_at: null,
            reportado_por: null,
          })
          .eq('id', archivoId);

        if (rejectError) throw rejectError;
        setLoading(false);
        return true;
      }

      // Para otras acciones, usar Edge Function
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/moderate-file`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ archivo_id: archivoId, action }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al moderar archivo');
      }

      console.log(`✅ Archivo ${action}d`);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error moderando archivo:', err);
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