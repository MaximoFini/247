import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

const FETCH_TIMEOUT_MS = 10000; // 10s timeout

export function useMateriaComisionProfesor() {
  const { loading: authLoading, user } = useAuth();
  
  const [relaciones, setRelaciones] = useState<MateriaComisionProfesor[]>([]);
  const [materias, setMaterias] = useState<SelectOption[]>([]);
  const [comisiones, setComisiones] = useState<SelectOption[]>([]);
  const [profesores, setProfesores] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // ⚡ PATRÓN OBLIGATORIO: Verificar auth antes de cargar
    if (authLoading) {
      console.log("⏳ useMateriaComisionProfesor: esperando auth...");
      return;
    }
    
    if (!user?.id) {
      console.log("⚠️ useMateriaComisionProfesor: sin usuario, limpiando data");
      setRelaciones([]);
      setMaterias([]);
      setComisiones([]);
      setProfesores([]);
      setLoading(false);
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    console.log("🔍 useMateriaComisionProfesor: cargando...");

    // Timeout para las requests
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.warn("⚠️ useMateriaComisionProfesor timeout (10s) - abortando");
      }
    }, FETCH_TIMEOUT_MS);

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
          .order('created_at', { ascending: false })
          .abortSignal(abortControllerRef.current.signal),
        supabase.from('materias').select('id, nombre').order('nombre').abortSignal(abortControllerRef.current.signal),
        supabase.from('comisiones').select('id, codigo').order('codigo').abortSignal(abortControllerRef.current.signal),
        supabase.from('profesores').select('id, nombre').order('nombre').abortSignal(abortControllerRef.current.signal),
      ]);

      clearTimeout(timeoutId);

      // Verificar si fue abortado
      if (relacionesRes.error?.message?.includes('abort') || 
          materiasRes.error?.message?.includes('abort') ||
          comisionesRes.error?.message?.includes('abort') ||
          profesoresRes.error?.message?.includes('abort')) {
        console.log("⏹️ useMateriaComisionProfesor: requests abortadas");
        return;
      }

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
      console.log("✅ useMateriaComisionProfesor: cargado");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Ignorar errores de abort
      if (err instanceof Error && err.message?.includes('abort')) {
        return;
      }
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [authLoading, user?.id]);

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
    // ⚡ PATRÓN OBLIGATORIO: esperar que auth esté listo
    if (authLoading) return;
    fetchData();
    
    // Cleanup: abortar requests pendientes al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, fetchData]);

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
