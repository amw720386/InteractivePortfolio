// Dock/Bridge Tileset Sprite Map
// 64x48 tileset with 16x16 tiles (4 cols x 3 rows)
// The bridge is always 2 tiles wide:
//   - Vertical bridge (going north-south): left col uses (0,1), right col uses (1,1)
//   - Horizontal bridge (going east-west): top row uses (0,1), bottom row uses (1,1)

export const DOCK_TILESET = {
  // Vertical bridge segments (placed side by side for a 2-wide bridge going N-S)
  VERTICAL_LEFT:  { col: 0, row: 1 },  // Left plank of vertical bridge
  VERTICAL_RIGHT: { col: 1, row: 1 },  // Right plank of vertical bridge

  // Horizontal bridge segments (placed stacked for a 2-tall bridge going E-W)
  // These use different tiles from vertical — planks run north-south (perpendicular to movement)
  HORIZONTAL_TOP:    { col: 3, row: 0 },  // Top plank of horizontal bridge
  HORIZONTAL_BOTTOM: { col: 3, row: 1 },  // Bottom plank of horizontal bridge

  // End pieces / caps
  END_TOP:    { col: 0, row: 0 },  // Top end cap
  END_BOTTOM: { col: 1, row: 0 },  // Bottom end cap
  END_LEFT:   { col: 2, row: 0 },  // Left end cap
  END_RIGHT:  { col: 2, row: 1 },  // Right end cap

  // Corner pieces (for L-shaped turns)
  CORNER_TOP_LEFT:     { col: 0, row: 2 },
  CORNER_TOP_RIGHT:    { col: 1, row: 2 },
  CORNER_BOTTOM_LEFT:  { col: 2, row: 2 },
  CORNER_BOTTOM_RIGHT: { col: 3, row: 2 },
} as const;

// Dock direction metadata stored per-tile during map generation
export type DockSegment = {
  orientation: "horizontal" | "vertical" | "corner";
  // For horizontal: "top" or "bottom" row of the 2-thick bridge
  // For vertical: "left" or "right" col of the 2-wide bridge
  // For corner: specific corner type
  subTile: "left" | "right" | "top" | "bottom" |
           "corner-tl" | "corner-tr" | "corner-bl" | "corner-br";
};

// Helper: get the tileset coords for a dock segment
export function getDockTileCoords(segment: DockSegment): { col: number; row: number } {
  switch (segment.orientation) {
    case "vertical":
      return segment.subTile === "left"
        ? DOCK_TILESET.VERTICAL_LEFT
        : DOCK_TILESET.VERTICAL_RIGHT;
    case "horizontal":
      return segment.subTile === "top"
        ? DOCK_TILESET.HORIZONTAL_TOP
        : DOCK_TILESET.HORIZONTAL_BOTTOM;
    case "corner":
      switch (segment.subTile) {
        case "corner-tl": return DOCK_TILESET.CORNER_TOP_LEFT;
        case "corner-tr": return DOCK_TILESET.CORNER_TOP_RIGHT;
        case "corner-bl": return DOCK_TILESET.CORNER_BOTTOM_LEFT;
        case "corner-br": return DOCK_TILESET.CORNER_BOTTOM_RIGHT;
        default: return DOCK_TILESET.VERTICAL_LEFT;
      }
    default:
      return DOCK_TILESET.VERTICAL_LEFT;
  }
}