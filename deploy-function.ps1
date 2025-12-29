# Deploy Script para make-file-public Supabase Edge Function
# 
# Uso:
#   .\deploy-function.ps1 -ProjectRef "tu-project-ref" -AccessToken "sbp_tu_token"
#
# O si ya tienes las variables de entorno configuradas:
#   .\deploy-function.ps1

param(
    [string]$ProjectRef = $env:SUPABASE_PROJECT_REF,
    [string]$AccessToken = $env:SUPABASE_ACCESS_TOKEN
)

Write-Host "🚀 Supabase Edge Function Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Verificar que tenemos el project ref
if ([string]::IsNullOrEmpty($ProjectRef)) {
    Write-Host "❌ Project Reference no configurado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor ejecuta uno de estos comandos:" -ForegroundColor Yellow
    Write-Host "  1. .\deploy-function.ps1 -ProjectRef 'tu-project-ref' -AccessToken 'sbp_token'" -ForegroundColor Gray
    Write-Host "  2. `$env:SUPABASE_PROJECT_REF = 'tu-project-ref'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Puedes encontrar tu Project Ref en:" -ForegroundColor Yellow
    Write-Host "  https://supabase.com/dashboard/projects" -ForegroundColor Blue
    exit 1
}

# Verificar que tenemos el access token
if ([string]::IsNullOrEmpty($AccessToken)) {
    Write-Host "❌ Access Token no configurado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor ejecuta uno de estos comandos:" -ForegroundColor Yellow
    Write-Host "  1. .\deploy-function.ps1 -ProjectRef 'tu-project-ref' -AccessToken 'sbp_token'" -ForegroundColor Gray
    Write-Host "  2. `$env:SUPABASE_ACCESS_TOKEN = 'sbp_token'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Genera un token en:" -ForegroundColor Yellow
    Write-Host "  https://supabase.com/dashboard/account/tokens" -ForegroundColor Blue
    exit 1
}

# Configurar token de acceso
$env:SUPABASE_ACCESS_TOKEN = $AccessToken

Write-Host "✅ Configuración:" -ForegroundColor Green
Write-Host "  Project Ref: $ProjectRef" -ForegroundColor Gray
Write-Host "  Token: sbp_***${AccessToken.Substring([Math]::Max($AccessToken.Length - 8, 0))}" -ForegroundColor Gray
Write-Host ""

# Link al proyecto (si no está linkeado ya)
Write-Host "🔗 Linkeando al proyecto..." -ForegroundColor Cyan
$linkOutput = npx supabase link --project-ref $ProjectRef 2>&1
if ($LASTEXITCODE -ne 0) {
    # Puede que ya esté linkeado, continuar
    Write-Host "  Proyecto ya está linkeado o error al linkear" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Linkeado exitosamente" -ForegroundColor Green
}
Write-Host ""

# Deploy la función
Write-Host "📦 Deployando función make-file-public..." -ForegroundColor Cyan
$deployOutput = npx supabase functions deploy make-file-public 2>&1 | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Deploy exitoso!" -ForegroundColor Green
    Write-Host ""
    
    # Construir la URL de la función
    $functionUrl = "https://${ProjectRef}.supabase.co/functions/v1/make-file-public"
    
    Write-Host "🌐 URL de la función:" -ForegroundColor Cyan
    Write-Host "  $functionUrl" -ForegroundColor Blue
    Write-Host ""
    
    # Guardar URL en archivo de configuración
    $configContent = @"
# Supabase Edge Function URL
# Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

VITE_MAKE_FILE_PUBLIC_URL=$functionUrl

# También puedes usar:
# `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-file-public
"@
    
    $configPath = ".env.function"
    Set-Content -Path $configPath -Value $configContent
    
    Write-Host "💾 URL guardada en:" -ForegroundColor Green
    Write-Host "  $configPath" -ForegroundColor Gray
    Write-Host ""
    
    # Copiar al portapapeles (si está disponible)
    try {
        Set-Clipboard -Value $functionUrl
        Write-Host "📋 URL copiada al portapapeles!" -ForegroundColor Green
    } catch {
        Write-Host "📋 No se pudo copiar al portapapeles (no disponible)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 Deploy completado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. La URL ya está en .env.function" -ForegroundColor Gray
    Write-Host "  2. Usa makeFilePublic() desde @/lib/google/drive" -ForegroundColor Gray
    Write-Host "  3. Ver logs: npx supabase functions logs make-file-public" -ForegroundColor Gray
    
} else {
    Write-Host "  ❌ Error en el deploy" -ForegroundColor Red
    Write-Host ""
    Write-Host "Output del comando:" -ForegroundColor Yellow
    Write-Host $deployOutput
    Write-Host ""
    Write-Host "Intenta:" -ForegroundColor Yellow
    Write-Host "  npx supabase functions deploy make-file-public --debug" -ForegroundColor Gray
    exit 1
}
