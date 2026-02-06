import { useState, useEffect, useRef } from "react";
import { Users, Plus, Edit, Trash2, Loader2, Save, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Comision } from "@/types/database";

const FETCH_TIMEOUT_MS = 10000; // 10s timeout

const AdminComisiones = () => {
  const { loading: authLoading, user } = useAuth();

  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ codigo: "" });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchComisiones = async () => {
    // ⚡ PATRÓN OBLIGATORIO: Verificar auth antes de cargar
    if (authLoading) {
      console.log("⏳ Comisiones: esperando auth...");
      return;
    }

    if (!user?.id) {
      console.log("⚠️ Comisiones: sin usuario, limpiando data");
      setComisiones([]);
      setLoading(false);
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      console.log("🔍 Comisiones: cargando...");

      // Timeout para la request
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.warn("⚠️ Comisiones timeout (10s) - abortando");
        }
      }, FETCH_TIMEOUT_MS);

      const { data, error } = await supabase
        .from("comisiones")
        .select("*")
        .order("codigo")
        .abortSignal(abortControllerRef.current.signal);

      clearTimeout(timeoutId);

      if (error) {
        // Ignorar errores de abort
        if (error.message?.includes("abort")) {
          console.log("⏹️ Comisiones: request abortada");
          return;
        }
        throw error;
      }

      setComisiones(data || []);
      console.log("✅ Comisiones: cargadas", data?.length || 0);
    } catch (err) {
      // Ignorar errores de abort
      if (err instanceof Error && err.message?.includes("abort")) {
        return;
      }
      console.error("Error fetching comisiones:", err);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    // ⚡ PATRÓN OBLIGATORIO: esperar que auth esté listo
    if (authLoading) return;
    fetchComisiones();

    // Cleanup: abortar requests pendientes al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, user?.id]);

  const handleCreate = async () => {
    if (!formData.codigo.trim()) return;

    try {
      const { error } = await supabase
        .from("comisiones")
        .insert({ codigo: formData.codigo });

      if (error) throw error;

      setFormData({ codigo: "" });
      setCreating(false);
      fetchComisiones();
    } catch (err: any) {
      console.error("Error creating comision:", err);
      alert(err.message || "Error al crear comisión");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("comisiones")
        .update({ codigo: formData.codigo })
        .eq("id", id);

      if (error) throw error;

      setEditing(null);
      setFormData({ codigo: "" });
      fetchComisiones();
    } catch (err: any) {
      console.error("Error updating comision:", err);
      alert(err.message || "Error al actualizar comisión");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "¿Eliminar esta comisión? Se eliminarán también archivos y relaciones asociadas.",
      )
    )
      return;

    try {
      const { error } = await supabase.from("comisiones").delete().eq("id", id);

      if (error) throw error;
      fetchComisiones();
    } catch (err: any) {
      console.error("Error deleting comision:", err);
      alert(err.message || "Error al eliminar comisión");
    }
  };

  const startEdit = (comision: Comision) => {
    setEditing(comision.id);
    setFormData({ codigo: comision.codigo });
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setFormData({ codigo: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-12 border-b-2 border-primary">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="font-brutal text-5xl text-primary flex items-center gap-4">
                <Users className="h-12 w-12" />
                COMISIONES
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-2">
                {comisiones.length} comision
                {comisiones.length !== 1 ? "es" : ""} registrada
                {comisiones.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Comisión
            </button>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Formulario crear */}
          {creating && (
            <div className="border-2 border-primary bg-primary/5 p-6 mb-6">
              <h3 className="font-mono text-lg text-primary mb-4">
                CREAR NUEVA COMISIÓN
              </h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Código de comisión (ej: 1K01)"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ codigo: e.target.value })}
                  className="border-2 border-primary bg-background px-4 py-2 font-mono text-primary w-full"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  className="border-2 border-primary bg-primary px-6 py-2 font-mono text-xs uppercase text-primary-foreground hover:bg-transparent hover:text-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </button>
                <button
                  onClick={cancelEdit}
                  className="border-2 border-muted bg-transparent px-6 py-2 font-mono text-xs uppercase text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="border-2 border-primary bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-primary">
                <tr>
                  <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Código
                  </th>
                  <th className="px-6 py-3 text-center font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {comisiones.map((comision) => (
                  <tr key={comision.id} className="border-t border-primary/30">
                    {editing === comision.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) =>
                              setFormData({ codigo: e.target.value })
                            }
                            className="border border-primary bg-background px-2 py-1 font-mono text-sm text-primary w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">
                          {new Date(comision.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(comision.id)}
                              className="border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-transparent hover:text-primary"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="border border-muted bg-transparent px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-mono text-sm text-foreground">
                          {comision.codigo}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">
                          {new Date(comision.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(comision)}
                              className="border border-primary bg-transparent px-3 py-1 text-xs text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(comision.id)}
                              className="border border-destructive bg-transparent px-3 py-1 text-xs text-destructive hover:bg-destructive hover:text-primary-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminComisiones;
