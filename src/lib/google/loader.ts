/**
 * Google APIs Script Loader
 * Carga dinámicamente los scripts de Google API y Google Identity Services
 * Implementa singleton pattern para evitar cargas duplicadas
 */

interface LoaderState {
  gapiLoaded: boolean;
  gisLoaded: boolean;
  gapiLoading: Promise<void> | null;
  gisLoading: Promise<void> | null;
}

const state: LoaderState = {
  gapiLoaded: false,
  gisLoaded: false,
  gapiLoading: null,
  gisLoading: null,
};

/**
 * Carga el script de Google API (gapi)
 * Usado para Google Picker y Drive API
 */
export async function loadGapiScript(): Promise<void> {
  // Si ya está cargado, retornar inmediatamente
  if (state.gapiLoaded) {
    return Promise.resolve();
  }

  // Si ya está cargando, retornar la promesa existente
  if (state.gapiLoading) {
    return state.gapiLoading;
  }

  // Crear nueva promesa de carga
  state.gapiLoading = new Promise<void>((resolve, reject) => {
    // Verificar si el script ya existe en el DOM
    if (
      document.querySelector('script[src="https://apis.google.com/js/api.js"]')
    ) {
      if (window.gapi) {
        state.gapiLoaded = true;
        state.gapiLoading = null;
        resolve();
        return;
      }
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      state.gapiLoaded = true;
      state.gapiLoading = null;
      resolve();
    };

    script.onerror = () => {
      state.gapiLoading = null;
      reject(new Error("Failed to load Google API script"));
    };

    document.body.appendChild(script);
  });

  return state.gapiLoading;
}

/**
 * Carga el script de Google Identity Services (GIS)
 * Reemplaza a gapi.auth2 (deprecated)
 */
export async function loadGisScript(): Promise<void> {
  // Si ya está cargado, retornar inmediatamente
  if (state.gisLoaded) {
    return Promise.resolve();
  }

  // Si ya está cargando, retornar la promesa existente
  if (state.gisLoading) {
    return state.gisLoading;
  }

  // Crear nueva promesa de carga
  state.gisLoading = new Promise<void>((resolve, reject) => {
    // Verificar si el script ya existe en el DOM
    if (
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      )
    ) {
      if (window.google?.accounts?.oauth2) {
        state.gisLoaded = true;
        state.gisLoading = null;
        resolve();
        return;
      }
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      state.gisLoaded = true;
      state.gisLoading = null;
      resolve();
    };

    script.onerror = () => {
      state.gisLoading = null;
      reject(new Error("Failed to load Google Identity Services script"));
    };

    document.body.appendChild(script);
  });

  return state.gisLoading;
}

/**
 * Carga ambos scripts en paralelo
 * Útil cuando necesitas gapi + GIS al mismo tiempo
 */
export async function loadGoogleScripts(): Promise<void> {
  await Promise.all([loadGapiScript(), loadGisScript()]);
}

/**
 * Verifica si los scripts están cargados
 */
export function areScriptsLoaded(): boolean {
  return state.gapiLoaded && state.gisLoaded;
}

/**
 * Resetea el estado (útil para testing o recargas)
 */
export function resetLoaderState(): void {
  state.gapiLoaded = false;
  state.gisLoaded = false;
  state.gapiLoading = null;
  state.gisLoading = null;
}
