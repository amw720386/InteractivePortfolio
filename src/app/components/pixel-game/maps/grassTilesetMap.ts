// Grass Tileset Sprite Map - Full 47-tile autotile (Wang blob)
// Tileset is 11x7 grid of 16x16 tiles (176x112 pixels)
//
// Edge bitmask encoding (bit flags for non-grass neighbors):
//   T=1, TR=2, R=4, BR=8, B=16, BL=32, L=64, TL=128
// Diagonal bits only count when BOTH adjacent cardinal neighbors are grass.
// This produces 47 unique effective configurations.

// Bitmask constants
export const EDGE_T  = 1;
export const EDGE_TR = 2;
export const EDGE_R  = 4;
export const EDGE_BR = 8;
export const EDGE_B  = 16;
export const EDGE_BL = 32;
export const EDGE_L  = 64;
export const EDGE_TL = 128;

// Full autotile lookup: effective bitmask → { col, row } in tileset
export const GRASS_AUTOTILE: Record<number, { col: number; row: number }> = {
  // No edges - center
  0:   { col: 1, row: 1 },

  // Single cardinal edges
  1:   { col: 1, row: 0 },  // T
  4:   { col: 2, row: 1 },  // R
  16:  { col: 1, row: 2 },  // B
  64:  { col: 0, row: 1 },  // L

  // Two cardinal edges (corners)
  65:  { col: 0, row: 0 },  // T+L
  5:   { col: 2, row: 0 },  // T+R
  20:  { col: 2, row: 2 },  // B+R
  80:  { col: 0, row: 2 },  // B+L

  // Two cardinal edges (corridors)
  68:  { col: 3, row: 1 },  // L+R
  17:  { col: 1, row: 3 },  // T+B

  // Three cardinal edges
  69:  { col: 3, row: 0 },  // T+L+R
  84:  { col: 3, row: 2 },  // B+L+R
  81:  { col: 0, row: 3 },  // T+B+L
  21:  { col: 2, row: 3 },  // T+B+R

  // Four cardinal edges (isolated)
  85:  { col: 3, row: 3 },  // T+R+B+L

  // Single inner corners only
  8:   { col: 5, row: 1 },  // BR
  2:   { col: 5, row: 2 },  // TR
  32:  { col: 6, row: 1 },  // BL
  128: { col: 6, row: 2 },  // TL

  // Cardinal edge + single inner corner
  9:   { col: 5, row: 0 },  // T+BR
  33:  { col: 6, row: 0 },  // T+BL
  41:  { col: 8, row: 0 },  // T+BL+BR
  72:  { col: 4, row: 1 },  // L+BR
  66:  { col: 4, row: 2 },  // L+TR
  36:  { col: 7, row: 1 },  // R+BL
  132: { col: 7, row: 2 },  // R+TL
  18:  { col: 5, row: 3 },  // B+TR
  144: { col: 6, row: 3 },  // B+TL
  146: { col: 8, row: 3 },  // B+TL+TR

  // Outer corner + inner corner
  73:  { col: 4, row: 0 },  // T+L+BR
  37:  { col: 7, row: 0 },  // T+R+BL
  82:  { col: 4, row: 3 },  // B+L+TR
  148: { col: 7, row: 3 },  // B+R+TL

  // Cardinal edge + two inner corners
  74:  { col: 4, row: 4 },  // L+TR+BR
  164: { col: 7, row: 4 },  // R+TL+BL

  // Two inner corners
  10:  { col: 5, row: 4 },  // TR+BR
  160: { col: 6, row: 4 },  // TL+BL
  40:  { col: 8, row: 1 },  // BL+BR
  130: { col: 8, row: 2 },  // TL+TR
  136: { col: 9, row: 0 },  // TL+BR (diagonal)
  34:  { col: 9, row: 1 },  // TR+BL (diagonal)

  // Three inner corners
  162: { col: 9, row: 2 },  // TL+TR+BL
  168: { col: 9, row: 3 },  // TL+BL+BR
  138: { col: 10, row: 2 }, // TL+TR+BR
  42:  { col: 10, row: 3 }, // TR+BL+BR

  // Four inner corners
  170: { col: 8, row: 4 },  // TL+TR+BL+BR
};

/**
 * Compute the effective grass edge bitmask for a tile at (x, y).
 * isGrass(x, y) should return true if the tile at that position is grass-like.
 */
export function computeGrassEdgeMask(
  x: number,
  y: number,
  width: number,
  height: number,
  isGrass: (x: number, y: number) => boolean,
): number {
  const gT  = y > 0          && isGrass(x, y - 1);
  const gB  = y < height - 1 && isGrass(x, y + 1);
  const gL  = x > 0          && isGrass(x - 1, y);
  const gR  = x < width - 1  && isGrass(x + 1, y);

  let mask = 0;

  // Cardinal edges (non-grass neighbor = edge)
  if (!gT) mask |= EDGE_T;
  if (!gR) mask |= EDGE_R;
  if (!gB) mask |= EDGE_B;
  if (!gL) mask |= EDGE_L;

  // Diagonal edges - only relevant when BOTH adjacent cardinals are grass
  if (gT && gL) {
    const gTL = y > 0 && x > 0 && isGrass(x - 1, y - 1);
    if (!gTL) mask |= EDGE_TL;
  }
  if (gT && gR) {
    const gTR = y > 0 && x < width - 1 && isGrass(x + 1, y - 1);
    if (!gTR) mask |= EDGE_TR;
  }
  if (gB && gL) {
    const gBL = y < height - 1 && x > 0 && isGrass(x - 1, y + 1);
    if (!gBL) mask |= EDGE_BL;
  }
  if (gB && gR) {
    const gBR = y < height - 1 && x < width - 1 && isGrass(x + 1, y + 1);
    if (!gBR) mask |= EDGE_BR;
  }

  return mask;
}

// Rows 5-6, columns 0-5: Foliage variations (12 total)
// Used to add texture variety to center grass tiles
export const GRASS_TILESET = {
  FOLIAGE: [
    // Row 5
    { col: 0, row: 5 },
    { col: 1, row: 5 },
    { col: 2, row: 5 },
    { col: 3, row: 5 },
    { col: 4, row: 5 },
    { col: 5, row: 5 },
    // Row 6
    { col: 0, row: 6 },
    { col: 1, row: 6 },
    { col: 2, row: 6 },
    { col: 3, row: 6 },
    { col: 4, row: 6 },
    { col: 5, row: 6 },
  ],
} as const;

// Helper function to get tile coordinates
export function getTileCoords(tileData: { col: number; row: number }) {
  return {
    col: tileData.col,
    row: tileData.row,
  };
}
