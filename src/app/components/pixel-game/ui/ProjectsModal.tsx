import { useEffect, useState, useRef } from "react";
import { PROJECTS, type Project } from "../data/projects";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, CheckCircle, Clock } from "lucide-react";

// ── Styles ───────────────────────────────────────────────────
const FONT_HEADING = "'Space Grotesk', sans-serif";
const FONT_BODY = "'Inter', sans-serif";

// ── Project Card ─────────────────────────────────────────────

function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (project.githubUrl) {
          window.open(project.githubUrl, "_blank", "noopener,noreferrer");
        }
      }}
      style={{
        cursor: project.githubUrl ? "pointer" : "default",
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
        breakInside: "avoid" as const,
        marginBottom: 16,
      }}
    >
      {/* Cover image */}
      {project.imageUrl && (
        <div
          style={{
            height: project.size === "tall" ? 160 : 120,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            src={project.imageUrl}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: hovered ? "brightness(1.1) saturate(1.1)" : "brightness(0.8)",
              transition: "filter 0.4s ease, transform 0.4s ease",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(15,15,20,0.9) 0%, transparent 60%)",
            }}
          />
          {/* Status badge */}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontFamily: FONT_BODY,
              fontWeight: 500,
              letterSpacing: 0.3,
              background:
                project.status === "complete"
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(251,191,36,0.15)",
              color:
                project.status === "complete"
                  ? "rgb(134,239,172)"
                  : "rgb(253,224,71)",
              border: `1px solid ${
                project.status === "complete"
                  ? "rgba(34,197,94,0.25)"
                  : "rgba(251,191,36,0.25)"
              }`,
              backdropFilter: "blur(8px)",
            }}
          >
            {project.status === "complete" ? (
              <CheckCircle size={12} />
            ) : (
              <Clock size={12} />
            )}
            {project.status === "complete" ? "Complete" : "In Progress"}
          </div>
          {/* Link icon */}
          {project.githubUrl && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: hovered ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              <ExternalLink size={14} color="rgba(255,255,255,0.8)" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Title */}
        <h3
          style={{
            fontFamily: FONT_HEADING,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 4px",
            letterSpacing: -0.3,
          }}
        >
          {project.title}
        </h3>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: FONT_BODY,
            color: "rgba(255,255,255,0.45)",
            fontSize: 12,
            margin: "0 0 12px",
            fontWeight: 400,
          }}
        >
          {project.subtitle}
        </p>

        {/* Tech tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {project.tech.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(255,255,255,0.6)",
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                letterSpacing: 0.2,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: FONT_BODY,
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 300,
          }}
        >
          {project.description}
        </p>
      </div>
    </motion.div>
  );
}

// ── Modal ────────────────────────────────────────────────────

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectsModal({ isOpen, onClose }: ProjectsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const check = () => setCompact(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              zIndex: 998,
              cursor: "pointer",
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: compact ? 8 : 32,
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
              borderRadius: compact ? 20 : 24,
              overflow: "hidden",
              background:
                "linear-gradient(145deg, rgba(18,28,22,0.95) 0%, rgba(10,18,12,0.98) 100%)",
              border: "1px solid rgba(134,239,172,0.08)",
              boxShadow:
                "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(134,239,172,0.05), inset 0 1px 0 rgba(134,239,172,0.08)",
            }}
          >
            {/* Header bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: compact ? "16px 20px" : "20px 28px",
                borderBottom: "1px solid rgba(134,239,172,0.08)",
                flexShrink: 0,
                background: "rgba(134,239,172,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <h2
                    style={{
                      fontFamily: FONT_HEADING,
                      color: "#fff",
                      fontSize: compact ? 18 : 22,
                      fontWeight: 700,
                      margin: 0,
                      letterSpacing: -0.5,
                    }}
                  >
                    Projects
                  </h2>
                  <p
                    style={{
                      fontFamily: FONT_BODY,
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 12,
                      margin: 0,
                      fontWeight: 400,
                    }}
                  >
                    {PROJECTS.length} projects
                  </p>
                </div>
              </div>

              {/* Close button */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(134,239,172,0.06)",
                  border: "1px solid rgba(134,239,172,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(239,68,68,0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(239,68,68,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(134,239,172,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(134,239,172,0.1)";
                }}
              >
                <X size={16} color="rgba(255,255,255,0.6)" />
              </motion.div>
            </div>

            {/* Scrollable content */}
            <div
              ref={scrollRef}
              data-no-drag
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: compact ? "16px 16px 24px" : "24px 28px 32px",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(134,239,172,0.12) transparent",
              }}
            >
              {/* Masonry columns */}
              <div
                style={{
                  columns: compact ? 1 : 2,
                  columnGap: 16,
                }}
              >
                {PROJECTS.map((project, i) => (
                  <ProjectCard key={project.title} project={project} index={i} />
                ))}
              </div>
            </div>

            {/* Bottom glow */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                background:
                  "linear-gradient(to top, rgba(10,18,12,0.95), transparent)",
                pointerEvents: "none",
                borderRadius: "0 0 24px 24px",
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}