// Foliage Tileset Sprite Map
// Tileset is 9x5 grid of 16x16 tiles (144x80 pixels total)
// Each tile is 16x16 pixels

export const FOLIAGE_TILESET = {
  // Small 1x2 column tree (narrow tree)
  SMALL_TREE: {
    TOP: { col: 0, row: 0 },
    BOTTOM: { col: 0, row: 1 },
    width: 1,  // 1 tile wide
    height: 2, // 2 tiles tall
  },

  // 2x2 tree (medium tree)
  MEDIUM_TREE: {
    TOP_LEFT: { col: 1, row: 0 },
    TOP_RIGHT: { col: 2, row: 0 },
    BOTTOM_LEFT: { col: 1, row: 1 },
    BOTTOM_RIGHT: { col: 2, row: 1 },
    width: 2,  // 2 tiles wide
    height: 2, // 2 tiles tall
  },

  // 2x2 fruit tree (tree with fruits)
  FRUIT_TREE: {
    TOP_LEFT: { col: 3, row: 0 },
    TOP_RIGHT: { col: 4, row: 0 },
    BOTTOM_LEFT: { col: 3, row: 1 },
    BOTTOM_RIGHT: { col: 4, row: 1 },
    width: 2,  // 2 tiles wide
    height: 2, // 2 tiles tall
  },

  // 1x1 bushes
  BUSHES: [
    { col: 0, row: 3 },
    { col: 1, row: 3 },
  ],
  
  // 1x1 tree stump
  TREE_STUMP: { col: 4, row: 2 },

  // 1x1 mushrooms
  MUSHROOMS: [
    { col: 5, row: 0 },
    { col: 6, row: 0 },
    { col: 7, row: 0 },
    { col: 8, row: 0 },
  ],

  // 1x1 flowers
  FLOWERS: [
    { col: 6, row: 2 },
    { col: 7, row: 2 },
    { col: 6, row: 3 },
    { col: 7, row: 3 },
  ],

  // 1x2 sunflower
  SUNFLOWER: {
    TOP: { col: 8, row: 2 },
    BOTTOM: { col: 8, row: 3 },
    width: 1,  // 1 tile wide
    height: 2, // 2 tiles tall
  },
} as const;

// Tree type definitions for easy reference
export type TreeType = 'small' | 'medium' | 'fruit' | 'forest' | 'forestDarker' | 'eucalyptus' | 'pine';
export type FoliageType = 'tree' | 'bush' | 'mushroom' | 'flower' | 'sunflower' | 'stump';

export interface TreeInstance {
  x: number;      // Top-left X position in tiles
  y: number;      // Top-left Y position in tiles
  type: TreeType; // Tree type
  width: number;  // Width in tiles
  height: number; // Height in tiles
}

export interface FoliageInstance {
  x: number;           // Position in tiles (for 1x1) or top-left (for multi-tile)
  y: number;           // Position in tiles (for 1x1) or top-left (for multi-tile)
  type: FoliageType;   // Foliage type
  variant?: number;    // For bushes, mushrooms, flowers (index into array)
  treeType?: TreeType; // For trees only
  width: number;       // Width in tiles
  height: number;      // Height in tiles
}