/**
 * PROJECT DATA
 * ============
 * Add new projects here — the modal UI pulls from this array automatically.
 *
 * Fields:
 *   title        – Project name
 *   subtitle     – One-liner tagline
 *   tech         – Array of technology tags
 *   description  – Technical description (rendered in the card)
 *   imageUrl     – Cover image URL (use Unsplash or your own)
 *   githubUrl    – Direct link opened on card click
 *   status       – "complete" | "in-progress"  (in-progress cards get a badge)
 *   size         – "normal" | "tall"  (tall cards span more vertical space)
 */

export interface Project {
  title: string;
  subtitle: string;
  tech: string[];
  description: string;
  imageUrl: string;
  githubUrl: string;
  status: "complete" | "in-progress";
  size: "normal" | "tall";
}

export const PROJECTS: Project[] = [
  // ── Completed ──────────────────────────────────────────────
  {
    title: "Pixel Portfolio",
    subtitle: "2D Game-Based Developer Portfolio",
    tech: ["React", "TypeScript", "Canvas API", "Tile Rendering", "Sprite Animation"],
    description:
      "Full-screen 2D pixel-art portfolio built entirely on the HTML5 Canvas API within React. Features an 80×60 procedurally generated tile map with four themed biomes, real-time camera tracking, sprite-based character animation with 4-directional movement, autonomous animal AI with water/fence-aware pathfinding, interior teleportation systems, 9-slice UI rendering from spritesheets, and a dialogue bubble system with live entity tracking. Includes mobile-responsive virtual joystick controls, dynamic tile scaling, and custom pixel font loading via the FontFace API.",
    imageUrl:
      "https://images.unsplash.com/photo-1759171052927-83f3b3a72b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXhlbCUyMGFydCUyMHJldHJvJTIwZ2FtZXxlbnwxfHx8fDE3NzM2MTUyOTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    githubUrl: "https://github.com/amw720386",
    status: "complete",
    size: "tall",
  },
  {
    title: "CookedTofu",
    subtitle: "Distributed Discord Bot Network",
    tech: ["Python", "Discord.py", "Async/Await", "REST APIs"],
    description:
      "High-throughput distributed bot architecture for real-time Discord event processing. Implements concurrent command dispatch via Python's asyncio event loop, structured API request pipelining, and fault-tolerant reconnection logic for sustained uptime across multiple guild instances. Features modular command surfaces with rate-limit aware request batching and stateful card trading mechanics.",
    imageUrl:
      "https://images.unsplash.com/photo-1666597107756-ef489e9f1f09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXNjb3JkJTIwYm90JTIwYXV0b21hdGlvbnxlbnwxfHx8fDE3NzM2MTUyOTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    githubUrl: "https://github.com/amw720386",
    status: "complete",
    size: "normal",
  },
  {
    title: "ReelTikTok",
    subtitle: "Automated Short-Form Content Pipeline",
    tech: ["C++", "Python", "OpenCV", "Selenium", "FFmpeg"],
    description:
      "End-to-end media generation pipeline combining native C++ frame manipulation via OpenCV with Python-driven Selenium browser automation for source asset acquisition. Processes raw frames through configurable transform stages — cropping, overlaying, and re-encoding to vertical 9:16 — then outputs platform-optimized video via FFmpeg. Demonstrates cross-language IPC, headless browser orchestration, and batch media processing at scale.",
    imageUrl:
      "https://images.unsplash.com/photo-1658207951097-96f86cc0a1c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWt0b2slMjBzb2NpYWwlMjBtZWRpYSUyMHZpZGVvfGVufDF8fHx8MTc3MzYxNTI5OHww&ixlib=rb-4.1.0&q=80&w=1080",
    githubUrl: "https://github.com/amw720386",
    status: "complete",
    size: "normal",
  },
  {
    title: "Rick and Mordle",
    subtitle: "Themed Wordle-Style Web Game",
    tech: ["Python", "Flask", "REST API", "JavaScript"],
    description:
      "Full-stack browser game with a Flask REST backend serving game state via stateless API endpoints with session-based puzzle tracking. Implements server-side word validation, guess evaluation with positional feedback encoding, and a responsive frontend with keyboard input handling, animated tile reveals, and localStorage persistence for streak tracking.",
    imageUrl:
      "https://images.unsplash.com/photo-1678962855794-fb76c6f822f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JkbGUlMjB3b3JkJTIwcHV6emxlJTIwZ2FtZXxlbnwxfHx8fDE3NzM2MTUyOTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    githubUrl: "https://github.com/amw720386",
    status: "complete",
    size: "tall",
  },
  {
    title: "A Dollar Through the 2000s",
    subtitle: "Interactive Financial Visualization",
    tech: ["Python", "Flask", "Three.js", "YFinance API", "WebGL"],
    description:
      "Data-driven 3D visualization that ingests historical market data via the YFinance API, transforms it through a Flask data layer, and renders interactive WebGL scenes using Three.js. Features real-time camera controls, animated time-series traversal, and dynamic mesh generation to represent purchasing power erosion across two decades of financial data.",
    imageUrl:
      "https://images.unsplash.com/photo-1767424196045-030bbde122a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBzdG9jayUyMG1hcmtldCUyMGNoYXJ0fGVufDF8fHx8MTc3MzYxNTI5OXww&ixlib=rb-4.1.0&q=80&w=1080",
    githubUrl: "https://github.com/amw720386",
    status: "complete",
    size: "normal",
  },
];