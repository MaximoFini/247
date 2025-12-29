import React, { createContext, useContext, useEffect, useState } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(() => {
    // Intentar recuperar dbUser de sessionStorage para mantener estado entre navegaciones
    const cached = sessionStorage.getItem("dbUser");
    return cached ? JSON.parse(cached) : null;
  });
  const [session, setSession] = useState<Session | null>(null);
  // Si ya tenemos dbUser cacheado, no mostrar loading inicialmente
  const [loading, setLoading] = useState(() => {
    const cached = sessionStorage.getItem("dbUser");
    return !cached; // Solo loading si no hay caché
  });

  // Guardar dbUser en sessionStorage cuando cambie
  useEffect(() => {
    if (dbUser) {
      sessionStorage.setItem("dbUser", JSON.stringify(dbUser));
    } else {
      sessionStorage.removeItem("dbUser");
    }
  }, [dbUser]);

  useEffect(() => {
    console.log("🔍 AuthProvider:  Inicializando.. .");

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "📦 Sesión inicial:",
        session?.user?.email || "No hay sesión"
      );
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchDbUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔄 Auth state cambió:",
        event,
        session?.user?.email || "No user"
      );
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchDbUser(session.user.id);
      } else {
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("🧹 AuthProvider: Cleanup");
      subscription.unsubscribe();
    };
  }, []);

  const fetchDbUser = async (userId: string) => {
    try {
      console.log("🔍 Buscando usuario en BD:", userId);

      // Si ya tenemos dbUser cacheado con el mismo id, no hacer nada (optimización)
      if (dbUser && dbUser.id === userId) {
        console.log("✅ Usando dbUser cacheado:", dbUser.email);
        setLoading(false);
        return;
      }

      // Timeout de 3 segundos para evitar que se cuelgue (reducido de 5s)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout fetching user")), 3000)
      );

      // Solo seleccionar campos necesarios para mejor performance
      const queryPromise = supabase
        .from("users")
        .select(
          "id, email, nombre, puntos_archivos, puntos_donaciones, is_admin"
        )
        .eq("id", userId)
        .single();

      const { data, error } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.warn("⚠️ Error o usuario no existe en BD:", error.message);
        // Si el usuario no existe en la BD pero tenemos caché, mantener el caché
        if (!dbUser) {
          setDbUser(null);
        }
      } else {
        console.log("✅ Usuario encontrado:", data?.email);
        setDbUser(data);
      }
    } catch (error: any) {
      console.warn("⚠️ Error en fetchDbUser:", error?.message || error);
      // Solo limpiar dbUser si no tenemos caché (preservar estado admin)
      if (!dbUser) {
        setDbUser(null);
      }
    } finally {
      console.log("✅ fetchDbUser completado, loading = false");
      setLoading(false);
    }
  };

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
    sessionStorage.removeItem("dbUser");
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
