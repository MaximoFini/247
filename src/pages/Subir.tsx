import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { zip } from "fflate";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_EXTENSIONS = ["pdf", "zip", "doc", "docx", "ppt", "pptx"];
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import type { Materia, Comision, TipoArchivo } from "@/types/database";

// Comprime un File en un ZIP client-side. Para archivos ya ZIP, los devuelve sin cambios.
function compressToZip(file: File): Promise<{ blob: Blob; name: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "zip") {
    return Promise.resolve({ blob: file, name: file.name });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      zip({ [file.name]: [data, { level: 6 }] }, (err, compressed) => {
        if (err) return reject(err);
        resolve({
          blob: new Blob([compressed], { type: "application/zip" }),
          name: file.name + ".zip",
        });
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

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
  const [uploadProgress, setUploadProgress] = useState(0);

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
    if (!materiaId || !comisionId || !tipo || !selectedFile || !user) return;

    setError(null);
    setSuccess(false);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Paso 1 — Validación client-side
      const fileSizeMB = selectedFile.size / 1024 / 1024;
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(
          `El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB`,
        );
      }
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`Extensión no permitida: .${ext}`);
      }

      // Paso 1.5 — Comprimir el archivo client-side antes de subir
      setUploadProgress(0);
      const { blob: compressedBlob, name: compressedName } =
        await compressToZip(selectedFile);
      const uploadContentType = "application/zip";

      // Paso 2 — Obtener presigned URL de la Edge Function
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No hay sesión activa");

      const uploadUrlRes = await fetch(
        `${SUPABASE_URL}/functions/v1/get-upload-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: compressedName,
            contentType: uploadContentType,
            materiaId,
            comisionId,
            tipo,
          }),
        },
      );

      if (!uploadUrlRes.ok) {
        const errData = await uploadUrlRes.json().catch(() => ({}));
        throw new Error(
          errData.error ||
            `Error al generar URL de subida (${uploadUrlRes.status})`,
        );
      }

      const { presignedUrl, r2Key, publicUrl } = await uploadUrlRes.json();

      // Paso 3 — Upload directo a R2 con barra de progreso (XHR)
      const compressedSizeMB = compressedBlob.size / 1024 / 1024;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Error al subir a R2: ${xhr.status}`));
          }
        };
        xhr.onerror = () =>
          reject(new Error("Error de red al subir el archivo"));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", uploadContentType);
        xhr.send(compressedBlob);
      });

      // Paso 4 — Insertar registro en la DB
      const { error: insertError } = await supabase.from("archivos").insert({
        user_id: user.id,
        materia_id: materiaId,
        comision_id: comisionId,
        tipo,
        nombre: selectedFile.name,
        r2_key: r2Key,
        file_url: publicUrl,
        tamanio_mb: parseFloat(compressedSizeMB.toFixed(2)),
        extension: ext,
        descargas: 0,
        activo: true,
        reportado: false,
      });
      if (insertError) throw insertError;

      // Paso 5 — Actualizar puntos (atómico, falla en silencio para no bloquear)
      const { error: rpcError } = await supabase.rpc("add_puntos_archivos", {
        target_user_id: user.id,
        puntos_a_agregar: puntosSeleccionados,
      });
      if (rpcError) {
        console.error("Error al actualizar puntos (no crítico):", rpcError);
      }

      setSuccess(true);
      setSelectedFile(null);
      setMateriaId("");
      setComisionId("");
      setTipo("");
      setUploadProgress(0);
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
                      {uploadProgress > 0 && uploadProgress < 100
                        ? `SUBIENDO... ${uploadProgress}%`
                        : "PROCESANDO..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      SUBIR ARCHIVO
                    </>
                  )}
                </button>

                {uploading && uploadProgress > 0 && (
                  <div className="w-full border-2 border-primary bg-background h-4 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {uploading && (
                  <p className="font-mono text-xs text-muted-foreground text-center">
                    No cierres esta página mientras se sube el archivo
                  </p>
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
