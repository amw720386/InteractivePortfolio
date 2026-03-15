import { Furniture } from "../types";

/**
 * Creates the furniture layout for a house interior
 * Interior is 3x scaled: 8x4 exterior becomes 24x12 interior
 */
export function createFurnitureLayout(): Furniture[] {
  const furniture: Furniture[] = [];

  // Bed (1x2) in top-left area - against top wall
  furniture.push({
    x: 2,
    y: 1,
    tileX: 1,
    tileY: 1,
    width: 1,
    height: 2,
    collidable: true,
  });

  // Small table next to bed (right side)
  furniture.push({
    x: 3,
    y: 2,
    tileX: 4,
    tileY: 3,
    width: 1,
    height: 1,
    collidable: true,
  });

  // Another dresser on left side of bed
  furniture.push({
    x: 1,
    y: 2,
    tileX: 3,
    tileY: 2,
    width: 1,
    height: 1,
    collidable: true,
  });

  // Table (1x1) in center-right area
  furniture.push({
    x: 14,
    y: 5,
    tileX: 2,
    tileY: 5,
    width: 1,
    height: 1,
    collidable: true,
  });

  // Carpet under table
  furniture.push({
    x: 14,
    y: 5,
    tileX: 3,
    tileY: 3,
    width: 1,
    height: 1,
    collidable: false,
  });

  // Chairs around table
  // Top chair (facing down)
  furniture.push({
    x: 14,
    y: 4,
    tileX: 6,
    tileY: 2,
    width: 1,
    height: 1,
    collidable: false,
  });

  // Bottom chair (facing up)
  furniture.push({
    x: 14,
    y: 6,
    tileX: 7,
    tileY: 2,
    width: 1,
    height: 1,
    collidable: false,
  });

  // Left chair (facing right)
  furniture.push({
    x: 13,
    y: 5,
    tileX: 4,
    tileY: 2,
    width: 1,
    height: 1,
    collidable: false,
  });

  // Right chair (facing left)
  furniture.push({
    x: 15,
    y: 5,
    tileX: 5,
    tileY: 2,
    width: 1,
    height: 1,
    collidable: false,
  });

  // Wall paintings - top wall
  furniture.push({
    x: 9,
    y: 1,
    tileX: 0,
    tileY: 0,
    width: 1,
    height: 1,
    collidable: false,
    onWall: true,
  });

  furniture.push({
    x: 15,
    y: 1,
    tileX: 1,
    tileY: 0,
    width: 1,
    height: 1,
    collidable: false,
    onWall: true,
  });

  // Clock on top wall
  furniture.push({
    x: 12,
    y: 1,
    tileX: 7,
    tileY: 3,
    width: 1,
    height: 1,
    collidable: false,
    onWall: true,
  });

  // House plants in corners
  // Bottom-left corner
  furniture.push({
    x: 2,
    y: 9,
    tileX: 3,
    tileY: 0,
    width: 1,
    height: 1,
    collidable: false,
  });

  // Bottom-right corner
  furniture.push({
    x: 20,
    y: 9,
    tileX: 3,
    tileY: 0,
    width: 1,
    height: 1,
    collidable: false,
  });

  // Bookshelf on right wall
  furniture.push({
    x: 21,
    y: 3,
    tileX: 0,
    tileY: 4,
    width: 1,
    height: 2,
    collidable: true,
  });

  // Small shelf next to bookshelf
  furniture.push({
    x: 21,
    y: 6,
    tileX: 0,
    tileY: 3,
    width: 1,
    height: 1,
    collidable: true,
  });

  return furniture;
}
