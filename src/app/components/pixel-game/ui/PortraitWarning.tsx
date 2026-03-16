import { useEffect, useState } from "react";

export function PortraitWarning() {
  const [show, setShow] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Check portrait on mount — use a small delay so layout is settled
    const checkPortrait = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = h > w && w < 900; // portrait + reasonably small = mobile
      if (isPortrait) {
        setShow(true);
        setOpacity(1);
        // Start fading out after 1.5s
        const t1 = setTimeout(() => setOpacity(0), 1500);
        // Remove from DOM after fade completes
        const t2 = setTimeout(() => setShow(false), 2200);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    };

    // Delay the check slightly so the browser has time to settle dimensions
    const t = setTimeout(checkPortrait, 100);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000000",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        transition: "opacity 0.6s ease-out",
        opacity,
      }}
    >
      {/* Rotate phone SVG */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Phone body */}
        <rect
          x="22"
          y="10"
          width="36"
          height="60"
          rx="6"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
        {/* Screen */}
        <rect
          x="26"
          y="18"
          width="28"
          height="44"
          rx="2"
          fill="rgba(255,255,255,0.15)"
        />
        {/* Home button indicator */}
        <circle cx="40" cy="66" r="2" fill="rgba(255,255,255,0.5)" />
        {/* Rotation arrow */}
        <path
          d="M62 30 C 70 30, 70 50, 62 50"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <polygon points="60,48 66,52 62,44" fill="white" />
      </svg>

      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 14,
          fontFamily: "'PixelFont', monospace",
          textAlign: "center",
          margin: 0,
          padding: "0 32px",
        }}
      >
        Rotate your device for<br />a better experience
      </p>
    </div>
  );
}
