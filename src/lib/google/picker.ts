import { loadGoogleScripts } from './loader';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// Scope completo de Drive para acceder, modificar y compartir archivos del usuario
const SCOPES = 'https://www.googleapis.com/auth/drive';

export interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export const showGooglePicker = async (
  accessToken: string
): Promise<PickedFile | null> => {
  try {
    await loadGoogleScripts();
    
    // Cargar la biblioteca picker de gapi
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout loading picker')), 10000);
      gapi.load('picker', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    return new Promise((resolve, reject) => {
      try {
        const picker = new google.picker.PickerBuilder()
          .setOAuthToken(accessToken)
          .setDeveloperKey(API_KEY)
          .setCallback((data: google.picker.ResponseObject) => {
            if (data.action === google.picker.Action.PICKED) {
              const doc = data.docs[0];
              resolve({
                id: doc.id,
                name: doc.name,
                mimeType: doc.mimeType,
                sizeBytes: doc.sizeBytes || 0,
              });
            } else if (data.action === google.picker.Action.CANCEL) {
              resolve(null);
            }
          })
          .addView(
            new google.picker.DocsView(google.picker.ViewId.DOCS)
              .setIncludeFolders(false)
              .setMimeTypes('application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation')
          )
          .build();

        picker.setVisible(true);
      } catch (err) {
        console.error('Error al construir picker:', err);
        reject(err);
      }
    });
  } catch (err) {
    console.error('Error al cargar scripts de Google:', err);
    throw err;
  }
};

export const requestDriveAccess = async (): Promise<string> => {
  await loadGoogleScripts();

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: google.accounts.oauth2.TokenResponse) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error('No access token received'));
        }
      },
    });

    client.requestAccessToken();
  });
};