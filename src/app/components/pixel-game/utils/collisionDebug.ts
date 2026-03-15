import { TILE_SIZE } from "../constants";
import type { Furniture, Position } from "../types";

/**
 * Debug visualization for collision boxes
 * This will help us see the ACTUAL collision boundaries vs where sprites are drawn
 */

export interface CollisionBox {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  label: string;
  color: string;
}

/**
 * Draw a collision box with center point and extents
 */
export function drawCollisionBox(
  ctx: CanvasRenderingContext2D,
  box: CollisionBox,
  cameraX: number,
  cameraY: number
) {
  const screenX = (box.centerX - cameraX) * TILE_SIZE;
  const screenY = (box.centerY - cameraY) * TILE_SIZE;
  
  // Draw the box
  ctx.strokeStyle = box.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    screenX - box.halfWidth * TILE_SIZE,
    screenY - box.halfHeight * TILE_SIZE,
    box.halfWidth * 2 * TILE_SIZE,
    box.halfHeight * 2 * TILE_SIZE
  );
  
  // Draw center point
  ctx.fillStyle = box.color;
  ctx.beginPath();
  ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw label
  ctx.fillStyle = box.color;
  ctx.font = "12px monospace";
  ctx.fillText(
    box.label,
    screenX - box.halfWidth * TILE_SIZE,
    screenY - box.halfHeight * TILE_SIZE - 5
  );
  
  // Draw coordinate text
  ctx.fillStyle = box.color;
  ctx.font = "10px monospace";
  ctx.fillText(
    `(${box.centerX.toFixed(2)}, ${box.centerY.toFixed(2)})`,
    screenX - box.halfWidth * TILE_SIZE,
    screenY + box.halfHeight * TILE_SIZE + 15
  );
}

/**
 * Get player collision box for debug visualization
 */
export function getPlayerCollisionBox(
  playerPos: Position,
  playerRadius: number
): CollisionBox {
  return {
    centerX: playerPos.x,
    centerY: playerPos.y,
    halfWidth: playerRadius,
    halfHeight: playerRadius,
    label: "PLAYER",
    color: "#00ff00", // Green
  };
}

/**
 * Get furniture collision box for debug visualization (EXTERIOR/MAP VIEW)
 */
export function getFurnitureCollisionBox(
  furn: Furniture,
  isInterior: boolean = false
): CollisionBox {
  // THIS IS WHERE THE BUG LIVES!
  // We need to figure out if furn.x, furn.y means:
  // A) Top-left corner of the furniture's tile grid
  // B) Center of the furniture
  // C) Something else entirely
  
  // Current calculation (probably wrong):
  const furnCenterX = furn.x + (furn.width - 1) / 2;
  const furnCenterY = furn.y + (furn.height - 1) / 2;
  const furnHalfWidth = furn.width / 2;
  const furnHalfHeight = furn.height / 2;
  
  return {
    centerX: furnCenterX,
    centerY: furnCenterY,
    halfWidth: furnHalfWidth,
    halfHeight: furnHalfHeight,
    label: `FURN(${furn.x},${furn.y})`,
    color: "#ff0000", // Red
  };
}

/**
 * Get tree collision box for debug visualization
 */
export function getTreeCollisionBox(
  treeX: number,
  treeY: number,
  treeHeight: number
): CollisionBox {
  // Tree collision uses ANOTHER different convention!
  const treeCenterY = treeY + treeHeight - 0.5;
  
  return {
    centerX: treeX + 0.5, // Assuming tree is 1 tile wide
    centerY: treeCenterY,
    halfWidth: 0.4,
    halfHeight: 0.4,
    label: `TREE`,
    color: "#ff8800", // Orange
  };
}

/**
 * Draw all collision boxes for a scene
 */
export function drawAllCollisionBoxes(
  ctx: CanvasRenderingContext2D,
  boxes: CollisionBox[],
  cameraX: number,
  cameraY: number
) {
  boxes.forEach(box => drawCollisionBox(ctx, box, cameraX, cameraY));
}
