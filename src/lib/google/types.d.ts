/**
 * TypeScript type definitions for Google APIs
 * Extiende los tipos globales de window
 */

interface Window {
  gapi: typeof gapi;
  google: typeof google;
}

// Declaraciones para gapi (Google API)
declare namespace gapi {
  function load(apiName: string, callback: () => void): void;

  namespace client {
    function init(config: {
      apiKey: string;
      discoveryDocs: string[];
    }): Promise<void>;

    function load(api: string, version: string): Promise<void>;

    function setToken(token: { access_token: string }): void;

    namespace drive {
      namespace files {
        function get(params: {
          fileId: string;
          fields?: string;
        }): Promise<{ result: any }>;
      }

      namespace permissions {
        function create(params: {
          fileId: string;
          resource: {
            role: string;
            type: string;
          };
        }): Promise<{ result: { id: string } }>;

        function delete(params: {
          fileId: string;
          permissionId: string;
        }): Promise<void>;
      }
    }
  }
}

// Declaraciones para Google Identity Services y Picker
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken(options?: { prompt?: string }): void;
      }

      interface TokenResponse {
        access_token: string;
        error?: string;
        expires_in: number;
        scope: string;
        token_type: string;
      }

      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: string | ((response: TokenResponse) => void);
      }): TokenClient;

      function revoke(token: string, callback: () => void): void;
    }
  }

  namespace picker {
    enum Action {
      PICKED = 'picked',
      CANCEL = 'cancel',
    }

    enum ViewId {
      DOCS = 'docs',
      RECENTLY_PICKED = 'recently-picked',
    }

    enum DocsViewMode {
      LIST = 'list',
      GRID = 'grid',
    }

    interface Document {
      id: string;
      name: string;
      mimeType: string;
      sizeBytes: number;
      url?: string;
    }

    interface ResponseObject {
      action: Action;
      docs: Document[];
    }

    class PickerBuilder {
      addView(view: DocsView): PickerBuilder;
      setOAuthToken(token: string): PickerBuilder;
      setDeveloperKey(key: string): PickerBuilder;
      setCallback(callback: (data: ResponseObject) => void): PickerBuilder;
      setTitle(title: string): PickerBuilder;
      setLocale(locale: string): PickerBuilder;
      build(): Picker;
    }

    class DocsView {
      constructor(viewId: ViewId);
      setIncludeFolders(include: boolean): DocsView;
      setMimeTypes(mimeTypes: string): DocsView;
      setMode(mode: DocsViewMode): DocsView;
      setSelectFolderEnabled(enabled: boolean): DocsView;
    }

    interface Picker {
      setVisible(visible: boolean): void;
    }
  }
}
