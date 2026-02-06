# Plan de Solución - Problemas de Recarga en Producción

## 🎯 Objetivo

Solucionar los 3 problemas críticos que impiden que la aplicación funcione correctamente al recargar páginas estando autenticado.

---

## 📋 Problemas Identificados

### 1. **Inicio (/) - Loop infinito de "Cargando archivos..."**

- **Síntoma**: Con la sesion iniciada archivos se muestran bien en primera carga, pero al recargar quedan en loading infinito
- **Causa raíz**: `usePublicFiles` hook no maneja correctamente el estado de autenticación cambiante durante la recarga
- **Archivo afectado**: `src/hooks/use-public-files.ts`, `src/pages/Index.tsx`

### 2. **/subir - Formulario nunca termina de cargar**

- **Síntoma**: El formulario de subida no se muestra después de recargar
- **Causa raíz**: Queries de React Query (`useMaterias`, `useComisiones`) no reintentan correctamente después de que `user` se define
- **Archivo afectado**: `src/pages/Subir.tsx`, `src/hooks/use-materia-comision-profesor.ts`

### 3. **/perfil - Archivos del usuario no se listan**

- **Síntoma**: Los archivos propios no se muestran, loop infinito de carga
- **Causa raíz**: `useUserFiles` hook depende de `user.id` pero se ejecuta antes de que `user` esté disponible
- **Archivo afectado**: `src/hooks/use-user-files.ts`, `src/pages/Perfil.tsx`

---

## 🔧 Diagnóstico Técnico

### Problema Core: Race Condition en AuthContext

```
1. Usuario recarga la página
2. AuthContext inicia con loading=true, user=null
3. Hooks de React Query se ejecutan INMEDIATAMENTE con user=null
4. AuthContext termina de cargar → loading=false, user={...}
5. React Query NO se re-ejecuta porque "enabled" ya evaluó a false
6. Los componentes quedan esperando datos que nunca llegan
```

### Solución: Sincronizar React Query con estado de autenticación

---

## 📊 Plan de Implementación - 3 Fases

---

## 🚀 FASE 1: Arreglar AuthContext y Base de Sincronización

**Prioridad: CRÍTICA** | **Tiempo estimado: 30 min**

### Objetivos:

- ✅ Optimizar `AuthContext` para carga más rápida
- ✅ Eliminar race conditions entre `getSession()` y `onAuthStateChange`
- ✅ Implementar caché de `dbUser` en sessionStorage para carga instantánea
- ✅ Reducir timeouts (de 10s → 5s máximo)

### Archivos a modificar:

#### 1.1 - `src/contexts/AuthContext.tsx`

**Cambios:**

```typescript
// ANTES: getSession() y onAuthStateChange compiten
// DESPUÉS: Listener primero, getSession solo como fallback

// Optimizaciones clave:
- initialSessionProcessedRef para prevenir duplicados
- Caché en sessionStorage del dbUser
- Timeouts reducidos: 5s total, 3s para auth, 4s para dbUser
- Si dbUser está en caché → carga instantánea (0ms)
```

**Implementación:**

```typescript
// 1. Agregar flag de sesión procesada
const initialSessionProcessedRef = useRef<boolean>(false);

// 2. En INITIAL_SESSION, marcar como procesado
case "INITIAL_SESSION":
  initialSessionProcessedRef.current = true;
  if (newSession?.user) {
    // Si hay caché, carga instantánea
    if (dbUserRef.current?.id === newSession.user.id) {
      setLoading(false);
      return;
    }
    await fetchDbUser(newSession.user.id);
  }

// 3. getSession solo si listener no disparó
await new Promise(resolve => setTimeout(resolve, 100));
if (initialSessionProcessedRef.current) {
  console.log("Sesión ya procesada, saltando getSession");
  return;
}
```

**Testing:**

- [ ] Recargar en `/` estando logueado → debe cargar nombre de usuario instantáneamente
- [ ] Hacer login → debe mostrar nombre sin delays
- [ ] Cerrar sesión y volver → debe redirigir a `/login` en <1s

---

\*//

## 🔄 FASE 2: Arreglar Hooks de React Query

**Prioridad: CRÍTICA** | **Tiempo estimado: 45 min** | **✅ COMPLETADO**

### Objetivos:

- ✅ Hacer que los hooks se re-ejecuten cuando `user` cambia de null → definido
- ✅ Prevenir queries cuando no hay autenticación
- ✅ Implementar mejor manejo de errores y estados vacíos

### 2.1 - `src/hooks/use-public-files.ts`

**Problema actual:**

```typescript
// Hook se ejecuta con user=null, enabled=true
// Cuando user se define, la query NO se re-ejecuta
```

**Solución:**

```typescript
export function usePublicFiles() {
  const { user } = useAuth(); // Puede ser null durante carga inicial

  return useQuery({
    queryKey: ["files", "public", user?.id ?? "anonymous"], // 👈 KEY cambia con user
    queryFn: async () => {
      // Fetch files...
    },
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
    retry: 2,
    retryDelay: 1000,
    enabled: true, // 👈 Siempre habilitado (archivos públicos)
    // Cuando user cambia de null → definido, queryKey cambia → refetch automático
  });
}
```

**Testing:**

- [ ] Cargar `/` sin login → debe mostrar archivos públicos
- [ ] Recargar `/` con login → debe mostrar archivos inmediatamente
- [ ] No debe haber loops infinitos

---

### 2.2 - `src/hooks/use-user-files.ts`

**Problema actual:**

```typescript
enabled: !!user?.id; // Se evalúa a false con user=null, nunca se re-ejecuta
```

**Solución:**

```typescript
export function useUserFiles() {
  const { user, loading } = useAuth(); // 👈 Necesitamos loading también

  return useQuery({
    queryKey: ["files", "user", user?.id], // 👈 KEY incluye user.id
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("No user ID"); // Esto fuerza a retry cuando user se define
      }

      const { data, error } = await supabase
        .from("archivos")
        .select("*")
        .eq("subido_por", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !loading, // 👈 Solo cuando terminó de cargar auth
    staleTime: 1000 * 60 * 5,
    retry: 3, // 👈 Más reintentos para manejar la transición null → user
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
}
```

**Testing:**

- [ ] Recargar `/perfil` estando logueado → debe mostrar archivos propios
- [ ] Sin archivos → debe mostrar mensaje "No has subido archivos"
- [ ] Error de red → debe reintentar automáticamente

---

### 2.3 - `src/hooks/use-materia-comision-profesor.ts`

**Problema actual:**

```typescript
// useMaterias y useComisiones se ejecutan antes de que user exista
// Cuando user se define, NO se re-ejecutan
```

**Solución:**

```typescript
export function useMaterias() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["materias", user?.id], // 👈 Incluir user en key
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materias")
        .select("id, nombre, codigo")
        .order("nombre");

      if (error) throw error;
      return data || [];
    },
    enabled: !loading, // 👈 Esperar a que auth termine
    staleTime: 1000 * 60 * 30, // 30 min (materias cambian poco)
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });
}

export function useComisiones() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["comisiones", user?.id], // 👈 Incluir user en key
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comisiones")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      return data || [];
    },
    enabled: !loading, // 👈 Esperar a que auth termine
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });
}
```

**Testing:**

- [ ] Recargar `/subir` → debe mostrar formulario completo con selectores
- [ ] Selectores deben tener opciones de materias y comisiones
- [ ] No debe quedar en loading infinito

---

## 🎨 FASE 3: Optimizar UX y Estados de Carga

**Prioridad: MEDIA** | **Tiempo estimado: 30 min**

### Objetivos:

- ✅ Mejorar feedback visual durante cargas
- ✅ Manejar estados vacíos correctamente
- ✅ Agregar skeletons en lugar de spinners genéricos

### 3.1 - `src/pages/Index.tsx`

**Mejorar manejo de estados:**

```typescript
const { data: files, isLoading, error, isRefetching } = usePublicFiles();

// Estado de carga inicial
if (isLoading) {
  return <FilesSkeletonLoader />;
}

// Error con retry
if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-red-500">Error cargando archivos</p>
      <Button onClick={() => refetch()}>Reintentar</Button>
    </div>
  );
}

// Estado vacío
if (!files || files.length === 0) {
  return <EmptyState message="No hay archivos disponibles" />;
}

// Datos cargados
return (
  <div>
    {isRefetching && <RefreshIndicator />}
    <FileGrid files={files} />
  </div>
);
```

### 3.2 - `src/pages/Perfil.tsx`

**Skeleton mientras carga:**

```typescript
const { data: userFiles, isLoading, error } = useUserFiles();

if (isLoading) {
  return <ProfileSkeletonLoader />; // Skeleton específico
}

if (error) {
  return <ErrorState error={error} />;
}

if (!userFiles?.length) {
  return (
    <EmptyState
      icon={<FileIcon />}
      title="Sin archivos"
      message="Aún no has subido ningún archivo"
      action={<Button to="/subir">Subir archivo</Button>}
    />
  );
}
```

### 3.3 - `src/pages/Subir.tsx`

**Mostrar form disabled mientras carga datos:**

```typescript
const { data: materias, isLoading: loadingMaterias } = useMaterias();
const { data: comisiones, isLoading: loadingComisiones } = useComisiones();

const isLoadingData = loadingMaterias || loadingComisiones;

return (
  <form>
    <Select disabled={isLoadingData}>
      {isLoadingData ? (
        <option>Cargando materias...</option>
      ) : (
        materias?.map(...)
      )}
    </Select>

    {isLoadingData && (
      <p className="text-sm text-muted-foreground">
        Cargando datos del formulario...
      </p>
    )}
  </form>
);
```

---

## ✅ Checklist Final de Testing

### Testing en Desarrollo:

- [ ] Recargar `/` logueado → archivos visibles <2s
- [ ] Recargar `/perfil` logueado → archivos propios visibles <2s
- [ ] Recargar `/subir` logueado → formulario completo <2s
- [ ] Login → redirección y datos visibles inmediatamente
- [ ] Logout → limpieza de caché y redirección

### Testing en Producción (antes de deploy final):

- [ ] Recargar en frío (Ctrl+Shift+R) en cada ruta
- [ ] Verificar en Network tab que no hay requests duplicados
- [ ] Verificar que no hay loops infinitos de queries
- [ ] Probar con throttling de red (Fast 3G)
- [ ] Probar en móvil real

---

## 📦 Orden de Implementación

### Día 1 - Fundamentos:

1. ✅ Implementar FASE 1 completa (AuthContext optimizado)
2. ✅ Testing básico de login/logout/recarga

### Día 2 - Queries:

3. ✅ Implementar FASE 2.1 (use-public-files)
4. ✅ Implementar FASE 2.2 (use-user-files)
5. ✅ Implementar FASE 2.3 (use-materia-comision-profesor)
6. ✅ Testing de recargas en todas las rutas

### Día 3 - Polish:

7. ✅ Implementar FASE 3 (skeletons y estados)
8. ✅ Testing completo en dev
9. ✅ Deploy a staging
10. ✅ Testing en producción
11. ✅ Deploy final

---

## 🚨 Rollback Plan

Si algo falla en producción:

1. **Inmediato**: Revertir a commit anterior con `git revert`
2. **Temporal**: Agregar flag `enabled: false` a queries problemáticas
3. **Debug**: Revisar logs de Supabase y console del navegador
4. **Fix**: Aplicar hotfix específico sin tocar otras partes

---

## 📝 Notas Adicionales

### Performance esperada después del fix:

- **Primera carga (sin caché)**: 1-2s
- **Recarga (con caché)**: <500ms (instantáneo)
- **Cambio de ruta**: <200ms

### Métricas a monitorear:

- Tiempo hasta First Contentful Paint (FCP)
- Tiempo hasta Interactive (TTI)
- Número de requests duplicados
- Rate de errores en queries

---

## 🎯 Criterios de Éxito

La implementación será exitosa cuando:

1. ✅ Al recargar `/` estando logueado, los archivos aparecen en <2s
2. ✅ Al recargar `/perfil`, los archivos propios aparecen en <2s
3. ✅ Al recargar `/subir`, el formulario está completo en <2s
4. ✅ No hay loops infinitos de "Cargando..."
5. ✅ El nombre del usuario aparece instantáneamente al recargar
6. ✅ No hay requests duplicados innecesarios
7. ✅ La experiencia es fluida tanto en primera carga como en recargas

---

**Última actualización**: 2026-02-06  
**Versión del plan**: 1.0  
**Estado**: Listo para implementación
