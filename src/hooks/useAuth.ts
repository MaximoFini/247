import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { storage, UserData } from "@/lib/storage";

/**
 * Hook personalizado para manejar autenticación
 * Centraliza la lógica de login/logout y estado del usuario
 */
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    nombre: "",
    apodo: "",
    email: "",
    filePoints: 0,
    donationPoints: 0,
  });
  const location = useLocation();

  useEffect(() => {
    const loggedIn = storage.isLoggedIn();
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      setUserData(storage.getUserData());
    }
  }, [location]);

  const login = (data: {
    nombre: string;
    apodo: string;
    email: string;
  }): void => {
    storage.setLoggedIn(true);
    storage.setUserData({
      ...data,
      filePoints: 0,
      donationPoints: 0,
    });
    setIsLoggedIn(true);
    setUserData({
      ...data,
      filePoints: 0,
      donationPoints: 0,
    });
  };

  const logout = (): void => {
    storage.clearUserData();
    setIsLoggedIn(false);
    setUserData({
      nombre: "",
      apodo: "",
      email: "",
      filePoints: 0,
      donationPoints: 0,
    });
  };

  return {
    isLoggedIn,
    userData,
    login,
    logout,
  };
};

/**
 * Hook para proteger rutas que requieren autenticación
 */
export const useRequireAuth = () => {
  const navigate = useNavigate();
  const isLoggedIn = storage.isLoggedIn();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  return isLoggedIn;
};
