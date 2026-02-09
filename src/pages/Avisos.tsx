import {
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Megaphone,
  Calendar,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAvisos } from "@/hooks/use-avisos";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSd8Gi_YuyU9J966qXaVxPwAw81C5wIL0lvJPsDb9molphuwnQ/viewform?usp=sharing&ouid=113939760443319258778";

const AvisosPage = () => {
  const { data: avisos = [], isLoading, error } = useAvisos();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
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
              AVISOS
            </h1>
            <p className="font-mono text-lg text-muted-foreground md:text-xl">
              Noticias y comunicados importantes
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-20">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Aviso MVP */}
            <div className="border-2 border-primary bg-primary/5 p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest text-primary">
                    VERSIÓN MVP - PRODUCTO MÍNIMO VIABLE
                  </h2>
                  <p className="font-mono text-sm leading-relaxed text-foreground">
                    Esta es la primera versión funcional de la plataforma.
                    Estamos trabajando constantemente para mejorarla. Es normal
                    que algunas funcionalidades puedan tener bugs menores.
                    Agradecemos tu comprensión mientras seguimos desarrollando.
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario de Feedback */}
            <div className="border-2 border-primary bg-background p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h2 className="font-mono text-base font-bold uppercase tracking-widest text-primary">
                      TU OPINIÓN IMPORTA
                    </h2>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      Ayúdanos a mejorar la plataforma
                    </p>
                  </div>
                </div>

                <a
                  href={FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-primary bg-primary px-6 py-3 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary glitch-hover flex items-center gap-2 whitespace-nowrap"
                >
                  <span>DEJAR FEEDBACK</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-4 border-t-2 border-primary/20 pt-4">
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  Contanos qué funcionalidades te gustaría ver en próximas
                  versiones, reportá bugs o simplemente compartí tu experiencia.{" "}
                  <span className="text-primary font-bold">
                    ¡Gracias por participar!
                  </span>
                </p>
              </div>
            </div>

            {/* Avisos del Admin */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Megaphone className="h-6 w-6 text-primary" />
                <h2 className="font-mono text-lg font-bold uppercase tracking-widest text-primary">
                  COMUNICADOS OFICIALES
                </h2>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border-2 border-primary/30 bg-primary/5 p-6 animate-pulse"
                    >
                      <div className="h-4 bg-primary/20 rounded w-1/3 mb-3"></div>
                      <div className="h-3 bg-primary/20 rounded w-full mb-2"></div>
                      <div className="h-3 bg-primary/20 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="border-2 border-destructive bg-destructive/10 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="font-mono text-sm text-destructive">
                      Error al cargar los avisos. Por favor, intentá nuevamente
                      más tarde.
                    </p>
                  </div>
                </div>
              ) : avisos.length === 0 ? (
                <div className="border-2 border-primary/30 bg-primary/5 p-6 text-center">
                  <p className="font-mono text-sm text-muted-foreground">
                    No hay avisos en este momento
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {avisos.map((aviso) => (
                    <div
                      key={aviso.id}
                      className="border-2 border-primary bg-background p-6 transition-all hover:bg-primary/5"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-mono text-base font-bold uppercase tracking-wide text-primary">
                          {aviso.motivo}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                          <Calendar className="h-4 w-4" />
                          <time className="font-mono text-xs uppercase">
                            {format(new Date(aviso.fecha), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </time>
                        </div>
                      </div>

                      <p className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-line">
                        {aviso.mensaje}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div className="border-t-2 border-primary/20 pt-8">
              <p className="font-mono text-xs text-center text-muted-foreground">
                Esta sección se actualiza regularmente con información
                importante para la comunidad
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AvisosPage;
