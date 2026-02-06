BUG: En refresh (F5) con sesión activa, la página queda en “Cargando archivos…” infinito. En consola se ve:

- bootstrap getSession -> start
- auth event -> SIGNED_IN
- fetchDbUser -> start
- (no aparece fetchDbUser -> end)
- loading timeout (15s) forzando loading=false

OBJETIVO:

1. En refresh con sesión activa, SIEMPRE deben cargarse: Archivos, Materias, contadores.
2. Nunca puede quedar un “loading infinito” por depender de una query (dbUser/files).
3. Separar claramente:
   - authReady (sesión determinada)
   - dbUserLoading (perfil/usuario DB)
   - filesLoading / materiasLoading (data de pantalla)

CAMBIOS OBLIGATORIOS

A) AuthContext:

- No bloquear `loading` del AuthProvider esperando `fetchDbUser`.
- Regla: en cuanto se conoce si hay session o no, setLoading(false) (authReady).
- fetchDbUser debe correr en background (no await bloqueante) o tener timeout/abort.
- Implementar timeout real para fetchDbUser usando AbortController (PostgrestBuilder.abortSignal) o global.fetch con timeout.

B) Página de Archivos/Materias:

- Revisar todos los useEffect que cargan data.
- Si usan `[]` pero dependen de `user`/`session`/`auth.loading`, corregir dependencias.
- Patrón obligatorio:

useEffect(() => {
if (authLoading) return;
if (!user?.id) { setData([]); setLoading(false); return; }
setLoading(true);
load().finally(() => setLoading(false));
}, [authLoading, user?.id, filtros]);

- Prohibido: `if (!user) return;` dejando loading=true.

C) Instrumentación y validación:

- Activar “Preserve log” y “Disable cache” en Network.
- Verificar que en refresh aparecen requests a /rest/v1/... y/o /storage/v1/...
- Ninguna request debe quedar pending infinito: si pasa, abortarla a los 10s y loguear el error.

ENTREGABLE:

- Patch en AuthContext + página de Archivos/Materias (y client.ts si agrega global.fetch timeout).
- Explicar en 5 líneas el motivo del loading infinito y cómo se corrigió.

---

## ✅ SOLUCIÓN IMPLEMENTADA (2026-02-06)

### MOTIVO DEL LOADING INFINITO:

1. El `AuthContext` bloqueaba `loading=true` esperando que `fetchDbUser` terminara (await bloqueante).
2. Los hooks de admin (`use-admin-files`, `use-admin-stats`, etc.) usaban `useEffect(() => {}, [])` sin depender del estado de auth, ejecutándose antes de que la sesión estuviera lista.
3. Si `fetchDbUser` se colgaba o tardaba, los hooks quedaban esperando indefinidamente.
4. No había timeout real con abort en las queries de Supabase.
5. Patrón incorrecto: `if (!user) return;` dejaba `loading=true` sin camino de salida.

### CORRECCIONES APLICADAS:

**A) AuthContext:**

- Agregado `dbUserLoading` separado de `loading` (authReady).
- `loading` ahora se pone `false` INMEDIATAMENTE cuando se conoce la sesión (INITIAL_SESSION).
- `fetchDbUser` corre en background sin bloquear el auth loading.
- Timeout de 10s con `Promise.race` para evitar que `fetchDbUser` quede colgado.

**B) Hooks admin:**

- Todos usan el patrón obligatorio: `if (authLoading) return;` + `if (!user?.id) { setData([]); setLoading(false); return; }`
- Dependencias correctas: `[authLoading, user?.id]`
- Timeout de 10s con `AbortController` para abortar requests colgadas.
- Cleanup en unmount: `abortControllerRef.current?.abort()`

**C) Páginas admin:**

- `Materias.tsx`, `Comisiones.tsx`, `Profesores.tsx` corregidas con el mismo patrón.

### ARCHIVOS MODIFICADOS:

- `src/contexts/AuthContext.tsx`
- `src/hooks/use-admin-files.ts`
- `src/hooks/use-admin-stats.ts`
- `src/hooks/use-reported-files.ts`
- `src/hooks/use-materia-comision-profesor.ts`
- `src/pages/admin/Materias.tsx`
- `src/pages/admin/Comisiones.tsx`
- `src/pages/admin/Profesores.tsx`
