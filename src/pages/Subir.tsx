import { useState, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDriveUpload } from "@/hooks/use-drive-upload";
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
  const { user, dbUser } = useAuth();
  const { openPicker, uploading, error } = useDriveUpload();

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);

  const [materiaId, setMateriaId] = useState("");
  const [comisionId, setComisionId] = useState("");
  const [tipo, setTipo] = useState<TipoArchivo | "">("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materiasRes, comisionesRes] = await Promise.all([
        supabase.from("materias").select("*").order("nombre"),
        supabase.from("comisiones").select("*").order("codigo"),
      ]);

      if (materiasRes.data) setMaterias(materiasRes.data);
      if (comisionesRes.data) setComisiones(comisionesRes.data);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!materiaId || !comisionId || !tipo) return;

    // Debug: ver qué valores se están enviando
    console.log("📝 Valores del formulario:", { materiaId, comisionId, tipo });

    setSuccess(false);
    const result = await openPicker({
      materiaId: materiaId,
      comisionId: comisionId,
      tipo: tipo as TipoArchivo,
    });

    if (result) {
      setSuccess(true);
      // Resetear form
      setMateriaId("");
      setComisionId("");
      setTipo("");

      // Ocultar mensaje después de 5s
      setTimeout(() => setSuccess(false), 5000);
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
              APORTAR A LA CAUSA
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
            {/* Info Box */}
            <div className="border-2 border-primary bg-primary/5 p-6">
              <h3 className="mb-2 font-mono text-sm uppercase tracking-widest text-primary">
                ¿CÓMO FUNCIONA?
              </h3>
              <ol className="space-y-1 font-mono text-xs text-muted-foreground">
                <li>1. Seleccioná materia, comisión y tipo de archivo</li>
                <li>2. Click en "SELECCIONAR DE DRIVE"</li>
                <li>3. Elegí el archivo desde tu Google Drive</li>
                <li>
                  4. El archivo se comparte automáticamente y sumás puntos
                </li>
              </ol>
            </div>

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

                <button
                  onClick={handleSubmit}
                  disabled={
                    !user || !materiaId || !comisionId || !tipo || uploading
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
                      SELECCIONAR DE DRIVE
                    </>
                  )}
                </button>

                {/* Progreso detallado durante la subida */}
                {uploading && (
                  <div className="border-2 border-primary bg-primary/5 p-4 space-y-2">
                    <p className="font-mono text-xs text-primary animate-pulse">
                      🔐 Autenticando con Google Drive...
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      📂 Esperando selección de archivo...
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      🔓 Configurando permisos públicos...
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      💾 Guardando en base de datos...
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      🎯 Actualizando tus puntos...
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubirPage;
