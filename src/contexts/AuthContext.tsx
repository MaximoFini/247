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
  loading: boolean; // authReady: true cuando la sesión está determinada
  dbUserLoading: boolean; // true mientras se carga el perfil de DB
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Claves de storage
const DBUSER_STORAGE_KEY = "dbUser";
const AUTH_STORAGE_KEYS = ["dbUser", "sb-nesbqbdqeieyjuvkhwhf-auth-token"];

// ⚡ OPTIMIZACIÓN FASE 2: Timeouts
const AUTH_TIMEOUT_MS = 3000; // 3s para getSession
const DBUSER_FETCH_TIMEOUT_MS = 10000; // 10s para fetch de dbUser con AbortController
const LOADING_SAFETY_TIMEOUT_MS = 5000; // 5s máximo de auth loading

// Helper para limpiar todo el storage relacionado con auth
function clearAllAuthStorage() {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
    // Limpiar cualquier cosa de supabase en localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn("⚠️ Error limpiando storage:", e);
  }
}

// Helper para crear promesa con timeout
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMsg: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms),
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(() => {
    try {
      const cached = sessionStorage.getItem(DBUSER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // authReady: session determinada
  const [dbUserLoading, setDbUserLoading] = useState(false); // perfil de DB cargando

  const dbUserRef = useRef<DBUser | null>(dbUser);
  const fetchingRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⚡ OPTIMIZACIÓN FASE 2: Track si ya se procesó la sesión inicial
  const initialSessionProcessedRef = useRef<boolean>(false);

  // ⚠️ FALLBACK DE SEGURIDAD: Forzar loading=false después de 5s máximo
  useEffect(() => {
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn("⚠️ Loading timeout (5s) - forzando loading=false");
        setLoading(false);
      }, LOADING_SAFETY_TIMEOUT_MS);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading]);

  useEffect(() => {
    dbUserRef.current = dbUser;
  }, [dbUser]);

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

  const fetchDbUser = useCallback(
    async (userId: string, forceRefresh = false) => {
      // Evitar llamadas duplicadas
      if (fetchingRef.current) {
        console.log("⏭️ fetchDbUser ya en progreso, saltando...");
        return;
      }

      const currentDbUser = dbUserRef.current;

      // Si ya tenemos el usuario y no es force refresh, usar caché
      if (!forceRefresh && currentDbUser && currentDbUser.id === userId) {
        console.log("✅ dbUser cacheado:", currentDbUser.email);
        // NO bloquear loading, solo retornar
        return;
      }

      fetchingRef.current = true;
      setDbUserLoading(true);
      console.log("🔍 fetchDbUser -> start:", userId);

      try {
        // Crear promesa con timeout para evitar que la query quede colgada
        const queryPromise = supabase
          .from("users")
          .select(
            "id, email, nombre, puntos_archivos, puntos_donaciones, is_admin",
          )
          .eq("id", userId)
          .single();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("fetchDbUser timeout (10s)")),
            DBUSER_FETCH_TIMEOUT_MS,
          ),
        );

        const { data, error } = await Promise.race([
          queryPromise,
          timeoutPromise,
        ]);

        if (error) {
          console.warn("⚠️ Error fetchDbUser:", error.message);
          // Si hay error pero teníamos caché, mantenerlo
          if (!currentDbUser) {
            setDbUser(null);
          }
        } else if (data) {
          console.log(
            "✅ fetchDbUser -> end:",
            data.email,
            "admin:",
            data.is_admin,
          );
          setDbUser(data as DBUser);
        }
      } catch (error) {
        console.warn(
          "⚠️ Error/timeout en fetchDbUser:",
          error instanceof Error ? error.message : "Unknown error",
        );
        // Mantener caché si existe
      } finally {
        fetchingRef.current = false;
        setDbUserLoading(false);
      }
    },
    [],
  );

  // ⚡ OPTIMIZACIÓN FASE 2: Efecto principal - NO bloquea loading esperando dbUser
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log("🚀 AuthProvider: Inicializando...");

    let mounted = true;

    // ⚡ OPTIMIZACIÓN: Setup del listener PRIMERO para capturar eventos inmediatamente
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log(
        "🔄 Auth event:",
        event,
        newSession?.user?.email || "No user",
      );

      setSession(newSession);
      setUser(newSession?.user ?? null);

      switch (event) {
        case "INITIAL_SESSION":
          // ⚡ CRÍTICO: Este evento se dispara al cargar con sesión activa
          initialSessionProcessedRef.current = true;

          if (newSession?.user) {
            console.log("✅ INITIAL_SESSION con user:", newSession.user.email);
            // ⚡ CAMBIO CLAVE: setLoading(false) INMEDIATAMENTE, fetchDbUser en background
            setLoading(false);

            // Si ya tenemos dbUser cacheado, no hacer nada más
            if (
              dbUserRef.current &&
              dbUserRef.current.id === newSession.user.id
            ) {
              console.log("⚡ Usando dbUser cacheado - carga instantánea");
            } else {
              // Fetch dbUser en BACKGROUND (no bloqueante)
              fetchDbUser(newSession.user.id);
            }
          } else {
            console.log("⚠️ INITIAL_SESSION sin user");
            setDbUser(null);
            setLoading(false);
          }
          break;

        case "SIGNED_IN":
          // En SIGNED_IN (login), sí esperamos dbUser antes de desbloquear
          setLoading(false);
          fetchDbUser(newSession!.user.id, true);
          break;

        case "SIGNED_OUT":
          setDbUser(null);
          setLoading(false);
          clearAllAuthStorage();
          break;

        case "TOKEN_REFRESHED":
          console.log("🔄 Token refrescado");
          setLoading(false);
          // Refresh dbUser en background si es necesario
          if (!dbUserRef.current && newSession?.user) {
            fetchDbUser(newSession.user.id);
          }
          break;

        case "USER_UPDATED":
          setLoading(false);
          if (newSession?.user) {
            fetchDbUser(newSession.user.id, true);
          }
          break;

        default:
          console.log("🔄 Otro evento:", event);
          setLoading(false);
          if (newSession?.user && !dbUserRef.current) {
            fetchDbUser(newSession.user.id);
          } else if (!newSession) {
            setDbUser(null);
          }
      }
    });

    // ⚡ OPTIMIZACIÓN: getSession solo como fallback si el listener no dispara INITIAL_SESSION
    const initSession = async () => {
      try {
        // Esperar un tick para dar chance al listener
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Si el listener ya procesó la sesión inicial, no hacer nada
        if (initialSessionProcessedRef.current) {
          console.log(
            "✅ Sesión ya procesada por listener, saltando getSession",
          );
          return;
        }

        console.log("⏳ Listener no disparó - fallback a getSession()");

        const {
          data: { session: initialSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS,
          "Timeout getSession",
        );

        if (!mounted) return;

        console.log(
          "📦 getSession:",
          initialSession?.user?.email || "No session",
        );

        // Si hay sesión pero no hay dbUser, buscar
        if (initialSession?.user && !dbUserRef.current) {
          await fetchDbUser(initialSession.user.id);
        } else if (!initialSession) {
          // No hay sesión, limpiar
          setDbUser(null);
          setLoading(false);
        } else {
          // Ya tenemos todo
          setLoading(false);
        }
      } catch (error) {
        console.warn("⚠️ Error en getSession:", error);
        // Solo limpiar si NO tenemos nada cacheado
        if (!dbUserRef.current) {
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
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

    // 1. Limpiar estado local PRIMERO
    setDbUser(null);
    setUser(null);
    setSession(null);

    // 2. Limpiar TODO el storage
    clearAllAuthStorage();

    // 3. Resetear flags
    initializedRef.current = false;
    fetchingRef.current = false;
    initialSessionProcessedRef.current = false;

    // 4. Cerrar sesión en Supabase
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        console.error("❌ Error en signOut:", error);
      }
    } catch (e) {
      console.error("❌ Error en signOut:", e);
    }

    // 5. Forzar recarga limpia
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        session,
        loading,
        dbUserLoading,
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
