import { ReactNode } from "react";

interface HeroSectionProps {
  title: string;
  subtitle: string;
}

/**
 * Componente reutilizable para secciones hero
 * Elimina duplicación del patrón grid + título + subtítulo
 */
export const PageHero = ({ title, subtitle }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden py-20">
      {/* Decorative grid */}
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
          {title}
        </h1>
        <p className="mb-12 font-mono text-lg text-muted-foreground md:text-xl">
          {subtitle}
        </p>
      </div>
    </section>
  );
};

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * Layout base para páginas con navegación
 */
export const PageLayout = ({ children }: PageLayoutProps) => {
  return <div className="min-h-screen bg-background">{children}</div>;
};
