import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { lazy, Suspense, memo } from "react";

// Componente de carga optimizado con memo para evitar re-renders
const PageLoader = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
));
PageLoader.displayName = "PageLoader";

// Skeleton loader para contenido (más rápido que spinner)
const ContentSkeleton = memo(() => (
  <div className="min-h-screen bg-background">
    <div className="h-16 border-b-2 border-primary/20 bg-background/95" />
    <div className="container mx-auto px-4 py-8 space-y-4">
      <div className="h-32 bg-primary/5 animate-pulse rounded" />
      <div className="h-16 bg-primary/5 animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-primary/5 animate-pulse rounded" />
        ))}
      </div>
    </div>
  </div>
));
ContentSkeleton.displayName = "ContentSkeleton";

// ===== LAZY LOADING AGRESIVO =====
// Página principal cargada con prioridad
const Index = lazy(() => import("./pages/Index"));

// Páginas públicas con lazy loading
const Login = lazy(() => import("./pages/Login"));
const Profesores = lazy(() => import("./pages/Profesores"));
const QueCurso = lazy(() => import("./pages/QueCurso"));
const Avisos = lazy(() => import("./pages/Avisos"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));

// Componentes de error
const ErrorBoundary = lazy(() => import("./components/ErrorBoundary"));

// Páginas protegidas (usuarios autenticados) - lazy
const Perfil = lazy(() => import("./pages/Perfil"));
const Subir = lazy(() => import("./pages/Subir"));

// Páginas admin (lazy loading)
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminArchivos = lazy(() => import("@/pages/admin/Archivos"));
const ArchivosReportados = lazy(
  () => import("@/pages/admin/ArchivosReportados"),
);
const AdminProfesores = lazy(() => import("@/pages/admin/Profesores"));
const AdminMaterias = lazy(() => import("@/pages/admin/Materias"));
const AdminComisiones = lazy(() => import("@/pages/admin/Comisiones"));
const AdminAsignaciones = lazy(() => import("@/pages/admin/Asignaciones"));
const AdminAvisos = lazy(() => import("@/pages/admin/Avisos"));
const ForoPage = lazy(() => import("./pages/Foro"));
const HiloPage = lazy(() => import("./pages/Hilo"));
const AdminForo = lazy(() => import("@/pages/admin/Foro"));

// Componente auxiliar con lazy (cargado después del mount inicial)
const AlonsoFollower = lazy(() => import("./components/AlonsoFollower"));

// QueryClient con configuración optimizada para performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutos de datos "frescos" (aumentado)
      gcTime: 1000 * 60 * 60, // 1 hora en caché (aumentado)
      refetchOnWindowFocus: false, // No refetch al volver a la ventana
      refetchOnReconnect: false, // No refetch al reconectar
      retry: 1, // Solo 1 reintento
      retryDelay: 1000, // 1 segundo entre reintentos
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* AlonsoFollower cargado lazy para no bloquear First Paint */}
        <Suspense fallback={null}>
          <AlonsoFollower />
        </Suspense>
        <BrowserRouter>
          <Suspense fallback={<ContentSkeleton />}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profesores" element={<Profesores />} />
              <Route
                path="/quecurso"
                element={
                  <Suspense fallback={<ContentSkeleton />}>
                    <ErrorBoundary>
                      <QueCurso />
                    </ErrorBoundary>
                  </Suspense>
                }
              />
              <Route path="/avisos" element={<Avisos />} />
              <Route path="/foro" element={<ForoPage />} />
              <Route path="/foro/:id" element={<HiloPage />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Rutas protegidas (usuarios autenticados) */}
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subir"
                element={
                  <ProtectedRoute>
                    <Subir />
                  </ProtectedRoute>
                }
              />

              {/* Rutas admin (solo admins) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/archivos"
                element={
                  <AdminRoute>
                    <AdminArchivos />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/archivos-reportados"
                element={
                  <AdminRoute>
                    <ArchivosReportados />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/profesores"
                element={
                  <AdminRoute>
                    <AdminProfesores />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/materias"
                element={
                  <AdminRoute>
                    <AdminMaterias />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/comisiones"
                element={
                  <AdminRoute>
                    <AdminComisiones />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/asignaciones"
                element={
                  <AdminRoute>
                    <AdminAsignaciones />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/avisos"
                element={
                  <AdminRoute>
                    <AdminAvisos />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/foro"
                element={
                  <AdminRoute>
                    <AdminForo />
                  </AdminRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
