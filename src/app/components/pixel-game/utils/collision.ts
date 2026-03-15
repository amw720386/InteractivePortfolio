import type { Position, Furniture } from "../types";

/**
 * COLLISION DETECTION MODULE
 * 
 * COORDINATE SYSTEM RULES (MUST BE CONSISTENT):
 * 
 * 1. ALL entities use TILE COORDINATES (not pixels)
 * 2. For ALL entities, x,y represents the CENTER of the entity
 * 3. Player position (playerPos.x, playerPos.y) = CENTER of player in tile coords
 * 4. Furniture position (furn.x, furn.y) = TOP-LEFT CORNER of furniture in tile coords
 *    - Must convert to center for collision detection
 * 5. Collision uses AABB with center points and half-extents
 * 
 * WHY THE BUG EXISTED:
 * - Furniture data stores TOP-LEFT corner (like tile grid indices)
 * - Player data stores CENTER position (like entity coordinates)
 * - We were mixing these two conventions in collision calculations
 * - This caused asymmetric collision detection from different directions
 */

/**
 * AABB collision check between two boxes
 * Both boxes MUST have their positions in the SAME coordinate system
 */
export function checkAABBCollision(
  centerX1: number,
  centerY1: number,
  halfWidth1: number,
  halfHeight1: number,
  centerX2: number,
  centerY2: number,
  halfWidth2: number,
  halfHeight2: number
): boolean {
  const dx = Math.abs(centerX1 - centerX2);
  const dy = Math.abs(centerY1 - centerY2);
  
  return (
    dx < halfWidth1 + halfWidth2 &&
    dy < halfHeight1 + halfHeight2
  );
}

/**
 * Calculate furniture center point from top-left position
 * 
 * CRITICAL: Furniture.x and Furniture.y are TOP-LEFT corners in tile grid
 * We need to convert to CENTER for collision
 */
export function getFurnitureCenter(furn: Furniture): { centerX: number; centerY: number } {
  // For a furniture piece that is W tiles wide and H tiles tall:
  // - furn.x, furn.y is the top-left corner
  // - The center is at furn.x + width/2, furn.y + height/2
  // 
  // Example: 2x1 table at position (5, 3)
  // - Top-left corner: (5, 3)
  // - Occupies tiles: (5,3) and (6,3)
  // - Center should be: (5.5, 3.5)
  // - Formula: (5 + 2/2, 3 + 1/2) = (6, 3.5) ❌ WRONG!
  // - Correct: (5 + (2-1)/2, 3 + (1-1)/2) = (5.5, 3) ❌ STILL WRONG!
  // 
  // Actually, if it occupies 2 tiles starting at x=5:
  // - Tiles: [5, 6]
  // - Center: (5+6)/2 = 5.5 ✅
  // - Or: 5 + (2/2) = 6... no wait
  // - Or: 5 + ((2-1)/2) = 5.5 ✅
  // 
  // For 1 tile at x=5:
  // - Center: 5 + ((1-1)/2) = 5 ❌ (should be 5.5)
  // - Correct: 5 + (1/2) = 5.5 ✅
  //
  // SO THE CORRECT FORMULA IS:
  // centerX = topLeftX + width / 2
  // centerY = topLeftY + height / 2
  
  return {
    centerX: furn.x + furn.width / 2,
    centerY: furn.y + furn.height / 2,
  };
}

/**
 * Calculate furniture half-extents (collision box size)
 */
export function getFurnitureHalfExtents(furn: Furniture): { halfWidth: number; halfHeight: number } {
  return {
    halfWidth: furn.width / 2,
    halfHeight: furn.height / 2,
  };
}

/**
 * Check collision between player and furniture
 * Player position is CENTER, furniture position is TOP-LEFT
 */
export function checkPlayerFurnitureCollision(
  playerPos: Position,
  playerRadius: number,
  furn: Furniture
): boolean {
  if (!furn.collidable) return false;
  
  const { centerX: furnCenterX, centerY: furnCenterY } = getFurnitureCenter(furn);
  const { halfWidth: furnHalfWidth, halfHeight: furnHalfHeight } = getFurnitureHalfExtents(furn);
  
  return checkAABBCollision(
    playerPos.x,
    playerPos.y,
    playerRadius,
    playerRadius,
    furnCenterX,
    furnCenterY,
    furnHalfWidth,
    furnHalfHeight
  );
}

/**
 * Check collision between player and multiple furniture pieces
 * Returns true if player collides with ANY furniture
 */
export function checkPlayerFurnitureCollisions(
  playerPos: Position,
  playerRadius: number,
  furnitureList: Furniture[]
): boolean {
  return furnitureList.some(furn => 
    checkPlayerFurnitureCollision(playerPos, playerRadius, furn)
  );
}

/**
 * Check collision between player and tree trunk
 * Trees use a different collision model (circular base)
 */
export function checkPlayerTreeCollision(
  playerPos: Position,
  playerRadius: number,
  treeX: number,
  treeY: number,
  treeHeight: number
): boolean {
  // Tree trunk collision at the BASE of the tree
  // Tree is drawn with base at treeY + treeHeight
  // Collision circle is 0.4 tiles radius at the trunk base
  
  const treeCenterX = treeX + 0.5; // Tree is 1 tile wide, center at +0.5
  const treeCenterY = treeY + treeHeight - 0.5; // Base of tree trunk
  const treeRadius = 0.4; // Small collision circle for trunk
  
  // Circular collision check
  const dx = Math.abs(playerPos.x - treeCenterX);
  const dy = Math.abs(playerPos.y - treeCenterY);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < (playerRadius + treeRadius);
}

/**
 * Attempt to push player out of collision with furniture
 * Returns adjusted position or null if no collision
 */
export function resolvePlayerFurnitureCollision(
  playerPos: Position,
  playerRadius: number,
  furn: Furniture,
  moveX: number,
  moveY: number
): Position | null {
  if (!furn.collidable) return null;
  
  const { centerX: furnCenterX, centerY: furnCenterY } = getFurnitureCenter(furn);
  const { halfWidth: furnHalfWidth, halfHeight: furnHalfHeight } = getFurnitureHalfExtents(furn);
  
  // Check if there's a collision
  if (!checkAABBCollision(
    playerPos.x,
    playerPos.y,
    playerRadius,
    playerRadius,
    furnCenterX,
    furnCenterY,
    furnHalfWidth,
    furnHalfHeight
  )) {
    return null; // No collision
  }
  
  // There is a collision - push player back based on movement direction
  // Simple approach: just prevent the movement
  return {
    x: playerPos.x - moveX,
    y: playerPos.y - moveY,
  };
}
