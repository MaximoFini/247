import { useState } from "react";
import { X } from "lucide-react";
import type { Professor } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProfessorRatingDialogProps {
  professor: Professor;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  isLoggedIn?: boolean;
}

const ProfessorRatingDialog = ({
  professor,
  onClose,
  onSubmitSuccess,
  isLoggedIn = false,
}: ProfessorRatingDialogProps) => {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ratings, setRatings] = useState({
    claridad: 5,
    dificultad: 5,
    puntualidad: 5,
    disponibilidad: 5,
    material: 5,
  });

  const categories = [
    {
      key: "claridad" as keyof typeof ratings,
      label: "CLARIDAD AL EXPLICAR",
      promedio: professor.ratings.claridad,
    },
    {
      key: "dificultad" as keyof typeof ratings,
      label: "DIFICULTAD DE APROBACIÓN",
      promedio: professor.ratings.dificultad,
    },
    {
      key: "puntualidad" as keyof typeof ratings,
      label: "PUNTUALIDAD",
      promedio: professor.ratings.puntualidad,
    },
    {
      key: "disponibilidad" as keyof typeof ratings,
      label: "DISPONIBILIDAD FUERA DE CLASE",
      promedio: professor.ratings.disponibilidad,
    },
    {
      key: "material" as keyof typeof ratings,
      label: "MATERIAL DE ESTUDIO",
      promedio: professor.ratings.material,
    },
  ];

  const handleRatingChange = (key: keyof typeof ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!isLoggedIn || !user) {
      alert("Necesitás estar logueado para puntuar profesores");
      return;
    }

    try {
      console.log("📝 Intentando guardar rating:", {
        user_id: user.id,
        profesor_id: professor.id,
        materia_id: professor.materia_id,
        ratings,
      });

      // Guardar rating en la base de datos
      // Nota: La tabla ratings tiene: user_id, profesor_id, materia_id, claridad, dificultad, puntualidad, disponibilidad, material, created_at
      const { data, error } = await supabase
        .from("ratings")
        .insert({
          user_id: user.id,
          profesor_id: professor.id,
          materia_id: professor.materia_id,
          claridad: ratings.claridad,
          dificultad: ratings.dificultad,
          puntualidad: ratings.puntualidad,
          disponibilidad: ratings.disponibilidad,
          material: ratings.material,
        })
        .select();

      console.log("📦 Respuesta de Supabase:", { data, error });

      if (error) {
        console.error("Error al guardar rating:", error);

        // Detectar si es error de duplicado (ya calificó antes)
        if (
          error.code === "23505" ||
          error.message?.includes("duplicate") ||
          error.message?.includes("unique")
        ) {
          setErrorMessage(
            "Ya calificaste a este profesor en esta materia. Solo podés calificar una vez."
          );
          return;
        }

        setErrorMessage(`Error al guardar: ${error.message}`);
        return;
      }

      console.log("Puntuación guardada exitosamente:", ratings);

      // Llamar al callback de éxito
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      alert("Error inesperado. Intenta nuevamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl border-4 border-primary bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-primary bg-primary p-4">
          <h2 className="font-brutal text-2xl uppercase text-primary-foreground">
            {professor.nombre}
          </h2>
          <button
            onClick={onClose}
            className="transition-transform hover:scale-110 hover:rotate-90"
          >
            <X className="h-6 w-6 text-primary-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Subject and Stats */}
          <div className="mb-6 space-y-2">
            <h3 className="font-brutal text-3xl text-primary">
              {professor.materia}
            </h3>
            <div className="flex gap-4 font-mono text-sm">
              <span className="text-muted-foreground">
                {professor.comision}
              </span>
              <span className="text-primary">
                {professor.cantidadValoraciones} VALORACIONES
              </span>
            </div>
          </div>

          {/* Title */}
          <h4 className="mb-4 border-b-2 border-primary/30 pb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            CALIFICAR PROFESOR
          </h4>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 border-2 border-red-500 bg-red-500/10 p-4">
              <p className="font-mono text-sm text-red-500">{errorMessage}</p>
            </div>
          )}

          {/* Rating Categories */}
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.key}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm uppercase tracking-wider text-foreground">
                    {category.label}
                  </span>
                  <span className="font-brutal text-2xl text-primary">
                    {ratings[category.key]}
                  </span>
                </div>
                {/* Interactive Slider */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    1
                  </span>
                  <div className="relative h-6 flex-1 border-2 border-primary bg-background">
                    <div
                      className="h-full bg-primary transition-all pointer-events-none"
                      style={{
                        width: `${(ratings[category.key] / 10) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={ratings[category.key]}
                      onChange={(e) =>
                        handleRatingChange(
                          category.key,
                          parseInt(e.target.value)
                        )
                      }
                      className="absolute inset-0 w-full cursor-pointer opacity-0"
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    10
                  </span>
                </div>
                <p className="mt-1 text-xs font-mono text-muted-foreground">
                  PROMEDIO: {category.promedio.toFixed(1)}
                </p>
              </div>
            ))}
          </div>

          {/* Promedio del Usuario */}
          <div className="mt-8 border-2 border-primary bg-primary/10 p-4 text-center">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              TU PUNTUACIÓN PROMEDIO
            </p>
            <p className="font-brutal text-5xl text-primary">
              {(
                (ratings.claridad +
                  ratings.dificultad +
                  ratings.puntualidad +
                  ratings.disponibilidad +
                  ratings.material) /
                5
              ).toFixed(1)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={!isLoggedIn}
              className="flex-1 border-2 border-primary bg-transparent py-3 font-mono text-sm uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ENVIAR PUNTUACIÓN
            </button>
            <button
              onClick={onClose}
              className="flex-1 border-2 border-primary bg-primary py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary"
            >
              CANCELAR
            </button>
          </div>

          {/* Login Warning */}
          {!isLoggedIn && (
            <div className="mt-4 border-2 border-yellow-500 bg-yellow-500/10 p-3 text-center">
              <p className="font-mono text-sm text-yellow-500">
                Necesitás estar registrado en la plataforma para poder enviar
                puntuaciones a profesores
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorRatingDialog;
