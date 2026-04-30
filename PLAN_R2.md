# Plan de Migración: Google Drive → Cloudflare R2

> Estado actual verificado: **30 de abril de 2026**

## Resumen

Migración completa del sistema de archivos a Cloudflare R2 como storage de objetos. El upload estaba sin implementar (tenía un `throw new Error("Upload a R2 no implementado aún")`). Los downloads usaban `drive_link` apuntando a Google Drive. Reemplazamos ambos con R2.

**Arquitectura elegida:**

- **Upload:** Browser → Edge Function `get-upload-url` (genera presigned PUT URL) → PUT directo Browser→R2 (no se proxea el archivo por Supabase, evita timeouts en archivos grandes)
- **Download:** URL pública directa de R2 almacenada en DB. Sin presigned GET (los archivos son material educativo público)
- **Delete admin:** Edge Function `delete-r2-file` → luego delete en DB

---

## Estado actual del código (antes de tocar nada)

| Qué                                 | Estado                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload en `Subir.tsx`               | ❌ No implementado — `throw new Error("Upload a R2 no implementado aún")`                                                                    |
| Downloads en toda la app            | ✅ Funcionan con `drive_link` (columna en DB), pero apuntan a Google Drive                                                                   |
| Counter descargas en `FileCard.tsx` | ✅ Ya llama a `supabase.rpc("increment_descargas")` con fallback a `update` directo                                                          |
| Counter descargas en `Perfil.tsx`   | ❌ `<a href={file.drive_link}>` directo, sin counter                                                                                         |
| `make-file-public` Edge Function    | ❌ Carpeta existe pero no tiene `index.ts` — solo `deno.json` y `.npmrc`                                                                     |
| `moderate-file` Edge Function       | ❌ No existe. `activate`/`deactivate`/`approve` en `use-moderate-file.ts` ya estaban rotos                                                   |
| `supabase/migrations/`              | ❌ La carpeta no existe                                                                                                                      |
| Vista `admin_archivos_reportados`   | ⚠️ Existe en Supabase pero NO en código local. Referencia la columna `drive_link`                                                            |
| AWS SDK en `package.json`           | ✅ Ya instalado (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) — las Edge Functions Deno necesitan el prefijo `npm:` en los imports |

**Columnas a renombrar en la tabla `archivos`:**

- `drive_file_id` → `r2_key`
- `drive_link` → `file_url`

**Ocurrencias de `drive_link`/`drive_file_id` en el código fuente:** 20 en 8 archivos (detalladas en Fase 5).

---

## Fase 1 — Configuración de Cloudflare R2 (Manual, ~20 min)

> Hacé esto antes de tocar el código.

### 1.1 Crear el bucket

1. Ir a [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**
2. Nombre: `247-archivos` (o el que prefieras, anotarlo)
3. Region: Automatic (o `WNAM` West North America para menor latencia desde Argentina)

### 1.2 Habilitar acceso público

1. Dentro del bucket → **Settings** → **Public Access** → **Allow Access** → confirmar
2. Cloudflare te da una URL pública base tipo `https://pub-xxxxxxxxxxxx.r2.dev`
3. **Anotar esta URL** — será el valor de `R2_PUBLIC_URL`

> Alternativa recomendada para producción: usar un custom domain (`archivos.tudominio.com`) en Cloudflare. Evita depender de la URL `r2.dev` que puede cambiar.

### 1.3 Configurar CORS en el bucket

Bucket → **Settings** → **CORS Policy** → **Add CORS policy** → pegar este JSON:

```json
[
  {
    "AllowedOrigins": [
      "https://tudominio.com",
      "http://localhost:5173",
      "http://localhost:8080"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "x-amz-date",
      "authorization",
      "x-amz-content-sha256"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

> ⚠️ **CRÍTICO**: Sin esto el presigned PUT falla con un error de CORS en el browser. El mensaje de error es críptico y no menciona CORS directamente. Configurarlo **antes** de cualquier prueba de upload.

### 1.4 Crear API Token de R2

1. **Manage R2 API Tokens** (en la página principal de R2, no dentro del bucket) → **Create API Token**
2. Nombre: `247-archivos-rw`
3. Permissions: **Object Read & Write**
4. Specify bucket: `247-archivos`
5. Click **Create API Token**
6. **Guardar en lugar seguro:**
   - `Access Key ID`
   - `Secret Access Key`
   - `Account ID` (visible en la URL del dashboard: `dash.cloudflare.com/{ACCOUNT_ID}/...`)

### 1.5 Guardar credenciales en Supabase Secrets

```bash
supabase secrets set R2_ACCOUNT_ID=tu_account_id
supabase secrets set R2_BUCKET_NAME=247-archivos
supabase secrets set R2_ACCESS_KEY_ID=tu_access_key_id
supabase secrets set R2_SECRET_ACCESS_KEY=tu_secret_access_key
supabase secrets set R2_PUBLIC_URL=https://pub-xxxxxxxxxxxx.r2.dev
```

> ⚠️ **NUNCA** poner estas credenciales en `.env` con prefijo `VITE_`. Las variables `VITE_*` se embuten en el bundle del browser y son completamente públicas. Las credenciales de R2 van **solo** en Supabase Secrets, que las Edge Functions leen via `Deno.env.get()`.

---

## Fase 2 — Migración de base de datos

### 2.1 Crear la carpeta y el archivo de migration

Crear: `supabase/migrations/20260430000000_r2_migration.sql`

> La carpeta `supabase/migrations/` no existe todavía — crearla junto con el archivo.

### 2.2 Contenido del migration SQL

```sql
-- ============================================================
-- Migración: Google Drive → Cloudflare R2
-- ============================================================

-- 1. Renombrar columnas en la tabla archivos
ALTER TABLE archivos RENAME COLUMN drive_file_id TO r2_key;
ALTER TABLE archivos RENAME COLUMN drive_link TO file_url;

-- 2. Función RPC: incrementar descargas de forma atómica
-- FileCard.tsx ya la llama (con fallback), pero puede no existir en producción
CREATE OR REPLACE FUNCTION increment_descargas(archivo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE archivos
  SET descargas = descargas + 1
  WHERE id = archivo_id AND activo = true;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_descargas(uuid) TO anon, authenticated;

-- 3. Función RPC: agregar puntos de archivos de forma atómica
-- Evita el race condition de leer-modificar-escribir desde el frontend
CREATE OR REPLACE FUNCTION add_puntos_archivos(target_user_id uuid, puntos_a_agregar integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET puntos_archivos = puntos_archivos + puntos_a_agregar
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_puntos_archivos(uuid, integer) TO authenticated;

-- 4. Recrear la vista admin_archivos_reportados con la columna renombrada
-- Esta vista existe en Supabase pero NO en el código local.
-- Si el DROP falla porque no existe → ignorar y ejecutar solo el CREATE.
DROP VIEW IF EXISTS admin_archivos_reportados;

CREATE VIEW admin_archivos_reportados AS
SELECT
  a.id,
  a.nombre,
  a.tipo,
  a.extension,
  a.file_url,
  a.tamanio_mb,
  a.descargas,
  a.activo,
  a.reportado,
  a.motivo_reporte,
  a.reportado_at,
  a.created_at,
  m.nombre   AS materia_nombre,
  c.codigo   AS comision_codigo,
  u.nombre   AS uploader_nombre,
  u.email    AS uploader_email,
  rep.nombre AS reportador_nombre,
  rep.email  AS reportador_email,
  1          AS total_reportes
FROM archivos a
LEFT JOIN materias   m   ON a.materia_id    = m.id
LEFT JOIN comisiones c   ON a.comision_id   = c.id
LEFT JOIN users      u   ON a.user_id       = u.id
LEFT JOIN users      rep ON a.reportado_por = rep.id
WHERE a.reportado = true;
```

### 2.3 Aplicar el migration

```bash
# Opción A: Supabase CLI (recomendado)
supabase db push

# Opción B: Pegar el SQL directamente en el SQL Editor del Supabase Dashboard
# (útil si no tenés la CLI configurada con la remote DB)
```

> ⚠️ **Orden crítico**: Correr este migration **antes** de deployar el frontend con los nuevos nombres de columna. Si se deploya el frontend primero, la vista `admin_archivos_reportados` queda rota porque referencia `drive_link` (columna que ya no existe).

---

## Fase 3 — Edge Functions

### 3.1 `supabase/functions/get-upload-url/index.ts` (Nueva)

**Responsabilidad:** Recibir parámetros del archivo → generar presigned PUT URL → devolver URL + `r2Key` + URL pública final.

**Flujo:**

1. Verificar JWT del usuario autenticado (Supabase lo hace automáticamente con el header `Authorization: Bearer`)
2. Recibir: `{ fileName, contentType, materiaId, comisionId, tipo }`
3. Validar que `contentType` sea una extensión permitida (pdf, zip, doc, docx, ppt, pptx)
4. Generar `r2_key` único: `archivos/{materiaId}/{comisionId}/{tipo}/{uuid}.{ext}`
5. Crear `S3Client` con endpoint R2: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
6. Firmar `PutObjectCommand` con expiración de 900 segundos (15 min)
7. Retornar: `{ presignedUrl, r2Key, publicUrl }`

**Imports para Deno:**

```typescript
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
```

> ⚠️ **Pitfall Deno vs Node**: El `package.json` del frontend tiene `@aws-sdk/client-s3` instalado para Node.js. Las Edge Functions corren en **Deno** y necesitan el prefijo `npm:`. Sin ese prefijo la función no deploya.

> ⚠️ **Pitfall Content-Type**: El `Content-Type` con el que se firma la presigned URL **debe ser exactamente el mismo** que el browser envía en el `PUT`. Si difieren, R2 retorna 403. Incluir `ContentType: contentType` en el `PutObjectCommand` y enviarlo como header en el `fetch/XHR` del frontend.

También crear `supabase/functions/get-upload-url/deno.json`:

```json
{ "imports": {} }
```

### 3.2 `supabase/functions/delete-r2-file/index.ts` (Nueva)

**Responsabilidad:** Verificar que el usuario sea admin → eliminar el objeto de R2.

**Flujo:**

1. Verificar JWT
2. Consultar tabla `users` para verificar `is_admin = true`
3. Recibir: `{ r2Key }`
4. Ejecutar `DeleteObjectCommand` sobre el bucket
5. Retornar: `{ success: true }`

También crear `supabase/functions/delete-r2-file/deno.json`:

```json
{ "imports": {} }
```

### 3.3 Qué hacer con `make-file-public/`

La carpeta solo tiene `deno.json` y `.npmrc`, sin implementación. Se puede dejar como está o eliminar. **No se referencia en ningún lugar del frontend activo.** Crear `delete-r2-file/` como carpeta separada.

### 3.4 Qué hacer con `moderate-file` (Edge Function inexistente)

En `use-moderate-file.ts`, las acciones `activate`, `deactivate` y `approve` llaman a una Edge Function que **nunca se creó**. Ya estaban rotas antes de esta migración. Solución en Fase 5.6: migrarlas a llamadas directas a Supabase (igual que `delete` y `reject` que ya funcionan).

---

## Fase 4 — Frontend Upload (`src/pages/Subir.tsx`)

Reemplazar el bloque `try { throw new Error(...) }` en `handleSubmit` con:

**Paso 1 — Validación client-side** (antes de llamar a la API):

- Tamaño máximo: 50 MB
- Extensiones: `pdf`, `zip`, `doc`, `docx`, `ppt`, `pptx` (ya filtrado por el input `accept`)
- Todos los campos del form llenos

**Paso 2 — Obtener presigned URL:**

```typescript
const session = await supabase.auth.getSession();
const response = await fetch(`${SUPABASE_URL}/functions/v1/get-upload-url`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.data.session?.access_token}`,
  },
  body: JSON.stringify({
    fileName: selectedFile.name,
    contentType: selectedFile.type,
    materiaId,
    comisionId,
    tipo,
  }),
});
const { presignedUrl, r2Key, publicUrl } = await response.json();
```

**Paso 3 — Upload directo a R2 con progreso:**

```typescript
// Usar XHR (no fetch) para poder mostrar barra de progreso
await new Promise<void>((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable)
      setUploadProgress(Math.round((e.loaded / e.total) * 100));
  };
  xhr.onload = () =>
    xhr.status === 200
      ? resolve()
      : reject(new Error(`R2 error: ${xhr.status}`));
  xhr.onerror = () => reject(new Error("Error de red al subir el archivo"));
  xhr.open("PUT", presignedUrl);
  xhr.setRequestHeader("Content-Type", selectedFile.type);
  xhr.send(selectedFile);
});
```

**Paso 4 — Insertar en `archivos`:**

```typescript
await supabase.from("archivos").insert({
  user_id: user.id,
  materia_id: materiaId,
  comision_id: comisionId,
  tipo,
  nombre: selectedFile.name,
  r2_key: r2Key,
  file_url: publicUrl,
  tamanio_mb: parseFloat((selectedFile.size / 1024 / 1024).toFixed(2)),
  extension: selectedFile.name.split(".").pop()?.toLowerCase(),
  descargas: 0,
  activo: true,
  reportado: false,
});
```

**Paso 5 — Actualizar puntos (atómico):**

```typescript
await supabase.rpc("add_puntos_archivos", {
  target_user_id: user.id,
  puntos_a_agregar: puntosSeleccionados,
});
```

> ⚠️ **No usar**: `update({ puntos_archivos: dbUser.puntos_archivos + N })` — tiene un race condition si el usuario sube dos archivos en paralelo o hay un doble-submit accidental.

**Agregar estado:** `const [uploadProgress, setUploadProgress] = useState(0)` para mostrar la barra durante el upload.

---

## Fase 5 — Actualizar tipos y hooks de TypeScript

> Orden estricto: primero tipos → luego hooks → luego páginas.

### 5.1 `src/types/database.ts`

En la interfaz `Archivo`:

- `drive_file_id: string` → `r2_key: string`
- `drive_link: string` → `file_url: string`

### 5.2 `src/types/admin.ts`

- En `AdminArchivoReportado` (línea 38): `drive_link: string` → `file_url: string`
- En `AdminArchivo` (línea 60): `drive_link: string` → `file_url: string`

### 5.3 `src/hooks/use-public-files.ts`

- En `FILE_SELECT_FIELDS`: `drive_link` → `file_url`
- En `transformFile`: `link: file.drive_link` → `link: file.file_url`

### 5.4 `src/hooks/use-user-files.ts`

- En interfaz `UserFile`: ambos campos renombrados
- En el `.select(...)`: `drive_link, drive_file_id` → `file_url, r2_key`
- En el `.map(...)`: mismas asignaciones actualizadas

### 5.5 `src/hooks/use-admin-files.ts`

- En `FILE_SELECT_FIELDS`: `drive_link` → `file_url`, **agregar también `r2_key`** (necesario para el delete de R2 en Fase 6)
- En el transform: `drive_link: file.drive_link` → `file_url: file.file_url`

### 5.6 `src/hooks/use-moderate-file.ts`

- Cambiar firma: `moderateFile(archivoId: string, action: ModerationAction, r2Key?: string)`
- Acción `'delete'`: antes de `supabase.from('archivos').delete()`, llamar a la Edge Function `delete-r2-file` con el `r2Key`
- Acciones `'activate'` y `'deactivate'` (actualmente rotas): migrar a Supabase directo:
  ```typescript
  supabase
    .from("archivos")
    .update({ activo: action === "activate" })
    .eq("id", archivoId);
  ```
- Acción `'approve'` (actualmente rota): quitar reporte + activar:
  ```typescript
  supabase
    .from("archivos")
    .update({
      reportado: false,
      motivo_reporte: null,
      reportado_at: null,
      reportado_por: null,
      activo: true,
    })
    .eq("id", archivoId);
  ```

### 5.7 `src/pages/Perfil.tsx` (línea 295)

- `href={file.drive_link}` → `href={file.file_url}`
- Texto "VER EN DRIVE" → "DESCARGAR"
- Convertir el `<a>` en un elemento con `onClick` que llame `supabase.rpc('increment_descargas', { archivo_id: file.id })` y luego `window.open(file.file_url, '_blank')`

### 5.8 `src/pages/admin/Archivos.tsx` (línea 307)

- `href={file.drive_link}` → `href={file.file_url}`
- Texto → "VER ARCHIVO"

### 5.9 `src/pages/admin/ArchivosReportados.tsx` (línea 160)

- `href={file.drive_link}` → `href={file.file_url}`
- Texto → "VER ARCHIVO"

---

## Fase 6 — Admin Delete con limpieza en R2

### 6.1 `src/hooks/use-admin-files.ts` — función `deleteFile`

Actualmente solo borra de la DB. Nuevo flujo:

1. Obtener token de sesión
2. `POST /functions/v1/delete-r2-file` con `{ r2Key: file.r2_key }`
3. Si falla la Edge Function: loguear el error pero **continuar** (el objeto queda huérfano en R2, no es crítico)
4. `DELETE FROM archivos WHERE id = id`

> El campo `r2_key` debe estar en el SELECT del hook (cubierto en Fase 5.5).

### 6.2 `src/hooks/use-moderate-file.ts` — acción `'delete'`

Mismo enfoque que 6.1, usando el `r2Key?` agregado a la firma en Fase 5.6.

---

## Orden de ejecución recomendado

```
Fase 1 — R2 setup (manual)            ~20 min
         ↓
Fase 2 — DB migration                 Correr ANTES de cambiar cualquier código
         ↓
Fase 3 — Edge Functions               Escribir y deployar ambas funciones
         ↓
Fase 4 + Fase 5 (en paralelo)         Upload frontend + renombrar campos en tipos/hooks/páginas
         ↓
Fase 6 — Admin delete con R2          Depende de Fase 3 (delete-r2-file) y Fase 5.5 (r2_key en SELECT)
         ↓
Verificación completa
```

---

## Verificación completa

| Escenario                   | Qué verificar                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Upload básico**           | `/subir` → subir un PDF → aparece en bucket R2, registro en `archivos` con `r2_key` y `file_url`, puntos del usuario incrementados |
| **Download desde homepage** | Click en Descargar en `/` → abre URL de R2, campo `descargas` se incrementa en Supabase                                            |
| **Download desde Perfil**   | Click en link de archivo en `/perfil` → abre URL de R2, `descargas` se incrementa                                                  |
| **Admin toggle activo**     | Admin → Archivos → desactivar → `activo = false` en DB, no aparece en homepage                                                     |
| **Admin delete**            | Admin → Archivos → eliminar → desaparece de DB **y** del bucket R2                                                                 |
| **Admin reportados — ver**  | Admin → Archivos Reportados → "Ver archivo" → abre URL de R2                                                                       |
| **Moderate delete**         | Admin → Eliminar desde reportados → se borra de DB y de R2                                                                         |
| **Moderate reject**         | Admin → Rechazar reporte → archivo queda activo, sin flag de reporte                                                               |
| **Moderate approve**        | Admin → Aprovar reporte → `reportado = false`, `activo = true`                                                                     |
| **Upload > 50MB**           | Rechazado con mensaje de error **antes** de llamar a la Edge Function                                                              |
| **Verificar secrets**       | Si la Edge Function retorna 500: `supabase secrets list` → confirmar las 5 variables de R2                                         |

---

## Posibles problemas y soluciones

### 403 en el PUT a R2

**Causa más probable:** El `Content-Type` del `PUT` no coincide con el que se usó para firmar la URL.  
**Solución:** Incluir `ContentType: contentType` en el `PutObjectCommand` de la Edge Function, y enviar exactamente ese mismo valor como header en el `XHR.setRequestHeader('Content-Type', ...)` del frontend.

### Error de CORS en el PUT a R2

**Causa:** La CORS policy no está configurada en el bucket, o el origin del frontend no está en la lista.  
**Solución:** Cloudflare Dashboard → bucket → Settings → CORS. Agregar el origin exacto (con y sin `www`, con `http` y `https` según corresponda).

### Edge Function retorna 500

**Causas frecuentes:**

1. Secrets no seteados → verificar con `supabase secrets list`
2. Endpoint R2 incorrecto → debe ser `https://{ACCOUNT_ID}.r2.cloudflarestorage.com` (no el de AWS)
3. Imports Deno sin `npm:` → verificar que sea `import ... from "npm:@aws-sdk/..."`

### Vista `admin_archivos_reportados` retorna error

**Causa:** El migration no se corrió todavía, la vista sigue referenciando `drive_link` (columna ya renombrada).  
**Solución:** Correr el migration **antes** de deployar el frontend.

### Archivos existentes (anteriores a la migración) no tienen URL

**Causa:** Filas antiguas tienen `r2_key = null` y `file_url = null` o vacío (antes eran placeholders de Google Drive que nunca se usaron realmente).  
**Solución:** En los botones de descarga, si `file_url` es `null` o vacío, mostrar el botón deshabilitado con el texto "Archivo no disponible" en lugar de un link roto.

### `puntos_archivos` no se actualiza después del upload

**Causa:** La función RPC `add_puntos_archivos` no existe en la DB (migration no corrido).  
**Solución:** Verificar que el migration se corrió. Si la función no existe, el `supabase.rpc(...)` retorna error — capturarlo y loguear sin romper el flujo (el archivo ya se subió correctamente).

### Cold start lento en la primera subida del día

**Causa normal:** Las Edge Functions de Supabase tienen cold start de ~500ms-1s en la primera invocación del día.  
**No es un bug** — las llamadas subsiguientes son rápidas.

### Upload falla silenciosamente en archivos grandes

**Causa posible:** El browser cancela el `XHR` si el usuario cierra o navega fuera de la página durante el upload.  
**Solución:** Advertir al usuario que no cierre la página mientras el upload está en progreso (mostrar el estado claramente en la UI).

---

## Resumen de archivos a crear/modificar

| Archivo                                               | Tipo      | Acción                                                          |
| ----------------------------------------------------- | --------- | --------------------------------------------------------------- |
| `supabase/migrations/20260430000000_r2_migration.sql` | Nuevo     | Crear                                                           |
| `supabase/functions/get-upload-url/index.ts`          | Nuevo     | Crear                                                           |
| `supabase/functions/get-upload-url/deno.json`         | Nuevo     | Crear                                                           |
| `supabase/functions/delete-r2-file/index.ts`          | Nuevo     | Crear                                                           |
| `supabase/functions/delete-r2-file/deno.json`         | Nuevo     | Crear                                                           |
| `src/types/database.ts`                               | Existente | Renombrar `drive_file_id` → `r2_key`, `drive_link` → `file_url` |
| `src/types/admin.ts`                                  | Existente | Renombrar `drive_link` → `file_url` (x2)                        |
| `src/hooks/use-public-files.ts`                       | Existente | Renombrar `drive_link` → `file_url`                             |
| `src/hooks/use-user-files.ts`                         | Existente | Renombrar ambos campos                                          |
| `src/hooks/use-admin-files.ts`                        | Existente | Renombrar + agregar `r2_key` al SELECT                          |
| `src/hooks/use-moderate-file.ts`                      | Existente | Delete usa R2; activate/deactivate/approve → Supabase directo   |
| `src/pages/Subir.tsx`                                 | Existente | Implementar upload completo con progreso                        |
| `src/pages/Perfil.tsx`                                | Existente | `drive_link` → `file_url`, texto, agregar counter               |
| `src/pages/admin/Archivos.tsx`                        | Existente | `drive_link` → `file_url`, texto                                |
| `src/pages/admin/ArchivosReportados.tsx`              | Existente | `drive_link` → `file_url`, texto                                |

**Total: 5 archivos nuevos, 10 archivos a modificar.**

---

_Plan verificado contra el código real del proyecto. Última revisión: 30/04/2026._
