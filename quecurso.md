# Especificación: Módulo "¿Qué Curso?" para 247

## 1. Contexto General

### 1.1 Ubicación en la Aplicación

- **Ruta**: `/quecurso?`
- **Posición en navbar**: A la izquierda del módulo "Profesores"
- **Accesibilidad**: Público (con funcionalidades limitadas para usuarios no registrados)

---

## 2. Funcionalidades Principales

### 2.1 Visualización de Progreso Académico

El módulo debe mostrar:

1. **Progreso de Materias Obligatorias**
   - Total: 36 materias
   - Formato: `X/36 (Y%)`
   - Ejemplo: `18/36 (50%)`

2. **Progreso de Electivas**
   - Sistema de puntos: debe sumar 20 puntos
   - Electivas regulares (ID >= 50): 3 puntos cada una
   - Excepción - BDA de 3er año: 4 puntos
   - Formato: `X/20 puntos`
   - Ejemplo: `12/20 puntos`

### 2.2 Organización de Materias

Las materias deben mostrarse **desglosadas por año**, siguiendo exactamente la estructura del archivo `iuquecurso.html`:

- Año por año (1º a 5º)
- Indicación clara de cuáles son electivas en cada año
- Identificación visual de electivas vs obligatorias

---

## 3. Modelo de Datos

### 3.1 Estructura JSON de Materia

```json
{
  "id": <number>,
  "apodo": "<string>",
  "nombre": "<string>",
  "estado": <0|1|2|3>,
  "creditos": <number>,
  "materiasQueActualiza": [<array de IDs>],
  "materiasQueNecesitaRegulares": [<array de IDs>],
  "materiasQueNecesitaAprobadas": [<array de IDs>]
}
```

**Campos:**

- `id`: Identificador único
- `apodo`: Nombre corto/común (ej: "AM1", "AGA")
- `nombre`: Nombre completo
- `estado`:
  - `0` = Regular
  - `1` = Aprobada
  - `2` = Bloqueado
  - `3` = Cursable
- `creditos`: Puntos que otorga (para electivas)
- `materiasQueActualiza`: IDs de materias que se desbloquean cuando esta se aprueba/regulariza
- `materiasQueNecesitaRegulares`: IDs de materias que deben estar regulares como mínimo
- `materiasQueNecesitaAprobadas`: IDs de materias que deben estar aprobadas

### 3.2 Archivo de Configuración

**Archivo**: `plan_estudios_modificado.json`

Este archivo contiene todas las materias con sus dependencias y debe utilizarse como fuente de verdad para:

- Validar relaciones entre materias
- Determinar qué materias se desbloquean
- Calcular estados permitidos

---

## 4. Base de Datos

### 4.1 Tabla: `materias_usuario`

> ⚠️ **IMPORTANTE**: Ajustar según el motor de BD utilizado

```
Tenes que crear el codigo SQL que luego pegare en Supabase, asi que crealo y damelo al final de la implementacion
```

### 4.2 Consideraciones de BD

1. **Inicialización de datos**:
   - Cuando un usuario se registra o accede por primera vez al módulo, crear registros para las 36 materias
   - Materias ID 1-8 y 11: estado inicial = 3 (Cursable)
   - Resto: estado inicial = 2 (Bloqueado)

2. **Query de inicialización** (ejemplo):

```
Tenes que hacer la query y darmela para que copìe y pegue en supabase
```

3. **Migración para usuarios existentes**:
   > ⚠️ **DEFINIR**: ¿Qué hacer con usuarios que ya están registrados?
   >
   > - Opción A: Migración automática con todas las materias bloqueadas

---

## 5. Lógica del Cliente

### 5.1 Estados de Materias

Cada materia puede tener **4 estados** visuales:

| Estado        | Valor | Descripción                           | Representación Visual                          |
| ------------- | ----- | ------------------------------------- | ---------------------------------------------- |
| **Aprobada**  | 1     | Materia completamente aprobada        | ✅ (definir color/icono según iuquecurso.html) |
| **Regular**   | 0     | Materia regularizada pero no aprobada | 📝 (definir color/icono según iuquecurso.html) |
| **Cursable**  | 3     | Cumple requisitos para cursarla       | 🟢 (definir color/icono según iuquecurso.html) |
| **Bloqueada** | 2     | No cumple requisitos                  | 🔒 (definir color/icono según iuquecurso.html) |

### 5.2 Interacciones del Usuario

**Sobre materias Cursables, Regulares o Aprobadas:**

1. **Un click** → Cambia a "Aprobada" (estado = 1)
2. **Dos clicks** (o segundo click si ya está aprobada) → Cambia a "Regular" (estado = 0)
3. **Tres clicks** (o tercer click) → Vuelve a estado inicial calculado

> ⚠️ **ACLARAR**:
>
> - Si hace click en una materia Bloqueada no pasa nada nada
> - ¿Debe haber un botón de "Reset" o "Limpiar progreso"? No

### 5.3 Lógica de Desbloqueo

Basada en el archivo `plan_estudios_modificado.json`:

**Ejemplo:**

```javascript
// Si AM1 (id=1) y AGA (id=2) están regulares (estado >= 0)
// Entonces AM2 (id=X) pasa de Bloqueada (2) a Cursable (3)

function actualizarEstadoMaterias(materiaModificada) {
  // 1. Obtener datos de plan_estudios_modificado.json
  // 2. Verificar materiasQueActualiza de la materia modificada
  // 3. Para cada materia en materiasQueActualiza:
  //    - Verificar si cumple requisitos (materiasQueNecesitaRegulares/Aprobadas)
  //    - Si cumple: cambiar de Bloqueada a Cursable
  //    - Si NO cumple: cambiar de Cursable a Bloqueada
}
```

**Reglas de validación:**

- Una materia solo puede estar "Cursable" si cumple TODAS las dependencias
- `materiasQueNecesitaRegulares`: estado >= 0 (Regular o Aprobada)
- `materiasQueNecesitaAprobadas`: estado = 1 (solo Aprobada)

### 5.4 Usuarios No Registrados

**Comportamiento:**

1. El usuario **puede ver** toda la interfaz completa
2. El usuario **puede interactuar** y cambiar estados localmente (sin persistencia)
3. **Al intentar guardar** (cualquier modificación de estado/o clic sobre materia):
   - Mostrar pop-up modal
   - Mensaje: "Debes registrarte para guardar tu progreso académico"
   - Incluir formulario de registro/inicio de sesión (mismo que el resto de la página)
   - Opciones: "Registrarse", "Iniciar Sesión", "Cancelar"

> ⚠️ **ACLARAR**:
>
> - ¿Los cambios locales se pierden al recargar la página? Si, por que no se hace ningun cambio antes de registrarse o iniciar sesion
> - ¿Usar localStorage para persistencia temporal? No, todo a la bd una vez que el usuario se registre.

### 5.5 Usuarios Registrados

**Comportamiento:**

1. Al cargar la página:
   - Hacer request GET a `/api/materias/progreso` (o endpoint similar)
   - Cargar estados desde la BD
2. Al cambiar estado de una materia:
   - Actualizar UI inmediatamente (optimistic update)
   - Hacer request PATCH/PUT a `/api/materias/{id}` con nuevo estado
   - Si falla: revertir cambio y mostrar error

**Endpoints sugeridos:**

```
GET    /api/materias/progreso          → Obtener estado de todas las materias del usuario
PATCH  /api/materias/:id/estado        → Actualizar estado de una materia
POST   /api/materias/reset             → Resetear todo el progreso (opcional)
```

---

## 6. Estilos y Diseño

### 6.1 Referencia de Estilos

**Fuente**: `iuquecurso.html`

> ⚠️ **CRÍTICO**: Los estilos deben extraerse **EXACTAMENTE** como están en el archivo original.

**Aspectos a replicar:**

- Colores para cada estado de materia
- Tipografía y tamaños de fuente
- Espaciados y márgenes
- Diseño responsive (mobile, tablet, desktop)
- Animaciones o transiciones (si existen)
- Layout de las tarjetas de materias
- Indicadores visuales de electivas

---

## 7. Casos Edge y Validaciones

### 7.1 Casos a Manejar

4. **Concurrencia**
   - Solución sugerida: Timestamp de última modificación + conflict resolution

### 7.2 Validaciones Backend

```javascript
// Pseudocódigo de validación
function validarCambioEstado(userId, materiaId, nuevoEstado) {
  // 1. Verificar que el usuario existe
  // 2. Verificar que la materia existe
  // 3. Si nuevoEstado = Aprobada o Regular:
  //    - Verificar que cumple requisitos
  // 4. Guardar en BD
  // 5. Recalcular estados de materias dependientes
  // 6. Retornar estados actualizados
}
```

---

## 10. Plan de Implementación Sugerido

### Fase 1: Setup Base

1. Crear tabla `materias_usuario` en BD
2. Crear endpoints API básicos
3. Integrar ruta `/quecurso?` en navbar

### Fase 2: Lógica Core

4. Implementar cálculo de estados de materias
5. Cargar y parsear `plan_estudios_modificado.json`
6. Desarrollar sistema de validación de dependencias

### Fase 3: Frontend

7. Extraer estilos de `iuquecurso.html`
8. Implementar UI de materias por año
9. Agregar interacción de clicks

### Fase 4: Integración

10. Conectar frontend con API
11. Implementar modal de registro/login
12. Sistema de guardado automático para usuarios registrados

### Fase 5: Testing y Pulido

13. Validar casos edge
14. Testing de dependencias complejas
15. Optimización de rendimiento
16. Responsive design

---
