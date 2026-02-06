/**
 * Hook personalizado para subir archivos desde Google Drive
 * 
 * Maneja todo el flujo:
 * 1. Autenticación con Google Drive
 * 2. Selección de archivo con Google Picker
 * 3. Hacer el archivo público (directo con Google Drive API)
 * 4. Guardar en la base de datos de Supabase
 * 5. Actualizar puntos del usuario
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { requestDriveAccess, showGooglePicker } from '@/lib/google/picker';
import type { PickedFile } from '@/lib/google/picker';
import type { TipoArchivo } from '@/types/database';

export interface UploadParams {
  materiaId: string | number;
  comisionId: string | number;
  tipo: TipoArchivo;
}

export interface UploadResult {
  archivoId: number;
  downloadUrl: string;
  viewUrl: string;
}

interface UseDriveUploadReturn {
  openPicker: (params: UploadParams) => Promise<UploadResult | null>;
  uploading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook para subir archivos desde Google Drive
 */
export function useDriveUpload(): UseDriveUploadReturn {
  const { user, dbUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const openPicker = useCallback(
    async (params: UploadParams): Promise<UploadResult | null> => {
      try {
        // Validación: usuario debe estar autenticado
        console.log('👤 Estado de autenticación:', { 
          hasUser: !!user, 
          hasDbUser: !!dbUser,
          userId: user?.id 
        });

        if (!user) {
          throw new Error('Debes estar logueado para subir archivos');
        }

        // Validación: parámetros requeridos (sin convertir a número, pueden ser strings/UUIDs)
        console.log('📋 Validando parámetros:', {
          materiaId: params.materiaId,
          comisionId: params.comisionId,
          tipo: params.tipo,
          materiaIdType: typeof params.materiaId,
          comisionIdType: typeof params.comisionId
        });
        
        if (!params.materiaId || !params.comisionId || !params.tipo) {
          throw new Error('Faltan parámetros requeridos: materiaId, comisionId, tipo');
        }

        setUploading(true);
        setError(null);

        // PASO 1: Solicitar acceso a Google Drive
        console.log('🔐 Solicitando acceso a Google Drive...');
        let accessToken: string;
        try {
          accessToken = await requestDriveAccess();
          console.log('✅ Access token obtenido');
        } catch (err) {
          console.error('❌ Error al obtener access token:', err);
          throw new Error(
            'Error al autenticar con Google Drive. Asegúrate de dar los permisos necesarios.'
          );
        }

        // PASO 2: Mostrar Google Picker para seleccionar archivo
        console.log('📂 Abriendo Google Picker...');
        let pickedFile: PickedFile | null;
        try {
          pickedFile = await showGooglePicker(accessToken);
        } catch (err) {
          throw new Error(
            'Error al abrir el selector de archivos. Intenta nuevamente.'
          );
        }

        // Usuario canceló la selección
        if (!pickedFile) {
          console.log('❌ Usuario canceló la selección');
          setUploading(false);
          return null;
        }

        console.log('✅ Archivo seleccionado:', pickedFile.name);

        // PASO 3: Hacer el archivo público directamente con Google Drive API
        console.log('🔓 Haciendo el archivo público...');
        let publicFileData: {
          success: boolean;
          webContentLink: string;
          webViewLink: string;
        };

        try {
          // 3a. Hacer archivo público (compartir con "anyone")
          const permissionsResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${pickedFile.id}/permissions`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                role: 'reader',
                type: 'anyone',
              }),
            }
          );

          if (!permissionsResponse.ok) {
            const errorData = await permissionsResponse.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || '';
            
            // Mensajes amigables según el tipo de error
            let userMessage: string;
            
            if (permissionsResponse.status === 401) {
              userMessage = 'Tu sesión de Google expiró. Por favor, intentá de nuevo.';
            } else if (permissionsResponse.status === 404) {
              userMessage = 'No se encontró el archivo. Verificá que exista en tu Drive.';
            } else if (errorMessage.includes('sharingFolderNotAllowed')) {
              userMessage = 'No podés compartir carpetas. Por favor, seleccioná un archivo.';
            } else if (errorMessage.includes('domainPolicy')) {
              userMessage = 'Tu organización no permite compartir archivos públicamente. Usá un archivo de tu Drive personal.';
            } else if (errorMessage.includes('rateLimitExceeded')) {
              userMessage = 'Límite de compartir excedido. Esperá unos minutos e intentá de nuevo.';
            } else {
              userMessage = 'No se pudo hacer el archivo público. Verificá que el archivo te pertenezca.';
            }
            
            throw new Error(userMessage);
          }

          console.log('✅ Permisos públicos configurados');

          // 3b. Obtener metadata actualizada con webContentLink
          const metadataResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${pickedFile.id}?fields=id,name,webViewLink,webContentLink`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (!metadataResponse.ok) {
            throw new Error('No se pudo obtener la información del archivo');
          }

          const metadata = await metadataResponse.json();

          publicFileData = {
            success: true,
            webContentLink: metadata.webContentLink || metadata.webViewLink,
            webViewLink: metadata.webViewLink,
          };

          console.log('✅ Archivo público:', {
            webContentLink: publicFileData.webContentLink,
            webViewLink: publicFileData.webViewLink,
          });
        } catch (err) {
          // Si ya es un Error con mensaje, pasarlo tal cual
          if (err instanceof Error) {
            throw err;
          }
          throw new Error('Error desconocido al configurar permisos del archivo');
        }

        // PASO 4: Extraer extensión del archivo
        const extension = extractExtension(
          pickedFile.name,
          pickedFile.mimeType
        );

        // PASO 5: Convertir tamaño a MB
        const tamanioMb = pickedFile.sizeBytes / (1024 * 1024);

        // PASO 6: Guardar en la tabla 'archivos' de Supabase
        console.log('💾 Guardando en la base de datos...');
        
        const dataToInsert = {
          user_id: user.id,
          materia_id: params.materiaId,
          comision_id: params.comisionId,
          tipo: params.tipo,
          nombre: pickedFile.name,
          drive_file_id: pickedFile.id,
          drive_link: publicFileData.webContentLink,
          tamanio_mb: Number(tamanioMb.toFixed(2)),
          extension: extension,
          descargas: 0,
          reportado: false,
          activo: true,
        };
        
        console.log('📝 Datos a insertar:', dataToInsert);
        
        try {
          const { data: archivoData, error: insertError } = await supabase
            .from('archivos')
            .insert(dataToInsert)
            .select('id')
            .single();

          if (insertError) {
            console.error('Error al insertar archivo:', insertError);
            
            // Mensaje específico para archivos duplicados
            if (insertError.code === '23505' && insertError.message.includes('archivos_drive_file_id_key')) {
              throw new Error(
                'Este archivo ya fue subido anteriormente. Por favor, seleccioná un archivo diferente.'
              );
            }
            
            throw new Error(
              `Error al guardar el archivo en la base de datos: ${insertError.message}`
            );
          }

          if (!archivoData) {
            throw new Error('No se pudo obtener el ID del archivo creado');
          }

          console.log('✅ Archivo guardado con ID:', archivoData.id);

          // PASO 7: Refrescar dbUser para obtener puntos actualizados
          // (El trigger de la BD ya actualizó los puntos automáticamente)
          console.log('🔄 Actualizando puntos del usuario...');
          try {
            const { data: updatedUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            if (updatedUser) {
              console.log('✅ Puntos actualizados:', {
                puntos_archivos: updatedUser.puntos_archivos,
              });
              // Nota: Para actualizar el dbUser en el contexto, necesitarías
              // exponer una función refreshDbUser() en AuthContext
            }
          } catch (refreshError) {
            // No es crítico si falla el refresh de puntos
            console.warn('⚠️ No se pudieron actualizar los puntos:', refreshError);
          }

          // Éxito total
          return {
            archivoId: archivoData.id,
            downloadUrl: publicFileData.webContentLink || publicFileData.webViewLink,
            viewUrl: publicFileData.webViewLink,
          };
        } catch (err) {
          throw new Error(
            `Error al guardar en la base de datos: ${
              err instanceof Error ? err.message : 'Error desconocido'
            }`
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido al subir archivo';
        console.error('❌ Error en useDriveUpload:', errorMessage);
        setError(errorMessage);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, dbUser]
  );

  return {
    openPicker,
    uploading,
    error,
    clearError,
  };
}

/**
 * Extrae la extensión del archivo desde el nombre o MIME type
 */
function extractExtension(fileName: string, mimeType: string): string {
  // Primero intentar desde el nombre del archivo
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex > 0 && dotIndex < fileName.length - 1) {
    return fileName.substring(dotIndex + 1).toLowerCase();
  }

  // Fallback: inferir desde MIME type
  const mimeToExtension: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/msword': 'doc',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };

  return mimeToExtension[mimeType] || 'bin';
}
