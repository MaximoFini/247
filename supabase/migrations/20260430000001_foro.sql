-- ============================================================
-- Migración: Foro de Comunidad
-- ============================================================

-- 1. Tabla de hilos
CREATE TABLE IF NOT EXISTS hilos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo           text        NOT NULL CHECK (char_length(titulo) >= 5 AND char_length(titulo) <= 200),
  contenido        text        NOT NULL CHECK (char_length(contenido) >= 10 AND char_length(contenido) <= 5000),
  es_incognito     boolean     NOT NULL DEFAULT false,
  activo           boolean     NOT NULL DEFAULT true,
  respuestas_count integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabla de respuestas
CREATE TABLE IF NOT EXISTS respuestas (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hilo_id      uuid        NOT NULL REFERENCES hilos(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenido    text        NOT NULL CHECK (char_length(contenido) >= 1 AND char_length(contenido) <= 2000),
  es_incognito boolean     NOT NULL DEFAULT false,
  activo       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_hilos_updated_at ON hilos(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hilos_activo ON hilos(activo);
CREATE INDEX IF NOT EXISTS idx_hilos_user_id ON hilos(user_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_hilo_id ON respuestas(hilo_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_activo ON respuestas(activo);

-- 4. Trigger: actualizar respuestas_count y updated_at al insertar respuesta
CREATE OR REPLACE FUNCTION after_respuesta_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE hilos
  SET respuestas_count = respuestas_count + 1,
      updated_at       = now()
  WHERE id = NEW.hilo_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_respuesta_insert ON respuestas;
CREATE TRIGGER trg_after_respuesta_insert
  AFTER INSERT ON respuestas
  FOR EACH ROW EXECUTE FUNCTION after_respuesta_insert();

-- 5. Trigger: decrementar respuestas_count al eliminar respuesta
CREATE OR REPLACE FUNCTION after_respuesta_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE hilos
  SET respuestas_count = GREATEST(respuestas_count - 1, 0)
  WHERE id = OLD.hilo_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_respuesta_delete ON respuestas;
CREATE TRIGGER trg_after_respuesta_delete
  AFTER DELETE ON respuestas
  FOR EACH ROW EXECUTE FUNCTION after_respuesta_delete();

-- 6. Trigger: auto-actualizar updated_at en hilos
CREATE OR REPLACE FUNCTION update_hilo_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_hilo_updated_at ON hilos;
CREATE TRIGGER trg_update_hilo_updated_at
  BEFORE UPDATE ON hilos
  FOR EACH ROW EXECUTE FUNCTION update_hilo_updated_at();

-- 7. RPC: contar hilos del usuario en los últimos 7 días (para rate limit)
CREATE OR REPLACE FUNCTION get_hilos_this_week(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
BEGIN
  SELECT COUNT(*)
  INTO cnt
  FROM hilos
  WHERE user_id = target_user_id
    AND created_at >= now() - interval '7 days';
  RETURN cnt;
END;
$$;

GRANT EXECUTE ON FUNCTION get_hilos_this_week(uuid) TO authenticated;

-- 8. RLS — habilitar
ALTER TABLE hilos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE respuestas ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies — hilos
-- Lectura pública de hilos activos
CREATE POLICY "hilos_select_public"
  ON hilos FOR SELECT
  USING (activo = true);

-- Admins ven todo
CREATE POLICY "hilos_select_admin"
  ON hilos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo autenticados pueden insertar sus propios hilos
CREATE POLICY "hilos_insert_authenticated"
  ON hilos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo admins pueden actualizar
CREATE POLICY "hilos_update_admin"
  ON hilos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo admins pueden eliminar
CREATE POLICY "hilos_delete_admin"
  ON hilos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- 10. RLS Policies — respuestas
-- Lectura pública de respuestas activas
CREATE POLICY "respuestas_select_public"
  ON respuestas FOR SELECT
  USING (activo = true);

-- Admins ven todo
CREATE POLICY "respuestas_select_admin"
  ON respuestas FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo autenticados pueden insertar sus propias respuestas
CREATE POLICY "respuestas_insert_authenticated"
  ON respuestas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo admins pueden actualizar
CREATE POLICY "respuestas_update_admin"
  ON respuestas FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo admins pueden eliminar
CREATE POLICY "respuestas_delete_admin"
  ON respuestas FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
