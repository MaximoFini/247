/**
 * Centraliza el manejo de localStorage para evitar duplicación
 * y facilitar el mantenimiento
 */

export const STORAGE_KEYS = {
  IS_LOGGED_IN: "isLoggedIn",
  USER_NAME: "userName",
  USER_APODO: "userApodo",
  USER_EMAIL: "userEmail",
  USER_FILE_POINTS: "userFilePoints",
  USER_DONATION_POINTS: "userDonationPoints",
  ALONSO_FOLLOWER: "alonsoFollower",
} as const;

export interface UserData {
  nombre: string;
  apodo: string;
  email: string;
  filePoints: number;
  donationPoints: number;
}

export const storage = {
  // Auth
  isLoggedIn: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === "true";
  },

  setLoggedIn: (value: boolean): void => {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(value));
  },

  // User data
  getUserData: (): UserData => {
    return {
      nombre: localStorage.getItem(STORAGE_KEYS.USER_NAME) || "",
      apodo: localStorage.getItem(STORAGE_KEYS.USER_APODO) || "",
      email: localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || "",
      filePoints: parseInt(
        localStorage.getItem(STORAGE_KEYS.USER_FILE_POINTS) || "0"
      ),
      donationPoints: parseInt(
        localStorage.getItem(STORAGE_KEYS.USER_DONATION_POINTS) || "0"
      ),
    };
  },

  setUserData: (data: {
    nombre: string;
    apodo: string;
    email: string;
    filePoints?: number;
    donationPoints?: number;
  }): void => {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, data.nombre);
    localStorage.setItem(STORAGE_KEYS.USER_APODO, data.apodo);
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.email);
    localStorage.setItem(
      STORAGE_KEYS.USER_FILE_POINTS,
      String(data.filePoints || 0)
    );
    localStorage.setItem(
      STORAGE_KEYS.USER_DONATION_POINTS,
      String(data.donationPoints || 0)
    );
  },

  clearUserData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_APODO);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_FILE_POINTS);
    localStorage.removeItem(STORAGE_KEYS.USER_DONATION_POINTS);
  },

  // Alonso Follower
  getAlonsoFollowerEnabled: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ALONSO_FOLLOWER) === "on";
  },

  setAlonsoFollowerEnabled: (enabled: boolean): void => {
    localStorage.setItem(STORAGE_KEYS.ALONSO_FOLLOWER, enabled ? "on" : "off");
  },
};
