# useDriveUpload - Hook para subir archivos desde Google Drive

Hook personalizado que maneja todo el flujo de subida de archivos desde Google Drive a Supabase.

## 🎯 Características

✅ Autenticación con Google Drive (OAuth2)  
✅ Selección de archivos con Google Picker  
✅ Hacer archivos públicos automáticamente (Edge Function)  
✅ Guardar metadata en Supabase  
✅ Actualizar puntos del usuario  
✅ Manejo de errores detallado  
✅ Estados de loading y error

## 📦 Instalación

El hook ya está disponible en:

```
src/hooks/use-drive-upload.ts
```

## 🚀 Uso básico

```tsx
import { useDriveUpload } from "@/hooks/use-drive-upload";

function SubirArchivo() {
  const { openPicker, uploading, error, clearError } = useDriveUpload();

  const handleClick = async () => {
    const result = await openPicker({
      materiaId: 1,
      comisionId: 2,
      tipo: "apunte",
    });

    if (result) {
      console.log("Archivo subido:", result.archivoId);
      console.log("Download URL:", result.downloadUrl);
    }
  };

  return (
    <button onClick={handleClick} disabled={uploading}>
      {uploading ? "Subiendo..." : "Subir archivo"}
    </button>
  );
}
```

## 📚 API

### `useDriveUpload()`

Hook que retorna un objeto con:

#### Valores retornados:

```typescript
{
  openPicker: (params: UploadParams) => Promise<UploadResult | null>;
  uploading: boolean;
  error: string | null;
  clearError: () => void;
}
```

#### `openPicker(params)`

Función principal que abre el Google Picker y sube el archivo.

**Parámetros:**

```typescript
interface UploadParams {
  materiaId: number; // ID de la materia
  comisionId: number; // ID de la comisión
  tipo: TipoArchivo; // Tipo de archivo
}

type TipoArchivo = "apunte" | "resumen" | "final" | "parcial" | "tp" | "otro";
```

**Retorna:**

```typescript
interface UploadResult {
  archivoId: number; // ID del registro en la tabla 'archivos'
  downloadUrl: string; // URL directa de descarga
  viewUrl: string; // URL de visualización en Drive
}

// O null si el usuario cancela
```

**Ejemplo:**

```tsx
const result = await openPicker({
  materiaId: 5,
  comisionId: 12,
  tipo: "resumen",
});

if (result) {
  // Éxito
  alert(`Archivo guardado con ID: ${result.archivoId}`);
} else {
  // Usuario canceló
  console.log("Operación cancelada");
}
```

#### `uploading`

Booleano que indica si hay una subida en progreso.

```tsx
{
  uploading && <Loader />;
}
<button disabled={uploading}>Subir</button>;
```

#### `error`

String con el mensaje de error o `null`.

```tsx
{
  error && <div className="error">{error}</div>;
}
```

#### `clearError()`

Función para limpiar el error manualmente.

```tsx
<button onClick={clearError}>Cerrar error</button>
```

## 🔄 Flujo completo

```
1. Usuario click en "Subir archivo"
   ↓
2. openPicker() solicita acceso a Google Drive
   ↓
3. Se muestra Google Picker para seleccionar archivo
   ↓
4. Usuario selecciona archivo (o cancela)
   ↓
5. Se llama a Edge Function para hacer el archivo público
   ↓
6. Se guarda en tabla 'archivos' de Supabase
   ↓
7. Se actualiza puntos_archivos del usuario (trigger automático)
   ↓
8. Se retorna UploadResult con IDs y URLs
```

## 🎨 Ejemplo completo con UI

```tsx
import { useState } from "react";
import { useDriveUpload, type TipoArchivo } from "@/hooks/use-drive-upload";

function FormularioSubida() {
  const { openPicker, uploading, error, clearError } = useDriveUpload();
  const [materia, setMateria] = useState(1);
  const [comision, setComision] = useState(1);
  const [tipo, setTipo] = useState<TipoArchivo>("apunte");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const result = await openPicker({
      materiaId: materia,
      comisionId: comision,
      tipo,
    });

    if (result) {
      alert(`¡Éxito! Archivo ID: ${result.archivoId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={materia} onChange={(e) => setMateria(+e.target.value)}>
        <option value={1}>Álgebra</option>
        <option value={2}>Análisis</option>
      </select>

      <select value={comision} onChange={(e) => setComision(+e.target.value)}>
        <option value={1}>Comisión 1</option>
        <option value={2}>Comisión 2</option>
      </select>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoArchivo)}
      >
        <option value="apunte">Apunte</option>
        <option value="resumen">Resumen</option>
        <option value="final">Final</option>
      </select>

      <button type="submit" disabled={uploading}>
        {uploading ? "Subiendo..." : "Subir archivo"}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## 🗄️ Datos guardados en Supabase

El hook guarda en la tabla `archivos`:

```typescript
{
  user_id: string; // Del AuthContext (usuario logueado)
  materia_id: number; // Del parámetro
  comision_id: number; // Del parámetro
  tipo: TipoArchivo; // Del parámetro
  nombre: string; // Del Google Picker
  drive_file_id: string; // Del Google Picker
  drive_link: string; // De la Edge Function (URL pública)
  tamanio_mb: number; // Calculado (sizeBytes / 1024 / 1024)
  extension: string; // Extraído del nombre o MIME type
  descargas: 0; // Valor inicial
  reportado: false; // Valor inicial
  activo: true; // Valor inicial
}
```

## ⚠️ Manejo de errores

El hook captura y reporta errores en cada paso:

### Errores comunes:

| Error                                  | Causa                    | Solución                          |
| -------------------------------------- | ------------------------ | --------------------------------- |
| "Debes estar logueado..."              | Usuario no autenticado   | Verificar AuthContext             |
| "Error al autenticar con Google Drive" | Usuario rechazó permisos | Volver a intentar y aceptar       |
| "Error al abrir el selector..."        | Google Picker falló      | Verificar API Key y Client ID     |
| "Error al hacer el archivo público"    | Edge Function falló      | Ver logs de Supabase Functions    |
| "Error al guardar en la base de datos" | Insert falló             | Verificar permisos de tabla y RLS |

### Ejemplo de manejo:

```tsx
const { openPicker, error } = useDriveUpload();

const handleUpload = async () => {
  const result = await openPicker(params);

  if (!result && error) {
    // Hubo un error
    console.error("Error:", error);
  } else if (!result) {
    // Usuario canceló (sin error)
    console.log("Cancelado por el usuario");
  } else {
    // Éxito
    console.log("Subido:", result.archivoId);
  }
};
```

## 🔒 Requisitos previos

1. **AuthContext configurado** con usuario autenticado
2. **Google APIs configuradas** (Client ID y API Key en `.env`)
3. **Edge Function deployada** (`make-file-public`)
4. **Tabla `archivos`** creada en Supabase con RLS habilitado
5. **Trigger en la BD** para actualizar `puntos_archivos` (opcional)

## 🧪 Testing

Para probar el hook en desarrollo:

```tsx
// Componente de prueba
import { DriveUploadExample } from "@/components/DriveUploadExample";

function App() {
  return <DriveUploadExample />;
}
```

## 📝 Notas importantes

- El hook NO refresca automáticamente el `dbUser` en el AuthContext después de actualizar los puntos. Si necesitas mostrar los puntos actualizados inmediatamente, considera agregar una función `refreshDbUser()` en el AuthContext.

- El archivo se hace público en Google Drive (`anyone can read`). Si el usuario elimina el archivo de su Drive, el link dejará de funcionar.

- Los MIME types permitidos están definidos en `@/lib/google/picker.ts`. Si necesitas agregar más tipos, edita `ALLOWED_MIME_TYPES`.

## 🔗 Referencias

- [Google Picker API](https://developers.google.com/picker)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Hooks](https://react.dev/reference/react)
