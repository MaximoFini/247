import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GOOGLE_API_URL = 'https://www.googleapis.com/drive/v3/files';

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { fileId, accessToken } = await req.json();

    if (!fileId || !accessToken) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
      });
    }

    // Cambiar permisos a público
    const response = await fetch(`${GOOGLE_API_URL}/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${error}`);
    }

    // Obtener link público
    const fileResponse = await fetch(
      `${GOOGLE_API_URL}/${fileId}?fields=webViewLink,webContentLink`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const fileData = await fileResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        webViewLink: fileData.webViewLink,
        webContentLink:  fileData.webContentLink,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});