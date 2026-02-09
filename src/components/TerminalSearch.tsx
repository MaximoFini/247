import { Search, Loader2, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { INPUT_LIMITS, processSearchInput } from "@/lib/validation";

interface TerminalSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isSearching?: boolean;
}

const MAX_SEARCH_LENGTH = INPUT_LIMITS.SEARCH;

const TerminalSearch = ({
  onSearch,
  isSearching = false,
}: TerminalSearchProps) => {
  const [query, setQuery] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { user, dbUser } = useAuth();

  // Generar nombre de usuario: todo junto y en minúsculas
  const getUserName = () => {
    if (!user) return "gorreado/a";

    // Usar el nombre del dbUser si existe
    if (dbUser?.nombre) {
      return dbUser.nombre.toLowerCase().replace(/\s+/g, "");
    }

    // Fallback al email antes del @
    return user.email?.split("@")[0]?.toLowerCase() || "gorreado/a";
  };

  const username = getUserName();

  // Llamar onSearch con validación
  const handleChange = useCallback(
    (value: string) => {
      // Validar y sanitizar input
      const {
        value: sanitized,
        isValid,
        error,
      } = processSearchInput(value, MAX_SEARCH_LENGTH);

      if (!isValid) {
        setValidationError(error);
        return;
      }

      setValidationError(null);
      setQuery(value.slice(0, MAX_SEARCH_LENGTH)); // Mostrar lo que escribió (limitado)
      onSearch(sanitized); // Enviar sanitizado
    },
    [onSearch],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`relative flex items-center border-4 border-primary bg-background transition-all ${
          validationError
            ? "border-destructive"
            : isFocused
              ? "toxic-glow-intense border-flash"
              : "toxic-glow"
        }`}
      >
        {/* Terminal prompt: username $ find */}
        <span className="pl-6 font-mono text-xl text-primary whitespace-nowrap">
          <span className="text-primary/70">{username}</span>
          <span className="text-muted-foreground"> $ </span>
          <span className="text-primary">find</span>
        </span>

        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          maxLength={MAX_SEARCH_LENGTH}
          className="flex-1 bg-transparent px-4 py-6 font-mono text-xl text-primary placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Blinking cursor when focused and empty */}
        {isFocused && query === "" && (
          <span className="font-mono text-xl text-primary animate-cursor">
            _
          </span>
        )}

        {/* Indicador de búsqueda en progreso */}
        <div className="flex h-full items-center gap-2 border-l-4 border-primary bg-primary px-8 py-6 font-mono text-sm uppercase tracking-widest text-primary-foreground">
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          {isSearching ? "BUSCANDO..." : "BUSCAR"}
        </div>
      </div>

      {/* Mensaje de error de validación */}
      {validationError && (
        <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-destructive/10 border border-destructive text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">{validationError}</span>
        </div>
      )}

      {/* Contador de caracteres cuando se acerca al límite */}
      {query.length > MAX_SEARCH_LENGTH * 0.8 && (
        <div className="text-right mt-1">
          <span
            className={`font-mono text-xs ${
              query.length >= MAX_SEARCH_LENGTH
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {query.length}/{MAX_SEARCH_LENGTH}
          </span>
        </div>
      )}
    </form>
  );
};

export default TerminalSearch;
