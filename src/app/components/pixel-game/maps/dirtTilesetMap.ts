// Dirt Tileset Sprite Map
// Tileset follows the same format as grass tileset
// 3x3 grid for corners/edges + foliage variations

export const DIRT_TILESET = {
  // Top-left 3x3: Standard dirt edges and corners
  CORNERS_AND_EDGES: {
    TOP_LEFT_CORNER: { col: 0, row: 0 },
    TOP_EDGE: { col: 1, row: 0 },
    TOP_RIGHT_CORNER: { col: 2, row: 0 },
    LEFT_EDGE: { col: 0, row: 1 },
    CENTER: { col: 1, row: 1 },
    RIGHT_EDGE: { col: 2, row: 1 },
    BOTTOM_LEFT_CORNER: { col: 0, row: 2 },
    BOTTOM_EDGE: { col: 1, row: 2 },
    BOTTOM_RIGHT_CORNER: { col: 2, row: 2 },
  },

  // Column 3, rows 0-2: Vertical tube/corridor edges
  // Used when dirt is adjacent to vertical paths/roads
  VERTICAL_CORRIDOR: {
    TOP: { col: 3, row: 0 },      // Edge on top + left + right
    MIDDLE: { col: 3, row: 1 },   // Edge on left + right (center of corridor)
    BOTTOM: { col: 3, row: 2 },   // Edge on bottom + left + right
  },

  // Row 3, columns 0-2: Horizontal tube/corridor edges
  // Used when dirt is adjacent to horizontal paths/roads
  HORIZONTAL_CORRIDOR: {
    LEFT: { col: 0, row: 3 },     // Edge on left + top + bottom
    MIDDLE: { col: 1, row: 3 },   // Edge on top + bottom (center of corridor)
    RIGHT: { col: 2, row: 3 },    // Edge on right + top + bottom
  },

  // Foliage variations for texture variety
  // If your tileset has foliage variations, add them here following the same pattern as grass
  FOLIAGE: [
    // Add foliage tile coordinates if they exist in your tileset
    // For now, using empty array - will default to center tile
  ],
} as const;

// Helper function to get tile coordinates
export function getTileCoords(tileData: { col: number; row: number }) {
  return {
    col: tileData.col,
    row: tileData.row,
  };
}
