import { useRef, useCallback, useEffect, useState, MutableRefObject } from "react";

interface MobileControlsProps {
  keysPressed: MutableRefObject<Set<string>>;
  onInteract: () => void;
  visible: boolean;
}

const JOYSTICK_SIZE = 120;
const KNOB_SIZE = 48;
const DEAD_ZONE = 12;

export function MobileControls({ keysPressed, onInteract, visible }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false); // shared flag for both touch and mouse
  const touchId = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const clearKeys = useCallback(() => {
    keysPressed.current.delete("w");
    keysPressed.current.delete("a");
    keysPressed.current.delete("s");
    keysPressed.current.delete("d");
    keysPressed.current.delete("arrowup");
    keysPressed.current.delete("arrowdown");
    keysPressed.current.delete("arrowleft");
    keysPressed.current.delete("arrowright");
  }, [keysPressed]);

  const updateKeys = useCallback((dx: number, dy: number) => {
    clearKeys();
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DEAD_ZONE) return;

    const angle = Math.atan2(dy, dx);
    if (angle > -Math.PI * 0.375 && angle < Math.PI * 0.375) {
      keysPressed.current.add("d");
    }
    if (angle > Math.PI * 0.625 || angle < -Math.PI * 0.625) {
      keysPressed.current.add("a");
    }
    if (angle > Math.PI * 0.125 && angle < Math.PI * 0.875) {
      keysPressed.current.add("s");
    }
    if (angle < -Math.PI * 0.125 && angle > -Math.PI * 0.875) {
      keysPressed.current.add("w");
    }
  }, [keysPressed, clearKeys]);

  // Shared helper: compute knob position & update keys from a clientX/Y
  const processPointer = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const maxR = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    setKnobPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });
    updateKeys(dx, dy);
  }, [updateKeys]);

  const initCenter = useCallback(() => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const resetJoystick = useCallback(() => {
    dragging.current = false;
    touchId.current = null;
    setKnobPos({ x: 0, y: 0 });
    clearKeys();
  }, [clearKeys]);

  // ── Touch events ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (dragging.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    dragging.current = true;
    touchId.current = touch.identifier;
    initCenter();
    processPointer(touch.clientX, touch.clientY);
  }, [initCenter, processPointer]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging.current || touchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId.current) {
          processPointer(touch.clientX, touch.clientY);
        }
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
          resetJoystick();
        }
      }
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [processPointer, resetJoystick]);

  // ── Mouse events (for DevTools testing) ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (dragging.current) return;
    dragging.current = true;
    touchId.current = null; // not a touch
    initCenter();
    processPointer(e.clientX, e.clientY);
  }, [initCenter, processPointer]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || touchId.current !== null) return; // only for mouse drags
      processPointer(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      if (!dragging.current || touchId.current !== null) return;
      resetJoystick();
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [processPointer, resetJoystick]);

  if (!visible) return null;

  return (
    <>
      {/* Joystick — bottom left */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
        style={{
          position: "fixed",
          bottom: 28,
          left: 28,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "2px solid rgba(255,255,255,0.25)",
          zIndex: 900,
          touchAction: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.4)",
            border: "2px solid rgba(255,255,255,0.6)",
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: dragging.current ? "none" : "transform 0.15s ease-out",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Interact button — bottom right */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          onInteract();
        }}
        onClick={(e) => {
          e.preventDefault();
          onInteract();
        }}
        style={{
          position: "fixed",
          bottom: 36,
          right: 36,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "2px solid rgba(255,255,255,0.35)",
          zIndex: 900,
          touchAction: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
          padding: 0,
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 700, fontFamily: "'PixelFont', monospace"}}>E</span>
      </button>
    </>
  );
}