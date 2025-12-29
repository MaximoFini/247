import Navigation from "@/components/Navigation";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <section className="relative overflow-hidden py-12 border-b-2 border-primary">
          <div className="container mx-auto px-4">
            <h1 className="font-brutal text-5xl text-primary">
              TÉRMINOS DE SERVICIO
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
                1. Aceptación de los Términos
              </h2>
              <p>
                Al acceder y usar 247, aceptás estos Términos de Servicio. Si no
                estás de acuerdo, no uses la plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                2. Descripción del Servicio
              </h2>
              <p>
                247 es una plataforma colaborativa para compartir archivos
                académicos (apuntes, parciales, trabajos prácticos, etc.) entre
                estudiantes de Ingeniería en Sistemas de la UTN FRC.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                3. Requisitos de Uso
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Debes tener una cuenta de Google para registrarte</li>
                <li>Debes ser mayor de 13 años</li>
                <li>Sos responsable de mantener la seguridad de tu cuenta</li>
                <li>
                  No podés crear múltiples cuentas para abusar del sistema
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                4. Contenido del Usuario
              </h2>
              <p className="mb-3">Al subir archivos a 247:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Garantizás que tenés derecho a compartir ese contenido</li>
                <li>No subís material con copyright sin autorización</li>
                <li>No subís contenido ilegal, ofensivo o inapropiado</li>
                <li>
                  Los archivos que subís se hacen públicos (accesibles para
                  todos)
                </li>
                <li>
                  Nos otorgás permiso para almacenar y distribuir el contenido
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                5. Conducta Prohibida
              </h2>
              <p className="mb-3">No podés:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Subir contenido malicioso (virus, malware, etc.)</li>
                <li>Intentar hackear o comprometer la plataforma</li>
                <li>Usar bots o automatización para generar puntos</li>
                <li>Acosar, amenazar o discriminar a otros usuarios</li>
                <li>Violar la privacidad de otros usuarios</li>
                <li>Subir material plagiado sin atribución</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                6. Sistema de Puntos
              </h2>
              <p>
                Ganás puntos al subir archivos y hacer donaciones. Los puntos
                son virtuales y no tienen valor monetario. Nos reservamos el
                derecho de ajustar puntos si detectamos abuso.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                7. Moderación
              </h2>
              <p>Nos reservamos el derecho de:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Eliminar contenido que viole estos términos</li>
                <li>Suspender o banear cuentas que incumplan las reglas</li>
                <li>
                  Modificar o eliminar calificaciones de profesores si son
                  inapropiadas
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                8. Propiedad Intelectual
              </h2>
              <p>
                247 y su diseño, logo, código y contenido son propiedad de sus
                creadores. No podés copiar, modificar o redistribuir la
                plataforma sin permiso.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                9. Descargo de Responsabilidad
              </h2>
              <p className="mb-3">
                247 se provee "tal cual es" (AS IS). No garantizamos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>La exactitud del contenido subido por usuarios</li>
                <li>
                  Que la plataforma estará disponible 24/7 sin interrupciones
                </li>
                <li>Que el contenido no infringe derechos de terceros</li>
              </ul>
              <p className="mt-3">Usás la plataforma bajo tu propio riesgo.</p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                10. Limitación de Responsabilidad
              </h2>
              <p>
                No somos responsables por daños indirectos, pérdida de datos, o
                cualquier consecuencia derivada del uso de 247.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                11. Modificaciones a los Términos
              </h2>
              <p>
                Podemos actualizar estos términos en cualquier momento. Cambios
                significativos serán notificados en la plataforma. El uso
                continuado implica aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                12. Terminación
              </h2>
              <p>
                Podés eliminar tu cuenta en cualquier momento desde tu perfil.
                Nos reservamos el derecho de terminar tu cuenta si violás estos
                términos.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                13. Ley Aplicable
              </h2>
              <p>
                Estos términos se rigen por las leyes de la República Argentina.
                Cualquier disputa será resuelta en los tribunales de la Ciudad
                de Cordoba.
              </p>
            </section>

            <section>
              <h2 className="font-brutal text-2xl text-primary mb-4">
                14. Contacto
              </h2>
              <p>
                Para preguntas sobre estos términos, contactanos en:{" "}
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

export default Terms;
