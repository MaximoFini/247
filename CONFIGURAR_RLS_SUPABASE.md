# Configurar Políticas RLS en Supabase

Los errores 400 se deben a que faltan políticas de Row Level Security (RLS) en Supabase.

## 📋 Instrucciones

Ve a **Supabase Dashboard → SQL Editor** y ejecuta estos comandos:

---

## 1. Políticas para la tabla `ratings`

```sql
-- Habilitar RLS en la tabla ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Política: Cualquier usuario autenticado puede INSERTAR ratings
CREATE POLICY "Los usuarios autenticados pueden insertar ratings"
ON ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Cualquier usuario puede VER todos los ratings (para calcular promedios)
CREATE POLICY "Todos pueden ver ratings"
ON ratings
FOR SELECT
TO authenticated
USING (true);

-- Política: Los usuarios solo pueden actualizar sus propios ratings
CREATE POLICY "Los usuarios pueden actualizar sus propios ratings"
ON ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 2. Políticas para la tabla `archivos`

```sql
-- Habilitar RLS en la tabla archivos (si no está habilitado)
ALTER TABLE archivos ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden VER archivos activos
CREATE POLICY "Todos pueden ver archivos activos"
ON archivos
FOR SELECT
TO authenticated, anon
USING (activo = true);

-- Política: Usuarios autenticados pueden INSERTAR archivos
CREATE POLICY "Los usuarios autenticados pueden insertar archivos"
ON archivos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios pueden actualizar sus propios archivos
CREATE POLICY "Los usuarios pueden actualizar sus propios archivos"
ON archivos
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 3. Políticas para tablas relacionadas

### Tabla `materias`

```sql
-- Todos pueden ver materias
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver materias"
ON materias
FOR SELECT
TO authenticated, anon
USING (true);
```

### Tabla `comisiones`

```sql
-- Todos pueden ver comisiones
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver comisiones"
ON comisiones
FOR SELECT
TO authenticated, anon
USING (true);
```

### Tabla `users`

```sql
-- Los usuarios pueden ver su propio perfil
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Tabla `profesores`

```sql
-- Todos pueden ver profesores
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver profesores"
ON profesores
FOR SELECT
TO authenticated, anon
USING (true);
```

---

## 🔍 Verificar que funcionó

Después de ejecutar los comandos SQL, verifica que las políticas se crearon correctamente:

```sql
-- Ver todas las políticas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## ✅ Resultado Esperado

Después de configurar las políticas:

1. ✅ **Ratings**: Los usuarios podrán guardar puntuaciones de profesores
2. ✅ **Archivos**: Aparecerán todos los archivos en la página de inicio
3. ✅ **Sin errores 400**: Las consultas funcionarán correctamente

---

## 🆘 Si sigue sin funcionar

Si después de configurar las políticas sigues teniendo errores:

1. **Verifica que el usuario está autenticado**: Revisa en la consola del navegador si `user.id` existe
2. **Revisa los logs detallados**: Ahora la consola mostrará el error exacto con código y detalles
3. **Verifica la estructura de las tablas**: Asegúrate que las columnas coincidan con lo que estás enviando

## 📝 Comandos útiles

```sql
-- Ver estructura de la tabla ratings
\d ratings

-- Ver políticas de una tabla específica
SELECT * FROM pg_policies WHERE tablename = 'ratings';

-- Deshabilitar RLS temporalmente (solo para debugging)
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
```
