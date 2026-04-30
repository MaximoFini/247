import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import type { Materia, Comision, TipoArchivo } from "@/types/database";

const TIPO_ARCHIVO_OPTIONS: {
  value: TipoArchivo;
  label: string;
  puntos: number;
}[] = [
  { value: "apunte", label: "APUNTE", puntos: 90 },
  { value: "resumen", label: "RESUMEN", puntos: 90 },
  { value: "parcial", label: "PARCIAL", puntos: 60 },
  { value: "final", label: "FINAL", puntos: 80 },
  { value: "tp", label: "TP", puntos: 60 },
  { value: "guia", label: "GUÍA", puntos: 40 },
];

const SubirPage = () => {
  const { user, dbUser, loading: authLoading } = useAuth();

  const [materiaId, setMateriaId] = useState("");
  const [comisionId, setComisionId] = useState("");
  const [tipo, setTipo] = useState<TipoArchivo | "">("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ⚡ FASE 2: React Query con sincronización de auth
  const { data: materias = [], isLoading: loadingMaterias } = useQuery({
    queryKey: ["materias", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data as Materia[];
    },
    enabled: !authLoading, // ⚡ Solo cuando auth termine
    staleTime: 1000 * 60 * 30, // 30 minutos - datos estables
    gcTime: 1000 * 60 * 60, // 1 hora en caché
    retry: 2,
  });

  const { data: comisiones = [], isLoading: loadingComisiones } = useQuery({
    queryKey: ["comisiones", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comisiones")
        .select("*")
        .order("codigo");
      if (error) throw error;
      return data as Comision[];
    },
    enabled: !authLoading, // ⚡ Solo cuando auth termine
    staleTime: 1000 * 60 * 30, // 30 minutos - datos estables
    gcTime: 1000 * 60 * 60, // 1 hora en caché
    retry: 2,
  });

  const loading = loadingMaterias || loadingComisiones;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!materiaId || !comisionId || !tipo || !selectedFile) return;

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      // TODO: implementar upload a Cloudflare R2
      // const result = await uploadToR2({ file: selectedFile, materiaId, comisionId, tipo });
      throw new Error("Upload a R2 no implementado aún");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  };

  const puntosSeleccionados = tipo
    ? TIPO_ARCHIVO_OPTIONS.find((t) => t.value === tipo)?.puntos || 0
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <section className="relative overflow-hidden py-20">
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
            <h1 className="mb-4 font-brutal text-6xl text-primary md:text-7xl">
              SI NO SUBIS SOS PERONISTA
            </h1>
            <p className="mb-4 font-mono text-lg text-muted-foreground md:text-xl">
              Compartí material con la comunidad
            </p>
            {dbUser && (
              <p className="font-mono text-sm text-primary">
                TUS PUNTOS: {dbUser.puntos_archivos}
              </p>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 pb-20">
          {/* Aviso de Responsabilidad */}
          <div className="mx-auto mb-6 max-w-2xl border-2 border-primary bg-primary/5 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest text-primary">
                  AVISO IMPORTANTE
                </h3>
                <p className="font-mono text-sm leading-relaxed text-foreground">
                  Esta es una herramienta de estudiantes para estudiantes, por
                  favor, cuidemos la integridad de la página entre todos. No
                  está permitido bajo ningún punto de vista contenido ofensivo,
                  spam, publicidades o enlaces maliciosos. Gracias.
                </p>
              </div>
            </div>
          </div>

          {!user && (
            <div className="mx-auto mb-6 max-w-2xl border-2 border-primary bg-primary/10 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="font-mono text-sm text-foreground">
                Necesitás estar{" "}
                <Link
                  to="/login"
                  className="text-primary underline hover:no-underline"
                >
                  logueado
                </Link>{" "}
                para subir archivos
              </p>
            </div>
          )}

          {success && (
            <div className="mx-auto mb-6 max-w-2xl border-2 border-primary bg-primary/10 p-4 flex items-center gap-3 toxic-glow">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="font-mono text-sm text-primary">
                ¡Archivo subido exitosamente! +{puntosSeleccionados} puntos
              </p>
            </div>
          )}

          {error && (
            <div className="mx-auto mb-6 max-w-2xl border-2 border-destructive bg-destructive/10 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="font-mono text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mx-auto max-w-2xl space-y-6">
            {/* Form */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <select
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                  disabled={!user || uploading}
                  className="w-full border-2 border-primary bg-background px-4 py-3 font-mono text-primary disabled:opacity-50"
                >
                  <option value="">SELECCIONAR MATERIA</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  value={comisionId}
                  onChange={(e) => setComisionId(e.target.value)}
                  disabled={!user || uploading}
                  className="w-full border-2 border-primary bg-background px-4 py-3 font-mono text-primary disabled:opacity-50"
                >
                  <option value="">SELECCIONAR COMISIÓN</option>
                  {comisiones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo}
                    </option>
                  ))}
                </select>

                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoArchivo)}
                  disabled={!user || uploading}
                  className="w-full border-2 border-primary bg-background px-4 py-3 font-mono text-primary disabled:opacity-50"
                >
                  <option value="">SELECCIONAR TIPO DE ARCHIVO</option>
                  {TIPO_ARCHIVO_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} (+{t.puntos} puntos)
                    </option>
                  ))}
                </select>

                {puntosSeleccionados > 0 && (
                  <div className="border-2 border-primary bg-background p-4">
                    <p className="font-mono text-sm text-primary">
                      Ganarás{" "}
                      <span className="text-lg font-bold">
                        +{puntosSeleccionados}
                      </span>{" "}
                      puntos
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept=".pdf,.zip,.doc,.docx,.ppt,.pptx"
                  disabled={!user || uploading}
                  onChange={handleFileChange}
                  className="w-full border-2 border-primary bg-background px-4 py-3 font-mono text-primary disabled:opacity-50 file:mr-4 file:border-0 file:bg-primary file:px-4 file:py-2 file:font-mono file:text-sm file:uppercase file:text-primary-foreground"
                />

                <button
                  onClick={handleSubmit}
                  disabled={
                    !user ||
                    !materiaId ||
                    !comisionId ||
                    !tipo ||
                    !selectedFile ||
                    uploading
                  }
                  className="w-full border-2 border-primary bg-primary py-4 font-mono uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary disabled:opacity-50 glitch-hover disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      PROCESANDO...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      SUBIR ARCHIVO
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubirPage;
