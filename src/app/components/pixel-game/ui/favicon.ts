// Cute pixel art cat face - 16x16 grid encoded as an SVG data URI
// Each "pixel" is a 1x1 rect in a 16x16 viewBox for crisp scaling

const P = "#c0c0c0"; // outline/darker fur
const L = "#ffffff"; // white fur
const W = "#ffffff"; // eye highlight
const K = "#111111"; // black (eyes, nose)
const E = "#f0f0f0"; // cheeks
const N = "#ff9eae"; // pink nose/inner ear
const T = "transparent";

// 16x16 pixel grid - cute cat face
const GRID: string[][] = [
  [T, T, T, P, P, T, T, T, T, T, T, P, P, T, T, T],
  [T, T, P, L, P, T, T, T, T, T, T, P, L, P, T, T],
  [T, P, N, L, P, T, T, T, T, T, T, P, L, N, P, T],
  [T, P, L, L, P, P, P, P, P, P, P, P, L, L, P, T],
  [P, L, L, L, L, L, L, L, L, L, L, L, L, L, L, P],
  [P, L, L, L, L, L, L, L, L, L, L, L, L, L, L, P],
  [P, L, L, K, K, L, L, L, L, L, L, K, K, L, L, P],
  [P, L, L, K, W, L, L, L, L, L, L, K, W, L, L, P],
  [P, L, L, L, L, L, L, N, N, L, L, L, L, L, L, P],
  [P, L, E, L, L, L, L, N, N, L, L, L, L, E, L, P],
  [P, L, E, L, L, P, L, L, L, L, P, L, L, E, L, P],
  [P, L, L, L, L, L, P, P, P, P, L, L, L, L, L, P],
  [T, P, L, L, L, L, L, L, L, L, L, L, L, L, P, T],
  [T, T, P, P, L, L, L, L, L, L, L, L, P, P, T, T],
  [T, T, T, T, P, P, P, P, P, P, P, P, T, T, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
];

function buildSvg(): string {
  let rects = "";
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const c = GRID[y][x];
      if (c !== "transparent") {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`;
}

export function setFavicon() {
  const svg = buildSvg();
  const encoded = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = encoded;
}