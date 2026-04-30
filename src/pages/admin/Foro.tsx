import { useState } from "react";
import {
  MessageSquare,
  Trash2,
  EyeOff,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAdminForo } from "@/hooks/use-admin-foro";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Tab = "hilos" | "respuestas";

const AdminForo = () => {
  const [tab, setTab] = useState<Tab>("hilos");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    hilos,
    respuestas,
    loadingHilos,
    loadingRespuestas,
    deactivateHilo,
    activateHilo,
    deleteHilo,
    deactivateRespuesta,
    deleteRespuesta,
  } = useAdminForo();

  const runAction = async (id: string, fn: () => Promise<void>) => {
    setActionLoading(id);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError((err as Error).message ?? "Error");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = (label: string) =>
    window.confirm(
      `¿Eliminar permanentemente "${label}"? Esta acción no se puede deshacer.`,
    );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <section className="relative overflow-hidden py-16">
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>
          <div className="container relative mx-auto px-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="font-brutal text-5xl text-primary">
                MODERACIÓN FORO
              </h1>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-20">
          {/* Tabs */}
          <div className="mb-6 flex border-b-2 border-primary/20">
            <button
              onClick={() => setTab("hilos")}
              className={`px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === "hilos"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Hilos ({hilos.length})
            </button>
            <button
              onClick={() => setTab("respuestas")}
              className={`px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === "respuestas"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Respuestas ({respuestas.length})
            </button>
          </div>

          {actionError && (
            <div className="mb-4 flex items-center gap-2 border-2 border-destructive/40 bg-destructive/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="font-mono text-xs text-destructive">
                {actionError}
              </p>
            </div>
          )}

          {/* Tab: Hilos */}
          {tab === "hilos" && (
            <>
              {loadingHilos ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : hilos.length === 0 ? (
                <p className="font-mono text-sm text-muted-foreground">
                  Sin hilos.
                </p>
              ) : (
                <div className="space-y-3">
                  {hilos.map((hilo) => (
                    <div
                      key={hilo.id}
                      className={`border-2 p-5 ${
                        hilo.activo
                          ? "border-primary/30"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border ${
                                hilo.activo
                                  ? "border-primary/40 text-primary"
                                  : "border-destructive/40 text-destructive"
                              }`}
                            >
                              {hilo.activo ? "ACTIVO" : "INACTIVO"}
                            </span>
                            {hilo.es_incognito && (
                              <span className="font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border border-muted-foreground/30 text-muted-foreground">
                                ANÓNIMO
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 font-mono text-sm font-bold text-foreground">
                            {hilo.titulo}
                          </h3>
                          <p className="mt-1 font-mono text-xs text-muted-foreground line-clamp-2">
                            {hilo.contenido.slice(0, 200)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {hilo.activo ? (
                            <button
                              disabled={actionLoading === hilo.id}
                              onClick={() =>
                                runAction(hilo.id, () =>
                                  deactivateHilo(hilo.id),
                                )
                              }
                              title="Desactivar"
                              className="flex items-center gap-1.5 border-2 border-yellow-500/50 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-yellow-600 transition-all hover:border-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50"
                            >
                              {actionLoading === hilo.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                              Desactivar
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading === hilo.id}
                              onClick={() =>
                                runAction(hilo.id, () => activateHilo(hilo.id))
                              }
                              title="Activar"
                              className="flex items-center gap-1.5 border-2 border-green-500/50 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-green-600 transition-all hover:border-green-500 hover:bg-green-500/10 disabled:opacity-50"
                            >
                              {actionLoading === hilo.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                              Activar
                            </button>
                          )}
                          <button
                            disabled={actionLoading === hilo.id}
                            onClick={() => {
                              if (confirmDelete(hilo.titulo))
                                runAction(hilo.id, () => deleteHilo(hilo.id));
                            }}
                            title="Eliminar permanente"
                            className="flex items-center gap-1.5 border-2 border-destructive/50 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-destructive transition-all hover:border-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            {actionLoading === hilo.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground/70 uppercase tracking-widest">
                        {hilo.es_incognito || !hilo.autor
                          ? "Anónimo"
                          : hilo.autor.nombre}{" "}
                        ·{" "}
                        {format(new Date(hilo.created_at), "d MMM yyyy HH:mm", {
                          locale: es,
                        })}{" "}
                        · {hilo.respuestas_count} respuestas
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tab: Respuestas */}
          {tab === "respuestas" && (
            <>
              {loadingRespuestas ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : respuestas.length === 0 ? (
                <p className="font-mono text-sm text-muted-foreground">
                  Sin respuestas.
                </p>
              ) : (
                <div className="space-y-3">
                  {respuestas.map((resp) => (
                    <div
                      key={resp.id}
                      className={`border-2 p-5 ${
                        resp.activo
                          ? "border-primary/30"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border ${
                                resp.activo
                                  ? "border-primary/40 text-primary"
                                  : "border-destructive/40 text-destructive"
                              }`}
                            >
                              {resp.activo ? "ACTIVO" : "INACTIVO"}
                            </span>
                            {resp.es_incognito && (
                              <span className="font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border border-muted-foreground/30 text-muted-foreground">
                                ANÓNIMO
                              </span>
                            )}
                          </div>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(resp as any).hilo && (
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              Hilo: {(resp as any).hilo.titulo}
                            </p>
                          )}
                          <p className="mt-2 font-mono text-sm text-foreground line-clamp-3">
                            {resp.contenido}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {resp.activo && (
                            <button
                              disabled={actionLoading === resp.id}
                              onClick={() =>
                                runAction(resp.id, () =>
                                  deactivateRespuesta(resp.id),
                                )
                              }
                              title="Desactivar"
                              className="flex items-center gap-1.5 border-2 border-yellow-500/50 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-yellow-600 transition-all hover:border-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50"
                            >
                              {actionLoading === resp.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                              Desactivar
                            </button>
                          )}
                          <button
                            disabled={actionLoading === resp.id}
                            onClick={() => {
                              if (
                                confirmDelete(
                                  resp.contenido.slice(0, 40) + "...",
                                )
                              )
                                runAction(resp.id, () =>
                                  deleteRespuesta(resp.id),
                                );
                            }}
                            title="Eliminar permanente"
                            className="flex items-center gap-1.5 border-2 border-destructive/50 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-destructive transition-all hover:border-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            {actionLoading === resp.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground/70 uppercase tracking-widest">
                        {resp.es_incognito || !resp.autor
                          ? "Anónimo"
                          : resp.autor.nombre}{" "}
                        ·{" "}
                        {format(new Date(resp.created_at), "d MMM yyyy HH:mm", {
                          locale: es,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminForo;
