# 🔧 INSTRUCCIONES PARA ARREGLAR GOOGLE DRIVE

## ✅ Cambios realizados:

### 1. Variables de entorno corregidas en `.env`

- ❌ `VITE_PUBLIC_GOOGLE_CLIENT_ID`
- ✅ `VITE_GOOGLE_CLIENT_ID`

- ❌ `VITE_PUBLIC_GOOGLE_API_KEY`
- ✅ `VITE_GOOGLE_API_KEY`

### 2. Hook mejorado con mejor debugging

- Ahora valida solo `user`, no requiere `dbUser`
- Muestra logs detallados en consola

### 3. Picker con logs detallados

- Muestra cada paso de la inicialización
- Valida que las variables de entorno estén configuradas

## 🚀 PASOS PARA PROBAR:

### 1. **REINICIAR el servidor de desarrollo**

**IMPORTANTE:** Las variables de entorno solo se cargan al iniciar el servidor.

```powershell
# En la terminal, presiona Ctrl+C para detener
# Luego ejecuta:
npm run dev
```

### 2. **Limpiar caché del navegador**

- Abre DevTools (F12)
- Pestaña "Aplicación" / "Application"
- Click en "Borrar datos del sitio" / "Clear storage"
- O simplemente cierra y abre el navegador

### 3. **Probar la subida:**

1. Abre http://localhost:5173
2. Login con Google
3. Ve a **SUBIR**
4. Selecciona materia, comisión y tipo
5. Click **"SELECCIONAR DE DRIVE"**

### 4. **Ver logs en consola:**

Deberías ver algo como:

```
📝 Valores del formulario: { materiaId: "...", comisionId: "...", tipo: "apunte" }
👤 Estado de autenticación: { hasUser: true, hasDbUser: true, userId: "..." }
🔐 Solicitando acceso a Google Drive...
🔧 Inicializando Google Picker...
📋 Variables de entorno: { hasClientId: true, hasApiKey: true, clientId: "101432261092..." }
📥 Cargando scripts de Google...
✅ Scripts cargados
⚙️ Inicializando gapi client...
✅ Gapi client inicializado
🔑 Inicializando token client...
✅ Google Picker inicializado correctamente
```

## 🐛 Si sigue sin funcionar:

### Error: "Missing VITE_GOOGLE_CLIENT_ID"

- Verifica que el archivo `.env` esté en la raíz del proyecto
- Verifica que las variables NO tengan `VITE_PUBLIC_`
- **REINICIA el servidor** (npm run dev)

### Error: "Debes estar logueado"

- Verifica que estés logueado (debe aparecer "MI PERFIL" en el navbar)
- Si estás logueado pero sale el error, revisa los logs de consola

### Error en Google Drive

- Verifica que el Client ID y API Key sean correctos
- Ve a: https://console.cloud.google.com/apis/credentials
- Verifica que las APIs estén habilitadas (Google Picker API, Drive API)

### Popup de Google no aparece

- Desactiva extensiones del navegador (AdBlock, Privacy Badger, etc.)
- Prueba en modo incógnito
- Verifica que los "Authorized JavaScript origins" en Google Cloud Console incluyan:
  - http://localhost:5173
  - http://localhost:4173

## 📋 Checklist:

- [ ] .env tiene `VITE_GOOGLE_CLIENT_ID` (sin VITE*PUBLIC*)
- [ ] .env tiene `VITE_GOOGLE_API_KEY` (sin VITE*PUBLIC*)
- [ ] Servidor reiniciado (npm run dev)
- [ ] Navegador actualizado (F5 o Ctrl+Shift+R)
- [ ] Usuario logueado correctamente
- [ ] Consola del navegador abierta (F12) para ver logs

---

**Si todo está OK, deberías ver el popup de Google para seleccionar archivos de tu Drive.** 🎉
