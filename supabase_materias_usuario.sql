-- =========================================
-- Script SQL para Supabase: Módulo "¿Qué Curso?"
-- Tabla: materias_usuario
-- =========================================

-- 1. Crear la tabla materias_usuario
CREATE TABLE IF NOT EXISTS materias_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  materia_id INTEGER NOT NULL,
  estado INTEGER NOT NULL DEFAULT 2, -- 0=Regular, 1=Aprobada, 2=Bloqueada, 3=Cursable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  CONSTRAINT unique_user_materia UNIQUE (user_id, materia_id),
  
  -- Constraint para validar estados
  CONSTRAINT valid_estado CHECK (estado IN (0, 1, 2, 3))
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_materias_usuario_user_id ON materias_usuario(user_id);
CREATE INDEX IF NOT EXISTS idx_materias_usuario_materia_id ON materias_usuario(materia_id);
CREATE INDEX IF NOT EXISTS idx_materias_usuario_estado ON materias_usuario(estado);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE materias_usuario ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad RLS

-- Política: Los usuarios solo pueden ver sus propias materias
CREATE POLICY "Users can view their own materias"
  ON materias_usuario
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias materias
CREATE POLICY "Users can insert their own materias"
  ON materias_usuario
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias materias
CREATE POLICY "Users can update their own materias"
  ON materias_usuario
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias materias
CREATE POLICY "Users can delete their own materias"
  ON materias_usuario
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_materias_usuario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_materias_usuario_updated_at ON materias_usuario;
CREATE TRIGGER trigger_update_materias_usuario_updated_at
  BEFORE UPDATE ON materias_usuario
  FOR EACH ROW
  EXECUTE FUNCTION update_materias_usuario_updated_at();

-- 7. Función para inicializar materias de un usuario nuevo
-- Esta función crea los 36 registros iniciales para un usuario
CREATE OR REPLACE FUNCTION initialize_user_materias(p_user_id UUID)
RETURNS void AS $$
DECLARE
  -- Materias cursables inicialmente (IDs: 1-8, 11)
  v_cursable_ids INTEGER[] := ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 11];
  -- Todas las materias obligatorias (1-36, excluyendo el 99 que es Seminario Integrado)
  v_all_materia_ids INTEGER[] := ARRAY[
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36
  ];
  v_current_materia_id INTEGER;
BEGIN
  -- Insertar todas las materias obligatorias
  FOREACH v_current_materia_id IN ARRAY v_all_materia_ids
  LOOP
    INSERT INTO materias_usuario (user_id, materia_id, estado)
    VALUES (
      p_user_id,
      v_current_materia_id,
      -- Si está en cursable_ids, estado = 3 (Cursable), sino 2 (Bloqueada)
      CASE WHEN v_current_materia_id = ANY(v_cursable_ids) THEN 3 ELSE 2 END
    )
    ON CONFLICT (user_id, materia_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Vista para obtener el progreso del usuario (opcional, para estadísticas)
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE materia_id <= 36) as total_obligatorias,
  COUNT(*) FILTER (WHERE materia_id <= 36 AND estado = 0) as regulares,
  COUNT(*) FILTER (WHERE materia_id <= 36 AND estado = 1) as aprobadas,
  COUNT(*) FILTER (WHERE materia_id <= 36 AND estado = 3) as cursables,
  COUNT(*) FILTER (WHERE materia_id <= 36 AND estado = 2) as bloqueadas,
  ROUND((COUNT(*) FILTER (WHERE materia_id <= 36 AND estado = 1)::NUMERIC / 36) * 100, 2) as porcentaje_aprobadas
FROM materias_usuario
GROUP BY user_id;

-- =========================================
-- INSTRUCCIONES DE USO:
-- =========================================
-- 1. Copiar y pegar este script completo en el SQL Editor de Supabase
-- 2. Ejecutar el script
-- 3. Para inicializar materias de un usuario existente:
--    SELECT initialize_user_materias('USER_UUID_AQUI');
-- 4. Para nuevos usuarios, llamar a la función desde el backend después del registro
-- =========================================

-- Ejemplo de consulta para inicializar materias de un usuario específico:
-- SELECT initialize_user_materias('550e8400-e29b-41d4-a716-446655440000');
