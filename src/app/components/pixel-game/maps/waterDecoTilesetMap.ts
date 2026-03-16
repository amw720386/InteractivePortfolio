// Water Decoration Tileset Sprite Map
// Tileset is 12x2 grid of 16x16 tiles (192x32 pixels total)

export const WATER_DECO_TILESET = {
  // Row 0 — rocks (various sizes)
  ROCK_TINY:       { col: 0, row: 0 },  // smallest rock (1x1)
  ROCK_SMALL:      { col: 1, row: 0 },  // small rock (1x1)
  ROCK_MEDIUM:     { col: 2, row: 0 },  // medium rock (1x1)
  ROCK_MEDIUM_BIG: { col: 3, row: 0 },  // medium-big rock (1x1)
  ROCK_BIG_LEFT:   { col: 4, row: 0 },  // big rock left half (2x1)
  ROCK_BIG_RIGHT:  { col: 5, row: 0 },  // big rock right half (2x1)

  // Row 0 — reeds (water edge vegetation)
  REED_0: { col: 6, row: 0 },
  REED_1: { col: 7, row: 0 },

  // Row 0 — lily pads
  LILYPAD_0: { col: 8,  row: 0 },
  LILYPAD_1: { col: 9,  row: 0 },
  LILYPAD_2: { col: 10, row: 0 },
  LILYPAD_3: { col: 11, row: 0 },

  // Row 1 — dark water patches (overlay on water for depth variation)
  DARK_WATER_0: { col: 0, row: 1 },
  DARK_WATER_1: { col: 1, row: 1 },
  DARK_WATER_2: { col: 2, row: 1 },
  DARK_WATER_3: { col: 3, row: 1 },
  DARK_WATER_4: { col: 4, row: 1 },
  DARK_WATER_5: { col: 5, row: 1 },
} as const;

// Types of water decorations
export type WaterDecoType = "rock" | "bigRock" | "reed" | "lilypad" | "darkWater";

export interface WaterDecoInstance {
  x: number;      // Tile X position
  y: number;      // Tile Y position
  type: WaterDecoType;
  variant: number; // Which tile variant to use
}
