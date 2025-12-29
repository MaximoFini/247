# make-file-public - Supabase Edge Function

Esta función Edge hace que un archivo de Google Drive sea público (anyone can read) usando la Google Drive API.

## 🎯 Propósito

Cuando un usuario selecciona un archivo de su Google Drive personal, necesitamos hacerlo público para que otros puedan descargarlo. Esta función se ejecuta en el backend (Edge Runtime) para:

1. **Proteger credenciales**: El access token no se expone en el frontend
2. **Validar permisos**: Verificar que el usuario tenga permisos sobre el archivo
3. **Manejar errores**: Respuestas consistentes y logging centralizado

## 📡 API

### Request

```typescript
POST /functions/v1/make-file-public

Headers:
- Authorization: Bearer <SUPABASE_ANON_KEY>
- Content-Type: application/json

Body:
{
  "fileId": "1abc...xyz",        // ID del archivo en Google Drive
  "accessToken": "ya29.a0..."    // Access token de OAuth2 del usuario
}
```

### Response (Success)

```json
{
  "success": true,
  "permissionId": "anyoneWithLink",
  "message": "File is now public",
  "downloadUrl": "https://drive.google.com/uc?export=download&id=1abc...xyz",
  "viewUrl": "https://drive.google.com/file/d/1abc...xyz/view"
}
```

### Response (Already Public)

```json
{
  "success": true,
  "message": "File is already public",
  "alreadyPublic": true
}
```

### Response (Error)

```json
{
  "error": "Failed to create permission: ...",
  "details": "..."
}
```

## 🚀 Deploy

### 1. Asegúrate de tener Supabase CLI

```bash
# Verificar versión
npx supabase --version

# Si no está instalado, se instalará automáticamente con npx
```

### 2. Link al proyecto de Supabase

```bash
npx supabase link --project-ref <your-project-ref>
```

Tu project-ref está en: https://supabase.com/dashboard/project/<project-ref>

### 3. Deploy la función

```bash
npx supabase functions deploy make-file-public
```

### 4. Verificar deployment

```bash
npx supabase functions list
```

## 🧪 Testing Local

### 1. Iniciar Supabase local

```bash
npx supabase start
```

Esto levanta:

- Postgres database
- Auth service
- Storage service
- **Edge Functions runtime**

### 2. Servir la función localmente

```bash
npx supabase functions serve make-file-public
```

### 3. Hacer un request de prueba

```powershell
# PowerShell
$body = @{
  fileId = "1abc...xyz"
  accessToken = "ya29.a0..."
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:54321/functions/v1/make-file-public" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

## 📝 Uso desde el Frontend

```typescript
import { makeFilePublic } from "@/lib/google/drive";

// Después de que el usuario seleccione un archivo con Google Picker
const result = await makeFilePublic(fileId, accessToken);

console.log("Download URL:", result.downloadUrl);
console.log("View URL:", result.viewUrl);
```

## 🔒 Seguridad

### CORS

La función tiene CORS habilitado (`Access-Control-Allow-Origin: *`) para desarrollo. En producción, deberías restringirlo:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tu-dominio.com",
  // ...
};
```

### Rate Limiting

Considera agregar rate limiting en producción usando Supabase Auth:

```typescript
// Obtener usuario autenticado
const authHeader = req.headers.get("Authorization")!;
const token = authHeader.replace("Bearer ", "");
const {
  data: { user },
} = await supabaseClient.auth.getUser(token);

if (!user) {
  return new Response("Unauthorized", { status: 401 });
}
```

## 🐛 Troubleshooting

### "Failed to create permission"

- Verifica que el `accessToken` sea válido
- Asegúrate de que el usuario tenga permisos sobre el archivo
- Verifica que el scope `drive.file` esté incluido

### "CORS error"

- Verifica que la función devuelva los headers CORS correctos
- En desarrollo local, usa `http://localhost:5173` (no `127.0.0.1`)

### "Function not found"

- Verifica que hayas deployado la función: `npx supabase functions deploy`
- Verifica la URL: `<SUPABASE_URL>/functions/v1/make-file-public`

## 📚 Referencias

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Google Drive API - Permissions](https://developers.google.com/drive/api/v3/reference/permissions)
- [Deno Runtime](https://deno.land/manual)
