// Boat Tileset Sprite Map
// Tileset is 9x6 grid of 16x16 tiles (144x96 pixels total)
// Boat is 3 tiles wide × 2 tiles tall, 2 animation frames

export const BOAT_TILESET = {
  // Frame 0: columns 0-2, rows 0-1
  FRAME_0: {
    TOP_LEFT:   { col: 0, row: 0 },
    TOP_MID:    { col: 1, row: 0 },
    TOP_RIGHT:  { col: 2, row: 0 },
    BOTTOM_LEFT:  { col: 0, row: 1 },
    BOTTOM_MID:   { col: 1, row: 1 },
    BOTTOM_RIGHT: { col: 2, row: 1 },
  },
  // Frame 1: columns 3-5, rows 0-1
  FRAME_1: {
    TOP_LEFT:   { col: 3, row: 0 },
    TOP_MID:    { col: 4, row: 0 },
    TOP_RIGHT:  { col: 5, row: 0 },
    BOTTOM_LEFT:  { col: 3, row: 1 },
    BOTTOM_MID:   { col: 4, row: 1 },
    BOTTOM_RIGHT: { col: 5, row: 1 },
  },
  width: 3,   // 3 tiles wide
  height: 2,  // 2 tiles tall
  frameCount: 2,
  // Animation speed: ms per frame
  frameDuration: 800,
} as const;

export interface BoatInstance {
  x: number;  // Top-left tile X
  y: number;  // Top-left tile Y (top row overlaps grass)
}
