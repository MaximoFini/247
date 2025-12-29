import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useReportFile() {
  const { user } = useAuth();

  const reportFile = async (archivoId: string, motivo: string): Promise<boolean> => {
    if (!user) {
      toast.error('Debes iniciar sesión para reportar archivos');
      return false;
    }

    try {
      // Actualizar el archivo como reportado
      const { error } = await supabase
        .from('archivos')
        .update({
          reportado: true,
          motivo_reporte: motivo,
          reportado_at: new Date().toISOString(),
          reportado_por: user.id,
        })
        .eq('id', archivoId);

      if (error) {
        console.error('Error al reportar archivo:', error);
        toast.error('Error al reportar el archivo');
        return false;
      }

      toast.success('Archivo reportado correctamente');
      return true;
    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error al reportar el archivo');
      return false;
    }
  };

  return { reportFile, isAuthenticated: !!user };
}
