# 🎉 Hook useDriveUpload - Integración completa

## ✅ Archivos creados:

```
src/
├── hooks/
│   ├── use-drive-upload.ts              ✅ Hook principal
│   └── README-use-drive-upload.md       ✅ Documentación completa
├── components/
│   └── DriveUploadExample.tsx           ✅ Componente de ejemplo
└── lib/
    └── google/
        └── picker.ts                     ✅ Actualizado con requestDriveAccess()
```

## 🚀 Cómo usar:

### 1. Importar el hook

```tsx
import { useDriveUpload } from "@/hooks/use-drive-upload";
```

### 2. Usar en tu componente

```tsx
function SubirArchivo() {
  const { openPicker, uploading, error } = useDriveUpload();

  const handleUpload = async () => {
    const result = await openPicker({
      materiaId: 1,
      comisionId: 2,
      tipo: "apunte",
    });

    if (result) {
      alert(`¡Archivo subido! ID: ${result.archivoId}`);
    }
  };

  return (
    <button onClick={handleUpload} disabled={uploading}>
      {uploading ? "Subiendo..." : "Subir desde Drive"}
    </button>
  );
}
```

## 🔄 Flujo automático:

1. ✅ Usuario autenticado (AuthContext)
2. ✅ Solicita permisos de Google Drive
3. ✅ Abre Google Picker
4. ✅ Usuario selecciona archivo
5. ✅ Hace el archivo público (Edge Function)
6. ✅ Guarda en tabla `archivos`
7. ✅ Actualiza puntos del usuario (trigger automático)
8. ✅ Retorna URLs y IDs

## 📊 Estados manejados:

- `uploading: boolean` - Si está en proceso
- `error: string | null` - Mensaje de error
- `clearError()` - Limpiar error

## 🎯 Tipos de archivos soportados:

```typescript
type TipoArchivo = "apunte" | "resumen" | "final" | "parcial" | "tp" | "otro";
```

## ⚙️ Configuración requerida:

### Variables de entorno (.env):

```env
VITE_GOOGLE_CLIENT_ID=tu_client_id
VITE_GOOGLE_API_KEY=tu_api_key
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Tabla de Supabase (archivos):

```sql
CREATE TABLE archivos (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  materia_id INTEGER NOT NULL,
  comision_id INTEGER NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL,
  drive_link TEXT NOT NULL,
  tamanio_mb DECIMAL(10,2) NOT NULL,
  extension VARCHAR(10) NOT NULL,
  descargas INTEGER DEFAULT 0,
  reportado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Edge Function deployada:

```
https://nesbqbdqeieyjuvkhwhf.supabase.co/functions/v1/make-file-public
```

## 📦 Ejemplo completo:

Ver: `src/components/DriveUploadExample.tsx`

## 📚 Documentación completa:

Ver: `src/hooks/README-use-drive-upload.md`

## 🐛 Errores comunes:

| Error                                  | Solución                                      |
| -------------------------------------- | --------------------------------------------- |
| "Debes estar logueado"                 | Verificar que el usuario esté autenticado     |
| "Error al autenticar con Google"       | Aceptar permisos en el popup de Google        |
| "Error al hacer el archivo público"    | Verificar que la Edge Function esté deployada |
| "Error al guardar en la base de datos" | Verificar permisos RLS en tabla `archivos`    |

## 🎉 ¡Listo para usar!

El hook maneja TODOS los pasos automáticamente. Solo necesitas:

```tsx
const { openPicker, uploading, error } = useDriveUpload();

// Y llamar a:
await openPicker({ materiaId, comisionId, tipo });
```

## 🔗 Próximos pasos:

1. **Integrar en Subir.tsx**: Reemplazar la lógica actual por este hook
2. **Agregar UI feedback**: Mostrar progreso de cada paso
3. **Implementar refreshDbUser()**: Para actualizar puntos en tiempo real
4. **Testing**: Probar con diferentes tipos de archivos

---

**¿Necesitas ayuda con la integración?** Lee la documentación completa o prueba el componente de ejemplo.
