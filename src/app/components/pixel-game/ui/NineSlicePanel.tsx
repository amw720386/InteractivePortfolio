import { useRef, useEffect, useCallback, useState } from "react";
import type { NineSlice } from "../maps/uiPanelTileMap";

const SRC_TILE = 16; // source tile size in spritesheet

interface NineSlicePanelProps {
  /** The loaded tileset image */
  tileset: HTMLImageElement | null;
  /** 9-slice tile coordinates */
  slice: NineSlice;
  /** Rendered border thickness (scaled tile size) */
  borderSize?: number;
  /** Width of the panel. If omitted, uses 100% of parent via ResizeObserver. */
  width?: number;
  /** Height of the panel. If omitted, uses 100% of parent via ResizeObserver. */
  height?: number;
  /** Additional CSS class on the wrapper */
  className?: string;
  /** Children rendered on top of the 9-slice background */
  children?: React.ReactNode;
  /** Style overrides for the wrapper div */
  style?: React.CSSProperties;
}

export function NineSlicePanel({
  tileset,
  slice,
  borderSize = 12,
  width: propWidth,
  height: propHeight,
  className,
  children,
  style,
}: NineSlicePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [autoSize, setAutoSize] = useState({ w: 0, h: 0 });

  const w = propWidth ?? autoSize.w;
  const h = propHeight ?? autoSize.h;

  // Auto-size via ResizeObserver when no explicit dimensions
  useEffect(() => {
    if (propWidth !== undefined && propHeight !== undefined) return;
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: ew, height: eh } = entry.contentRect;
        setAutoSize({ w: Math.ceil(ew), h: Math.ceil(eh) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [propWidth, propHeight]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tileset || w === 0 || h === 0) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    // Clamp border so corners never overlap (prevents broken rendering on small panels)
    const B = Math.min(borderSize, Math.floor(w / 2), Math.floor(h / 2));
    const iw = w - B * 2;
    const ih = h - B * 2;

    const tile = (
      s: { col: number; row: number },
      dx: number,
      dy: number,
      dw: number,
      dh: number
    ) => {
      ctx.drawImage(
        tileset,
        s.col * SRC_TILE,
        s.row * SRC_TILE,
        SRC_TILE,
        SRC_TILE,
        dx,
        dy,
        dw,
        dh
      );
    };

    // Fill center
    for (let fy = 0; fy < ih; fy += B) {
      for (let fx = 0; fx < iw; fx += B) {
        tile(slice.C, B + fx, B + fy, Math.min(B, iw - fx), Math.min(B, ih - fy));
      }
    }
    // Top / bottom edges
    for (let fx = 0; fx < iw; fx += B) {
      const tw = Math.min(B, iw - fx);
      tile(slice.T, B + fx, 0, tw, B);
      tile(slice.B, B + fx, h - B, tw, B);
    }
    // Left / right edges
    for (let fy = 0; fy < ih; fy += B) {
      const th = Math.min(B, ih - fy);
      tile(slice.L, 0, B + fy, B, th);
      tile(slice.R, w - B, B + fy, B, th);
    }
    // Corners
    tile(slice.TL, 0, 0, B, B);
    tile(slice.TR, w - B, 0, B, B);
    tile(slice.BL, 0, h - B, B, B);
    tile(slice.BR, w - B, h - B, B, B);
  }, [tileset, slice, w, h, borderSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: w || "100%",
          height: h || "100%",
          imageRendering: "pixelated",
          pointerEvents: "none",
        }}
      />
      {/* Content sits above the canvas */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}