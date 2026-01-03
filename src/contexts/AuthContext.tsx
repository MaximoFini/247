import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { User as DBUser } from "@/types/database";

interface AuthContextType {
  user: User | null;
  dbUser: DBUser | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clave para sessionStorage
const DBUSER_STORAGE_KEY = "dbUser";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(() => {
    // Intentar recuperar dbUser de sessionStorage para mantener estado entre navegaciones
    try {
      const cached = sessionStorage.getItem(DBUSER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  // Si ya tenemos dbUser cacheado, no mostrar loading inicialmente
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem(DBUSER_STORAGE_KEY);
      return !cached; // Solo loading si no hay caché
    } catch {
      return true;
    }
  });

  // Ref para mantener el dbUser actual y evitar problemas de closure
  const dbUserRef = useRef<DBUser | null>(dbUser);
  // Ref para evitar múltiples llamadas a fetchDbUser simultáneas
  const fetchingRef = useRef<boolean>(false);
  // Ref para rastrear si ya se inicializó
  const initializedRef = useRef<boolean>(false);

  // Sincronizar ref con estado
  useEffect(() => {
    dbUserRef.current = dbUser;
  }, [dbUser]);

  // Guardar dbUser en sessionStorage cuando cambie
  useEffect(() => {
    try {
      if (dbUser) {
        sessionStorage.setItem(DBUSER_STORAGE_KEY, JSON.stringify(dbUser));
      } else {
        sessionStorage.removeItem(DBUSER_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("⚠️ Error guardando en sessionStorage:", error);
    }
  }, [dbUser]);

  // Función estable para buscar usuario en BD
  const fetchDbUser = useCallback(
    async (userId: string, forceRefresh = false) => {
      // Evitar múltiples llamadas simultáneas
      if (fetchingRef.current) {
        console.log("⏳ fetchDbUser ya en progreso, ignorando...");
        return;
      }

      // Si ya tenemos dbUser cacheado con el mismo id y no es force refresh, no hacer nada
      const currentDbUser = dbUserRef.current;
      if (!forceRefresh && currentDbUser && currentDbUser.id === userId) {
        console.log("✅ Usando dbUser cacheado:", currentDbUser.email);
        setLoading(false);
        return;
      }

      fetchingRef.current = true;

      try {
        console.log("🔍 Buscando usuario en BD:", userId);

        // Timeout de 5 segundos para evitar que se cuelgue
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const { data, error } = await supabase
          .from("users")
          .select(
            "id, email, nombre, puntos_archivos, puntos_donaciones, is_admin"
          )
          .eq("id", userId)
          .single()
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.warn("⚠️ Error o usuario no existe en BD:", error.message);
          // IMPORTANTE: Si hay error pero ya tenemos dbUser cacheado, mantenerlo
          if (!currentDbUser) {
            setDbUser(null);
          }
          // Si el dbUser cacheado existe, lo mantenemos (no hacemos nada)
        } else if (data) {
          console.log(
            "✅ Usuario encontrado:",
            data.email,
            "is_admin:",
            data.is_admin
          );
          setDbUser(data);
        }
      } catch (error: any) {
        // Si es un abort (timeout), mantener el dbUser cacheado
        if (error.name === "AbortError") {
          console.warn("⏱️ Timeout en fetchDbUser, manteniendo caché");
        } else {
          console.warn("⚠️ Error en fetchDbUser:", error?.message || error);
        }
        // IMPORTANTE: NUNCA limpiar dbUser en caso de error - mantener el estado actual
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        console.log("✅ fetchDbUser completado");
      }
    },
    [] // Sin dependencias - usa refs para acceder al estado actual
  );

  // Efecto principal para manejar autenticación
  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log("🔍 AuthProvider: Inicializando...");

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log(
        "📦 Sesión inicial:",
        initialSession?.user?.email || "No hay sesión"
      );
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchDbUser(initialSession.user.id);
      } else {
        setDbUser(null);
        setLoading(false);
      }
    });

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(
        "🔄 Auth state cambió:",
        event,
        newSession?.user?.email || "No user"
      );

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Manejar diferentes eventos de manera específica
      switch (event) {
        case "SIGNED_IN":
          // Usuario inició sesión - buscar datos frescos
          if (newSession?.user) {
            await fetchDbUser(newSession.user.id, true);
          }
          break;

        case "SIGNED_OUT":
          // Usuario cerró sesión - limpiar todo
          setDbUser(null);
          setLoading(false);
          try {
            sessionStorage.removeItem(DBUSER_STORAGE_KEY);
          } catch {
            // Ignorar errores de sessionStorage
          }
          break;

        case "TOKEN_REFRESHED":
          // Token refrescado - NO tocar dbUser, mantener estado actual
          // Esto es clave: el token refresh no debe afectar el estado del usuario
          console.log("🔄 Token refrescado - manteniendo estado de dbUser");
          // Solo actualizar si no tenemos dbUser y hay sesión
          if (!dbUserRef.current && newSession?.user) {
            await fetchDbUser(newSession.user.id);
          }
          break;

        case "USER_UPDATED":
          // Usuario actualizado - refrescar datos
          if (newSession?.user) {
            await fetchDbUser(newSession.user.id, true);
          }
          break;

        case "INITIAL_SESSION":
          // Sesión inicial ya manejada arriba, ignorar
          break;

        default:
          // Otros eventos - manejar con precaución
          if (newSession?.user && !dbUserRef.current) {
            await fetchDbUser(newSession.user.id);
          } else if (!newSession) {
            setDbUser(null);
            setLoading(false);
          }
      }
    });

    return () => {
      console.log("🧹 AuthProvider: Cleanup");
      subscription.unsubscribe();
    };
  }, [fetchDbUser]);

  const signInWithGoogle = async () => {
    console.log("🚀 Iniciando login con Google...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("❌ Error en signInWithGoogle:", error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log("👋 Cerrando sesión...");
    // Limpiar caché de sessionStorage
    try {
      sessionStorage.removeItem(DBUSER_STORAGE_KEY);
    } catch {
      // Ignorar errores de sessionStorage
    }
    setDbUser(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Error en signOut:", error);
      throw error;
    }
  };

  // Log del estado actual (útil para debugging)
  useEffect(() => {
    console.log("📊 Estado actual:", {
      loading,
      hasUser: !!user,
      hasDbUser: !!dbUser,
      email: user?.email,
    });
  }, [loading, user, dbUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        session,
        loading,
        signInWithGoogle,
        signOut,
        isAdmin: dbUser?.is_admin ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
