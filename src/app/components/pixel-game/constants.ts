// Game constants
export const TILE_SIZE = 48;
export const TILESET_TILE_SIZE = 16; // Tileset uses 16x16 tiles
export const PLAYER_SPRITE_SIZE = 48;
export const PLAYER_RENDER_SIZE = TILE_SIZE * 3;
export const CHICKEN_SPRITE_SIZE = 16;
export const CHICKEN_RENDER_SIZE = TILE_SIZE * 1;
export const COW_SPRITE_SIZE = 32;
export const COW_RENDER_SIZE = TILE_SIZE * 2;
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 60;

// Egg sprite constants
export const EGG_SPRITE_SIZE = 16;
export const EGG_FRAMES = {
  egg: 0,
  cracked_egg: 1,
  nest: 2,
};

// Player animation mapping - 4x4 grid
// Row 0: walking down (column 0 = idle down)
// Row 1: walking up (column 0 = idle up)
// Row 2: walking left (column 0 = idle left)
// Row 3: walking right (column 0 = idle right)
// Using frames [2, 3] - 2-frame animation
export const PLAYER_ANIMATIONS = {
  walk_down: { row: 0, frames: [2, 3] }, // Row 0
  walk_up: { row: 1, frames: [2, 3] }, // Row 1
  walk_left: { row: 2, frames: [2, 3] }, // Row 2
  walk_right: { row: 3, frames: [2, 3] }, // Row 3
};

// Chicken animation frames
export const CHICKEN_ANIMATIONS = {
  idle: [0, 1], // Row 0, frames 0-1
  walk: [2, 3], // Row 0, frames 2-3
  peck: [4, 5], // Row 1, frames 0-1 (index 4-5)
  rest: [6, 7], // Row 1, frames 2-3 (index 6-7)
};

// Cow animation frames - for walking animation
export const COW_ANIMATIONS = {
  idle: [0, 1], // Row 0, frames 0-1
  walk: [2, 3], // Row 0, frames 2-3 (will cycle between these)
};
