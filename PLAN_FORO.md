# Plan de Implementación: Foro de Comunidad

> Estado: **Pendiente de implementación** — 30 de abril de 2026

## Resumen

Agregar una sección `/foro` al proyecto usando Supabase como backend. Dos tablas nuevas (`hilos` y `respuestas`), hooks con React Query siguiendo los patrones existentes, páginas propias, y moderación en el panel admin.

**Reglas del foro:**

- Todos pueden leer todo
- Solo usuarios autenticados pueden crear hilos y responder
- Máximo 3 hilos por persona por semana
- Se puede elegir publicar como anónimo o con nombre visible
- Solo texto y links — sin imágenes ni archivos adjuntos
- Todo el contenido está moderado por los moderadores de la plataforma

---

## Fase 1 — DB Migration

**Archivo:** `supabase/migrations/20260430000001_foro.sql`

### Tabla `hilos`

| Columna            | Tipo            | Notas                                  |
| ------------------ | --------------- | -------------------------------------- |
| `id`               | uuid PK         | default gen_random_uuid()              |
| `user_id`          | uuid FK → users | NOT NULL                               |
| `titulo`           | text            | CHECK length 5–200                     |
| `contenido`        | text            | CHECK length 10–5000                   |
| `es_incognito`     | boolean         | default false                          |
| `activo`           | boolean         | default true                           |
| `respuestas_count` | integer         | default 0, actualizado por trigger     |
| `created_at`       | timestamptz     | default now()                          |
| `updated_at`       | timestamptz     | default now(), actualizado por trigger |

### Tabla `respuestas`

| Columna        | Tipo            | Notas                     |
| -------------- | --------------- | ------------------------- |
| `id`           | uuid PK         | default gen_random_uuid() |
| `hilo_id`      | uuid FK → hilos | ON DELETE CASCADE         |
| `user_id`      | uuid FK → users | NOT NULL                  |
| `contenido`    | text            | CHECK length 1–2000       |
| `es_incognito` | boolean         | default false             |
| `activo`       | boolean         | default true              |
| `created_at`   | timestamptz     | default now()             |

### RLS Policies

**`hilos`:**

- `SELECT`: público si `activo = true`; admin ve todo
- `INSERT`: authenticated + `auth.uid() = user_id`
- `UPDATE / DELETE`: solo admin

**`respuestas`:**

- `SELECT`: público si `activo = true`; admin ve todo
- `INSERT`: authenticated + `auth.uid() = user_id`
- `UPDATE / DELETE`: solo admin

### Triggers

- `after_respuesta_insert` → `hilos.respuestas_count + 1` + actualiza `hilos.updated_at`
- `after_respuesta_delete` → `hilos.respuestas_count - 1`

### RPC

```sql
-- Devuelve cantidad de hilos del usuario en los últimos 7 días
-- Usado para enforcement del límite de 3/semana
CREATE OR REPLACE FUNCTION get_hilos_this_week(target_user_id uuid)
RETURNS integer ...
```

---

## Fase 2 — TypeScript Types

**Archivo modificado:** `src/types/database.ts`

Agregar interfaces `Hilo` y `Respuesta` con todos los campos, incluyendo el join con `users` (para mostrar nombre cuando `es_incognito = false`).

---

## Fase 3 — Hooks _(paralelo con Fase 6)_

| Archivo nuevo                      | Responsabilidad                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/hooks/use-foro.ts`            | Lista hilos, búsqueda ILIKE en título + contenido, paginación offset limit 20, orden `updated_at DESC` |
| `src/hooks/use-hilo.ts`            | Hilo por ID + sus respuestas en `created_at ASC`                                                       |
| `src/hooks/use-crear-hilo.ts`      | Mutation: chequea rate limit via RPC (`< 3`) → insert → invalida "foro" → retorna ID para redirigir    |
| `src/hooks/use-crear-respuesta.ts` | Mutation: insert respuesta → invalida `["hilo", id]`                                                   |
| `src/hooks/use-admin-foro.ts`      | Para admin: lista todo incluyendo inactivos, `deactivate`, `deleteThread`, `deleteReply`               |

---

## Fase 4 — Páginas

### `src/pages/Foro.tsx`

- Banner: _"Todo el contenido está moderado por los moderadores de la plataforma"_
- Buscador con debounce 300ms (mín. 2 chars) — busca en título y contenido
  - Útil para términos como `3k2`, nombres de materias, etc.
- Botón "Nuevo hilo" — si no está logueado: toast indicando que debe iniciar sesión
- **Dialog de creación:**
  - Campo Título
  - Textarea Contenido
  - Toggle **Anónimo / Mostrar mi nombre**
  - Botón Publicar
- Lista de hilos como cards: título, preview truncado (~150 chars), autor o _"Anónimo"_, fecha, cantidad de respuestas
- Botón "Cargar más" (paginación offset)

### `src/pages/Hilo.tsx`

- Breadcrumb: `FORO / [título del hilo]`
- Card con el hilo original completo: contenido con **URLs detectadas y clicables** (via Fase 6)
- Respuestas en orden cronológico, cada una como card: autor o _"Anónimo"_, fecha, contenido
- Al final: form de respuesta con toggle anónimo
  - Si no autenticado → banner "Iniciá sesión para responder" (sin form)

### `src/pages/admin/Foro.tsx`

- Tabs **"Hilos"** / **"Respuestas"**
- Ve todo incluyendo inactivos (badge de estado)
- Acciones por fila: desactivar (soft delete: `activo = false`) o eliminar permanente

---

## Fase 5 — Navegación y rutas _(depende de Fase 4)_

**`src/App.tsx`** — 3 lazy routes nuevas:

| Ruta          | Componente  | Protección |
| ------------- | ----------- | ---------- |
| `/foro`       | `Foro`      | Público    |
| `/foro/:id`   | `Hilo`      | Público    |
| `/admin/foro` | `AdminForo` | AdminRoute |

**`src/components/Navigation.tsx`** — agregar link `FORO` entre AVISOS y SUBIR.

---

## Fase 6 — Utilidad de linkificación _(paralelo con Fase 3)_

**`src/lib/linkify.ts`** — función `linkifyText(text: string): ReactNode[]` que convierte URLs en `<a target="_blank" rel="noopener noreferrer">` dentro del texto. Regex segura, sin librería externa.

---

## Orden de ejecución

```
Fase 1 — Migration SQL      (primero, independiente)
         ↓
Fase 2 — Types
         ↓
Fase 3 + Fase 6             (en paralelo)
         ↓
Fase 4 — Páginas            (depende de Fase 3 + 6)
         ↓
Fase 5 — Nav + Rutas        (depende de Fase 4)
```

---

## Resumen de archivos a crear/modificar

| Archivo                                       | Tipo      | Acción                              |
| --------------------------------------------- | --------- | ----------------------------------- |
| `supabase/migrations/20260430000001_foro.sql` | Nuevo     | Crear                               |
| `src/hooks/use-foro.ts`                       | Nuevo     | Crear                               |
| `src/hooks/use-hilo.ts`                       | Nuevo     | Crear                               |
| `src/hooks/use-crear-hilo.ts`                 | Nuevo     | Crear                               |
| `src/hooks/use-crear-respuesta.ts`            | Nuevo     | Crear                               |
| `src/hooks/use-admin-foro.ts`                 | Nuevo     | Crear                               |
| `src/pages/Foro.tsx`                          | Nuevo     | Crear                               |
| `src/pages/Hilo.tsx`                          | Nuevo     | Crear                               |
| `src/pages/admin/Foro.tsx`                    | Nuevo     | Crear                               |
| `src/lib/linkify.ts`                          | Nuevo     | Crear                               |
| `src/types/database.ts`                       | Existente | Agregar interfaces Hilo y Respuesta |
| `src/App.tsx`                                 | Existente | Agregar 3 rutas lazy                |
| `src/components/Navigation.tsx`               | Existente | Agregar link FORO                   |

**Total: 10 archivos nuevos, 3 archivos modificados.**

---

## Decisiones de diseño

| Decisión          | Elección                                           | Razón                                                             |
| ----------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Rate limit        | Chequeado en hook frontend via RPC, sin trigger DB | Bajo volumen, evita complejidad innecesaria                       |
| Búsqueda          | ILIKE `%term%` en título + contenido               | FTS en español no maneja bien códigos como `3k2`                  |
| Anónimo           | `user_id` siempre guardado en DB                   | Necesario para moderación y rate limit; solo se oculta en UI      |
| Realtime          | Sin Supabase channels                              | Refetch al crear respuesta es suficiente para el volumen esperado |
| Linkificación     | Función custom sin librerías externas              | Evita dependencia innecesaria                                     |
| Imágenes/archivos | No permitidos                                      | Solo texto y links según requerimiento                            |

---

_Plan verificado contra el código real del proyecto. Última revisión: 30/04/2026._
