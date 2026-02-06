import { useState, useMemo, useCallback, useEffect } from "react";
import { Loader2, BookOpen } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useQueCurso } from "@/hooks/use-que-curso";
import type { MateriaPlanEstudios, EstadoMateria } from "@/types/database";

// Organización de materias por año según iuquecurso.html
const MATERIAS_POR_ANIO = {
  1: [1, 2, 3, 4, 5, 6, 7, 8],
  2: [9, 10, 11, 12, 13, 14, 15, 16, 17],
  3: [19, 20, 21, 22, 23, 18, 99, 50],
  4: [25, 26, 27, 28, 29, 30, 24, 51, 52, 53, 54, 55, 56, 57],
  5: [31, 32, 33, 34, 35, 36, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68],
};

const ELECTIVAS_IDS = new Set([
  50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
]);

const QueCurso = () => {
  const {
    materias,
    loading,
    saving,
    error,
    progreso,
    isAuthenticated,
    updateEstadoMateria,
    initializeUserMaterias,
    clearError,
  } = useQueCurso();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Keyboard shortcuts para accesibilidad
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cerrar modal con ESC
      if (e.key === "Escape" && showLoginModal) {
        setShowLoginModal(false);
      }

      // Cerrar error con ESC
      if (e.key === "Escape" && error) {
        clearError();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showLoginModal, error, clearError]);

  // Manejar click en materia
  const handleMateriaClick = useCallback(
    async (materia: MateriaPlanEstudios) => {
      // Si está bloqueada, no hacer nada
      if (materia.estado === 2) return;

      // Si no está autenticado, mostrar modal
      if (!isAuthenticated) {
        setShowLoginModal(true);
        return;
      }

      // Ciclo de estados: Cursable(3) -> Aprobada(1) -> Regular(0) -> Cursable(3)
      let nuevoEstado: EstadoMateria;

      if (materia.estado === 3) {
        nuevoEstado = 1; // Cursable -> Aprobada
      } else if (materia.estado === 1) {
        nuevoEstado = 0; // Aprobada -> Regular
      } else {
        nuevoEstado = 3; // Regular -> Cursable
      }

      try {
        await updateEstadoMateria(materia.id, nuevoEstado);
      } catch (err) {
        console.error("Error al actualizar materia:", err);
      }
    },
    [isAuthenticated, updateEstadoMateria],
  );

  // Inicializar materias si el usuario no las tiene
  const handleInitialize = async () => {
    setInitializing(true);
    try {
      await initializeUserMaterias();
    } catch (err) {
      console.error("Error al inicializar materias:", err);
    } finally {
      setInitializing(false);
    }
  };

  // Marcar todas las materias de un año como aprobadas (excepto electivas)
  const handleApproveYearMaterias = useCallback(
    async (anio: string) => {
      if (!isAuthenticated) {
        setShowLoginModal(true);
        return;
      }

      const materiaIds =
        MATERIAS_POR_ANIO[anio as keyof typeof MATERIAS_POR_ANIO] || [];

      // Filtrar solo materias no electivas y que no sean aprobadas
      const materiasAActualizar = materiaIds.filter((id) => {
        const materia = materias.find((m) => m.id === id);
        return materia && !ELECTIVAS_IDS.has(id) && materia.estado !== 1;
      });

      // Marcar todas como aprobadas
      for (const materiaId of materiasAActualizar) {
        try {
          await updateEstadoMateria(materiaId, 1);
        } catch (err) {
          console.error(
            `Error al marcar materia ${materiaId} como aprobada:`,
            err,
          );
        }
      }
    },
    [isAuthenticated, materias, updateEstadoMateria],
  );

  // Obtener clases CSS según estado - EXACTAMENTE como iuquecurso.html
  const getEstadoClasses = (estado: EstadoMateria, isElectiva: boolean) => {
    const baseClasses =
      "group relative bg-[#1a1a1a] p-4 h-32 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background";
    const borderType = isElectiva ? "border border-dashed" : "border";

    switch (estado) {
      case 1: // Aprobada - Naranja fuerte
        return `${baseClasses} ${borderType} border-[#ff9500] hover:bg-[#ff9500]/5 active:bg-[#ff9500]/10 focus:ring-[#ff9500]`;
      case 0: // Regular - Azul neón #00b3ff
        return `${baseClasses} ${borderType} border-[#00b3ff] hover:bg-[#00b3ff]/5 active:bg-[#00b3ff]/10 focus:ring-[#00b3ff]`;
      case 3: // Cursable - Verde #ccff00
        return `${baseClasses} ${borderType} border-primary/60 hover:bg-primary/5 hover:border-primary active:bg-primary/10`;
      case 2: // Bloqueada - Gris
      default:
        return `${baseClasses} ${borderType} border-gray-700 opacity-80 hover:opacity-100 hover:border-gray-500 ${isElectiva ? "hover:border-primary/50" : ""} cursor-not-allowed active:scale-100 focus:ring-0`;
    }
  };

  // Obtener texto e icono según estado - EXACTAMENTE como iuquecurso.html
  const getEstadoInfo = (estado: EstadoMateria) => {
    switch (estado) {
      case 1: // Aprobada
        return {
          text: "Aprobada",
          icon: "check_circle",
          color: "text-[#ff9500]", // Naranja fuerte
          textColor: "text-white", // Texto blanco para aprobadas
        };
      case 0: // Regular
        return {
          text: "Regular",
          icon: "schedule",
          color: "text-[#00b3ff]", // Azul neón
          textColor: "text-white", // Texto blanco para regulares
        };
      case 3: // Cursable
        return {
          text: "Cursable",
          icon: "radio_button_unchecked",
          color: "text-primary",
          textColor: "text-white group-hover:text-primary",
        };
      case 2: // Bloqueada
      default:
        return {
          text: "Bloqueada",
          icon: "lock",
          color: "text-gray-600",
          textColor: "text-gray-500",
        };
    }
  };

  const renderMateria = useCallback(
    (materia: MateriaPlanEstudios) => {
      const isElectiva = ELECTIVAS_IDS.has(materia.id);
      const estadoInfo = getEstadoInfo(materia.estado);
      const isBloqueada = materia.estado === 2;

      return (
        <div
          key={materia.id}
          className={getEstadoClasses(materia.estado, isElectiva)}
          onClick={() => handleMateriaClick(materia)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isBloqueada) {
              e.preventDefault();
              handleMateriaClick(materia);
            }
          }}
          role="button"
          tabIndex={isBloqueada ? -1 : 0}
          aria-label={`${materia.apodo} - ${materia.nombre}. Estado: ${estadoInfo.text}${isBloqueada ? ". Bloqueada, no se puede cambiar" : ". Presiona Enter o Space para cambiar estado"}`}
          aria-disabled={isBloqueada}
        >
          {isElectiva && (
            <div className="absolute top-2 right-2 text-[9px] text-primary/70 border border-primary/30 px-1 rounded uppercase tracking-wider">
              Electiva
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span
              className={`font-bold text-xl ${
                materia.estado === 2
                  ? estadoInfo.textColor
                  : `${estadoInfo.textColor} transition-colors`
              }`}
            >
              {materia.apodo}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest truncate">
              {materia.nombre}
            </span>
          </div>

          {isElectiva && materia.creditos > 0 && (
            <div className="text-[9px] text-primary/60 mt-2 font-light">
              Suman {materia.creditos} créditos
            </div>
          )}

          <div
            className={`flex justify-between items-end pt-2 mt-2 ${
              materia.estado === 1
                ? "border-t border-[#ff9500]/20"
                : materia.estado === 0
                  ? "border-t border-[#00b3ff]/20"
                  : "border-t border-gray-800"
            }`}
          >
            <span className={`text-[10px] uppercase ${estadoInfo.color}`}>
              {estadoInfo.text}
            </span>
            <span
              className={`material-symbols-outlined text-base ${estadoInfo.color}`}
            >
              {estadoInfo.icon}
            </span>
          </div>
        </div>
      );
    },
    [handleMateriaClick],
  );

  // Calcular estos valores ANTES del early return (hooks rules)
  const needsInitialization = useMemo(
    () => isAuthenticated && materias.every((m) => m.estado === 2),
    [isAuthenticated, materias],
  );

  const materiasMap = useMemo(
    () => new Map(materias.map((m) => [m.id, m])),
    [materias],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          {/* Hero Skeleton */}
          <section className="relative overflow-hidden py-12">
            <div className="container mx-auto px-4 flex flex-col gap-6">
              {/* Título Skeleton */}
              <div className="flex items-center gap-2 border-l-4 border-primary/50 pl-4">
                <div className="h-12 w-72 bg-gray-800/50 animate-pulse rounded"></div>
              </div>

              {/* Descripción Skeleton */}
              <div className="pl-5 space-y-2">
                <div className="h-4 w-96 bg-gray-800/50 animate-pulse rounded"></div>
                <div className="h-3 w-64 bg-gray-800/50 animate-pulse rounded"></div>
              </div>

              {/* Barras Skeleton */}
              <div className="pl-5 flex flex-col md:flex-row gap-8 items-start md:items-center pt-2">
                <div className="flex-grow w-full md:w-auto max-w-lg flex flex-col gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-800/50 animate-pulse rounded"></div>
                    <div className="h-1 w-full bg-gray-800 rounded overflow-hidden">
                      <div className="h-full w-1/3 bg-primary/30 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-800/50 animate-pulse rounded"></div>
                    <div className="h-1 w-full bg-gray-800 rounded overflow-hidden">
                      <div className="h-full w-1/4 bg-primary/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-primary/30 w-full"></div>

          {/* Materias Skeleton */}
          <div className="container mx-auto px-4 py-8 space-y-12">
            {[1, 2, 3].map((anio) => (
              <div key={anio} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-32 bg-primary/30 animate-pulse rounded"></div>
                  <div className="h-px bg-gray-800 flex-grow"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="bg-[#1a1a1a] border border-gray-800 p-4 h-32 animate-pulse"
                    >
                      <div className="h-6 w-16 bg-gray-800 rounded mb-2"></div>
                      <div className="h-3 w-full bg-gray-800 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero - Estilo exacto de iuquecurso.html */}
        <section className="relative overflow-hidden py-12">
          <div className="container mx-auto px-4 flex flex-col gap-6 items-center">
            {/* Título con borde */}
            <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                CORRELATIVAS
              </h1>
              <span className="text-primary text-3xl sm:text-4xl animate-pulse">
                _
              </span>
              {saving && (
                <span className="hidden sm:flex ml-4 text-xs text-primary/70 uppercase tracking-wider items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Guardando...
                </span>
              )}
            </div>

            {/* Indicador móvil de guardado */}
            {saving && (
              <div className="sm:hidden flex items-center gap-2 text-xs text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="uppercase tracking-wider">Guardando...</span>
              </div>
            )}

            {/* Descripción */}
            <p className="text-gray-400 max-w-2xl text-sm leading-relaxed text-center">
              Selecciona el estado de tus materias para visualizar tu progreso.
              <br />
              <span className="text-primary/70 text-xs uppercase tracking-wider">
                // Sistema de seguimiento curricular v1.0
              </span>
            </p>

            {/* Instrucción con icono terminal */}
            <div className="mt-2 border border-primary text-primary px-4 py-3 max-w-4xl bg-[#1a1a1a] shadow-[0_0_10px_rgba(204,255,0,0.1)]">
              <p className="text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 flex-wrap">
                <span className="material-symbols-outlined text-sm animate-pulse">
                  terminal
                </span>
                <span className="whitespace-nowrap">
                  [!] INSTRUCCIÓN: 1 CLICK = APROBADA | 2 CLICKS = REGULAR | 3
                  CLICKS = CURSABLE
                </span>
              </p>
            </div>

            {/* Leyenda de estados y barras de progreso */}
            <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-center pt-2">
              {/* Leyenda de estados */}
              <div className="flex flex-wrap gap-3 md:gap-5 text-[10px] font-bold uppercase tracking-widest justify-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    check_circle
                  </span>
                  <span className="text-primary">Aprobada</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[#00b3ff]">
                    schedule
                  </span>
                  <span className="text-primary">Regular</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-gray-500">
                    lock
                  </span>
                  <span className="text-primary">Bloqueada</span>
                </div>
              </div>

              {/* Barras de progreso */}
              <div className="flex-grow w-full md:w-auto max-w-lg flex flex-col gap-4">
                {/* Progreso Obligatorias */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1 text-primary uppercase tracking-widest">
                    <span>Progreso: {progreso.obligatorias.porcentaje}%</span>
                    <span>
                      {progreso.obligatorias.aprobadas}/
                      {progreso.obligatorias.total} MATERIAS
                    </span>
                  </div>
                  <div className="h-1 bg-gray-800 w-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_#ccff00]"
                      style={{
                        width: `${progreso.obligatorias.porcentaje}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Progreso Electivas */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1 text-primary uppercase tracking-widest">
                    <span>
                      Electivas:{" "}
                      {Math.round(
                        (progreso.electivas.puntosObtenidos /
                          progreso.electivas.totalPuntos) *
                          100,
                      )}
                      %
                    </span>
                    <span>
                      {progreso.electivas.puntosObtenidos}/
                      {progreso.electivas.totalPuntos} PUNTOS ELECTIVOS
                    </span>
                  </div>
                  <div className="h-1 bg-gray-800 w-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_#ccff00]"
                      style={{
                        width: `${(progreso.electivas.puntosObtenidos / progreso.electivas.totalPuntos) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-primary/30 w-full"></div>

        {error && (
          <div className="container mx-auto px-4 py-4">
            <div className="border border-[#ff3366] bg-[#ff3366]/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff3366] text-base">
                  error
                </span>
                <p className="font-mono text-sm text-[#ff3366]">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-[#ff3366] hover:text-[#ff3366]/80 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Botón de inicialización para usuarios nuevos */}
        {needsInitialization && (
          <div className="container mx-auto px-4 py-8">
            <div className="border-2 border-primary bg-primary/5 p-8 text-center">
              <h3 className="font-brutal text-2xl text-primary mb-4">
                ¡BIENVENIDO!
              </h3>
              <p className="font-mono text-sm text-gray-400 mb-6">
                Parece que es la primera vez que usas este módulo.
                <br />
                Haz click para inicializar tu progreso académico.
              </p>
              <button
                onClick={handleInitialize}
                disabled={initializing}
                className="border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase text-primary-foreground hover:bg-transparent hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {initializing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  "Inicializar Progreso"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Materias por año */}
        <div className="container mx-auto px-4 py-8 space-y-12">
          {Object.entries(MATERIAS_POR_ANIO).map(([anio, ids]) => (
            <div key={anio} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-primary uppercase tracking-tight pr-4">
                  {anio === "1"
                    ? "Primer"
                    : anio === "2"
                      ? "Segundo"
                      : anio === "3"
                        ? "Tercer"
                        : anio === "4"
                          ? "Cuarto"
                          : "Quinto"}{" "}
                  Año
                </h2>
                <div className="h-px bg-gray-800 flex-grow"></div>
                <button
                  onClick={() => handleApproveYearMaterias(anio)}
                  title="Aprobar todas las materias del año"
                  className="text-primary hover:text-primary/70 transition-colors opacity-60 hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-xl">
                    check_circle
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {ids.map((id) => {
                  const materia = materiasMap.get(id);
                  return materia ? renderMateria(materia) : null;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal de login (placeholder) */}
        {showLoginModal && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setShowLoginModal(false)}
          >
            <div
              className="bg-[#1a1a1a] border-2 border-primary p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-brutal text-2xl text-primary mb-4">
                REGISTRO REQUERIDO
              </h3>
              <p className="font-mono text-sm text-gray-400 mb-6">
                Debes registrarte para guardar tu progreso académico.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="flex-1 border-2 border-primary bg-primary px-4 py-2 font-mono text-sm uppercase text-primary-foreground hover:bg-transparent hover:text-primary transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 border-2 border-gray-700 bg-transparent px-4 py-2 font-mono text-sm uppercase text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default QueCurso;
