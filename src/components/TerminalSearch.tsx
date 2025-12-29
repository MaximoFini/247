import { Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface TerminalSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const TerminalSearch = ({ onSearch }: TerminalSearchProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { user, dbUser } = useAuth();

  // Generar nombre de usuario: todo junto y en minúsculas
  const getUserName = () => {
    if (!user) return "gorreado/a/e";

    // Usar el nombre del dbUser si existe
    if (dbUser?.nombre) {
      return dbUser.nombre.toLowerCase().replace(/\s+/g, "");
    }

    // Fallback al email antes del @
    return user.email?.split("@")[0]?.toLowerCase() || "gorreado/a/e";
  };

  const username = getUserName();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`relative flex items-center border-4 border-primary bg-background transition-all ${
          isFocused ? "toxic-glow-intense border-flash" : "toxic-glow"
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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          className="flex-1 bg-transparent px-4 py-6 font-mono text-xl text-primary placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Blinking cursor when focused and empty */}
        {isFocused && query === "" && (
          <span className="font-mono text-xl text-primary animate-cursor">
            _
          </span>
        )}

        <button
          type="submit"
          className="flex h-full items-center gap-2 border-l-4 border-primary bg-primary px-8 py-6 font-mono text-sm uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/80 glitch-hover"
        >
          <Search className="h-5 w-5" />
          BUSCAR
        </button>
      </div>
    </form>
  );
};

export default TerminalSearch;
