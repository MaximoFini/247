import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

const UTNFollower = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [started, setStarted] = useState(false);
  const [enabled, setEnabled] = useState(() => storage.getUTNFollowerEnabled());
  const [imgLoaded, setImgLoaded] = useState(false);

  // Try to preload image from public root '/manteca.png'
  useEffect(() => {
    const img = new Image();
    // Prefer SVG (the uploaded logo), fallback to PNG
    img.src = "/manteca.png";
    img.onload = () => setImgLoaded(true);
    img.onerror = () => {
      const img2 = new Image();
      img2.src = "/manteca.png";
      img2.onload = () => setImgLoaded(true);
      img2.onerror = () => setImgLoaded(false);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTargetPosition({ x: e.clientX, y: e.clientY });
      // if not started, start movement after a small delay
      if (!started) {
        setTimeout(() => setStarted(true), 500); // 0.5s delay before it starts following
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [started]);

  useEffect(() => {
    if (!started || !enabled) return;
    // smoother, slower interpolation once started
    const factor = 0.12; // lower factor = smoother/slower
    const intervalMs = 16; // smaller interval for smoother animation
    const interval = setInterval(() => {
      setPosition((prev) => ({
        x: prev.x + (targetPosition.x - prev.x) * factor,
        y: prev.y + (targetPosition.y - prev.y) * factor,
      }));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [started, targetPosition, enabled]);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    storage.setUTNFollowerEnabled(next);
  };

  if (!enabled) {
    return (
      <div>
        <button
          onClick={toggleEnabled}
          className="fixed bottom-6 right-6 z-50 rounded border-2 border-primary bg-background/80 px-4 py-2 font-mono text-sm text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Activar Alonso
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {imgLoaded ? (
          <img
            src="/manteca.png"
            alt="UTN"
            width={40}
            height={40}
            className="drop-shadow-lg opacity-90 select-none"
            style={{ transform: "translate3d(0,0,0)" }}
            onError={(e) => {
              // switch to svg if png fails to render
              (e.target as HTMLImageElement).src = "/manteca.png";
            }}
          />
        ) : (
          <svg
            width="60"
            height="60"
            viewBox="0 0 100 100"
            className="drop-shadow-lg opacity-70"
          >
            <rect x="10" y="10" width="80" height="80" fill="#003DA5" rx="5" />
            <text
              x="50"
              y="45"
              fontSize="24"
              fontWeight="bold"
              fill="white"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
            >
              UTN
            </text>
            <text
              x="40"
              y="60"
              fontSize="11"
              fill="white"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
            >
              FRA
            </text>
          </svg>
        )}
      </div>

      <button
        onClick={toggleEnabled}
        className="fixed bottom-6 right-6 z-50 rounded border-2 border-primary bg-background/80 px-4 py-2 font-mono text-sm text-primary hover:bg-primary hover:text-primary-foreground"
      >
        Desactivar Alonso
      </button>
    </>
  );
};

export default UTNFollower;
