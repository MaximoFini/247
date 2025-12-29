import { useState, useEffect } from "react";
import { BookOpen, Plus, Edit, Trash2, Loader2, Save, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase/client";
import type { Materia } from "@/types/database";

const AdminMaterias = () => {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ nombre: "" });

  useEffect(() => {
    fetchMaterias();
  }, []);

  const fetchMaterias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setMaterias(data || []);
    } catch (err) {
      console.error("Error fetching materias:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nombre.trim()) return;

    try {
      const { error } = await supabase
        .from("materias")
        .insert({ nombre: formData.nombre });

      if (error) throw error;

      setFormData({ nombre: "" });
      setCreating(false);
      fetchMaterias();
    } catch (err: any) {
      console.error("Error creating materia:", err);
      alert(err.message || "Error al crear materia");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("materias")
        .update({ nombre: formData.nombre })
        .eq("id", id);

      if (error) throw error;

      setEditing(null);
      setFormData({ nombre: "" });
      fetchMaterias();
    } catch (err: any) {
      console.error("Error updating materia:", err);
      alert(err.message || "Error al actualizar materia");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "¿Eliminar esta materia?  Se eliminarán también archivos y relaciones asociadas."
      )
    )
      return;

    try {
      const { error } = await supabase.from("materias").delete().eq("id", id);

      if (error) throw error;
      fetchMaterias();
    } catch (err: any) {
      console.error("Error deleting materia:", err);
      alert(err.message || "Error al eliminar materia");
    }
  };

  const startEdit = (materia: Materia) => {
    setEditing(materia.id);
    setFormData({ nombre: materia.nombre });
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setFormData({ nombre: "" });
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
                <BookOpen className="h-12 w-12" />
                MATERIAS
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-2">
                {materias.length} materia{materias.length !== 1 ? "s" : ""}{" "}
                registrada{materias.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Materia
            </button>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Formulario crear */}
          {creating && (
            <div className="border-2 border-primary bg-primary/5 p-6 mb-6">
              <h3 className="font-mono text-lg text-primary mb-4">
                CREAR NUEVA MATERIA
              </h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Nombre de la materia"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ nombre: e.target.value })}
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
                  className="border-2 border-muted bg-transparent px-6 py-2 font-mono text-xs uppercase text-muted-foreground hover:bg-muted hover: text-foreground flex items-center gap-2"
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
                    Nombre
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
                {materias.map((materia) => (
                  <tr key={materia.id} className="border-t border-primary/30">
                    {editing === materia.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) =>
                              setFormData({ nombre: e.target.value })
                            }
                            className="border border-primary bg-background px-2 py-1 font-mono text-sm text-primary w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">
                          {new Date(materia.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(materia.id)}
                              className="border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-transparent hover: text-primary"
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
                          {materia.nombre}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">
                          {new Date(materia.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(materia)}
                              className="border border-primary bg-transparent px-3 py-1 text-xs text-primary hover: bg-primary hover:text-primary-foreground"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(materia.id)}
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

export default AdminMaterias;
