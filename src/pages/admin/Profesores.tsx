import { useState, useEffect } from "react";
import { Users, Plus, Edit, Trash2, Loader2, Save, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase/client";
import type { Profesor } from "@/types/admin";

const AdminProfesores = () => {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", apellido: "" });

  useEffect(() => {
    fetchProfesores();
  }, []);

  const fetchProfesores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profesores")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setProfesores(data || []);
    } catch (err) {
      console.error("Error fetching profesores:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nombre.trim()) return;

    try {
      const { error } = await supabase
        .from("profesores")
        .insert({
          nombre: formData.nombre,
          apellido: formData.apellido || null,
        });

      if (error) throw error;

      setFormData({ nombre: "", apellido: "" });
      setCreating(false);
      fetchProfesores();
    } catch (err) {
      console.error("Error creating profesor:", err);
      alert("Error al crear profesor");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("profesores")
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido || null,
        })
        .eq("id", id);

      if (error) throw error;

      setEditing(null);
      setFormData({ nombre: "", apellido: "" });
      fetchProfesores();
    } catch (err) {
      console.error("Error updating profesor:", err);
      alert("Error al actualizar profesor");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "¿Eliminar este profesor? Se eliminarán también sus ratings."
      )
    )
      return;

    try {
      const { error } = await supabase.from("profesores").delete().eq("id", id);

      if (error) throw error;
      fetchProfesores();
    } catch (err) {
      console.error("Error deleting profesor:", err);
      alert("Error al eliminar profesor");
    }
  };

  const startEdit = (profesor: Profesor) => {
    setEditing(profesor.id);
    setFormData({ nombre: profesor.nombre, apellido: profesor.apellido || "" });
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setFormData({ nombre: "", apellido: "" });
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
                PROFESORES
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-2">
                {profesores.length} profesor
                {profesores.length !== 1 ? "es" : ""} registrado
                {profesores.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Profesor
            </button>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Formulario crear */}
          {creating && (
            <div className="border-2 border-primary bg-primary/5 p-6 mb-6">
              <h3 className="font-mono text-lg text-primary mb-4">
                CREAR NUEVO PROFESOR
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="border-2 border-primary bg-background px-4 py-2 font-mono text-primary"
                />
                <input
                  type="text"
                  placeholder="Apellido (opcional)"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                  className="border-2 border-primary bg-background px-4 py-2 font-mono text-primary"
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
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Apellido
                  </th>
                  <th className="px-6 py-3 text-center font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Ratings
                  </th>
                  <th className="px-6 py-3 text-center font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Promedio
                  </th>
                  <th className="px-6 py-3 text-right font-mono text-xs uppercase tracking-widest text-primary-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {profesores.map((profesor) => (
                  <tr key={profesor.id} className="border-t border-primary/30">
                    {editing === profesor.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nombre: e.target.value,
                              })
                            }
                            className="border border-primary bg-background px-2 py-1 font-mono text-sm text-primary w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={formData.apellido}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                apellido: e.target.value,
                              })
                            }
                            className="border border-primary bg-background px-2 py-1 font-mono text-sm text-primary w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">
                          {profesor.rating_count || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">
                          {(
                            ((profesor.avg_claridad || 0) +
                              (profesor.avg_dificultad || 0) +
                              (profesor.avg_puntualidad || 0) +
                              (profesor.avg_disponibilidad || 0) +
                              (profesor.avg_material || 0)) /
                            5
                          ).toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(profesor.id)}
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
                          {profesor.nombre}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-foreground">
                          {profesor.apellido || "-"}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">
                          {profesor.rating_count || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-primary">
                          {profesor.rating_count && profesor.rating_count > 0
                            ? (
                                ((profesor.avg_claridad || 0) +
                                  (profesor.avg_dificultad || 0) +
                                  (profesor.avg_puntualidad || 0) +
                                  (profesor.avg_disponibilidad || 0) +
                                  (profesor.avg_material || 0)) /
                                5
                              ).toFixed(1)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(profesor)}
                              className="border border-primary bg-transparent px-3 py-1 text-xs text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(profesor.id)}
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

export default AdminProfesores;
