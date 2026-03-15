// House tileset mapping for 112x80 (7 columns x 5 rows) with 16x16 tiles
// Structure:
// - Columns 0-2, Rows 1-3: Wall tiles (3x3 auto-tiling)
// - Column 3, Row 1: Closed door
// - Column 3, Row 2: Open door  
// - Columns 4-6, Rows 0-4: Roof tiles (3x5 for peaked roof)

export interface WallTileCoords {
  x: number;
  y: number;
}

export interface RoofTileCoords {
  x: number;
  y: number;
}

// Wall tiles use 3x3 auto-tiling (columns 0-2, rows 1-3)
// Row 1: Top edges
// Row 2: Middle (sides and center/floor)
// Row 3: Bottom edges
export const WALL_TILESET = {
  // Top row
  topLeft: { x: 0, y: 1 },      // Corner with edges on left and top
  topCenter: { x: 1, y: 1 },    // Top edge wall
  topRight: { x: 2, y: 1 },     // Corner with edges on right and top
  
  // Middle row  
  middleLeft: { x: 0, y: 2 },   // Left edge wall
  center: { x: 1, y: 2 },       // Floor/center tile (no walls)
  middleRight: { x: 2, y: 2 },  // Right edge wall
  
  // Bottom row
  bottomLeft: { x: 0, y: 3 },   // Corner with edges on left and bottom
  bottomCenter: { x: 1, y: 3 }, // Bottom edge wall
  bottomRight: { x: 2, y: 3 },  // Corner with edges on right and bottom
};

// Door tiles
export const DOOR_TILESET = {
  closed: { x: 3, y: 1 },
  open: { x: 3, y: 2 },
};

// Roof tiles use 3x5 grid (columns 4-6, rows 0-4)
// Rows 0-1: Upper roof (upward facing)
// Row 2: Peak row (special middle plank tiles)
// Rows 3-4: Lower roof (downward facing)
export const ROOF_TILESET = {
  // Upper section (rows 0-1) - upward facing
  upperTopLeft: { x: 4, y: 0 },
  upperTopCenter: { x: 5, y: 0 },
  upperTopRight: { x: 6, y: 0 },
  
  upperMiddleLeft: { x: 4, y: 1 },
  upperMiddleCenter: { x: 5, y: 1 },
  upperMiddleRight: { x: 6, y: 1 },
  
  // Peak row (row 2) - has vertical plank down middle
  peakLeft: { x: 4, y: 2 },
  peakCenter: { x: 5, y: 2 },     // Plank running vertically
  peakRight: { x: 6, y: 2 },
  
  // Lower section (rows 3-4) - downward facing
  lowerMiddleLeft: { x: 4, y: 3 },
  lowerMiddleCenter: { x: 5, y: 3 },
  lowerMiddleRight: { x: 6, y: 3 },
  
  lowerBottomLeft: { x: 4, y: 4 },
  lowerBottomCenter: { x: 5, y: 4 },
  lowerBottomRight: { x: 6, y: 4 },
};

// Helper function to get wall tile based on neighbors
// For walls on the perimeter: edges face OUTWARD (where there are no neighbors)
export function getWallTile(hasTop: boolean, hasRight: boolean, hasBottom: boolean, hasLeft: boolean): WallTileCoords {
  // Corners: two edges face outward (no neighbors on those sides)
  if (!hasTop && !hasLeft && hasRight && hasBottom) return WALL_TILESET.topLeft;      // Top-left corner
  if (!hasTop && !hasRight && hasLeft && hasBottom) return WALL_TILESET.topRight;     // Top-right corner
  if (!hasBottom && !hasLeft && hasTop && hasRight) return WALL_TILESET.bottomLeft;   // Bottom-left corner
  if (!hasBottom && !hasRight && hasTop && hasLeft) return WALL_TILESET.bottomRight;  // Bottom-right corner
  
  // Edges: one edge faces outward
  if (!hasTop && hasLeft && hasRight && hasBottom) return WALL_TILESET.topCenter;      // Top edge
  if (!hasBottom && hasLeft && hasRight && hasTop) return WALL_TILESET.bottomCenter;   // Bottom edge
  if (!hasLeft && hasTop && hasBottom && hasRight) return WALL_TILESET.middleLeft;     // Left edge
  if (!hasRight && hasTop && hasBottom && hasLeft) return WALL_TILESET.middleRight;    // Right edge
  
  // Center (floor) - surrounded by walls or interior
  return WALL_TILESET.center;
}

// Helper function to get roof tile based on position in roof
export function getRoofTile(col: number, row: number, roofWidth: number, roofHeight: number): RoofTileCoords {
  const isLeftEdge = col === 0;
  const isRightEdge = col === roofWidth - 1;
  const peakRow = Math.floor(roofHeight / 2); // Middle row is the peak
  const isAbovePeak = row < peakRow;
  const isPeak = row === peakRow;
  const isBelowPeak = row > peakRow;
  
  // Peak row (has vertical plank)
  if (isPeak) {
    if (isLeftEdge) return ROOF_TILESET.peakLeft;
    if (isRightEdge) return ROOF_TILESET.peakRight;
    return ROOF_TILESET.peakCenter;
  }
  
  // Upper section (above peak)
  if (isAbovePeak) {
    if (row === 0) {
      if (isLeftEdge) return ROOF_TILESET.upperTopLeft;
      if (isRightEdge) return ROOF_TILESET.upperTopRight;
      return ROOF_TILESET.upperTopCenter;
    } else {
      if (isLeftEdge) return ROOF_TILESET.upperMiddleLeft;
      if (isRightEdge) return ROOF_TILESET.upperMiddleRight;
      return ROOF_TILESET.upperMiddleCenter;
    }
  }
  
  // Lower section (below peak)
  if (isBelowPeak) {
    if (row === roofHeight - 1) {
      if (isLeftEdge) return ROOF_TILESET.lowerBottomLeft;
      if (isRightEdge) return ROOF_TILESET.lowerBottomRight;
      return ROOF_TILESET.lowerBottomCenter;
    } else {
      if (isLeftEdge) return ROOF_TILESET.lowerMiddleLeft;
      if (isRightEdge) return ROOF_TILESET.lowerMiddleRight;
      return ROOF_TILESET.lowerMiddleCenter;
    }
  }
  
  // Fallback
  return ROOF_TILESET.peakCenter;
}
