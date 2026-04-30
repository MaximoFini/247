import { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FETCH_TIMEOUT_MS = 10000;

interface AvisoAdmin {
  id: number;
  motivo: string;
  mensaje: string;
  fecha: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  motivo: string;
  mensaje: string;
  fecha: string;
  activo: boolean;
}

const emptyForm: FormData = {
  motivo: "",
  mensaje: "",
  fecha: new Date().toISOString().split("T")[0],
  activo: true,
};

const AdminAvisos = () => {
  const { loading: authLoading, user } = useAuth();

  const [avisos, setAvisos] = useState<AvisoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAvisos = async () => {
    if (authLoading) return;
    if (!user?.id) {
      setAvisos([]);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);

      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, FETCH_TIMEOUT_MS);

      const { data, error } = await supabase
        .from("avisos_admin")
        .select("*")
        .order("fecha", { ascending: false })
        .abortSignal(abortControllerRef.current.signal);

      clearTimeout(timeoutId);

      if (error) {
        if (error.message?.includes("abort")) return;
        throw error;
      }

      setAvisos(data || []);
    } catch (err) {
      if (err instanceof Error && err.message?.includes("abort")) return;
      console.error("Error fetching avisos:", err);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchAvisos();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [authLoading, user?.id]);

  const handleCreate = async () => {
    if (!formData.motivo.trim() || !formData.mensaje.trim()) {
      alert("El motivo y el mensaje son obligatorios");
      return;
    }
    try {
      const { error } = await supabase.from("avisos_admin").insert({
        motivo: formData.motivo.trim(),
        mensaje: formData.mensaje.trim(),
        fecha: formData.fecha,
        activo: formData.activo,
      });
      if (error) throw error;
      setFormData(emptyForm);
      setCreating(false);
      fetchAvisos();
    } catch (err) {
      console.error("Error creating aviso:", err);
      alert("Error al crear aviso");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.motivo.trim() || !formData.mensaje.trim()) {
      alert("El motivo y el mensaje son obligatorios");
      return;
    }
    try {
      const { error } = await supabase
        .from("avisos_admin")
        .update({
          motivo: formData.motivo.trim(),
          mensaje: formData.mensaje.trim(),
          fecha: formData.fecha,
          activo: formData.activo,
        })
        .eq("id", id);
      if (error) throw error;
      setEditing(null);
      setFormData(emptyForm);
      fetchAvisos();
    } catch (err) {
      console.error("Error updating aviso:", err);
      alert("Error al actualizar aviso");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm("¿Eliminar este aviso? Esta acción no se puede deshacer.")
    )
      return;
    try {
      const { error } = await supabase
        .from("avisos_admin")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchAvisos();
    } catch (err) {
      console.error("Error deleting aviso:", err);
      alert("Error al eliminar aviso");
    }
  };

  const handleToggleActivo = async (aviso: AvisoAdmin) => {
    try {
      const { error } = await supabase
        .from("avisos_admin")
        .update({ activo: !aviso.activo })
        .eq("id", aviso.id);
      if (error) {
        console.error("Error toggling activo:", error);
        alert(`Error al cambiar estado del aviso:\n${error.message}\n(code: ${error.code})`);
        return;
      }
      fetchAvisos();
    } catch (err) {
      console.error("Error toggling activo:", err);
      alert("Error al cambiar estado del aviso");
    }
  };

  const startEdit = (aviso: AvisoAdmin) => {
    setEditing(aviso.id);
    setFormData({
      motivo: aviso.motivo,
      mensaje: aviso.mensaje,
      fecha: aviso.fecha,
      activo: aviso.activo,
    });
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setFormData(emptyForm);
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
                <Megaphone className="h-12 w-12" />
                AVISOS
              </h1>
              <p className="font-mono text-sm text-muted-foreground mt-2">
                {avisos.length} aviso{avisos.length !== 1 ? "s" : ""} registrado
                {avisos.length !== 1 ? "s" : ""} •{" "}
                {avisos.filter((a) => a.activo).length} activo
                {avisos.filter((a) => a.activo).length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setCreating(true);
                setEditing(null);
                setFormData(emptyForm);
              }}
              className="border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Aviso
            </button>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Formulario crear */}
          {creating && (
            <div className="border-2 border-primary bg-primary/5 p-6 mb-6">
              <h3 className="font-mono text-lg text-primary mb-4">
                CREAR NUEVO AVISO
              </h3>
              <AvisoForm
                formData={formData}
                onChange={setFormData}
                onSave={handleCreate}
                onCancel={cancelEdit}
              />
            </div>
          )}

          {/* Lista de avisos */}
          <div className="space-y-4">
            {avisos.length === 0 && !creating && (
              <p className="font-mono text-muted-foreground text-center py-12">
                No hay avisos registrados.
              </p>
            )}
            {avisos.map((aviso) => (
              <div
                key={aviso.id}
                className={`border-2 ${aviso.activo ? "border-primary" : "border-muted"} bg-card p-6`}
              >
                {editing === aviso.id ? (
                  <>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
                      Editando aviso #{aviso.id}
                    </p>
                    <AvisoForm
                      formData={formData}
                      onChange={setFormData}
                      onSave={() => handleUpdate(aviso.id)}
                      onCancel={cancelEdit}
                    />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span
                          className={`font-mono text-xs uppercase tracking-widest px-2 py-0.5 border ${
                            aviso.activo
                              ? "border-primary text-primary bg-primary/10"
                              : "border-muted text-muted-foreground bg-muted/20"
                          }`}
                        >
                          {aviso.activo ? "Activo" : "Inactivo"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {aviso.fecha}
                        </span>
                      </div>
                      <p className="font-mono text-sm font-bold text-foreground mb-1 uppercase tracking-wide">
                        {aviso.motivo}
                      </p>
                      <p className="font-mono text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {aviso.mensaje}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActivo(aviso)}
                        title={aviso.activo ? "Desactivar" : "Activar"}
                        className="border border-muted bg-transparent px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                      >
                        {aviso.activo ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(aviso)}
                        className="border border-primary bg-transparent px-3 py-2 text-xs text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(aviso.id)}
                        className="border border-destructive bg-transparent px-3 py-2 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

interface AvisoFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AvisoForm = ({
  formData,
  onChange,
  onSave,
  onCancel,
}: AvisoFormProps) => (
  <div className="space-y-4">
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground block mb-1">
          Motivo *
        </label>
        <input
          type="text"
          placeholder="Ej: Mantenimiento, Nueva función..."
          value={formData.motivo}
          onChange={(e) => onChange({ ...formData, motivo: e.target.value })}
          className="w-full border-2 border-primary bg-background px-4 py-2 font-mono text-sm text-primary"
        />
      </div>
      <div>
        <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground block mb-1">
          Fecha *
        </label>
        <input
          type="date"
          value={formData.fecha}
          onChange={(e) => onChange({ ...formData, fecha: e.target.value })}
          className="w-full border-2 border-primary bg-background px-4 py-2 font-mono text-sm text-primary"
        />
      </div>
    </div>
    <div>
      <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground block mb-1">
        Mensaje *
      </label>
      <textarea
        placeholder="Escribí el contenido del aviso..."
        value={formData.mensaje}
        rows={4}
        onChange={(e) => onChange({ ...formData, mensaje: e.target.value })}
        className="w-full border-2 border-primary bg-background px-4 py-2 font-mono text-sm text-primary resize-none"
      />
    </div>
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={formData.activo}
          onChange={(e) => onChange({ ...formData, activo: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        <span className="font-mono text-sm text-foreground">
          Publicar aviso (activo)
        </span>
      </label>
    </div>
    <div className="flex gap-3 pt-2">
      <button
        onClick={onSave}
        className="border-2 border-primary bg-primary px-6 py-2 font-mono text-xs uppercase text-primary-foreground hover:bg-transparent hover:text-primary flex items-center gap-2 transition-all"
      >
        <Save className="h-4 w-4" />
        Guardar
      </button>
      <button
        onClick={onCancel}
        className="border-2 border-muted bg-transparent px-6 py-2 font-mono text-xs uppercase text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-all"
      >
        <X className="h-4 w-4" />
        Cancelar
      </button>
    </div>
  </div>
);

export default AdminAvisos;
