import { useEffect, useRef, useCallback, useState } from "react";
import { Linkedin, Github, Mail } from "lucide-react";
import { ASSET_URLS } from "../assets";

// 9-slice tile coordinates from the UI tileset (16x16 source tiles)
const T = 16;
const SCALE = 3;
const BORDER = T * SCALE; // 48px scaled border

const SLICE = {
  TL: { sx: 8 * T, sy: 0 * T },
  T:  { sx: 9 * T, sy: 0 * T },
  TR: { sx: 15 * T, sy: 0 * T },
  L:  { sx: 8 * T, sy: 1 * T },
  C:  { sx: 9 * T, sy: 1 * T },
  R:  { sx: 15 * T, sy: 1 * T },
  BL: { sx: 8 * T, sy: 8 * T },
  B:  { sx: 9 * T, sy: 8 * T },
  BR: { sx: 15 * T, sy: 8 * T },
};

// Dynamic sizing helper — kept in code for reusability, not exposed to user
export function computeModalSize(
  w: number,
  h: number,
  minW = BORDER * 5,
  minH = BORDER * 4
) {
  return {
    w: Math.max(minW, w),
    h: Math.max(minH, h),
  };
}

const FONT_FAMILY = "'PixelFont', monospace";

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameModal({ isOpen, onClose }: GameModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tilesetRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fixed size modal — centered
  const modalW = 420;
  const modalH = 280;
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const initialized = useRef(false);
  const [cursor, setCursor] = useState("grab");

  // Center on first open
  useEffect(() => {
    if (isOpen && !initialized.current) {
      setPos({
        x: Math.floor((window.innerWidth - modalW) / 2),
        y: Math.floor((window.innerHeight - modalH) / 2),
      });
      initialized.current = true;
    }
  }, [isOpen]);

  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = ASSET_URLS.uiTileset;
    img.onload = () => { tilesetRef.current = img; setLoaded(true); };
  }, []);

  // Draw 9-slice border
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ts = tilesetRef.current;
    if (!canvas || !ts || !loaded) return;

    canvas.width = modalW;
    canvas.height = modalH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, modalW, modalH);

    const tile = (key: keyof typeof SLICE, dx: number, dy: number, dw: number, dh: number) => {
      const { sx, sy } = SLICE[key];
      ctx.drawImage(ts, sx, sy, T, T, dx, dy, dw, dh);
    };

    const iw = modalW - BORDER * 2;
    const ih = modalH - BORDER * 2;

    // Center fill
    for (let fy = 0; fy < ih; fy += BORDER) {
      for (let fx = 0; fx < iw; fx += BORDER) {
        tile("C", BORDER + fx, BORDER + fy, Math.min(BORDER, iw - fx), Math.min(BORDER, ih - fy));
      }
    }
    // Top & bottom edges
    for (let fx = 0; fx < iw; fx += BORDER) {
      const tw = Math.min(BORDER, iw - fx);
      tile("T", BORDER + fx, 0, tw, BORDER);
      tile("B", BORDER + fx, modalH - BORDER, tw, BORDER);
    }
    // Left & right edges
    for (let fy = 0; fy < ih; fy += BORDER) {
      const th = Math.min(BORDER, ih - fy);
      tile("L", 0, BORDER + fy, BORDER, th);
      tile("R", modalW - BORDER, BORDER + fy, BORDER, th);
    }
    // Corners
    tile("TL", 0, 0, BORDER, BORDER);
    tile("TR", modalW - BORDER, 0, BORDER, BORDER);
    tile("BL", 0, modalH - BORDER, BORDER, BORDER);
    tile("BR", modalW - BORDER, modalH - BORDER, BORDER, BORDER);
  }, [loaded]);

  useEffect(() => { if (isOpen) draw(); }, [isOpen, draw]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, onClose]);

  // Dragging — move only (resize logic retained in computeModalSize for future use)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    setCursor("grabbing");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragging.current = true;
    dragStart.current = { mx: touch.clientX, my: touch.clientY, px: pos.x, py: pos.y };
  };

  useEffect(() => {
    if (!isOpen) return;

    const onMove = (cx: number, cy: number) => {
      if (!dragging.current) return;
      setPos({
        x: dragStart.current.px + (cx - dragStart.current.mx),
        y: dragStart.current.py + (cy - dragStart.current.my),
      });
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleUp = () => { dragging.current = false; setCursor("grab"); };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isOpen, pos]);

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          zIndex: 998,
          cursor: "pointer",
        }}
      />
      {/* Modal */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: modalW,
          height: modalH,
          zIndex: 999,
          cursor,
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* 9-slice canvas background */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: modalW,
            height: modalH,
            imageRendering: "pixelated",
          }}
        />
        {/* Content overlay */}
        <div
          style={{
            position: "absolute",
            left: BORDER,
            top: BORDER,
            right: BORDER,
            bottom: BORDER,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            pointerEvents: "auto",
          }}
        >
          {/* Title text */}
          <p
            style={{
              fontFamily: FONT_FAMILY,
              color: "#ffffff",
              fontSize: 16,
              textAlign: "center",
              margin: 0,
              lineHeight: 1.4,
              textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
            }}
          >
            Contact me or check out<br />what I&apos;m up to!
          </p>

          {/* Social icons */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <a
              href="https://linkedin.com/in/ahamed-wajibu"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 8,
                transition: "transform 0.15s, background 0.15s",
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
            >
              <Linkedin size={28} />
            </a>

            <a
              href="https://github.com/amw720386"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 8,
                transition: "transform 0.15s, background 0.15s",
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
            >
              <Github size={28} />
            </a>

            <a
              href="mailto:ahamedw2006@gmail.com"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 8,
                transition: "transform 0.15s, background 0.15s",
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
            >
              <Mail size={28} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}