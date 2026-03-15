import type { HouseTile, Furniture, House } from "./types";

/**
 * Creates the permanent house structure with exterior shell and remote interior.
 */
export function createHouse(): House {
  // EXTERIOR HOUSE: 8 tiles wide x 4 tiles tall
  const houseWidth = 8;
  const houseHeight = 4;
  const roofHeight = 6;

  // Position exterior house in top-right quadrant
  const houseX = 60;
  const houseY = 10;

  // INTERIOR LOCATION: Far away on the map (way out of render distance)
  const interiorX = 300;
  const interiorY = 300;
  const interiorWidth = 23;
  const interiorHeight = 12;

  // Create EXTERIOR house tiles (just walls and door for the building shell)
  const tiles: HouseTile[][] = [];
  for (let y = 0; y < houseHeight; y++) {
    tiles[y] = [];
    for (let x = 0; x < houseWidth; x++) {
      const isWall =
        x === 0 ||
        x === houseWidth - 1 ||
        y === 0 ||
        y === houseHeight - 1;
      tiles[y][x] = {
        type: isWall ? "wall" : "floor",
        collidable: isWall,
      };
    }
  }

  // Door at bottom center of exterior
  const doorX = Math.floor(houseWidth / 2);
  const doorY = houseHeight - 1;
  tiles[doorY][doorX] = {
    type: "door",
    doorOpen: false,
    collidable: false,
  };

  // Create INTERIOR tiles at the remote location
  const interiorTiles: HouseTile[][] = [];
  for (let y = 0; y < interiorHeight; y++) {
    interiorTiles[y] = [];
    for (let x = 0; x < interiorWidth; x++) {
      const isWall =
        x === 0 ||
        x === interiorWidth - 1 ||
        y === 0 ||
        y === interiorHeight - 1;
      interiorTiles[y][x] = {
        type: isWall ? "wall" : "floor",
        collidable: isWall,
      };
    }
  }

  // Exit door at bottom center of interior
  const interiorDoorX = Math.floor(interiorWidth / 2);
  const interiorDoorY = interiorHeight - 1;
  interiorTiles[interiorDoorY][interiorDoorX] = {
    type: "door",
    doorOpen: false,
    collidable: false,
  };

  // Create furniture layout (in interior coordinates)
  const furniture: Furniture[] = [];

  // Bed (1x2) in top-left area - against top wall
  furniture.push({
    x: 2, y: 0,
    tileX: 1, tileY: 1,
    width: 1, height: 2,
    collidable: true,
  });

  // Small table next to bed (right side)
  furniture.push({
    x: 3, y: 1,
    tileX: 4, tileY: 3,
    width: 1, height: 1,
    collidable: true,
  });

  // Another dresser on left side of bed
  furniture.push({
    x: 1, y: 1,
    tileX: 3, tileY: 2,
    width: 1, height: 1,
    collidable: true,
  });

  // Table (1x1) in center-right area
  furniture.push({
    x: 14, y: 5,
    tileX: 2, tileY: 5,
    width: 1, height: 1,
    collidable: true,
  });

  // Carpet under table
  furniture.push({
    x: 14, y: 5,
    tileX: 3, tileY: 3,
    width: 1, height: 1,
    collidable: false,
  });

  // Chairs around table
  // Top chair (facing down)
  furniture.push({
    x: 14, y: 4,
    tileX: 6, tileY: 2,
    width: 1, height: 1,
    collidable: false,
  });

  // Bottom chair (facing up)
  furniture.push({
    x: 14, y: 6,
    tileX: 7, tileY: 2,
    width: 1, height: 1,
    collidable: false,
  });

  // Left chair (facing right)
  furniture.push({
    x: 13, y: 5,
    tileX: 4, tileY: 2,
    width: 1, height: 1,
    collidable: false,
  });

  // Right chair (facing left)
  furniture.push({
    x: 15, y: 5,
    tileX: 5, tileY: 2,
    width: 1, height: 1,
    collidable: false,
  });

  // Wall paintings - top wall
  furniture.push({
    x: 9, y: 0,
    tileX: 0, tileY: 0,
    width: 1, height: 1,
    collidable: false,
    onWall: true,
  });

  furniture.push({
    x: 15, y: 0,
    tileX: 1, tileY: 0,
    width: 1, height: 1,
    collidable: false,
    onWall: true,
  });

  // Clock on top wall
  furniture.push({
    x: 12, y: 0,
    tileX: 7, tileY: 3,
    width: 1, height: 1,
    collidable: false,
    onWall: true,
  });

  // House plants in corners
  // Bottom-left corner
  furniture.push({
    x: 2, y: 9,
    tileX: 3, tileY: 0,
    width: 1, height: 1,
    collidable: false,
  });

  // Bottom-right corner
  furniture.push({
    x: 20, y: 9,
    tileX: 4, tileY: 0,
    width: 1, height: 1,
    collidable: true,
  });

  // Top-right corner
  furniture.push({
    x: 19, y: 2,
    tileX: 5, tileY: 0,
    width: 1, height: 1,
    collidable: true,
  });

  return {
    x: houseX,
    y: houseY,
    width: houseWidth,
    height: houseHeight,
    roofHeight,
    tiles,
    doorX,
    doorY,
    doorOpen: false,
    interiorX,
    interiorY,
    interiorWidth,
    interiorHeight,
    interiorTiles,
    interiorDoorX,
    interiorDoorY,
    furniture,
  };
}
