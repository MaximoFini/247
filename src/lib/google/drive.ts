/**
 * Google Drive API Integration
 * Funciones para interactuar con Google Drive API
 */

import { loadGapiScript } from "./loader";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  owners: Array<{
    displayName: string;
    emailAddress: string;
  }>;
  permissions?: Array<{
    id: string;
    type: string;
    role: string;
    emailAddress?: string;
  }>;
}

/**
 * Obtiene metadata completa de un archivo de Google Drive
 * @param fileId - ID del archivo en Google Drive
 * @param accessToken - Access token de OAuth2
 * @returns Metadata del archivo
 */
export async function getFileMetadata(
  fileId: string,
  accessToken: string
): Promise<DriveFileMetadata> {
  if (!API_KEY) {
    throw new Error("Missing VITE_GOOGLE_API_KEY environment variable");
  }

  await loadGapiScript();

  // Asegurar que gapi.client.drive esté cargado
  if (!gapi.client.drive) {
    await gapi.client.load("drive", "v3");
  }

  // Configurar el access token
  gapi.client.setToken({ access_token: accessToken });

  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      fields:
        "id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, owners, permissions",
    });

    return response.result as DriveFileMetadata;
  } catch (error) {
    console.error("Error fetching file metadata:", error);
    throw new Error(`Failed to fetch file metadata: ${error}`);
  }
}

/**
 * Descarga un archivo de Google Drive como Blob
 * @param fileId - ID del archivo
 * @param accessToken - Access token de OAuth2
 * @returns Blob del archivo
 */
export async function downloadFile(
  fileId: string,
  accessToken: string
): Promise<Blob> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return await response.blob();
}

/**
 * Cambia los permisos de un archivo para hacerlo público
 * Usa la Edge Function de Supabase para proteger credenciales
 * @param fileId - ID del archivo
 * @param accessToken - Access token con scope drive.file
 * @returns Objeto con información del archivo público
 */
export async function makeFilePublic(
  fileId: string,
  accessToken: string
): Promise<{
  success: boolean;
  permissionId?: string;
  downloadUrl: string;
  viewUrl: string;
  alreadyPublic?: boolean;
}> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/make-file-public`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          fileId,
          accessToken,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to make file public");
    }

    return await response.json();
  } catch (error) {
    console.error("Error making file public:", error);
    throw new Error(`Failed to make file public: ${error}`);
  }
}

/**
 * Elimina un permiso de un archivo
 * @param fileId - ID del archivo
 * @param permissionId - ID del permiso a eliminar
 * @param accessToken - Access token
 */
export async function removePermission(
  fileId: string,
  permissionId: string,
  accessToken: string
): Promise<void> {
  await loadGapiScript();

  if (!gapi.client.drive) {
    await gapi.client.load("drive", "v3");
  }

  gapi.client.setToken({ access_token: accessToken });

  try {
    await gapi.client.drive.permissions.delete({
      fileId: fileId,
      permissionId: permissionId,
    });
  } catch (error) {
    console.error("Error removing permission:", error);
    throw new Error(`Failed to remove permission: ${error}`);
  }
}

/**
 * Obtiene la URL directa de descarga de un archivo
 * @param fileId - ID del archivo
 * @returns URL de descarga
 */
export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Obtiene la URL de visualización de un archivo
 * @param fileId - ID del archivo
 * @returns URL de visualización
 */
export function getViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Verifica si un archivo es accesible públicamente
 * @param fileId - ID del archivo
 * @param accessToken - Access token
 * @returns true si el archivo es público
 */
export async function isFilePublic(
  fileId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const metadata = await getFileMetadata(fileId, accessToken);
    return metadata.permissions?.some((p) => p.type === "anyone") || false;
  } catch (error) {
    console.error("Error checking if file is public:", error);
    return false;
  }
}
