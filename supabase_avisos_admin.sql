-- ============================================
-- TABLA: avisos_admin
-- Descripción: Almacena avisos creados por administradores
-- para mostrar a los usuarios en la página de Avisos
-- ============================================

CREATE TABLE IF NOT EXISTS public.avisos_admin (
  id BIGSERIAL PRIMARY KEY,
  motivo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_avisos_admin_activo_fecha 
  ON public.avisos_admin(activo, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_avisos_admin_fecha 
  ON public.avisos_admin(fecha DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_avisos_admin_updated_at 
  BEFORE UPDATE ON public.avisos_admin
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.avisos_admin ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden LEER avisos activos
CREATE POLICY "Todos pueden leer avisos activos"
  ON public.avisos_admin
  FOR SELECT
  USING (activo = true);

-- Policy: Solo admins pueden INSERTAR avisos
CREATE POLICY "Solo admins pueden insertar avisos"
  ON public.avisos_admin
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy: Solo admins pueden ACTUALIZAR avisos
CREATE POLICY "Solo admins pueden actualizar avisos"
  ON public.avisos_admin
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy: Solo admins pueden ELIMINAR avisos
CREATE POLICY "Solo admins pueden eliminar avisos"
  ON public.avisos_admin
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE public.avisos_admin IS 'Avisos creados por administradores para mostrar a los usuarios';
COMMENT ON COLUMN public.avisos_admin.motivo IS 'Título o motivo del aviso (ej: "Mantenimiento", "Nueva Funcionalidad")';
COMMENT ON COLUMN public.avisos_admin.mensaje IS 'Contenido completo del aviso';
COMMENT ON COLUMN public.avisos_admin.fecha IS 'Fecha de publicación del aviso';
COMMENT ON COLUMN public.avisos_admin.activo IS 'Indica si el aviso está visible para los usuarios';

-- Datos de ejemplo (opcional - puedes comentar esta sección si no la quieres)
INSERT INTO public.avisos_admin (motivo, mensaje, fecha, activo) VALUES
  (
    'Bienvenida al MVP',
    '¡Bienvenidos a 247! Esta es la primera versión de nuestra plataforma. Agradecemos su paciencia mientras seguimos mejorando.',
    NOW(),
    true
  ),
  (
    'Reportar Bugs',
    'Si encuentras algún error o tienes sugerencias, por favor utiliza el formulario de feedback. ¡Tu opinión es muy importante!',
    NOW(),
    true
  );
