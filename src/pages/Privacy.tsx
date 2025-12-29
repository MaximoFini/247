import Navigation from "@/components/Navigation";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <section className="relative overflow-hidden py-12 border-b-2 border-primary">
          <div className="container mx-auto px-4">
            <h1 className="font-brutal text-5xl text-primary">
              POLÍTICA DE PRIVACIDAD
            </h1>
            <p className="font-mono text-sm text-muted-foreground mt-2">
              Última actualización: {new Date().toLocaleDateString()}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="border-2 border-primary bg-card p-8 space-y-6 font-mono text-sm text-foreground">
            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                1. Información que Recopilamos
              </h2>
              <p className="mb-3">
                Cuando usás 247, recopilamos la siguiente información:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Información de perfil de Google (nombre, email)</li>
                <li>Archivos que subís a través de Google Drive</li>
                <li>
                  Metadata de archivos (nombre, tipo, tamaño, materia, comisión)
                </li>
                <li>Puntos acumulados por tu actividad</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                2. Cómo Usamos tu Información
              </h2>
              <p className="mb-3">Usamos tu información para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Permitirte subir y compartir archivos académicos</li>
                <li>Mostrar tu perfil y estadísticas</li>
                <li>Calcular y mostrar tu puntaje</li>
                <li>Mejorar la plataforma y la experiencia de usuario</li>
                <li>Moderar contenido inapropiado</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                3. Compartir Información
              </h2>
              <p>
                No compartimos tu información personal con terceros, excepto:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Cuando es requerido por ley</li>
                <li>Para proteger los derechos y seguridad de la plataforma</li>
                <li>
                  Información pública: archivos que subís son visibles para
                  todos los usuarios
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                4. Google Drive
              </h2>
              <p>
                247 usa Google Drive API para permitirte seleccionar archivos de
                tu Drive. Solo accedemos a los archivos que vos explícitamente
                seleccionás en el picker. Hacemos públicos esos archivos para
                que otros usuarios puedan acceder.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                5. Cookies y Almacenamiento
              </h2>
              <p>
                Usamos cookies y localStorage para mantener tu sesión activa.
                Podés borrar las cookies en cualquier momento desde tu
                navegador.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                6. Tus Derechos
              </h2>
              <p className="mb-3">Tenés derecho a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acceder a tu información personal</li>
                <li>Solicitar la corrección de datos incorrectos</li>
                <li>Solicitar la eliminación de tu cuenta y datos</li>
                <li>Retirar el consentimiento de uso de Google OAuth</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                7. Seguridad
              </h2>
              <p>
                Implementamos medidas de seguridad para proteger tu información,
                incluyendo autenticación OAuth, encriptación de datos en
                tránsito (HTTPS), y políticas de acceso restringido a nivel de
                base de datos (RLS).
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                8. Cambios a esta Política
              </h2>
              <p>
                Podemos actualizar esta política ocasionalmente. Te
                notificaremos de cambios significativos mediante un aviso en la
                plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                9. Contacto
              </h2>
              <p>
                Si tenés preguntas sobre esta política, contactanos en:{" "}
                <a
                  href="mailto:contacto@247.com"
                  className="text-primary underline hover:no-underline"
                >
                  contacto@247.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
