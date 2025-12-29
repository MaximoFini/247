/**
 * Ejemplo de uso del hook useDriveUpload
 *
 * Este componente muestra cómo integrar la subida de archivos
 * desde Google Drive en un formulario.
 */

import { useState } from "react";
import { useDriveUpload, type TipoArchivo } from "@/hooks/use-drive-upload";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";

export function DriveUploadExample() {
  const { openPicker, uploading, error, clearError } = useDriveUpload();

  // Estado del formulario
  const [materiaId, setMateriaId] = useState<number>(1);
  const [comisionId, setComisionId] = useState<number>(1);
  const [tipo, setTipo] = useState<TipoArchivo>("apunte");
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async () => {
    clearError();
    setSuccess(null);

    try {
      const result = await openPicker({
        materiaId,
        comisionId,
        tipo,
      });

      if (result) {
        setSuccess(`¡Archivo subido exitosamente! ID: ${result.archivoId}`);
        console.log("Resultado:", result);
      }
    } catch (err) {
      console.error("Error en el componente:", err);
    }
  };

  return (
    <div className="max-w-md space-y-4 p-6">
      <h2 className="text-2xl font-bold text-primary">
        Subir archivo desde Google Drive
      </h2>

      {/* Formulario */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Materia ID</label>
          <input
            type="number"
            value={materiaId}
            onChange={(e) => setMateriaId(Number(e.target.value))}
            className="w-full rounded border border-muted-foreground bg-background px-3 py-2"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comisión ID</label>
          <input
            type="number"
            value={comisionId}
            onChange={(e) => setComisionId(Number(e.target.value))}
            className="w-full rounded border border-muted-foreground bg-background px-3 py-2"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Tipo de archivo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoArchivo)}
            className="w-full rounded border border-muted-foreground bg-background px-3 py-2"
            disabled={uploading}
          >
            <option value="apunte">Apunte</option>
            <option value="resumen">Resumen</option>
            <option value="final">Final</option>
            <option value="parcial">Parcial</option>
            <option value="tp">Trabajo Práctico</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      {/* Botón de subida */}
      <Button onClick={handleUpload} disabled={uploading} className="w-full">
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Seleccionar archivo de Drive
          </>
        )}
      </Button>

      {/* Mensaje de éxito */}
      {success && (
        <div className="flex items-center gap-2 rounded border border-primary bg-primary/10 p-3 text-sm">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-primary">{success}</p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500 bg-red-500/10 p-3 text-sm">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Estado de carga detallado */}
      {uploading && (
        <div className="space-y-2 rounded border border-muted-foreground bg-muted/50 p-4 text-sm font-mono">
          <p>📂 Seleccionando archivo...</p>
          <p>🔓 Configurando permisos...</p>
          <p>💾 Guardando en base de datos...</p>
          <p>🎯 Actualizando puntos...</p>
        </div>
      )}
    </div>
  );
}
