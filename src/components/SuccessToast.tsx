/**
 * Toast de confirmación - Popup de éxito
 * Se muestra temporalmente y desaparece automáticamente
 */

import { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface SuccessToastProps {
  message: string;
  onClose: () => void;
  duration?: number; // milisegundos
}

export function SuccessToast({
  message,
  onClose,
  duration = 3000,
}: SuccessToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-3 border-2 border-primary bg-primary/10 p-4 shadow-lg backdrop-blur-sm toxic-glow max-w-md">
        <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
        <p className="font-mono text-sm text-primary flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-primary hover:text-primary/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
