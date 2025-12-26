const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Glitch decoration */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 rotate-90 font-brutal text-9xl text-primary/5">
        247
      </div>
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 -rotate-90 font-brutal text-9xl text-primary/5">
        247
      </div>
      
      <div className="container relative mx-auto px-4 text-center">
        {/* Main Headline */}
        <h1 className="mb-6 font-brutal text-6xl leading-none text-primary md:text-8xl lg:text-9xl">
          247.
        </h1>
        <h2 className="mb-8 font-brutal text-3xl leading-tight text-card-foreground md:text-4xl lg:text-5xl">
          LA BASE DE DATOS
          <br />
          <span className="text-primary">NO OFICIAL.</span>
        </h2>
        
        {/* Subtext */}
        <p className="mx-auto max-w-2xl font-mono text-lg text-muted-foreground md:text-xl">
          Archivos crudos. Sin filtro.{" "}
          <span className="text-primary">Subilo o rescatate.</span>
        </p>
        
        {/* Stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t-2 border-b-2 border-primary/30 py-6">
          <div className="text-center">
            <p className="font-brutal text-4xl text-primary">2,847</p>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              ARCHIVOS
            </p>
          </div>
          <div className="h-12 w-0.5 bg-primary/30" />
          <div className="text-center">
            <p className="font-brutal text-4xl text-primary">15</p>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              MATERIAS
            </p>
          </div>
          <div className="h-12 w-0.5 bg-primary/30" />
          <div className="text-center">
            <p className="font-brutal text-4xl text-primary">48.2K</p>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              DESCARGAS
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
