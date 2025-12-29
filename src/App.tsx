import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Componente de carga
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

// Páginas públicas
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profesores from "./pages/Profesores";
import NotFound from "./pages/NotFound";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";

// Páginas protegidas (usuarios autenticados)
import Perfil from "./pages/Perfil";
import Subir from "./pages/Subir";

// Páginas admin (lazy loading para mejor performance)
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminArchivos = lazy(() => import("@/pages/admin/Archivos"));
const ArchivosReportados = lazy(
  () => import("@/pages/admin/ArchivosReportados")
);
const AdminProfesores = lazy(() => import("@/pages/admin/Profesores"));
const AdminMaterias = lazy(() => import("@/pages/admin/Materias"));
const AdminComisiones = lazy(() => import("@/pages/admin/Comisiones"));
const AdminAsignaciones = lazy(() => import("@/pages/admin/Asignaciones"));

import UTNFollower from "./components/AlonsoFollower";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de datos "frescos"
      gcTime: 1000 * 60 * 30, // 30 minutos en caché
      refetchOnWindowFocus: false, // No refetch al volver a la ventana
      retry: 1, // Solo 1 reintento
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UTNFollower />
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profesores" element={<Profesores />} />
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

            {/* Rutas admin (solo admins) - con Suspense para lazy loading */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/archivos"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminArchivos />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/archivos-reportados"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ArchivosReportados />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/profesores"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminProfesores />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/materias"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminMaterias />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/comisiones"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminComisiones />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/asignaciones"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminAsignaciones />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
