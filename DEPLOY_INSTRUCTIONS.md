# 🚀 Deploy de make-file-public a Supabase

## Pasos para hacer deploy:

### 1. Generar Access Token

1. Ve a: https://supabase.com/dashboard/account/tokens
2. Click en **"Generate New Token"**
3. Nombre: `CLI Token` (o el que quieras)
4. Copia el token generado

### 2. Configurar el token

```powershell
# Opción A: Variable de entorno (temporal, solo para esta sesión)
$env:SUPABASE_ACCESS_TOKEN = "sbp_tu_token_aqui"

# Opción B: Guardar en archivo (permanente)
npx supabase login --token sbp_tu_token_aqui
```

### 3. Link al proyecto (solo la primera vez)

Necesitas el Project Reference ID de tu proyecto:

1. Ve a: https://supabase.com/dashboard/projects
2. Click en tu proyecto "247 Terminal UI" (o como se llame)
3. En la URL verás: `https://supabase.com/dashboard/project/<PROJECT_REF>`
4. Copia el `<PROJECT_REF>`

```powershell
npx supabase link --project-ref <PROJECT_REF>
```

Ejemplo:

```powershell
npx supabase link --project-ref abcdefghijklmnop
```

### 4. Deploy la función

```powershell
npx supabase functions deploy make-file-public
```

### 5. Guardar la URL

Después del deploy exitoso, verás algo como:

```
Deployed Function make-file-public in region us-east-1
Function URL: https://abcdefghijklmnop.supabase.co/functions/v1/make-file-public
```

Copia esa URL y pégala en el archivo `.env`:

```env
# .env
VITE_SUPABASE_FUNCTION_URL=https://abcdefghijklmnop.supabase.co/functions/v1/make-file-public
```

O simplemente usa:

```typescript
const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-file-public`;
```

## Verificar deployment

```powershell
# Listar funciones deployadas
npx supabase functions list

# Ver logs de la función
npx supabase functions logs make-file-public
```

## Troubleshooting

### Error: "Access token not provided"

- Asegúrate de haber ejecutado `npx supabase login` o configurado `$env:SUPABASE_ACCESS_TOKEN`

### Error: "Project not linked"

- Ejecuta `npx supabase link --project-ref <PROJECT_REF>`

### Error: "Invalid credentials"

- Verifica que el token sea correcto
- Genera un nuevo token si es necesario

### Error: "Function already exists"

- Usa `npx supabase functions deploy make-file-public --no-verify-jwt` si hay conflictos

## Testing después del deploy

```powershell
# PowerShell - Test de la función
$body = @{
  fileId = "1abc...xyz"
  accessToken = "ya29.a0...tu_google_access_token"
} | ConvertTo-Json

$headers = @{
  "Authorization" = "Bearer $env:VITE_SUPABASE_ANON_KEY"
  "Content-Type" = "application/json"
}

Invoke-RestMethod `
  -Uri "https://TU-PROJECT-REF.supabase.co/functions/v1/make-file-public" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

## Comandos rápidos

```powershell
# 1. Login
$env:SUPABASE_ACCESS_TOKEN = "sbp_tu_token"

# 2. Link (solo primera vez)
npx supabase link --project-ref TU-PROJECT-REF

# 3. Deploy
npx supabase functions deploy make-file-public

# 4. Ver logs
npx supabase functions logs make-file-public --tail
```
