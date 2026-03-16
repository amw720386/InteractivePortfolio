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

// Sign position (left of the center dirt patch)
export const SIGN_X = Math.floor(MAP_WIDTH / 2) - 3;
export const SIGN_Y = Math.floor(MAP_HEIGHT / 2);

// Egg sprite constants
export const EGG_SPRITE_SIZE = 16;
export const EGG_FRAMES = {
  egg: 0,
  cracked_egg: 1,
  nest: 2,
};

// Player animation mapping - new spritesheet layout
// Rows 0-3: idle animations (down, up, right, left) - 8 frames each
// Rows 4-7: walk animations (down, up, right, left) - 8 frames each
export const PLAYER_ANIMATIONS = {
  idle_down: { row: 0, frames: 8 },
  idle_up: { row: 1, frames: 8 },
  idle_right: { row: 2, frames: 8 },
  idle_left: { row: 3, frames: 8 },
  walk_down: { row: 4, frames: 8 },
  walk_up: { row: 5, frames: 8 },
  walk_right: { row: 6, frames: 8 },
  walk_left: { row: 7, frames: 8 },
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