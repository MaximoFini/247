/**
 * Utilidades de validación y sanitización de inputs
 * Previene payloads gigantes, inyecciones y entradas maliciosas
 */

// Límites de caracteres por tipo de campo
export const INPUT_LIMITS = {
  SEARCH: 150,        // Búsquedas generales
  NAME: 100,          // Nombres
  EMAIL: 254,         // Email (RFC 5321)
  ID: 50,             // IDs/códigos
  TEXT_SHORT: 200,    // Texto corto
  TEXT_LONG: 1000,    // Texto largo (descripciones)
} as const;

/**
 * Sanitiza un string de búsqueda:
 * - Limita longitud
 * - Elimina caracteres peligrosos para SQL/ILIKE
 * - Trim espacios
 */
// Función para eliminar caracteres de control (ASCII 0-31 y 127)
function removeControlChars(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Mantener solo caracteres imprimibles (32-126) y extendidos (>127)
    if (code >= 32 && code !== 127) {
      result += str[i];
    }
  }
  return result;
}

export function sanitizeSearchInput(
  input: string, 
  maxLength: number = INPUT_LIMITS.SEARCH
): string {
  if (!input || typeof input !== 'string') return '';
  
  return removeControlChars(
    input
      .trim()
      .slice(0, maxLength)
      // Escapar caracteres especiales de ILIKE/SQL
      .replace(/[%_\\]/g, '\\$&')
  );
}

/**
 * Sanitiza input para uso general (sin escape de ILIKE)
 */
export function sanitizeInput(
  input: string,
  maxLength: number = INPUT_LIMITS.TEXT_SHORT
): string {
  if (!input || typeof input !== 'string') return '';
  
  return removeControlChars(input.trim().slice(0, maxLength));
}

/**
 * Valida que un input no exceda el límite
 * Retorna objeto con estado de validación y mensaje
 */
export function validateInputLength(
  input: string,
  maxLength: number,
  fieldName: string = 'Campo'
): { valid: boolean; error: string | null } {
  if (!input) return { valid: true, error: null };
  
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} no puede exceder ${maxLength} caracteres`,
    };
  }
  
  return { valid: true, error: null };
}

/**
 * Valida formato de email básico
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= INPUT_LIMITS.EMAIL;
}

/**
 * Valida que un ID sea alfanumérico o UUID
 */
export function validateId(id: string): boolean {
  if (!id) return false;
  // Acepta UUIDs o IDs alfanuméricos
  const idRegex = /^[a-zA-Z0-9-_]+$/;
  return idRegex.test(id) && id.length <= INPUT_LIMITS.ID;
}

/**
 * Hook-friendly: valida y sanitiza input de búsqueda
 * Retorna el valor sanitizado o null si es inválido
 */
export function processSearchInput(
  input: string,
  maxLength: number = INPUT_LIMITS.SEARCH
): { value: string; isValid: boolean; error: string | null } {
  const sanitized = sanitizeSearchInput(input, maxLength);
  
  // Input muy largo (antes de sanitizar)
  if (input.length > maxLength * 2) {
    return {
      value: '',
      isValid: false,
      error: `Búsqueda demasiado larga. Máximo ${maxLength} caracteres.`,
    };
  }
  
  return {
    value: sanitized,
    isValid: true,
    error: null,
  };
}
