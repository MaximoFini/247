-- ============================================================
-- Migración: Google Drive → Cloudflare R2
-- ============================================================

-- 1. Renombrar columnas en la tabla archivos
ALTER TABLE archivos RENAME COLUMN drive_file_id TO r2_key;
ALTER TABLE archivos RENAME COLUMN drive_link TO file_url;

-- 2. Función RPC: incrementar descargas de forma atómica
-- FileCard.tsx ya la llama (con fallback), pero puede no existir en producción
CREATE OR REPLACE FUNCTION increment_descargas(archivo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE archivos
  SET descargas = descargas + 1
  WHERE id = archivo_id AND activo = true;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_descargas(uuid) TO anon, authenticated;

-- 3. Función RPC: agregar puntos de archivos de forma atómica
-- Evita el race condition de leer-modificar-escribir desde el frontend
CREATE OR REPLACE FUNCTION add_puntos_archivos(target_user_id uuid, puntos_a_agregar integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET puntos_archivos = puntos_archivos + puntos_a_agregar
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_puntos_archivos(uuid, integer) TO authenticated;

-- 4. Recrear la vista admin_archivos_reportados con la columna renombrada
-- Esta vista existe en Supabase pero NO en el código local.
-- Si el DROP falla porque no existe → ignorar y ejecutar solo el CREATE.
DROP VIEW IF EXISTS admin_archivos_reportados;

CREATE VIEW admin_archivos_reportados AS
SELECT
  a.id,
  a.nombre,
  a.tipo,
  a.extension,
  a.file_url,
  a.tamanio_mb,
  a.descargas,
  a.activo,
  a.reportado,
  a.motivo_reporte,
  a.reportado_at,
  a.created_at,
  m.nombre   AS materia_nombre,
  c.codigo   AS comision_codigo,
  u.nombre   AS uploader_nombre,
  u.email    AS uploader_email,
  rep.nombre AS reportador_nombre,
  rep.email  AS reportador_email,
  1          AS total_reportes
FROM archivos a
LEFT JOIN materias   m   ON a.materia_id    = m.id
LEFT JOIN comisiones c   ON a.comision_id   = c.id
LEFT JOIN users      u   ON a.user_id       = u.id
LEFT JOIN users      rep ON a.reportado_por = rep.id
WHERE a.reportado = true;
