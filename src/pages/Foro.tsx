import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useForo } from "@/hooks/use-foro";
import { useCrearHilo } from "@/hooks/use-crear-hilo";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const ForoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { hilos, loading, loadingMore, hasMore, search, setSearch, loadMore } =
    useForo();
  const { creating, error: createError, crearHilo } = useCrearHilo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [esIncognito, setEsIncognito] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenDialog = () => {
    if (!user) {
      toast({
        title: "Sesión requerida",
        description: "Tenés que iniciar sesión para crear un hilo.",
      });
      return;
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTitulo("");
    setContenido("");
    setEsIncognito(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (titulo.trim().length < 5) {
      setFormError("El título debe tener al menos 5 caracteres.");
      return;
    }
    if (contenido.trim().length < 10) {
      setFormError("El contenido debe tener al menos 10 caracteres.");
      return;
    }

    const id = await crearHilo({
      titulo,
      contenido,
      es_incognito: esIncognito,
    });

    if (id) {
      handleCloseDialog();
      navigate(`/foro/${id}`);
    } else {
      setFormError(createError);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>
          <div className="container relative mx-auto px-4 text-center">
            <h1 className="mb-4 font-brutal text-6xl text-primary md:text-7xl">
              FORO
            </h1>
            <p className="font-mono text-lg text-muted-foreground md:text-xl">
              Comunidad · debates · consultas
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-20">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Banner moderación */}
            <div className="border-2 border-primary/40 bg-primary/5 px-5 py-3">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Todo el contenido está moderado por los moderadores de la
                plataforma
              </p>
            </div>

            {/* Barra de acción: buscar + nuevo hilo */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar en el foro..."
                  className="w-full border-2 border-primary/40 bg-background py-2 pl-10 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={handleOpenDialog}
                className="flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                NUEVO HILO
              </button>
            </div>

            {/* Lista de hilos */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hilos.length === 0 ? (
              <div className="border-2 border-primary/20 py-16 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary/30" />
                <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                  {search.length >= 2
                    ? "Sin resultados para esa búsqueda"
                    : "Todavía no hay hilos. ¡Sé el primero!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {hilos.map((hilo) => (
                  <button
                    key={hilo.id}
                    onClick={() => navigate(`/foro/${hilo.id}`)}
                    className="w-full border-2 border-primary/30 bg-background p-5 text-left transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <h2 className="font-mono text-base font-bold uppercase tracking-wide text-foreground line-clamp-2">
                        {hilo.titulo}
                      </h2>
                      <span className="shrink-0 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {hilo.respuestas_count}
                      </span>
                    </div>
                    <p className="mb-3 font-mono text-sm text-muted-foreground line-clamp-2">
                      {hilo.contenido.slice(0, 150)}
                      {hilo.contenido.length > 150 ? "…" : ""}
                    </p>
                    <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground/70 uppercase tracking-widest">
                      <span>
                        {hilo.es_incognito || !hilo.autor
                          ? "Anónimo"
                          : hilo.autor.nombre}
                      </span>
                      <span>·</span>
                      <span>
                        {format(new Date(hilo.updated_at), "d MMM yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Cargar más */}
            {hasMore && !loading && hilos.length > 0 && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 border-2 border-primary/40 px-6 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialog crear hilo */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border-2 border-primary bg-background p-6">
            <h2 className="mb-6 font-brutal text-2xl text-primary">
              NUEVO HILO
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Título
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={200}
                  placeholder="Título del hilo (5–200 caracteres)"
                  className="w-full border-2 border-primary/40 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <p className="mt-1 font-mono text-xs text-muted-foreground/60 text-right">
                  {titulo.length}/200
                </p>
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Contenido
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  maxLength={5000}
                  rows={6}
                  placeholder="Escribí tu hilo... (10–5000 caracteres)"
                  className="w-full border-2 border-primary/40 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
                <p className="mt-1 font-mono text-xs text-muted-foreground/60 text-right">
                  {contenido.length}/5000
                </p>
              </div>
              {/* Toggle anónimo */}
              <div className="flex items-center justify-between border-2 border-primary/20 px-4 py-3">
                <div>
                  <p className="font-mono text-sm text-foreground">
                    {esIncognito
                      ? "Publicar como Anónimo"
                      : "Publicar con mi nombre"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Tu identidad siempre queda guardada para moderación
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEsIncognito((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${
                    esIncognito
                      ? "border-primary bg-primary"
                      : "border-primary/40 bg-transparent"
                  }`}
                  aria-pressed={esIncognito}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
                      esIncognito
                        ? "translate-x-5 bg-primary-foreground"
                        : "translate-x-0.5 bg-primary/60"
                    }`}
                  />
                </button>
              </div>

              {formError && (
                <p className="font-mono text-xs text-destructive">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="flex-1 border-2 border-primary/40 px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:border-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {creating ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForoPage;
