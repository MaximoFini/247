import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Loader2, MessageSquare } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useHilo } from "@/hooks/use-hilo";
import { useCrearRespuesta } from "@/hooks/use-crear-respuesta";
import { useAuth } from "@/contexts/AuthContext";
import { linkifyText } from "@/lib/linkify";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const HiloPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { hilo, respuestas, loading, loadingRespuestas, error } = useHilo(id);
  const { creating, error: respError, crearRespuesta } = useCrearRespuesta();

  const [contenido, setContenido] = useState("");
  const [esIncognito, setEsIncognito] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (contenido.trim().length === 0) {
      setFormError("La respuesta no puede estar vacía.");
      return;
    }

    const ok = await crearRespuesta({
      hilo_id: id,
      contenido,
      es_incognito: esIncognito,
    });

    if (ok) {
      setContenido("");
      setEsIncognito(false);
    } else {
      setFormError(respError);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !hilo) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-32 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-destructive">
            {error ?? "Hilo no encontrado"}
          </p>
          <Link
            to="/foro"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-primary underline"
          >
            ← Volver al foro
          </Link>
        </div>
      </div>
    );
  }

  const autorNombre =
    hilo.es_incognito || !hilo.autor ? "Anónimo" : hilo.autor.nombre;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Link to="/foro" className="hover:text-primary transition-colors">
                FORO
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground line-clamp-1">
                {hilo.titulo}
              </span>
            </nav>

            {/* Hilo original */}
            <div className="border-2 border-primary p-6">
              <h1 className="mb-4 font-brutal text-3xl text-primary md:text-4xl uppercase">
                {hilo.titulo}
              </h1>
              <div className="mb-4 flex items-center gap-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">
                <span>{autorNombre}</span>
                <span>·</span>
                <span>
                  {format(new Date(hilo.created_at), "d MMM yyyy HH:mm", {
                    locale: es,
                  })}
                </span>
              </div>
              <div className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                {linkifyText(hilo.contenido)}
              </div>
            </div>

            {/* Respuestas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="font-mono text-sm uppercase tracking-widest text-primary">
                  {hilo.respuestas_count}{" "}
                  {hilo.respuestas_count === 1 ? "Respuesta" : "Respuestas"}
                </h2>
              </div>

              {loadingRespuestas ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : respuestas.length === 0 ? (
                <div className="border-2 border-primary/20 py-10 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Sin respuestas todavía. ¡Sé el primero en responder!
                  </p>
                </div>
              ) : (
                respuestas.map((resp, idx) => {
                  const respAutor =
                    resp.es_incognito || !resp.autor
                      ? "Anónimo"
                      : resp.autor.nombre;
                  return (
                    <div
                      key={resp.id}
                      className="border-2 border-primary/30 p-5"
                    >
                      <div className="mb-3 flex items-center gap-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">
                        <span className="text-primary/70 font-bold">
                          #{idx + 1}
                        </span>
                        <span>{respAutor}</span>
                        <span>·</span>
                        <span>
                          {format(
                            new Date(resp.created_at),
                            "d MMM yyyy HH:mm",
                            { locale: es },
                          )}
                        </span>
                      </div>
                      <div className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                        {linkifyText(resp.contenido)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario de respuesta */}
            {user ? (
              <div className="border-2 border-primary/40 p-6">
                <h3 className="mb-4 font-mono text-sm uppercase tracking-widest text-primary">
                  Tu respuesta
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Escribí tu respuesta... (máx. 2000 caracteres)"
                    className="w-full border-2 border-primary/40 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  />
                  <p className="font-mono text-xs text-muted-foreground/60 text-right -mt-2">
                    {contenido.length}/2000
                  </p>

                  {/* Toggle anónimo */}
                  <div className="flex items-center justify-between border-2 border-primary/20 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm text-foreground">
                        {esIncognito
                          ? "Responder como Anónimo"
                          : "Responder con mi nombre"}
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

                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 border-2 border-primary bg-primary px-5 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {creating ? "Enviando..." : "Responder"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="border-2 border-primary/30 bg-primary/5 p-6 text-center">
                <p className="font-mono text-sm text-foreground">
                  <Link
                    to="/login"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Iniciá sesión
                  </Link>{" "}
                  para responder este hilo.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HiloPage;
