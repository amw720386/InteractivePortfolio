import { useEffect, useState } from "react";

interface LoadingScreenProps {
  loaded: boolean;
}

export function LoadingScreen({ loaded }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (loaded) {
      // Small delay then fade out
      const t1 = setTimeout(() => setFadeOut(true), 200);
      const t2 = setTimeout(() => setVisible(false), 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [loaded]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0a0a12",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        transition: "opacity 0.5s ease-out",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Pixel art loading animation */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#8bc34a",
              imageRendering: "pixelated" as const,
              animation: `pixelBounce 1s ${i * 0.15}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontFamily: "'PixelFont', monospace",
          color: "rgba(255,255,255,0.7)",
          fontSize: 16,
          margin: 0,
          letterSpacing: 2,
        }}
      >
        Loading...
      </p>

      <style>{`
        @keyframes pixelBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-16px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
