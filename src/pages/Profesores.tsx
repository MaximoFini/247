import { useState, useMemo, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ProfessorRatingDialog from "@/components/ProfessorRatingDialog";
import { SuccessToast } from "@/components/SuccessToast";
import type { Professor } from "@/types";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

const Profesores = () => {
  const { user } = useAuth();
  const [selectedCommission, setSelectedCommission] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(
    null,
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [comisiones, setComisiones] = useState<
    { id: string; codigo: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Cargar comisiones y profesores desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔄 Cargando datos...");

        // Cargar comisiones
        const { data: comisionesData, error: comisionesError } = await supabase
          .from("comisiones")
          .select("id, codigo")
          .order("codigo");

        console.log("📋 Comisiones:", comisionesData?.length, comisionesError);

        if (comisionesData) {
          setComisiones(comisionesData);
        }

        // Cargar la tabla intermedia materia_comision_profesor
        const { data: relacionesData, error: relacionesError } = await supabase
          .from("materia_comision_profesor")
          .select("id, materia_id, comision_id, profesor_id");

        console.log("🔗 Relaciones:", relacionesData?.length, relacionesError);

        // Cargar profesores
        const { data: profesoresData, error: profError } = await supabase
          .from("profesores")
          .select("id, nombre");

        console.log("👨‍🏫 Profesores:", profesoresData?.length, profError);

        // Cargar materias
        const { data: materiasData } = await supabase
          .from("materias")
          .select("id, nombre");

        console.log("📚 Materias:", materiasData?.length);

        // Cargar ratings para calcular promedios
        const { data: ratingsData } = await supabase
          .from("ratings")
          .select(
            "profesor_id, claridad, dificultad, puntualidad, disponibilidad, material",
          );

        console.log("⭐ Ratings:", ratingsData?.length);

        // Crear mapas para lookups rápidos
        const profesoresMap = new Map(
          (profesoresData || []).map((p: any) => [p.id, p.nombre]),
        );
        const materiasMap = new Map(
          (materiasData || []).map((m: any) => [m.id, m.nombre]),
        );
        const comisionesMap = new Map(
          (comisionesData || []).map((c: any) => [c.id, c.codigo]),
        );

        // Transformar relaciones a formato Professor
        // Cada relación representa un profesor dando una materia en una comisión
        const transformedProfessors: Professor[] = (relacionesData || []).map(
          (rel: any) => {
            const profRatings = (ratingsData || []).filter(
              (r: any) => r.profesor_id === rel.profesor_id,
            );
            const count = profRatings.length;

            const avgRatings = {
              claridad:
                count > 0
                  ? profRatings.reduce(
                      (sum: number, r: any) => sum + r.claridad,
                      0,
                    ) / count
                  : 0,
              dificultad:
                count > 0
                  ? profRatings.reduce(
                      (sum: number, r: any) => sum + r.dificultad,
                      0,
                    ) / count
                  : 0,
              puntualidad:
                count > 0
                  ? profRatings.reduce(
                      (sum: number, r: any) => sum + r.puntualidad,
                      0,
                    ) / count
                  : 0,
              disponibilidad:
                count > 0
                  ? profRatings.reduce(
                      (sum: number, r: any) => sum + r.disponibilidad,
                      0,
                    ) / count
                  : 0,
              material:
                count > 0
                  ? profRatings.reduce(
                      (sum: number, r: any) => sum + r.material,
                      0,
                    ) / count
                  : 0,
            };

            const promedioGeneral =
              count > 0
                ? (avgRatings.claridad +
                    avgRatings.dificultad +
                    avgRatings.puntualidad +
                    avgRatings.disponibilidad +
                    avgRatings.material) /
                  5
                : 0;

            return {
              id: rel.profesor_id, // Usamos el profesor_id para los ratings
              nombre:
                profesoresMap.get(rel.profesor_id) || "Profesor desconocido",
              materia: materiasMap.get(rel.materia_id) || "Sin materia",
              comision: comisionesMap.get(rel.comision_id) || "Sin comisión",
              materia_id: rel.materia_id, // Guardamos el UUID para los ratings
              comision_id: rel.comision_id, // Guardamos el UUID para los ratings
              cantidadValoraciones: count,
              promedioGeneral,
              ratings: avgRatings,
            };
          },
        );

        console.log("✅ Profesores transformados:", transformedProfessors);
        setProfessors(transformedProfessors);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProfessors = useMemo(() => {
    if (!selectedCommission) return [];
    return professors.filter((prof) => prof.comision === selectedCommission);
  }, [selectedCommission, professors]);

  const handleRatingSubmitted = () => {
    setShowSuccessToast(true);
    setSelectedProfessor(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <section className="relative overflow-hidden py-12 sm:py-16 md:py-20">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="container relative mx-auto px-4 text-center">
            <h1 className="mb-4 font-brutal text-4xl text-primary sm:text-5xl md:text-6xl lg:text-7xl">
              CALIFICAR PROFESORES
            </h1>
            <p className="mb-8 font-mono text-base text-muted-foreground sm:text-lg md:mb-12 md:text-xl">
              Compartí tu experiencia con la comunidad
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-12 sm:pb-16 md:pb-20">
          {/* Commission Selector centered */}
          <div className="mb-8 flex flex-col items-center px-4 sm:px-0">
            <label className="mb-3 block text-center font-mono text-xs uppercase tracking-widest text-muted-foreground sm:text-sm">
              SELECCIONAR COMISIÓN
            </label>
            <select
              value={selectedCommission}
              onChange={(e) => setSelectedCommission(e.target.value)}
              className="w-full max-w-md mx-auto border-2 border-primary bg-background px-4 py-3 font-mono text-sm text-primary focus:outline-none focus:ring-4 focus:ring-primary/50 sm:border-4 sm:px-6 sm:py-4 sm:text-lg"
            >
              <option value="">-- ELEGIR COMISIÓN --</option>
              {comisiones.map((com) => (
                <option key={com.id} value={com.codigo}>
                  {com.codigo}
                </option>
              ))}
            </select>
          </div>

          {/* Professors List */}
          {selectedCommission && (
            <div className="space-y-3 sm:space-y-4">
              {filteredProfessors.length === 0 ? (
                <div className="border-2 border-primary/30 bg-card p-6 text-center sm:p-8">
                  <p className="font-mono text-sm text-muted-foreground sm:text-base">
                    No hay profesores cargados para esta comisión
                  </p>
                </div>
              ) : (
                filteredProfessors.map((professor) => (
                  <div
                    key={professor.id}
                    className="flex flex-col gap-4 border-2 border-primary bg-card p-4 transition-all hover:border-flash hover:toxic-glow sm:p-6 lg:flex-row lg:items-center lg:justify-between"
                  >
                    {/* Professor Info */}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-brutal text-xl text-primary sm:text-2xl">
                        {professor.nombre}
                      </h3>
                      <p className="font-mono text-xs text-foreground sm:text-sm">
                        {professor.materia}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                      <div className="flex items-center justify-between sm:block sm:text-center">
                        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                          VALORACIONES
                        </p>
                        <p className="font-brutal text-xl text-primary sm:text-2xl">
                          {professor.cantidadValoraciones}
                        </p>
                      </div>

                      <div className="h-0.5 w-full bg-primary/30 sm:h-12 sm:w-0.5 lg:block" />

                      <div className="flex items-center justify-between sm:block sm:text-center">
                        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                          PROMEDIO
                        </p>
                        <div className="flex items-center gap-2 sm:justify-center">
                          <Star className="h-5 w-5 fill-primary text-primary" />
                          <p className="font-brutal text-xl text-primary sm:text-2xl">
                            {professor.promedioGeneral.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      <div className="h-0.5 w-full bg-primary/30 sm:h-12 sm:w-0.5 lg:block" />

                      {/* Action Button */}
                      <button
                        onClick={() => setSelectedProfessor(professor)}
                        className="w-full border-2 border-primary bg-transparent px-4 py-3 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground glitch-hover sm:w-auto sm:px-6"
                      >
                        VER RATINGS
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Rating Dialog */}
      {selectedProfessor && (
        <ProfessorRatingDialog
          professor={selectedProfessor}
          onClose={() => setSelectedProfessor(null)}
          onSubmitSuccess={handleRatingSubmitted}
          isLoggedIn={!!user}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message="¡Puntuación enviada exitosamente! Gracias por tu aporte a la comunidad."
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
};

export default Profesores;
