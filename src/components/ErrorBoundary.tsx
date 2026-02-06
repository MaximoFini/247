import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-lg w-full border-2 border-[#ff3366] bg-[#ff3366]/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#ff3366] text-3xl">
                error
              </span>
              <h2 className="font-brutal text-2xl text-[#ff3366] uppercase">
                ERROR CRÍTICO
              </h2>
            </div>

            <p className="font-mono text-sm text-gray-300 mb-4">
              Algo salió mal al cargar la aplicación.
            </p>

            <div className="bg-black/50 border border-[#ff3366]/30 p-4 mb-6 font-mono text-xs text-gray-400 overflow-auto max-h-40">
              <pre className="whitespace-pre-wrap break-words">
                {this.state.error.toString()}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.resetError}
                className="flex-1 border-2 border-primary bg-primary px-4 py-2 font-mono text-sm uppercase text-primary-foreground hover:bg-transparent hover:text-primary transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 border-2 border-gray-700 bg-transparent px-4 py-2 font-mono text-sm uppercase text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                Recargar Página
              </button>
            </div>

            <p className="font-mono text-xs text-gray-500 mt-4 text-center">
              Si el problema persiste, contacta al soporte técnico.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
