import { useState } from "react";
import { Link2, Plus, Trash2, Loader2, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useMateriaComisionProfesor } from "@/hooks/use-materia-comision-profesor";
import { toast } from "sonner";

const AdminAsignaciones = () => {
  const {
    relaciones,
    materias,
    comisiones,
    profesores,
    loading,
    createRelacion,
    deleteRelacion,
  } = useMateriaComisionProfesor();

  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    materia_id: "",
    comision_id: "",
    profesor_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtros
  const [filterMateria, setFilterMateria] = useState("");
  const [filterComision, setFilterComision] = useState("");
  const [filterProfesor, setFilterProfesor] = useState("");

  const handleCreate = async () => {
    if (
      !formData.materia_id ||
      !formData.comision_id ||
      !formData.profesor_id
    ) {
      toast.error("Debes seleccionar materia, comisión y profesor");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRelacion(
        formData.materia_id,
        formData.comision_id,
        formData.profesor_id
      );
      toast.success("Asignación creada correctamente");
      setFormData({ materia_id: "", comision_id: "", profesor_id: "" });
      setCreating(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Error al crear asignación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta asignación?")) return;

    setDeletingId(id);
    try {
      await deleteRelacion(id);
      toast.success("Asignación eliminada");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar asignación");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrar relaciones
  const filteredRelaciones = relaciones.filter((r) => {
    const matchMateria = filterMateria === "" || r.materia_id === filterMateria;
    const matchComision =
      filterComision === "" || r.comision_id === filterComision;
    const matchProfesor =
      filterProfesor === "" || r.profesor_id === filterProfesor;
    return matchMateria && matchComision && matchProfesor;
  });

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
                <Link2 className="h-12 w-12" />
                ASIGNACIONES
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-2">
                {relaciones.length} asignacion
                {relaciones.length !== 1 ? "es" : ""} de
                materia-comisión-profesor
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Asignación
            </button>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Formulario crear */}
          {creating && (
            <div className="border-2 border-primary bg-primary/5 p-6 mb-6">
              <h3 className="font-mono text-lg text-primary mb-4">
                CREAR NUEVA ASIGNACIÓN
              </h3>
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div>
                  <label className="font-mono text-xs uppercase text-muted-foreground block mb-2">
                    Materia
                  </label>
                  <select
                    value={formData.materia_id}
                    onChange={(e) =>
                      setFormData({ ...formData, materia_id: e.target.value })
                    }
                    className="w-full bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
                  >
                    <option value="">Seleccionar materia...</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-muted-foreground block mb-2">
                    Comisión
                  </label>
                  <select
                    value={formData.comision_id}
                    onChange={(e) =>
                      setFormData({ ...formData, comision_id: e.target.value })
                    }
                    className="w-full bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
                  >
                    <option value="">Seleccionar comisión...</option>
                    {comisiones.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-muted-foreground block mb-2">
                    Profesor
                  </label>
                  <select
                    value={formData.profesor_id}
                    onChange={(e) =>
                      setFormData({ ...formData, profesor_id: e.target.value })
                    }
                    className="w-full bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
                  >
                    <option value="">Seleccionar profesor...</option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCreating(false);
                    setFormData({
                      materia_id: "",
                      comision_id: "",
                      profesor_id: "",
                    });
                  }}
                  className="border-2 border-muted-foreground bg-transparent px-4 py-2 font-mono text-sm uppercase text-muted-foreground hover:bg-muted-foreground hover:text-background"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="border-2 border-primary bg-primary px-4 py-2 font-mono text-sm uppercase text-primary-foreground hover:bg-transparent hover:text-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Crear
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="border-2 border-primary bg-card p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm text-primary uppercase">
                Filtrar
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={filterMateria}
                onChange={(e) => setFilterMateria(e.target.value)}
                className="bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
              >
                <option value="">Todas las materias</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <select
                value={filterComision}
                onChange={(e) => setFilterComision(e.target.value)}
                className="bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
              >
                <option value="">Todas las comisiones</option>
                {comisiones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo}
                  </option>
                ))}
              </select>
              <select
                value={filterProfesor}
                onChange={(e) => setFilterProfesor(e.target.value)}
                className="bg-background border-2 border-primary font-mono text-sm px-3 py-2 focus:outline-none"
              >
                <option value="">Todos los profesores</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de asignaciones */}
          {filteredRelaciones.length === 0 ? (
            <div className="border-2 border-primary bg-primary/5 p-12 text-center">
              <Link2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="font-mono text-lg text-primary">
                No hay asignaciones{" "}
                {filterMateria || filterComision || filterProfesor
                  ? "con los filtros seleccionados"
                  : "registradas"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary bg-primary/10">
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Materia
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Comisión
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Profesor
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Fecha
                    </th>
                    <th className="text-left p-3 font-mono text-xs uppercase text-primary">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRelaciones.map((rel) => (
                    <tr
                      key={rel.id}
                      className="border-b border-primary/20 hover:bg-primary/5 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-mono text-sm text-foreground">
                          {rel.materia_nombre}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm uppercase text-primary bg-primary/10 px-2 py-1">
                          {rel.comision_codigo}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm text-foreground">
                          {rel.profesor_nombre}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(rel.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(rel.id)}
                          disabled={deletingId === rel.id}
                          className="p-2 border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === rel.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Estadísticas rápidas */}
          <div className="grid gap-4 md:grid-cols-3 mt-8">
            <div className="border-2 border-primary p-4">
              <p className="font-mono text-xs uppercase text-muted-foreground">
                Materias con asignaciones
              </p>
              <p className="font-mono text-2xl text-primary">
                {new Set(relaciones.map((r) => r.materia_id)).size}
              </p>
            </div>
            <div className="border-2 border-primary p-4">
              <p className="font-mono text-xs uppercase text-muted-foreground">
                Comisiones con asignaciones
              </p>
              <p className="font-mono text-2xl text-primary">
                {new Set(relaciones.map((r) => r.comision_id)).size}
              </p>
            </div>
            <div className="border-2 border-primary p-4">
              <p className="font-mono text-xs uppercase text-muted-foreground">
                Profesores asignados
              </p>
              <p className="font-mono text-2xl text-primary">
                {new Set(relaciones.map((r) => r.profesor_id)).size}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAsignaciones;
