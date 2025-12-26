import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-primary bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="font-brutal text-2xl text-primary glitch-hover"
          >
            247
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className={`font-mono text-sm uppercase tracking-widest transition-all hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              EXPLORAR
            </Link>
            <Link
              to="/subir"
              className={`font-mono text-sm uppercase tracking-widest transition-all hover:text-primary ${
                isActive("/subir") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              SUBIR
            </Link>
            <button className="border-2 border-primary bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground glitch-hover">
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
