/**
 * Ejemplo de uso de Google Picker en un componente React
 *
 * Este componente muestra cómo integrar Google Picker para seleccionar
 * archivos desde Google Drive y subirlos a tu aplicación.
 */

import { useState } from "react";
import {
  initializePicker,
  showPicker,
  type PickedFile,
} from "@/lib/google/picker";
import {
  getFileMetadata,
  makeFilePublic,
  type DriveFileMetadata,
} from "@/lib/google/drive";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

export function GooglePickerExample() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [metadata, setMetadata] = useState<DriveFileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handler para abrir Google Picker
   */
  const handleOpenPicker = async () => {
    try {
      setLoading(true);
      setError(null);

      // Inicializar picker (solo se hace una vez)
      await initializePicker();

      // Mostrar picker y esperar selección
      const file = await showPicker();

      if (file) {
        setSelectedFile(file);
        console.log("Archivo seleccionado:", file);

        // Opcional: Obtener metadata completa
        // Nota: Necesitas guardar el accessToken del picker para esto
        // O volver a solicitar permisos
      }
    } catch (err) {
      console.error("Error al abrir Google Picker:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler para subir archivo a tu backend
   */
  const handleUploadFile = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);

      // Aquí puedes enviar el fileId a tu backend
      // Tu backend puede usar la API de Drive para:
      // 1. Verificar permisos
      // 2. Descargar el archivo
      // 3. Procesarlo

      const response = await fetch("/api/upload-from-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: selectedFile.fileId,
          fileName: selectedFile.fileName,
          mimeType: selectedFile.mimeType,
          sizeBytes: selectedFile.sizeBytes,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al subir archivo");
      }

      const result = await response.json();
      console.log("Archivo subido:", result);

      // Limpiar selección
      setSelectedFile(null);
    } catch (err) {
      console.error("Error al subir archivo:", err);
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Google Drive Picker</h2>

      {/* Botón para abrir picker */}
      <Button onClick={handleOpenPicker} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Seleccionar archivo de Google Drive
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="rounded border border-red-500 bg-red-500/10 p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Archivo seleccionado */}
      {selectedFile && (
        <div className="space-y-3 rounded border border-primary bg-primary/10 p-4">
          <h3 className="font-bold text-primary">Archivo seleccionado:</h3>
          <div className="space-y-1 font-mono text-sm">
            <p>
              <strong>Nombre:</strong> {selectedFile.fileName}
            </p>
            <p>
              <strong>ID:</strong> {selectedFile.fileId}
            </p>
            <p>
              <strong>Tipo:</strong> {selectedFile.mimeType}
            </p>
            <p>
              <strong>Tamaño:</strong>{" "}
              {(selectedFile.sizeBytes / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <Button
            onClick={handleUploadFile}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              "Confirmar y subir"
            )}
          </Button>
        </div>
      )}

      {/* Metadata (si se cargó) */}
      {metadata && (
        <div className="space-y-3 rounded border border-muted-foreground bg-muted p-4">
          <h3 className="font-bold">Metadata completa:</h3>
          <pre className="overflow-x-auto text-xs">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
