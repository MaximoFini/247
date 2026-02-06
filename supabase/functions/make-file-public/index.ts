import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GOOGLE_API_URL = 'https://www.googleapis.com/drive/v3/files';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, accessToken } = await req.json();

    if (!fileId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros: fileId o accessToken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primero verificar que el usuario tiene acceso al archivo
    const checkResponse = await fetch(
      `${GOOGLE_API_URL}/${fileId}?fields=id,name,ownedByMe,capabilities&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!checkResponse.ok) {
      const checkError = await checkResponse.json().catch(() => ({}));
      const errorCode = checkError?.error?.code || checkResponse.status;
      const errorMessage = checkError?.error?.message || 'No se puede acceder al archivo';
      
      // Mensajes específicos según el error
      if (errorCode === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Token de Google expirado o inválido. Por favor, volvé a autenticarte.',
            code: 'TOKEN_EXPIRED'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (errorCode === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Archivo no encontrado. Verificá que el archivo exista en tu Drive.',
            code: 'FILE_NOT_FOUND'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, code: 'ACCESS_ERROR' }),
        { status: errorCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileInfo = await checkResponse.json();
    
    // Verificar si el usuario puede cambiar permisos
    if (!fileInfo.capabilities?.canShare) {
      return new Response(
        JSON.stringify({ 
          error: 'No tenés permisos para compartir este archivo. Solo podés subir archivos que te pertenezcan.',
          code: 'CANNOT_SHARE'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cambiar permisos a público (con soporte para Shared Drives)
    const permResponse = await fetch(
      `${GOOGLE_API_URL}/${fileId}/permissions?supportsAllDrives=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (!permResponse.ok) {
      const permError = await permResponse.json().catch(() => ({}));
      const errorMessage = permError?.error?.message || 'Error al cambiar permisos';
      const errorReason = permError?.error?.errors?.[0]?.reason;
      
      // Mensajes específicos según el tipo de error de permisos
      if (errorReason === 'sharingRateLimitExceeded') {
        return new Response(
          JSON.stringify({ 
            error: 'Límite de compartir excedido. Esperá unos minutos e intentá de nuevo.',
            code: 'RATE_LIMIT'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (errorReason === 'sharingNotAllowedForDomain' || errorReason === 'domainPolicy') {
        return new Response(
          JSON.stringify({ 
            error: 'Tu organización no permite compartir archivos públicamente. Usá un archivo de tu Drive personal.',
            code: 'DOMAIN_POLICY'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, code: 'PERMISSION_ERROR' }),
        { status: permResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener links públicos (con soporte para Shared Drives)
    const fileResponse = await fetch(
      `${GOOGLE_API_URL}/${fileId}?fields=webViewLink,webContentLink&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!fileResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener links del archivo', code: 'LINK_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileData = await fileResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        webViewLink: fileData.webViewLink,
        webContentLink: fileData.webContentLink,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en make-file-public:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});