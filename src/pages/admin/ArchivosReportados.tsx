import { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Check,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useReportedFiles } from "@/hooks/use-reported-files";
import { useModerateFile } from "@/hooks/use-moderate-file";

const ArchivosReportados = () => {
  const { files, loading, error, refetch } = useReportedFiles();
  const { moderateFile, loading: moderating } = useModerateFile();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleAction = async (
    archivoId: string,
    action: "reject" | "delete"
  ) => {
    setActioningId(archivoId);
    const success = await moderateFile(archivoId, action);
    if (success) {
      await refetch();
    }
    setActioningId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-12 border-b-2 border-destructive">
          <div className="container mx-auto px-4">
            <h1 className="font-brutal text-5xl text-destructive flex items-center gap-4">
              <AlertTriangle className="h-12 w-12" />
              ARCHIVOS REPORTADOS
            </h1>
            <p className="font-mono text-sm text-muted-foreground mt-2">
              {files.length} archivo{files.length !== 1 ? "s" : ""} pendiente
              {files.length !== 1 ? "s" : ""} de moderación
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {error && (
            <div className="border-2 border-destructive bg-destructive/10 p-4 mb-6">
              <p className="font-mono text-sm text-destructive">{error}</p>
            </div>
          )}

          {files.length === 0 ? (
            <div className="border-2 border-primary bg-primary/5 p-12 text-center">
              <Check className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="font-mono text-lg text-primary">
                ¡Todo limpio! No hay archivos reportados.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border-2 border-destructive bg-card p-6"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Columna 1: Info del archivo */}
                    <div className="md:col-span-1">
                      <h3 className="font-mono text-lg text-primary mb-3 break-words">
                        {file.nombre}
                      </h3>
                      <div className="space-y-2">
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">TIPO:</span>{" "}
                          {file.tipo?.toUpperCase()}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">MATERIA:</span>{" "}
                          {file.materia_nombre || "N/A"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">COMISIÓN:</span>{" "}
                          {file.comision_codigo || "N/A"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">TAMAÑO:</span>{" "}
                          {file.tamanio_mb} MB
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">DESCARGAS:</span>{" "}
                          {file.descargas}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">ESTADO:</span>{" "}
                          {file.activo ? (
                            <span className="text-green-500">ACTIVO</span>
                          ) : (
                            <span className="text-destructive">
                              DESACTIVADO
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Columna 2: Info del reporte */}
                    <div className="md:col-span-1 border-l-2 border-destructive/30 pl-6">
                      <h4 className="font-mono text-sm uppercase tracking-widest text-destructive mb-3">
                        Reporte
                      </h4>
                      <div className="space-y-2">
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">MOTIVO:</span>
                        </p>
                        <p className="font-mono text-sm text-foreground bg-destructive/10 p-2 border border-destructive/30">
                          {file.motivo_reporte || "Sin motivo especificado"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">REPORTADO POR:</span>{" "}
                          {file.reportador_nombre || "Anónimo"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">EMAIL:</span>{" "}
                          {file.reportador_email || "N/A"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">SUBIDO POR:</span>{" "}
                          {file.uploader_nombre}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          <span className="text-primary">TOTAL REPORTES:</span>{" "}
                          {file.total_reportes}
                        </p>
                      </div>
                    </div>

                    {/* Columna 3: Acciones */}
                    <div className="md:col-span-1 border-l-2 border-primary/30 pl-6">
                      <h4 className="font-mono text-sm uppercase tracking-widest text-primary mb-3">
                        Acciones
                      </h4>
                      <div className="space-y-3">
                        {/* Ver en Drive */}
                        <a
                          href={file.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 border-2 border-primary bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground w-full"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver archivo
                        </a>

                        {/* Rechazar reporte (archivo queda activo pero sin reporte) */}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "¿Rechazar este reporte? El archivo quedará activo pero se quitará de reportados."
                              )
                            ) {
                              handleAction(file.id, "reject");
                            }
                          }}
                          disabled={moderating && actioningId === file.id}
                          className="flex items-center justify-center gap-2 border-2 border-destructive bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-destructive transition-all hover:bg-destructive hover:text-primary-foreground w-full disabled:opacity-50"
                        >
                          {moderating && actioningId === file.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Rechazar
                        </button>

                        {/* Eliminar permanentemente */}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "¿Estás seguro?  Esta acción es irreversible."
                              )
                            ) {
                              handleAction(file.id, "delete");
                            }
                          }}
                          disabled={moderating && actioningId === file.id}
                          className="flex items-center justify-center gap-2 border-2 border-destructive bg-destructive/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-destructive transition-all hover:bg-destructive hover:text-primary-foreground w-full disabled:opacity-50"
                        >
                          {moderating && actioningId === file.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ArchivosReportados;
