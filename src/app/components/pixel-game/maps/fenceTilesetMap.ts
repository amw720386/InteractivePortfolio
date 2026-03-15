// Fence Tileset Sprite Map
// 64x64 tileset with 16x16 tiles (4x4 grid)
// Each tile is a fence post with fencing extending in various directions
// Directions refer to which sides the fencing extends from the post

export const FENCE_TILESET = {
  // Column 0: Vertical-only connections
  POST_DOWN:        { col: 0, row: 0 },  // Fence going down
  POST_UP_DOWN:     { col: 0, row: 1 },  // Fence going up and down
  POST_UP:          { col: 0, row: 2 },  // Fence going up
  POST_NONE:        { col: 0, row: 3 },  // Isolated post, no fencing

  // Column 1: Right + vertical connections
  POST_RIGHT_DOWN:      { col: 1, row: 0 },  // Fence going right and down
  POST_RIGHT_UP_DOWN:   { col: 1, row: 1 },  // Fence going right, up, and down (T-junction)
  POST_RIGHT_UP:        { col: 1, row: 2 },  // Fence going right and up
  POST_RIGHT:           { col: 1, row: 3 },  // Fence going right only

  // Column 2: Left + right + vertical connections
  POST_LEFT_RIGHT_DOWN:     { col: 2, row: 0 },  // Fence going left, right, and down (T-junction)
  POST_LEFT_RIGHT_UP_DOWN:  { col: 2, row: 1 },  // Fence going all four directions (crossroads)
  POST_LEFT_RIGHT_UP:       { col: 2, row: 2 },  // Fence going left, right, and up (T-junction)
  POST_LEFT_RIGHT:          { col: 2, row: 3 },  // Fence going left and right (horizontal)

  // Column 3: Left + vertical connections
  POST_LEFT_DOWN:     { col: 3, row: 0 },  // Fence going left and down
  POST_LEFT_UP_DOWN:  { col: 3, row: 1 },  // Fence going left, up, and down (T-junction)
  POST_LEFT_UP:       { col: 3, row: 2 },  // Fence going left and up
  POST_LEFT:          { col: 3, row: 3 },  // Fence going left only
} as const;

// Helper: Get tile source rect for a given fence tile
export function getFenceTileCoords(tileData: { col: number; row: number }) {
  return {
    col: tileData.col,
    row: tileData.row,
  };
}

// Utility: Auto-select the correct fence tile based on neighbor connections
// Pass booleans for whether there is a connecting fence in each direction
export function getAutoFenceTile(up: boolean, down: boolean, left: boolean, right: boolean) {
  const key = `${up ? 'U' : ''}${down ? 'D' : ''}${left ? 'L' : ''}${right ? 'R' : ''}`;

  switch (key) {
    // No connections
    case '':        return FENCE_TILESET.POST_NONE;

    // Single direction
    case 'U':       return FENCE_TILESET.POST_UP;
    case 'D':       return FENCE_TILESET.POST_DOWN;
    case 'L':       return FENCE_TILESET.POST_LEFT;
    case 'R':       return FENCE_TILESET.POST_RIGHT;

    // Two directions
    case 'UD':      return FENCE_TILESET.POST_UP_DOWN;
    case 'LR':      return FENCE_TILESET.POST_LEFT_RIGHT;
    case 'UR':      return FENCE_TILESET.POST_RIGHT_UP;
    case 'DR':      return FENCE_TILESET.POST_RIGHT_DOWN;
    case 'UL':      return FENCE_TILESET.POST_LEFT_UP;
    case 'DL':      return FENCE_TILESET.POST_LEFT_DOWN;

    // Three directions (T-junctions)
    case 'UDR':     return FENCE_TILESET.POST_RIGHT_UP_DOWN;
    case 'UDL':     return FENCE_TILESET.POST_LEFT_UP_DOWN;
    case 'ULR':     return FENCE_TILESET.POST_LEFT_RIGHT_UP;
    case 'DLR':     return FENCE_TILESET.POST_LEFT_RIGHT_DOWN;

    // All four directions (crossroads)
    case 'UDLR':    return FENCE_TILESET.POST_LEFT_RIGHT_UP_DOWN;

    default:        return FENCE_TILESET.POST_NONE;
  }
}
