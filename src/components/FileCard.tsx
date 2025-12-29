import {
  Download,
  FileText,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  Presentation,
  File,
  Flag,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { FileItem } from "@/data/mockData";
import { supabase } from "@/lib/supabase/client";
import { useReportFile } from "@/hooks/use-report-file";

interface FileCardProps {
  file: FileItem & { link?: string; id?: string };
}

const getFileIcon = (fileType: FileItem["fileType"]) => {
  switch (fileType) {
    case "pdf":
    case "doc":
      return FileText;
    case "zip":
      return FileArchive;
    case "img":
      return FileImage;
    case "xls":
      return FileSpreadsheet;
    case "ppt":
      return Presentation;
    default:
      return File;
  }
};

const getFileTypeColor = (fileType: FileItem["fileType"]) => {
  switch (fileType) {
    case "pdf":
      return "text-red-500 border-red-500";
    case "doc":
      return "text-blue-500 border-blue-500";
    case "zip":
      return "text-yellow-500 border-yellow-500";
    case "img":
      return "text-purple-500 border-purple-500";
    case "xls":
      return "text-green-500 border-green-500";
    case "ppt":
      return "text-orange-500 border-orange-500";
    default:
      return "text-muted-foreground border-muted-foreground";
  }
};

const FileCard = ({ file }: FileCardProps) => {
  const FileIcon = getFileIcon(file.fileType);
  const typeColor = getFileTypeColor(file.fileType);
  const { reportFile, isAuthenticated } = useReportFile();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMotivo, setReportMotivo] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const handleDownload = async () => {
    if (file.link) {
      // Abrir el archivo en nueva pestaña
      window.open(file.link, "_blank");

      // Incrementar contador de descargas en la BD
      if (file.id) {
        try {
          const { error } = await supabase.rpc("increment_descargas", {
            archivo_id: file.id,
          });

          if (error) {
            // Fallback: usar update directo si la función RPC no existe
            console.log("RPC no disponible, usando update directo");
            const { data: currentFile } = await supabase
              .from("archivos")
              .select("descargas")
              .eq("id", file.id)
              .single();

            if (currentFile) {
              await supabase
                .from("archivos")
                .update({ descargas: (currentFile.descargas || 0) + 1 })
                .eq("id", file.id);
            }
          }
          console.log("✅ Descarga registrada");
        } catch (err) {
          console.error("Error al registrar descarga:", err);
        }
      }
    } else {
      alert("Link de descarga no disponible");
    }
  };

  return (
    <div className="group relative border-2 border-primary bg-card transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_hsl(var(--primary))]">
      {/* File Type Badge */}
      <div
        className={`absolute -top-3 -right-3 border-2 bg-background px-2 py-1 font-mono text-xs uppercase ${typeColor}`}
      >
        {file.fileType.toUpperCase()}
      </div>

      <div className="p-5">
        {/* File Icon & Name */}
        <div className="mb-4 flex items-start gap-3">
          <FileIcon className="h-8 w-8 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-mono text-sm font-bold text-card-foreground group-hover:text-primary">
              {file.name}
            </h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {file.size}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="file-tag">{file.subject}</span>
          <span className="file-tag">{file.commission}</span>
        </div>

        {/* Metadata */}
        <div className="mb-4 flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>{file.uploadDate}</span>
          <span>{file.downloads} descargas</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 border-2 border-primary bg-primary py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary glitch-hover"
          >
            <Download className="h-4 w-4" />
            DESCARGAR
          </button>

          {/* Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center justify-center border-2 border-destructive bg-transparent px-3 py-3 text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
            title="Reportar archivo"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Report Modal - usando Portal para evitar conflictos con animaciones */}
      {showReportModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
            onClick={(e) => {
              // Cerrar al hacer click fuera del modal
              if (e.target === e.currentTarget) {
                setShowReportModal(false);
                setReportMotivo("");
              }
            }}
          >
            <div
              className="border-2 border-primary bg-background p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-brutal text-xl text-primary mb-4">
                REPORTAR ARCHIVO
              </h3>
              <p className="font-mono text-sm text-muted-foreground mb-4">
                {file.name}
              </p>

              {!isAuthenticated ? (
                <div className="text-center">
                  <p className="font-mono text-sm text-destructive mb-4">
                    Debes iniciar sesión para reportar archivos
                  </p>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="border-2 border-primary bg-transparent px-4 py-2 font-mono text-sm uppercase text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    CERRAR
                  </button>
                </div>
              ) : (
                <>
                  <label className="font-mono text-xs uppercase text-muted-foreground block mb-2">
                    Motivo del reporte:
                  </label>
                  <select
                    value={reportMotivo}
                    onChange={(e) => setReportMotivo(e.target.value)}
                    className="w-full bg-background border-2 border-primary font-mono text-sm px-3 py-2 mb-4 focus:outline-none"
                  >
                    <option value="">Selecciona un motivo...</option>
                    <option value="contenido_inapropiado">
                      Contenido inapropiado
                    </option>
                    <option value="spam">Spam o publicidad</option>
                    <option value="archivo_corrupto">
                      Archivo corrupto o no funciona
                    </option>
                    <option value="informacion_incorrecta">
                      Información incorrecta (materia/comisión)
                    </option>
                    <option value="duplicado">Archivo duplicado</option>
                    <option value="derechos_autor">
                      Violación de derechos de autor
                    </option>
                    <option value="otro">Otro</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setReportMotivo("");
                      }}
                      className="flex-1 border-2 border-muted-foreground bg-transparent px-4 py-2 font-mono text-sm uppercase text-muted-foreground hover:bg-muted-foreground hover:text-background"
                    >
                      CANCELAR
                    </button>
                    <button
                      onClick={async () => {
                        if (!reportMotivo) return;
                        setIsReporting(true);
                        const success = await reportFile(
                          file.id!,
                          reportMotivo
                        );
                        setIsReporting(false);
                        if (success) {
                          setShowReportModal(false);
                          setReportMotivo("");
                        }
                      }}
                      disabled={!reportMotivo || isReporting}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-destructive bg-destructive px-4 py-2 font-mono text-sm uppercase text-destructive-foreground hover:bg-transparent hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isReporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Flag className="h-4 w-4" />
                          REPORTAR
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FileCard;
