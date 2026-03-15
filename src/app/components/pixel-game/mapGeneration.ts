import {
  FOLIAGE_TILESET,
  FoliageInstance,
  TreeType,
} from "./maps/foliageTilesetMap";
import { MAP_WIDTH, MAP_HEIGHT } from "./constants";
import type { Tile, Position, Animal, Decoration, House } from "./types";

export interface MapGenerationResult {
  map: Tile[][];
  foliage: FoliageInstance[];
  fencePositions: Array<{ x: number; y: number }>;
  glowingCowPenBounds: { left: number; top: number; right: number; bottom: number };
  chickenCoopPositions: Array<{ x: number; y: number }>;
  animals: Animal[];
  decorations: Decoration[];
  playerPos: Position;
}

export function generateMap(house: House | null): MapGenerationResult {
  const newMap: Tile[][] = [];
  // Initialize with grass
  for (let y = 0; y < MAP_HEIGHT; y++) {
    newMap[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      newMap[y][x] = Math.random() > 0.5 ? "grass" : "grass2";
    }
  }

  // Create 3x3 dirt patch in center of map
  const centerX = Math.floor(MAP_WIDTH / 2);
  const centerY = Math.floor(MAP_HEIGHT / 2);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      newMap[centerY + dy][centerX + dx] = "dirt";
    }
  }

  // Top-right quadrant: farming region (no random dirt patches)
  // Dirt comes only from pen 2-tile borders (handled after pen definitions)

  // Add dotted paths (with gaps) - horizontal and vertical through center, 3 tiles thick
  const horizontalPathY = centerY;
  const verticalPathX = centerX;

  // Horizontal dotted path - 3 tiles thick, each tile independently random (33% path, 66% grass)
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const y = horizontalPathY + rowOffset;

      if (x < 3 || x >= MAP_WIDTH - 3) continue;
      if (Math.abs(x - centerX) <= 3) continue;

      if (Math.random() < 0.33) {
        newMap[y][x] = "path";
      }
    }
  }

  // Vertical dotted path - 3 tiles thick, each tile independently random (33% path, 66% grass)
  for (let colOffset = -1; colOffset <= 1; colOffset++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const x = verticalPathX + colOffset;

      if (y < 3 || y >= MAP_HEIGHT - 3) continue;
      if (Math.abs(y - centerY) <= 3) continue;

      if (Math.random() < 0.33) {
        newMap[y][x] = "path";
      }
    }
  }

  // Path layout constants
  const PATH_BUFFER = 2;
  const DIRT_BUFFER = 2;
  const EDGE_BUFFER = 3;

  // Add random dirt patches - bigger and more solid blobs with 2-tile buffer from obstacles
  for (let i = 0; i < 15; i++) {
    const patchCenterX =
      Math.floor(Math.random() * (MAP_WIDTH - 20)) + 10;
    const patchCenterY =
      Math.floor(Math.random() * (MAP_HEIGHT - 20)) + 10;
    const patchSize = Math.floor(Math.random() * 5) + 5;

    // No dirt patches in bottom-right quadrant (flower field) or top-left quadrant (thick forest)
    if (patchCenterX >= centerX && patchCenterY >= centerY) continue;
    if (patchCenterX < centerX && patchCenterY < centerY) continue;

    const tooCloseToHorizontalPath =
      Math.abs(patchCenterY - horizontalPathY) <=
      patchSize + DIRT_BUFFER;
    const tooCloseToVerticalPath =
      Math.abs(patchCenterX - verticalPathX) <=
      patchSize + DIRT_BUFFER;

    if (tooCloseToHorizontalPath || tooCloseToVerticalPath) {
      continue;
    }

    for (let py = -patchSize; py <= patchSize; py++) {
      for (let px = -patchSize; px <= patchSize; px++) {
        const tx = patchCenterX + px;
        const ty = patchCenterY + py;

        const distance = Math.sqrt(px * px + py * py);
        if (distance <= patchSize + 1) {
          if (
            tx >= 0 &&
            tx < MAP_WIDTH &&
            ty >= 0 &&
            ty < MAP_HEIGHT
          ) {
            const tooCloseToHPath =
              Math.abs(ty - horizontalPathY) <= DIRT_BUFFER;
            const tooCloseToVPath =
              Math.abs(tx - verticalPathX) <= DIRT_BUFFER;

            let tooCloseToTree = false;
            for (
              let dy = -DIRT_BUFFER;
              dy <= DIRT_BUFFER;
              dy++
            ) {
              for (
                let dx = -DIRT_BUFFER;
                dx <= DIRT_BUFFER;
                dx++
              ) {
                const checkX = tx + dx;
                const checkY = ty + dy;
                if (
                  checkX >= 0 &&
                  checkX < MAP_WIDTH &&
                  checkY >= 0 &&
                  checkY < MAP_HEIGHT
                ) {
                  if (newMap[checkY][checkX] === "tree") {
                    tooCloseToTree = true;
                    break;
                  }
                }
              }
              if (tooCloseToTree) break;
            }

            if (
              !tooCloseToHPath &&
              !tooCloseToVPath &&
              !tooCloseToTree &&
              (newMap[ty][tx] === "grass" ||
                newMap[ty][tx] === "grass2")
            ) {
              newMap[ty][tx] = "dirt";
            }
          }
        }
      }
    }
  }

  // Add random trees (not near paths or dirt)
  const treeTiles: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 120; i++) {
    const tx =
      Math.floor(
        Math.random() * (MAP_WIDTH - 2 * EDGE_BUFFER),
      ) + EDGE_BUFFER;
    const ty =
      Math.floor(
        Math.random() * (MAP_HEIGHT - 2 * EDGE_BUFFER),
      ) + EDGE_BUFFER;

    // No trees in right half or top-left (handled separately)
    const inRightHalf = tx >= centerX;
    if (inRightHalf) {
      continue;
    }
    if (tx < centerX && ty < centerY) {
      continue;
    }

    const tooCloseToHorizontalPath =
      Math.abs(ty - horizontalPathY) <= PATH_BUFFER;
    const tooCloseToVerticalPath =
      Math.abs(tx - verticalPathX) <= PATH_BUFFER;

    if (newMap[ty][tx] === "dirt") {
      continue;
    }

    let tooCloseToDirt = false;
    for (let dy = -DIRT_BUFFER; dy <= DIRT_BUFFER; dy++) {
      for (let dx = -DIRT_BUFFER; dx <= DIRT_BUFFER; dx++) {
        const checkX = tx + dx;
        const checkY = ty + dy;
        if (
          checkX >= 0 &&
          checkX < MAP_WIDTH &&
          checkY >= 0 &&
          checkY < MAP_HEIGHT
        ) {
          if (newMap[checkY][checkX] === "dirt") {
            tooCloseToDirt = true;
            break;
          }
        }
      }
      if (tooCloseToDirt) break;
    }

    if (
      !tooCloseToHorizontalPath &&
      !tooCloseToVerticalPath &&
      !tooCloseToDirt &&
      (newMap[ty][tx] === "grass" ||
        newMap[ty][tx] === "grass2")
    ) {
      treeTiles.push({ x: tx, y: ty });
    }
  }

  // Smooth pass: remove 1x1 jutouts for grass and dirt texturing
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        const currentTile = newMap[y][x];

        if (
          currentTile === "path" ||
          currentTile === "tree" ||
          currentTile === "building" ||
          currentTile === "sign"
        ) {
          continue;
        }

        const isGrass =
          currentTile === "grass" || currentTile === "grass2";
        const isDirt = currentTile === "dirt";

        const left = newMap[y][x - 1];
        const right = newMap[y][x + 1];
        const up = newMap[y - 1][x];
        const down = newMap[y + 1][x];

        let similarNeighbors = 0;
        let differentNeighbors = 0;

        if (isGrass) {
          if (left === "grass" || left === "grass2")
            similarNeighbors++;
          else differentNeighbors++;
          if (right === "grass" || right === "grass2")
            similarNeighbors++;
          else differentNeighbors++;
          if (up === "grass" || up === "grass2")
            similarNeighbors++;
          else differentNeighbors++;
          if (down === "grass" || down === "grass2")
            similarNeighbors++;
          else differentNeighbors++;
        } else if (isDirt) {
          if (left === "dirt") similarNeighbors++;
          else differentNeighbors++;
          if (right === "dirt") similarNeighbors++;
          else differentNeighbors++;
          if (up === "dirt") similarNeighbors++;
          else differentNeighbors++;
          if (down === "dirt") similarNeighbors++;
          else differentNeighbors++;
        }

        if (differentNeighbors >= 3) {
          const neighborTypes: Tile[] = [
            left,
            right,
            up,
            down,
          ];
          const counts = new Map<Tile, number>();

          neighborTypes.forEach((tile) => {
            if (tile !== currentTile) {
              counts.set(tile, (counts.get(tile) || 0) + 1);
            }
          });

          let maxCount = 0;
          let mostCommon: Tile = "grass";
          counts.forEach((count, tile) => {
            if (count > maxCount) {
              maxCount = count;
              mostCommon = tile;
            }
          });

          newMap[y][x] = mostCommon;
        }
      }
    }
  }

  // Convert tree tiles to FoliageInstance objects and add other foliage types
  const allFoliage: FoliageInstance[] = [];

  // Pre-define pen coordinates for foliage exclusion
  const pen1 = { left: 51, top: 8, right: 59, bottom: 15 };
  const pen2 = { left: 65, top: 15, right: 73, bottom: 22 };
  const pen3 = { left: 49, top: 17, right: 57, bottom: 23 };
  const pen4 = { left: 71, top: 4, right: 75, bottom: 8 };
  const allPens = [pen1, pen2, pen3, pen4];

  // Add trees
  treeTiles.forEach((tilePos) => {
    const rand = Math.random();
    const treeType: TreeType =
      rand < 0.4 ? "small" : rand < 0.7 ? "medium" : "fruit";

    const treeData =
      treeType === "small"
        ? FOLIAGE_TILESET.SMALL_TREE
        : treeType === "medium"
          ? FOLIAGE_TILESET.MEDIUM_TREE
          : FOLIAGE_TILESET.FRUIT_TREE;

    const width = treeData.width;
    const height = treeData.height;

    const topLeftX =
      width === 1
        ? tilePos.x
        : tilePos.x - Math.floor(width / 2);
    const topLeftY = tilePos.y - (height - 1);

    if (house) {
      const h = house;
      const overlaps = !(
        topLeftX + width <= h.x - 1 ||
        topLeftX >= h.x + h.width + 1 ||
        topLeftY + height <= h.y - 1 ||
        topLeftY >= h.y + h.height + 2
      );
      if (overlaps) return;
    }

    allFoliage.push({
      x: topLeftX,
      y: topLeftY,
      type: "tree",
      treeType: treeType,
      width,
      height,
    });
  });

  // Helper: check if position overlaps with any tree
  const overlapsTree = (x: number, y: number): boolean => {
    return allFoliage.some((item) => {
      if (item.type !== "tree") return false;
      return (
        x >= item.x &&
        x < item.x + item.width &&
        y >= item.y &&
        y < item.y + item.height
      );
    });
  };

  // Helper: check if position overlaps with the house
  const overlapsHouse = (
    x: number,
    y: number,
    width: number,
    height: number,
  ): boolean => {
    if (!house) return false;
    const h = house;
    return !(
      x + width <= h.x - 1 ||
      x >= h.x + h.width + 1 ||
      y + height <= h.y - 1 ||
      y >= h.y + h.height + 2
    );
  };

  // Helper: check if position overlaps with any foliage
  const overlapsFoliage = (
    x: number,
    y: number,
    width: number,
    height: number,
  ): boolean => {
    return allFoliage.some((item) => {
      return !(
        x + width <= item.x ||
        x >= item.x + item.width ||
        y + height <= item.y ||
        y >= item.y + item.height
      );
    });
  };

  // Helper: check if position overlaps with any decoration
  const overlapsDecoration = (
    x: number,
    y: number,
    width: number,
    height: number,
    decs: Decoration[],
  ): boolean => {
    return decs.some((dec) => {
      if (dec.type === "fountain") {
        return !(
          x + width <= dec.x ||
          x >= dec.x + 6 ||
          y + height <= dec.y ||
          y >= dec.y + 5
        );
      } else if (dec.type === "campfire") {
        const bufferSize = 2;
        return !(
          x + width <= dec.x - bufferSize ||
          x >= dec.x + 4 + bufferSize ||
          y + height <= dec.y - bufferSize ||
          y >= dec.y + 4 + bufferSize
        );
      } else if (dec.type === "well") {
        return !(
          x + width <= dec.x ||
          x >= dec.x + 2 ||
          y + height <= dec.y ||
          y >= dec.y + 2
        );
      }
      return false;
    });
  };

  // Helper: check if near dirt (within 1 block)
  const nearDirt = (
    x: number,
    y: number,
    width: number,
    height: number,
  ): boolean => {
    for (let dy = -1; dy <= height; dy++) {
      for (let dx = -1; dx <= width; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        if (
          checkX >= 0 &&
          checkX < MAP_WIDTH &&
          checkY >= 0 &&
          checkY < MAP_HEIGHT
        ) {
          if (newMap[checkY][checkX] === "dirt") {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Quadrant helpers
  const inTopRight = (x: number, y: number) => x >= centerX && y < centerY;
  const inBottomRight = (x: number, y: number) => x >= centerX && y >= centerY;

  // Helper: check if position is inside any pen (including fence tiles + 1 buffer)
  const insidePenArea = (x: number, y: number): boolean => {
    return allPens.some((pen) =>
      x >= pen.left - 1 && x <= pen.right + 1 &&
      y >= pen.top - 1 && y <= pen.bottom + 1
    );
  };

  // Helper: check if a bush is adjacent to another bush
  const adjacentToBush = (x: number, y: number): boolean => {
    return allFoliage.some((item) => {
      if (item.type !== "bush") return false;
      const dx = Math.abs(item.x - x);
      const dy = Math.abs(item.y - y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    });
  };

  // Initialize decorations array early so all quadrants can add to it
  const newDecorations: Decoration[] = [];

  // Top-left quadrant: thick forest with circular clearing
  const groveCenter = { x: 20, y: 15 };
  const groveRadius = 12;
  const clearingRadius = 7;
  const forestBuffer = 3;

  // Fill the entire top-left quadrant with dense scattered trees
  for (let attempts = 0; attempts < 300; attempts++) {
    const tx = Math.floor(Math.random() * (centerX - 2 * forestBuffer)) + forestBuffer;
    const ty = Math.floor(Math.random() * (centerY - 2 * forestBuffer)) + forestBuffer;

    if (Math.abs(ty - horizontalPathY) <= 2 || Math.abs(tx - verticalPathX) <= 2) continue;

    const dxC = tx - groveCenter.x;
    const dyC = ty - groveCenter.y;
    const distToCenter = Math.sqrt(dxC * dxC + dyC * dyC);
    if (distToCenter < clearingRadius + 1) continue;

    if (overlapsFoliage(tx, ty, 1, 1) || overlapsHouse(tx - 1, ty - 1, 3, 3)) continue;

    const rand = Math.random();
    const treeType: TreeType = rand < 0.25 ? "forest" : rand < 0.33 ? "forestDarker" : rand < 0.48 ? "eucalyptus" : rand < 0.60 ? "willow" : rand < 0.75 ? "fruit" : rand < 0.90 ? "medium" : "small";
    const width = (treeType === "forest" || treeType === "forestDarker") ? 3 : treeType === "small" ? 1 : 2;
    const height = (treeType === "forest" || treeType === "forestDarker") ? 3 : (treeType === "eucalyptus" || treeType === "willow") ? 4 : 2;
    const topLeftX = width === 1 ? tx : tx - Math.floor(width / 2);
    const topLeftY = ty - (height - 1);

    if (topLeftX < 1 || topLeftX + width >= centerX - 1 || topLeftY < 1 || ty >= centerY - 2) continue;

    allFoliage.push({
      x: topLeftX, y: topLeftY, type: "tree",
      treeType, width, height,
    });
  }

  // Place a dense ring of fruit trees around the clearing
  for (let angle = 0; angle < 360; angle += 8) {
    const rad = (angle * Math.PI) / 180;
    for (let rOff = -1; rOff <= 1; rOff += 1) {
      const r = clearingRadius + 1 + rOff;
      const tx = Math.round(groveCenter.x + Math.cos(rad) * r);
      const ty = Math.round(groveCenter.y + Math.sin(rad) * r);

      if (angle >= 165 && angle <= 195) continue;

      if (tx < 3 || tx >= centerX - 2 || ty < 3 || ty >= centerY - 2) continue;
      if (Math.abs(ty - horizontalPathY) <= 2 || Math.abs(tx - verticalPathX) <= 2) continue;

      if (overlapsFoliage(tx, ty, 1, 1) || overlapsHouse(tx - 1, ty - 1, 3, 3)) continue;

      const rRand = Math.random();
      const treeType: TreeType = rRand < 0.25 ? "forest" : rRand < 0.30 ? "forestDarker" : rRand < 0.45 ? "eucalyptus" : rRand < 0.60 ? "willow" : rRand < 0.80 ? "fruit" : "medium";
      const width = (treeType === "forest" || treeType === "forestDarker") ? 3 : 2;
      const height = (treeType === "forest" || treeType === "forestDarker") ? 3 : (treeType === "eucalyptus" || treeType === "willow") ? 4 : 2;
      const topLeftX = tx - Math.floor(width / 2);
      const topLeftY = ty - (height - 1);

      allFoliage.push({
        x: topLeftX, y: topLeftY, type: "tree",
        treeType, width, height,
      });
    }
  }

  // Place the water well in the center of the grove clearing (2x2 tiles)
  const wellWidth = 2;
  const wellHeight = 2;
  const wellX = groveCenter.x - Math.floor(wellWidth / 2);
  const wellY = groveCenter.y - Math.floor(wellHeight / 2);
  newDecorations.push({
    x: wellX,
    y: wellY,
    type: "well",
    variant: 0,
  });

  // Fill the clearing with flowers, mushrooms, sunflowers, and a few bushes
  for (let gy = groveCenter.y - clearingRadius; gy <= groveCenter.y + clearingRadius; gy++) {
    for (let gx = groveCenter.x - clearingRadius; gx <= groveCenter.x + clearingRadius; gx++) {
      const dx = gx - groveCenter.x;
      const dy = gy - groveCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > clearingRadius - 0.5) continue;

      if (dy > clearingRadius - 2 && Math.abs(dx) <= 1) continue;

      if (gx >= wellX - 1 && gx < wellX + wellWidth + 1 &&
          gy >= wellY - 1 && gy < wellY + wellHeight + 1) continue;

      if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) continue;
      if (newMap[gy][gx] !== "grass" && newMap[gy][gx] !== "grass2") continue;
      if (overlapsFoliage(gx, gy, 1, 1)) continue;

      const noise = ((gx * 73856093 + gy * 19349663) >>> 0) % 100;
      if (noise < 45) {
        allFoliage.push({
          x: gx, y: gy, type: "flower",
          variant: Math.floor(Math.random() * FOLIAGE_TILESET.FLOWERS.length),
          width: 1, height: 1,
        });
      } else if (noise < 60) {
        allFoliage.push({
          x: gx, y: gy, type: "mushroom",
          variant: Math.floor(Math.random() * FOLIAGE_TILESET.MUSHROOMS.length),
          width: 1, height: 1,
        });
      } else if (noise < 70) {
        if (!overlapsFoliage(gx, gy - 1, 1, 2) && gy - 1 >= 0) {
          allFoliage.push({
            x: gx, y: gy - 1, type: "sunflower",
            width: 1, height: 2,
          });
        }
      } else if (noise < 80) {
        if (!adjacentToBush(gx, gy)) {
          allFoliage.push({
            x: gx, y: gy, type: "bush",
            variant: Math.floor(Math.random() * FOLIAGE_TILESET.BUSHES.length),
            width: 1, height: 1,
          });
        }
      }
    }
  }

  // Fill gaps between trees in the forest with ground-level foliage
  for (let fy = forestBuffer; fy < centerY - 2; fy++) {
    for (let fx = forestBuffer; fx < centerX - 2; fx++) {
      if (Math.abs(fy - horizontalPathY) <= 2 || Math.abs(fx - verticalPathX) <= 2) continue;
      const dxC2 = fx - groveCenter.x;
      const dyC2 = fy - groveCenter.y;
      if (Math.sqrt(dxC2 * dxC2 + dyC2 * dyC2) < clearingRadius + 1) continue;
      
      if (newMap[fy][fx] !== "grass" && newMap[fy][fx] !== "grass2") continue;
      if (overlapsFoliage(fx, fy, 1, 1)) continue;

      const noise = ((fx * 48271 + fy * 16807) >>> 0) % 100;
      if (noise < 8) {
        allFoliage.push({
          x: fx, y: fy, type: "flower",
          variant: Math.floor(Math.random() * FOLIAGE_TILESET.FLOWERS.length),
          width: 1, height: 1,
        });
      } else if (noise < 14) {
        allFoliage.push({
          x: fx, y: fy, type: "mushroom",
          variant: Math.floor(Math.random() * FOLIAGE_TILESET.MUSHROOMS.length),
          width: 1, height: 1,
        });
      } else if (noise < 18) {
        if (!adjacentToBush(fx, fy)) {
          allFoliage.push({
            x: fx, y: fy, type: "bush",
            variant: Math.floor(Math.random() * FOLIAGE_TILESET.BUSHES.length),
            width: 1, height: 1,
          });
        }
      }
    }
  }

  // Add bushes (1x1) - not in bottom-right (flower field) or top-right (handled separately)
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(Math.random() * (MAP_WIDTH - 6)) + 3;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;

    if (inTopRight(x, y) || inBottomRight(x, y)) continue;

    const tooCloseToHorizontalPath = Math.abs(y - horizontalPathY) <= 2;
    const tooCloseToVerticalPath = Math.abs(x - verticalPathX) <= 2;

    if (
      !tooCloseToHorizontalPath && !tooCloseToVerticalPath &&
      (newMap[y][x] === "grass" || newMap[y][x] === "grass2") &&
      !overlapsTree(x, y) && !nearDirt(x, y, 1, 1) &&
      !overlapsFoliage(x, y, 1, 1) && !overlapsHouse(x, y, 1, 1) &&
      !adjacentToBush(x, y)
    ) {
      allFoliage.push({
        x, y, type: "bush",
        variant: Math.floor(Math.random() * FOLIAGE_TILESET.BUSHES.length),
        width: 1, height: 1,
      });
    }
  }

  // Add mushrooms (1x1) - not in top-right or bottom-right
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(Math.random() * (MAP_WIDTH - 6)) + 3;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;

    if (inTopRight(x, y) || inBottomRight(x, y)) continue;

    if (
      (newMap[y][x] === "grass" || newMap[y][x] === "grass2") &&
      !overlapsTree(x, y) && !nearDirt(x, y, 1, 1) &&
      !overlapsFoliage(x, y, 1, 1) && !overlapsHouse(x, y, 1, 1)
    ) {
      allFoliage.push({
        x, y, type: "mushroom",
        variant: Math.floor(Math.random() * FOLIAGE_TILESET.MUSHROOMS.length),
        width: 1, height: 1,
      });
    }
  }

  // Add flowers (1x1) - not in top-right, bottom-right handled separately
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * (MAP_WIDTH - 6)) + 3;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;

    if (inTopRight(x, y) || inBottomRight(x, y)) continue;

    const tooCloseToHorizontalPath = Math.abs(y - horizontalPathY) <= 2;
    const tooCloseToVerticalPath = Math.abs(x - verticalPathX) <= 2;

    if (
      !tooCloseToHorizontalPath && !tooCloseToVerticalPath &&
      (newMap[y][x] === "grass" || newMap[y][x] === "grass2") &&
      !overlapsTree(x, y) && !nearDirt(x, y, 1, 1) &&
      !overlapsFoliage(x, y, 1, 1) && !overlapsHouse(x, y, 1, 1)
    ) {
      allFoliage.push({
        x, y, type: "flower",
        variant: Math.floor(Math.random() * FOLIAGE_TILESET.FLOWERS.length),
        width: 1, height: 1,
      });
    }
  }

  // Add sunflowers (1x2) - not in top-right, bottom-right handled separately
  const sunflowerPatches = 5;
  for (let patch = 0; patch < sunflowerPatches; patch++) {
    const patchX = Math.floor(Math.random() * (MAP_WIDTH - 20)) + 10;
    const patchY = Math.floor(Math.random() * (MAP_HEIGHT - 20)) + 10;

    if (inTopRight(patchX, patchY) || inBottomRight(patchX, patchY)) continue;

    const patchSize = Math.floor(Math.random() * 3) + 2;
    const tooCloseToHorizontalPath = Math.abs(patchY - horizontalPathY) <= 3;
    const tooCloseToVerticalPath = Math.abs(patchX - verticalPathX) <= 3;
    if (tooCloseToHorizontalPath || tooCloseToVerticalPath) continue;

    for (let i = 0; i < patchSize; i++) {
      const offsetX = Math.floor(Math.random() * 5) - 2;
      const offsetY = Math.floor(Math.random() * 5) - 2;
      const x = patchX + offsetX;
      const y = patchY + offsetY;

      if (
        y >= 0 && y < MAP_HEIGHT - 1 && x >= 0 && x < MAP_WIDTH &&
        (newMap[y][x] === "grass" || newMap[y][x] === "grass2") &&
        (newMap[y + 1][x] === "grass" || newMap[y + 1][x] === "grass2") &&
        !overlapsTree(x, y) && !overlapsTree(x, y + 1) &&
        !nearDirt(x, y, 1, 2) && !overlapsFoliage(x, y, 1, 2) &&
        !overlapsHouse(x, y, 1, 2)
      ) {
        allFoliage.push({ x, y, type: "sunflower", width: 1, height: 2 });
      }
    }
  }

  // Top-right quadrant: bushes only (no flowers/mushrooms/sunflowers)
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(Math.random() * (MAP_WIDTH - centerX - 3)) + centerX;
    const y = Math.floor(Math.random() * (centerY - 3)) + 3;

    if (
      newMap[y] && newMap[y][x] &&
      !overlapsHouse(x, y, 1, 1) && !overlapsFoliage(x, y, 1, 1) &&
      !insidePenArea(x, y) &&
      !adjacentToBush(x, y) &&
      (newMap[y][x] === "grass" || newMap[y][x] === "grass2" || newMap[y][x] === "dirt")
    ) {
      const tooCloseToHorizontalPath = Math.abs(y - horizontalPathY) <= 2;
      const tooCloseToVerticalPath = Math.abs(x - verticalPathX) <= 2;
      if (tooCloseToHorizontalPath || tooCloseToVerticalPath) continue;

      allFoliage.push({
        x, y, type: "bush",
        variant: Math.floor(Math.random() * FOLIAGE_TILESET.BUSHES.length),
        width: 1, height: 1,
      });
    }
  }

  // Bottom-right quadrant: dense flower field (no bushes/mushrooms/dirt)
  // Ensure no dirt tiles in the flower field
  for (let y = centerY; y < MAP_HEIGHT; y++) {
    for (let x = centerX; x < MAP_WIDTH; x++) {
      if (Math.abs(y - centerY) <= 2 || Math.abs(x - centerX) <= 2) continue;
      if (newMap[y][x] === "dirt") {
        newMap[y][x] = Math.random() < 0.5 ? "grass" : "grass2";
      }
    }
  }

  // Diagonal-striped flower field with empty center clearing
  const quadCenterX = Math.floor((centerX + MAP_WIDTH) / 2);
  const quadCenterY = Math.floor((centerY + MAP_HEIGHT) / 2);
  const clearingRadiusX = 5;
  const clearingRadiusY = 4;

  // Add fountain
  newDecorations.push({
    x: quadCenterX - 3,
    y: quadCenterY - 2,
    type: "fountain",
    variant: 0,
  });

  // Add campfires randomly across the flower field
  const campfireCount = 4;
  const campfireAttempts = 100;
  
  for (let i = 0; i < campfireCount; i++) {
    for (let attempt = 0; attempt < campfireAttempts; attempt++) {
      const cx = centerX + 5 + Math.floor(Math.random() * (MAP_WIDTH - centerX - 8));
      const cy = centerY + 5 + Math.floor(Math.random() * (MAP_HEIGHT - centerY - 8));
      
      let valid = true;
      
      const fountainX = quadCenterX - 3;
      const fountainY = quadCenterY - 2;
      if (
        cx >= fountainX - 4 && cx < fountainX + 10 &&
        cy >= fountainY - 4 && cy < fountainY + 9
      ) {
        valid = false;
      }
      
      for (const dec of newDecorations) {
        if (dec.type === "campfire") {
          const dx = Math.abs(cx - dec.x);
          const dy = Math.abs(cy - dec.y);
          if (dx < 8 && dy < 8) {
            valid = false;
            break;
          }
        }
      }
      
      if (valid) {
        newDecorations.push({
          x: cx,
          y: cy,
          type: "campfire",
          variant: 0,
        });
        break;
      }
    }
  }

  // Iterate over every tile in the bottom-right quadrant for structured diagonal placement
  for (let y = centerY + 3; y < MAP_HEIGHT - 3; y++) {
    for (let x = centerX + 3; x < MAP_WIDTH - 3; x++) {
      if (Math.abs(y - centerY) <= 2 || Math.abs(x - centerX) <= 2) continue;

      const dx = (x - quadCenterX) / clearingRadiusX;
      const dy = (y - quadCenterY) / clearingRadiusY;
      if (dx * dx + dy * dy < 1) continue;
      
      const fountainX = quadCenterX - 3;
      const fountainY = quadCenterY - 2;
      if (x >= fountainX && x < fountainX + 6 && y >= fountainY && y < fountainY + 5) continue;
      
      let skipCampfire = false;
      for (const dec of newDecorations) {
        if (dec.type === "campfire") {
          const bufferSize = 2;
          if (
            x >= dec.x - bufferSize &&
            x < dec.x + 4 + bufferSize &&
            y >= dec.y - bufferSize &&
            y < dec.y + 4 + bufferSize
          ) {
            skipCampfire = true;
            break;
          }
        }
      }
      if (skipCampfire) continue;

      if (!newMap[y] || !newMap[y][x]) continue;
      if (newMap[y][x] !== "grass" && newMap[y][x] !== "grass2") continue;

      const diag1 = (x + y) % 4;
      const diag2 = ((x - y) % 6 + 6) % 6;
      const noise = ((x * 73856093 + y * 19349663) >>> 0) % 100;

      const onPrimaryStripe = diag1 <= 1;
      const onAccentStripe = diag2 === 0;
      const randomScatter = noise < 12;

      if (!onPrimaryStripe && !onAccentStripe && !randomScatter) continue;

      const density = onPrimaryStripe ? 70 : (onAccentStripe ? 55 : 100);
      if (noise % 100 >= density) continue;

      if (
        !overlapsTree(x, y) && !overlapsFoliage(x, y, 1, 1) &&
        !overlapsHouse(x, y, 1, 1)
      ) {
        allFoliage.push({
          x, y, type: "flower",
          variant: Math.floor(((x * 31 + y * 57) >>> 0) % FOLIAGE_TILESET.FLOWERS.length),
          width: 1, height: 1,
        });
      }
    }
  }

  // Sunflower patches distributed via golden-angle spiral around the quadrant
  for (let patch = 0; patch < 18; patch++) {
    const angle = (patch * 137.5 * Math.PI) / 180;
    const dist = 6 + (patch % 5) * 3;
    const patchX = Math.round(quadCenterX + Math.cos(angle) * dist);
    const patchY = Math.round(quadCenterY + Math.sin(angle) * dist);

    const pdx = (patchX - quadCenterX) / clearingRadiusX;
    const pdy = (patchY - quadCenterY) / clearingRadiusY;
    if (pdx * pdx + pdy * pdy < 1.3) continue;
    if (patchX <= centerX + 3 || patchY <= centerY + 3) continue;
    if (patchX >= MAP_WIDTH - 3 || patchY >= MAP_HEIGHT - 3) continue;

    const patchSize = 3 + (patch % 4);
    for (let i = 0; i < patchSize; i++) {
      const ox = Math.floor(((patch * 7 + i * 13) % 7) - 3);
      const oy = Math.floor(((patch * 11 + i * 17) % 7) - 3);
      const x = patchX + ox;
      const y = patchY + oy;

      if (
        y >= centerY + 3 && y < MAP_HEIGHT - 4 && x >= centerX + 3 && x < MAP_WIDTH - 3 &&
        (newMap[y][x] === "grass" || newMap[y][x] === "grass2") &&
        (newMap[y + 1][x] === "grass" || newMap[y + 1][x] === "grass2") &&
        !overlapsTree(x, y) && !overlapsTree(x, y + 1) &&
        !overlapsFoliage(x, y, 1, 2) && !overlapsHouse(x, y, 1, 2) &&
        !overlapsDecoration(x, y, 1, 2, newDecorations)
      ) {
        allFoliage.push({ x, y, type: "sunflower", width: 1, height: 2 });
      }
    }
  }

  // Add tree stumps around campfire areas
  for (const dec of newDecorations) {
    if (dec.type === "campfire") {
      if (Math.random() < 0.8) {
        const stumpCount = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < stumpCount; i++) {
          const offsetX = Math.floor(Math.random() * 6) - 1;
          const offsetY = Math.floor(Math.random() * 6) - 1;
          const x = dec.x + offsetX;
          const y = dec.y + offsetY;
          
          const insideCampfireHitbox =
            x >= dec.x + 1 && x < dec.x + 3 &&
            y >= dec.y + 1 && y < dec.y + 3;
          
          if (
            !insideCampfireHitbox &&
            x >= centerX + 3 && x < MAP_WIDTH - 3 &&
            y >= centerY + 3 && y < MAP_HEIGHT - 3 &&
            (newMap[y]?.[x] === "grass" || newMap[y]?.[x] === "grass2") &&
            !overlapsTree(x, y) && !overlapsFoliage(x, y, 1, 1)
          ) {
            allFoliage.push({
              x, y, type: "stump",
              width: 1, height: 1,
            });
          }
        }
      }
    }
  }
  
  // Remove foliage that overlaps with chicken coop positions
  const coopPenCandidates = [pen1, pen3];
  for (let i = allFoliage.length - 1; i >= 0; i--) {
    const f = allFoliage[i];
    for (const pen of coopPenCandidates) {
      const cx = pen.right - 3;
      const cy = pen.top;
      if (
        f.x >= cx - 1 && f.x < cx + 4 &&
        f.y >= cy - 1 && f.y < cy + 4
      ) {
        allFoliage.splice(i, 1);
        break;
      }
    }
  }

  // Create fenced pens in top-right quadrant
  const buildFencePen = (
    left: number, top: number, right: number, bottom: number,
    gateEdge: "bottom" | "top" | "left" | "right" = "bottom"
  ): Array<{ x: number; y: number }> => {
    const tiles: Array<{ x: number; y: number }> = [];
    const gateCenter = gateEdge === "bottom" || gateEdge === "top"
      ? Math.floor((left + right) / 2)
      : Math.floor((top + bottom) / 2);
    const gateEnd = gateCenter + 1;
    for (let x = left; x <= right; x++) {
      if (gateEdge === "top" && x >= gateCenter && x <= gateEnd) continue;
      tiles.push({ x, y: top });
    }
    for (let x = left; x <= right; x++) {
      if (gateEdge === "bottom" && x >= gateCenter && x <= gateEnd) continue;
      tiles.push({ x, y: bottom });
    }
    for (let y = top + 1; y < bottom; y++) {
      if (gateEdge === "left" && y >= gateCenter && y <= gateEnd) continue;
      tiles.push({ x: left, y });
    }
    for (let y = top + 1; y < bottom; y++) {
      if (gateEdge === "right" && y >= gateCenter && y <= gateEnd) continue;
      tiles.push({ x: right, y });
    }
    return tiles;
  };

  // Build fence tiles for all 4 pens
  const fences: Array<{ x: number; y: number }> = [
    ...buildFencePen(pen1.left, pen1.top, pen1.right, pen1.bottom, "bottom"),
    ...buildFencePen(pen2.left, pen2.top, pen2.right, pen2.bottom, "bottom"),
    ...buildFencePen(pen3.left, pen3.top, pen3.right, pen3.bottom, "bottom"),
  ];

  // Build pen4 fully enclosed (no gate)
  for (let x = pen4.left; x <= pen4.right; x++) {
    fences.push({ x, y: pen4.top });
    fences.push({ x, y: pen4.bottom });
  }
  for (let y = pen4.top + 1; y < pen4.bottom; y++) {
    fences.push({ x: pen4.left, y });
    fences.push({ x: pen4.right, y });
  }

  // Store pen4 interior bounds for the glowing cow
  const glowingCowPenBounds = { left: pen4.left + 1, top: pen4.top + 1, right: pen4.right - 1, bottom: pen4.bottom - 1 };

  // Place chicken coops at top-right of pen1 and pen3
  const coopPens = [pen1, pen3];
  const coopPositions: Array<{ x: number; y: number }> = [];
  coopPens.forEach((pen) => {
    const coopX = pen.right - 3;
    const coopY = pen.top;
    coopPositions.push({ x: coopX, y: coopY });
  });

  // Make pen interiors and 2-tile surrounding area all dirt
  allPens.forEach((pen) => {
    for (let y = pen.top - 2; y <= pen.bottom + 2; y++) {
      for (let x = pen.left - 2; x <= pen.right + 2; x++) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
          if (newMap[y][x] !== "water" && newMap[y][x] !== "path") {
            newMap[y][x] = "dirt";
          }
        }
      }
    }
  });

  // Make house exterior footprint dirt (2-tile radius outside walls)
  if (house) {
    const h = house;
    for (let y = h.y - 2; y <= h.y + h.height + 1; y++) {
      for (let x = h.x - 2; x <= h.x + h.width + 1; x++) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
          if (newMap[y][x] !== "water" && newMap[y][x] !== "path") {
            newMap[y][x] = "dirt";
          }
        }
      }
    }
  }

  // Pen interior bounds for animal spawning
  const penBoundsList = allPens.map((pen) => ({
    left: pen.left + 1,
    top: pen.top + 1,
    right: pen.right - 1,
    bottom: pen.bottom - 1,
  }));

  // Helper: check if a position is clear of collidable objects (1-tile buffer)
  const isPositionClearOfCollisions = (px: number, py: number, buffer: number = 1.0): boolean => {
    for (const item of allFoliage) {
      if (item.type === "tree") {
        const treeCenterX = item.x + (item.width - 1) / 2 + 0.5;
        const treeCenterY = item.y + item.height - 0.5;
        if (Math.abs(px - treeCenterX) < 0.5 + buffer && Math.abs(py - treeCenterY) < 0.5 + buffer) {
          return false;
        }
      }
    }
    for (const coop of coopPositions) {
      if (px >= coop.x - buffer && px < coop.x + 3 + buffer &&
          py >= coop.y - buffer && py < coop.y + 3 + buffer) {
        return false;
      }
    }
    for (const fence of fences) {
      if (Math.abs(px - (fence.x + 0.5)) < 0.5 + buffer && Math.abs(py - (fence.y + 0.5)) < 0.5 + buffer) {
        return false;
      }
    }
    for (const dec of newDecorations) {
      if (dec.type === "fountain") {
        if (px >= dec.x + 1.5 - buffer && px < dec.x + 4.5 + buffer &&
            py >= dec.y + 2 - buffer && py < dec.y + 4 + buffer) {
          return false;
        }
      } else if (dec.type === "campfire") {
        if (px >= dec.x + 1 - buffer && px < dec.x + 3 + buffer &&
            py >= dec.y + 1 - buffer && py < dec.y + 3 + buffer) {
          return false;
        }
      } else if (dec.type === "well") {
        if (px >= dec.x - buffer && px < dec.x + 2 + buffer &&
            py >= dec.y - buffer && py < dec.y + 2 + buffer) {
          return false;
        }
      }
    }
    if (house) {
      const h = house;
      if (px >= h.x - buffer && px < h.x + h.width + buffer &&
          py >= h.y - buffer && py < h.y + h.height + 2 + buffer) {
        return false;
      }
    }
    return true;
  };

  // Helper: find a valid spawn position within bounds
  const findClearPosition = (
    left: number, top: number, right: number, bottom: number,
    maxAttempts: number = 20
  ): { x: number; y: number } => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = left + Math.random() * (right - left);
      const y = top + Math.random() * (bottom - top);
      if (isPositionClearOfCollisions(x, y, 1.0)) {
        return { x, y };
      }
    }
    return { x: (left + right) / 2, y: (top + bottom) / 2 };
  };

  // Spawn penned animals
  const newAnimals: Animal[] = [];

  const penAnimalAssignments: Array<Array<{ type: "chicken" | "cow" }>> = [
    [{ type: "chicken" }, { type: "chicken" }, { type: "chicken" }, { type: "chicken" }],
    [{ type: "cow" }, { type: "cow" }, { type: "cow" }, { type: "cow" }],
    [{ type: "chicken" }, { type: "chicken" }, { type: "cow" }, { type: "cow" }],
    [{ type: "cow" }],
  ];

  penBoundsList.forEach((pb, penIndex) => {
    const penAnimals = penAnimalAssignments[penIndex];
    penAnimals.forEach((pa) => {
      const pos = findClearPosition(pb.left, pb.top, pb.right, pb.bottom);
      const speed = pa.type === "cow" ? 0.003 : Math.random() * 0.008 + 0.005;
      newAnimals.push({
        type: pa.type,
        x: pos.x,
        y: pos.y,
        direction: Math.floor(Math.random() * 4),
        frame: 0,
        speed,
        targetX: pos.x,
        targetY: pos.y,
        moveTimer: 0,
        penned: true,
        penBounds: pb,
      });
    });
  });

  // Also spawn some free-roaming animals outside the pens
  for (let i = 0; i < 6; i++) {
    const type: "chicken" | "cow" =
      Math.random() > 0.5 ? "chicken" : "cow";
    const pos = findClearPosition(10, 10, MAP_WIDTH - 10, MAP_HEIGHT - 10, 30);

    const direction = Math.floor(Math.random() * 4);
    const frame = 0;
    const speed =
      type === "cow" ? 0.003 : Math.random() * 0.008 + 0.005;
    newAnimals.push({
      type,
      x: pos.x,
      y: pos.y,
      direction,
      frame,
      speed,
      targetX: pos.x,
      targetY: pos.y,
      moveTimer: 0,
    });
  }

  return {
    map: newMap,
    foliage: allFoliage,
    fencePositions: fences,
    glowingCowPenBounds,
    chickenCoopPositions: coopPositions,
    animals: newAnimals,
    decorations: newDecorations,
    playerPos: { x: centerX, y: centerY },
  };
}
