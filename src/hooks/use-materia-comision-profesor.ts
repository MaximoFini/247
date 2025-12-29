import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface MateriaComisionProfesor {
  id: string;
  materia_id: string;
  comision_id: string;
  profesor_id: string;
  created_at: string;
  // Datos relacionados
  materia_nombre?: string;
  comision_codigo?: string;
  profesor_nombre?: string;
}

export interface SelectOption {
  id: string;
  nombre?: string;
  codigo?: string;
}

export function useMateriaComisionProfesor() {
  const [relaciones, setRelaciones] = useState<MateriaComisionProfesor[]>([]);
  const [materias, setMaterias] = useState<SelectOption[]>([]);
  const [comisiones, setComisiones] = useState<SelectOption[]>([]);
  const [profesores, setProfesores] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch todas las relaciones con datos relacionados
      const [relacionesRes, materiasRes, comisionesRes, profesoresRes] = await Promise.all([
        supabase
          .from('materia_comision_profesor')
          .select(`
            id,
            materia_id,
            comision_id,
            profesor_id,
            created_at,
            materia:materias(nombre),
            comision:comisiones(codigo),
            profesor:profesores(nombre)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('materias').select('id, nombre').order('nombre'),
        supabase.from('comisiones').select('id, codigo').order('codigo'),
        supabase.from('profesores').select('id, nombre').order('nombre'),
      ]);

      if (relacionesRes.error) throw relacionesRes.error;
      if (materiasRes.error) throw materiasRes.error;
      if (comisionesRes.error) throw comisionesRes.error;
      if (profesoresRes.error) throw profesoresRes.error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedRelaciones: MateriaComisionProfesor[] = (relacionesRes.data || []).map((r: any) => ({
        id: r.id,
        materia_id: r.materia_id,
        comision_id: r.comision_id,
        profesor_id: r.profesor_id,
        created_at: r.created_at,
        materia_nombre: r.materia?.nombre || 'N/A',
        comision_codigo: r.comision?.codigo || 'N/A',
        profesor_nombre: r.profesor?.nombre || 'N/A',
      }));

      setRelaciones(transformedRelaciones);
      setMaterias(materiasRes.data || []);
      setComisiones(comisionesRes.data || []);
      setProfesores(profesoresRes.data || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRelacion = async (
    materia_id: string,
    comision_id: string,
    profesor_id: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('materia_comision_profesor')
        .insert({ materia_id, comision_id, profesor_id });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Esta combinación de materia, comisión y profesor ya existe');
        }
        throw error;
      }

      await fetchData();
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error creating relacion:', err);
      throw err;
    }
  };

  const deleteRelacion = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('materia_comision_profesor')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRelaciones((prev) => prev.filter((r) => r.id !== id));
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error deleting relacion:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    relaciones,
    materias,
    comisiones,
    profesores,
    loading,
    error,
    refetch: fetchData,
    createRelacion,
    deleteRelacion,
  };
}
