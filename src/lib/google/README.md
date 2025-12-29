# Google APIs Integration - Guía de Configuración

## � Edge Function Deployada

**URL de la función make-file-public:**

```
https://nesbqbdqeieyjuvkhwhf.supabase.co/functions/v1/make-file-public
```

**Dashboard:** https://supabase.com/dashboard/project/nesbqbdqeieyjuvkhwhf/functions

---

## �📋 Archivos creados

```
src/lib/google/
├── loader.ts          # Carga scripts de Google (gapi + GIS)
├── picker.ts          # Google Picker para seleccionar archivos
├── drive.ts           # Google Drive API (metadata, permisos)
└── types.d.ts         # TypeScript definitions
```

## 🔧 Configuración en Google Cloud Console

### 1. Crear proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - **Google Picker API**
   - **Google Drive API**

### 2. Crear credenciales

#### OAuth 2.0 Client ID

1. Ve a **APIs & Services → Credentials**
2. Click en **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. Tipo de aplicación: **Web application**
4. Nombre: `247 Terminal UI` (o el que quieras)
5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:4173
   https://tu-dominio.com
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:5173
   https://tu-dominio.com
   ```
7. Click **CREATE**
8. Copia el **Client ID** → va en `VITE_GOOGLE_CLIENT_ID`

#### API Key

1. Ve a **APIs & Services → Credentials**
2. Click en **"+ CREATE CREDENTIALS"** → **API key**
3. Copia la **API key** → va en `VITE_GOOGLE_API_KEY`
4. (Recomendado) Click en **RESTRICT KEY**:
   - **Application restrictions**: HTTP referrers
   - Agregar: `http://localhost:5173/*` y tu dominio
   - **API restrictions**: Restrict key → Seleccionar:
     - Google Picker API
     - Google Drive API

### 3. Configurar OAuth consent screen

1. Ve a **APIs & Services → OAuth consent screen**
2. **User Type**: External (si es para uso público)
3. Completa la información básica:
   - App name: `247 Terminal`
   - User support email: tu email
   - Developer contact: tu email
4. **Scopes**: Agregar estos scopes:
   ```
   https://www.googleapis.com/auth/drive.readonly
   https://www.googleapis.com/auth/drive.file
   ```
5. **Test users** (si está en modo Testing): Agregar tu email
6. Guardar y continuar

## 📝 Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🚀 Uso básico

### Opción 1: Componente React (recomendado)

```tsx
import { GooglePickerExample } from "@/components/GooglePickerExample";

function App() {
  return <GooglePickerExample />;
}
```

### Opción 2: Uso manual

```tsx
import { useState } from "react";
import { initializePicker, showPicker } from "@/lib/google/picker";
import { getFileMetadata, makeFilePublic } from "@/lib/google/drive";

function MyComponent() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleSelectFile = async () => {
    // 1. Inicializar (solo una vez)
    await initializePicker();

    // 2. Mostrar picker
    const file = await showPicker();

    if (file) {
      console.log("Archivo seleccionado:", {
        id: file.fileId,
        nombre: file.fileName,
        tipo: file.mimeType,
        tamaño: file.sizeBytes,
      });

      // 3. (Opcional) Obtener metadata completa
      const metadata = await getFileMetadata(file.fileId, accessToken!);
      console.log("Metadata:", metadata);

      // 4. (Opcional) Hacer público el archivo
      await makeFilePublic(file.fileId, accessToken!);
    }
  };

  return (
    <button onClick={handleSelectFile}>Seleccionar archivo de Drive</button>
  );
}
```

## 🔒 Scopes y permisos

Los scopes configurados son:

- `https://www.googleapis.com/auth/drive.readonly` → Leer archivos
- `https://www.googleapis.com/auth/drive.file` → Modificar permisos

Si necesitas más permisos, edita `SCOPES` en `picker.ts`.

## 📦 Tipos de archivos permitidos

Por defecto, el picker acepta:

- **PDF** (`.pdf`)
- **Word** (`.doc`, `.docx`)
- **PowerPoint** (`.ppt`, `.pptx`)
- **Excel** (`.xls`, `.xlsx`)
- **ZIP** (`.zip`)

Para cambiar, edita `ALLOWED_MIME_TYPES` en `picker.ts`.

## 🐛 Troubleshooting

### "Missing VITE_GOOGLE_CLIENT_ID"

- Asegúrate de que `.env` existe y tiene las variables
- Reinicia el servidor de desarrollo (`npm run dev`)

### "Failed to load Google API script"

- Verifica tu conexión a internet
- Asegúrate de que los scripts no estén bloqueados por extensiones (AdBlock, etc.)

### "Access token denied"

- Verifica que el OAuth consent screen esté configurado correctamente
- Asegúrate de que tu email esté en los test users (si está en modo Testing)
- Verifica que los scopes estén aprobados

### "API key not valid"

- Verifica que la API key sea correcta en `.env`
- Asegúrate de que el HTTP referer esté permitido en las restricciones de la key

## 📚 Referencias

- [Google Picker API](https://developers.google.com/picker)
- [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

## 🔄 Migración desde gapi.auth2 (deprecated)

Este proyecto usa **Google Identity Services (GIS)**, NO `gapi.auth2` que está deprecated desde 2023.

| Deprecated ❌                  | Nuevo ✅                                   |
| ------------------------------ | ------------------------------------------ |
| `gapi.auth2.getAuthInstance()` | `google.accounts.oauth2.initTokenClient()` |
| `gapi.auth2.signIn()`          | `tokenClient.requestAccessToken()`         |
| `gapi.auth2.signOut()`         | `google.accounts.oauth2.revoke()`          |
