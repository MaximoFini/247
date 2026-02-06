import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MateriaUsuario, MateriaPlanEstudios, ProgresoAcademico, EstadoMateria } from '@/types/database';
import planEstudios from '@/data/plan_estudios_modificado.json';

const FETCH_TIMEOUT_MS = 10000; // 10s timeout

interface UseQueCursoReturn {
  materias: MateriaPlanEstudios[];
  loading: boolean;
  saving: boolean; // Nuevo: indicador de guardado
  error: string | null;
  progreso: ProgresoAcademico;
  isAuthenticated: boolean;
  updateEstadoMateria: (materiaId: number, nuevoEstado: EstadoMateria) => Promise<void>;
  initializeUserMaterias: () => Promise<void>;
  clearError: () => void; // Nuevo: limpiar errores
}

export function useQueCurso(): UseQueCursoReturn {
  const { loading: authLoading, user } = useAuth();
  
  const [materias, setMaterias] = useState<MateriaPlanEstudios[]>([]);
  const [materiasUsuario, setMateriasUsuario] = useState<MateriaUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Nuevo: estado de guardado
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<ProgresoAcademico>({
    obligatorias: { total: 36, aprobadas: 0, regulares: 0, porcentaje: 0 },
    electivas: { totalPuntos: 20, puntosObtenidos: 0 }
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const localMateriasRef = useRef<Map<number, EstadoMateria>>(new Map());

  // Cargar plan de estudios base
  useEffect(() => {
    const materiasBase = (planEstudios as MateriaPlanEstudios[]).map(m => ({
      ...m,
      estado: 2 as EstadoMateria // Por defecto bloqueada
    }));
    setMaterias(materiasBase);
  }, []);

  // Calcular progreso
  const calcularProgreso = useCallback((materiasConEstado: MateriaPlanEstudios[]) => {
    const obligatorias = materiasConEstado.filter(m => m.id <= 36);
    const aprobadas = obligatorias.filter(m => m.estado === 1).length;
    const regulares = obligatorias.filter(m => m.estado === 0).length;
    
    // Calcular puntos de electivas (id >= 50)
    const electivas = materiasConEstado.filter(m => m.id >= 50 && m.estado === 1);
    const puntosObtenidos = electivas.reduce((sum, m) => sum + m.creditos, 0);

    setProgreso({
      obligatorias: {
        total: 36,
        aprobadas,
        regulares,
        porcentaje: Math.round((aprobadas / 36) * 100)
      },
      electivas: {
        totalPuntos: 20,
        puntosObtenidos
      }
    });
  }, []);

  // Recalcular estados de materias basado en dependencias
  // Implementación optimizada que procesa materias en orden de dependencias
  const recalcularEstados = useCallback((materiasActuales: MateriaPlanEstudios[]): MateriaPlanEstudios[] => {
    // Crear copia profunda para no mutar el estado original
    const materiasMap = new Map(materiasActuales.map(m => [m.id, { ...m }]));
    const planEstudiosMap = new Map((planEstudios as MateriaPlanEstudios[]).map(m => [m.id, m]));

    // Paso 1: Mantener estados de materias aprobadas/regulares (no se pueden revertir automáticamente)
    // Paso 2: Para materias bloqueadas o cursables, recalcular basado en dependencias
    materiasActuales.forEach(materia => {
      // Si está aprobada o regular, mantener ese estado (decisión del usuario)
      if (materia.estado === 1 || materia.estado === 0) {
        return;
      }

      const planMateria = planEstudiosMap.get(materia.id);
      if (!planMateria) return;

      // Verificar requisitos de materias regulares (estado >= 0)
      const cumpleRegulares = planMateria.materiasQueNecesitaRegulares.every(reqId => {
        const req = materiasMap.get(reqId);
        return req && (req.estado === 0 || req.estado === 1); // Regular o Aprobada
      });

      // Verificar requisitos de materias aprobadas (estado === 1)
      const cumpleAprobadas = planMateria.materiasQueNecesitaAprobadas.every(reqId => {
        const req = materiasMap.get(reqId);
        return req && req.estado === 1; // Solo Aprobada
      });

      const materiaActualizada = materiasMap.get(materia.id);
      if (materiaActualizada) {
        // Solo puede ser cursable si cumple TODOS los requisitos
        if (cumpleRegulares && cumpleAprobadas) {
          materiaActualizada.estado = 3; // Cursable
        } else {
          materiaActualizada.estado = 2; // Bloqueada
        }
      }
    });

    return Array.from(materiasMap.values());
  }, []);

  // Fetch materias del usuario desde BD
  const fetchMateriasUsuario = useCallback(async () => {
    if (authLoading) {
      console.log("⏳ useQueCurso: esperando auth...");
      return;
    }
    
    if (!user?.id) {
      console.log("⚠️ useQueCurso: sin usuario, usando estados locales");
      // Usuario no autenticado - usar localStorage o estado local
      const materiasConEstadosLocales = materias.map(m => ({
        ...m,
        estado: (localMateriasRef.current.get(m.id) ?? m.estado) as EstadoMateria
      }));
      const materiasRecalculadas = recalcularEstados(materiasConEstadosLocales);
      setMaterias(materiasRecalculadas);
      calcularProgreso(materiasRecalculadas);
      setLoading(false);
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      console.log("🔍 useQueCurso: cargando materias del usuario...");
      
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.warn("⚠️ useQueCurso timeout (10s) - abortando");
        }
      }, FETCH_TIMEOUT_MS);

      const { data, error: fetchError } = await supabase
        .from('materias_usuario')
        .select('*')
        .eq('user_id', user.id)
        .abortSignal(abortControllerRef.current.signal);

      clearTimeout(timeoutId);

      if (fetchError) {
        if (fetchError.message?.includes('abort')) {
          console.log("⏹️ useQueCurso: request abortada");
          return;
        }
        throw fetchError;
      }

      setMateriasUsuario(data || []);
      
      // Si no hay materias, inicializar
      if (!data || data.length === 0) {
        console.log("📝 Usuario sin materias, necesita inicialización");
      } else {
        // Combinar plan de estudios con estados del usuario
        const estadosMap = new Map(data.map(m => [m.materia_id, m.estado as EstadoMateria]));
        const materiasConEstados = materias.map(m => ({
          ...m,
          estado: estadosMap.get(m.id) ?? m.estado
        }));
        
        const materiasRecalculadas = recalcularEstados(materiasConEstados);
        setMaterias(materiasRecalculadas);
        calcularProgreso(materiasRecalculadas);
        console.log("✅ useQueCurso: materias cargadas");
      }
    } catch (err) {
      if (err instanceof Error && err.message?.includes('abort')) {
        return;
      }
      console.error('Error fetching materias usuario:', err);
      setError('Error al cargar el progreso académico');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [authLoading, user?.id, materias, recalcularEstados, calcularProgreso]);

  // Inicializar materias para un usuario nuevo
  const initializeUserMaterias = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const { error } = await supabase.rpc('initialize_user_materias', {
        p_user_id: user.id
      });

      if (error) throw error;
      
      // Recargar materias
      await fetchMateriasUsuario();
    } catch (err) {
      console.error('Error initializing user materias:', err);
      throw err;
    }
  }, [user?.id, fetchMateriasUsuario]);

  // Actualizar estado de una materia
  const updateEstadoMateria = useCallback(async (materiaId: number, nuevoEstado: EstadoMateria) => {
    // Validación: verificar que el cambio es permitido
    const materia = materias.find(m => m.id === materiaId);
    if (!materia) {
      console.error('Materia no encontrada:', materiaId);
      setError('Materia no encontrada');
      return;
    }

    // Si no está autenticado, solo actualizar localmente
    if (!user?.id) {
      localMateriasRef.current.set(materiaId, nuevoEstado);
      
      const materiasActualizadas = materias.map(m =>
        m.id === materiaId ? { ...m, estado: nuevoEstado } : m
      );
      const materiasRecalculadas = recalcularEstados(materiasActualizadas);
      setMaterias(materiasRecalculadas);
      calcularProgreso(materiasRecalculadas);
      return;
    }

    // Guardar estado anterior para poder revertir
    const estadoAnterior = materia.estado;

    try {
      setSaving(true);
      setError(null);

      // Actualizar optimísticamente en UI
      const materiasActualizadas = materias.map(m =>
        m.id === materiaId ? { ...m, estado: nuevoEstado } : m
      );
      const materiasRecalculadas = recalcularEstados(materiasActualizadas);
      setMaterias(materiasRecalculadas);
      calcularProgreso(materiasRecalculadas);

      // Guardar en BD
      const { error: updateError } = await supabase
        .from('materias_usuario')
        .update({ estado: nuevoEstado })
        .eq('user_id', user.id)
        .eq('materia_id', materiaId);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Materia ${materiaId} actualizada a estado ${nuevoEstado}`);
    } catch (err) {
      console.error('Error en updateEstadoMateria:', err);
      setError('Error al guardar cambios. Revirtiendo...');
      
      // Revertir cambio
      const materiasRevertidas = materias.map(m =>
        m.id === materiaId ? { ...m, estado: estadoAnterior } : m
      );
      const materiasRecalculadas = recalcularEstados(materiasRevertidas);
      setMaterias(materiasRecalculadas);
      calcularProgreso(materiasRecalculadas);
      
      // Auto-clear error después de 3 segundos
      setTimeout(() => setError(null), 3000);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user?.id, materias, recalcularEstados, calcularProgreso]);

  useEffect(() => {
    if (authLoading || materias.length === 0) return;
    fetchMateriasUsuario();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, materias.length]);

  // Función para limpiar errores manualmente
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    materias,
    loading,
    saving,
    error,
    progreso,
    isAuthenticated: !!user,
    updateEstadoMateria,
    initializeUserMaterias,
    clearError
  };
}
