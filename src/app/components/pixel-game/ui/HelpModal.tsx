import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const FONT_HEADING = "'Space Grotesk', sans-serif";
const FONT_BODY = "'Inter', sans-serif";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(380px, 90vw)",
              borderRadius: 20,
              overflow: "hidden",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              boxShadow:
                "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Close button */}
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              <X size={16} />
            </motion.button>

            <div style={{ padding: "28px 28px 24px" }}>
              {/* Title */}
              <h2
                style={{
                  fontFamily: FONT_HEADING,
                  color: "#fff",
                  margin: "0 0 20px 0",
                  fontSize: 20,
                  letterSpacing: "-0.02em",
                }}
              >
                How to Play
              </h2>

              {/* Controls list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <ControlRow
                  keys={["W", "A", "S", "D"]}
                  altKeys={["\u2191", "\u2190", "\u2193", "\u2192"]}
                  description="Move around"
                />
                <ControlRow
                  keys={["E"]}
                  description="Interact with objects"
                />
                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.08)",
                    margin: "2px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    <span role="img" aria-label="phone">
                      {"\ud83d\udcf1"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    On mobile, use the{" "}
                    <span style={{ color: "rgba(255,255,255,0.85)" }}>
                      joystick
                    </span>{" "}
                    to move and the{" "}
                    <span style={{ color: "rgba(255,255,255,0.85)" }}>
                      interact button
                    </span>{" "}
                    to interact
                  </span>
                </div>
              </div>

              {/* Tip */}
              <div
                style={{
                  marginTop: 18,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  style={{
                    fontFamily: FONT_BODY,
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 12,
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Tip:
                  </span>{" "}
                  Look for the{" "}
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    E
                  </span>{" "}
                  indicator above objects to find things you can interact
                  with. Explore the world to discover projects, NPCs, and
                  more!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ControlRow({
  keys,
  altKeys,
  description,
}: {
  keys: string[];
  altKeys?: string[];
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {keys.map((key) => (
          <KeyCap key={key} label={key} />
        ))}
        {altKeys && (
          <>
            <span
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 12,
                margin: "0 2px",
                alignSelf: "center",
              }}
            >
              /
            </span>
            {altKeys.map((key) => (
              <KeyCap key={key} label={key} />
            ))}
          </>
        )}
      </div>
      <span
        style={{
          fontFamily: FONT_BODY,
          color: "rgba(255,255,255,0.5)",
          fontSize: 13,
        }}
      >
        {description}
      </span>
    </div>
  );
}

function KeyCap({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 28,
        height: 28,
        padding: "0 6px",
        borderRadius: 7,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        fontFamily: FONT_BODY,
        color: "rgba(255,255,255,0.8)",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}
