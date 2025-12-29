# 🔧 Solución al Error 502 de Google Drive

## ✅ Problema Resuelto

El error `502 Bad Gateway` ocurría al intentar cargar el Discovery Document de Google Drive API. Esto bloqueaba la inicialización del Google Picker.

## 🛠️ Cambios Aplicados

1. **Simplificación de gapi.load()**: Cambiado de `client:picker` a solo `picker`
2. **Eliminación de Discovery Docs**: Ya no se intenta cargar `discoveryDocs` que causaba el 502
3. **Timeouts agregados**: 10 segundos máximo para evitar cuelgues

## 📋 Pasos para Probar

### 1. Reiniciar el servidor de desarrollo (IMPORTANTE)

```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npm run dev
```

> ⚠️ **CRÍTICO**: Los cambios en `.env` solo se cargan al iniciar el servidor

### 2. Refrescar el navegador

```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 3. Probar el flujo completo

1. **Login**: Iniciar sesión con Google
2. **Navegar**: Ir a la página SUBIR
3. **Seleccionar**:
   - Materia: Cualquiera (ej: "ANÁLISIS MATEMÁTICO I")
   - Comisión: Cualquiera (ej: "1K01")
   - Tipo: Cualquiera (ej: "APUNTE (+90 puntos)")
4. **Subir**: Click en "SELECCIONAR DE DRIVE"

## 🔍 Logs Esperados en la Consola

Si todo funciona correctamente, deberías ver:

```
✅ Variables de entorno cargadas
🔄 Inicializando Google Picker...
📦 Cargando scripts de Google...
✅ Script de gapi cargado
✅ Script de GIS cargado
✅ Scripts de Google cargados
⚙️ Inicializando gapi picker...
✅ Gapi picker cargado
🔑 Inicializando token client...
✅ Google Picker inicializado correctamente
🔐 Solicitando acceso a Google Drive...
🔑 Obteniendo access token...
📂 Mostrando Google Picker...
```

## ❌ Errores Comunes

### Error: "Missing environment variables"

- **Causa**: Servidor no reiniciado después de cambiar `.env`
- **Solución**: `npm run dev` (reiniciar servidor)

### Error: "Failed to load picker"

- **Causa**: Bloqueador de popups activado
- **Solución**: Permitir popups para localhost:5173

### Error: "OAuth error"

- **Causa**: Client ID incorrecto o no configurado
- **Solución**: Verificar en Google Cloud Console que el Client ID está activo

## 🎯 Criterios de Éxito

✅ **Google Picker se abre** (ventana popup de Google)  
✅ **Puedes navegar** por tus archivos de Drive  
✅ **Puedes seleccionar** un archivo  
✅ **El archivo se sube** a Supabase  
✅ **Se muestra** el toast de éxito con los puntos ganados

## 🚨 Si Aún Falla

1. **Verificar Google Cloud Console**:
   - APIs habilitadas: Google Picker API, Google Drive API
   - Authorized JavaScript origins: `http://localhost:5173`

2. **Modo incógnito**: Probar en una ventana privada para descartar extensiones

3. **Verificar red**:
   - Firewall no bloquea `googleapis.com`
   - Antivirus no interfiere

4. **Consola del navegador**: Captura el error completo y compártelo

## 📞 Debugging

Si el problema persiste, ejecuta en la consola del navegador:

```javascript
// Ver configuración actual
console.log({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
});

// Forzar reinicialización
localStorage.clear();
location.reload();
```
