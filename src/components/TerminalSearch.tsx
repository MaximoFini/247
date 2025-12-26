import { Search } from "lucide-react";
import { useState } from "react";

interface TerminalSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const TerminalSearch = ({ onSearch, placeholder = "> buscar archivos..." }: TerminalSearchProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

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
        {/* Terminal prompt */}
        <span className="pl-6 font-mono text-xl text-primary">{">"}</span>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-6 font-mono text-xl text-primary placeholder:text-muted-foreground focus:outline-none"
        />
        
        {/* Blinking cursor when focused and empty */}
        {isFocused && query === "" && (
          <span className="absolute left-16 top-1/2 -translate-y-1/2 font-mono text-xl text-primary animate-cursor">
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
