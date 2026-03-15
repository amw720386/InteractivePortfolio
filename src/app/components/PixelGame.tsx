import { useEffect, useRef, useState } from "react";
import { drawSilhouetteGlow } from "./pixel-game/rendering/glowEffect";
import { createHouse } from "./pixel-game/houseSetup";
import { useInput } from "./pixel-game/hooks/useInput";
import { useGameLoop } from "./pixel-game/hooks/useGameLoop";
import { useAnimalAI } from "./pixel-game/hooks/useAnimalAI";
import {
  GRASS_TILESET,
  GRASS_AUTOTILE,
  computeGrassEdgeMask,
} from "./pixel-game/maps/grassTilesetMap";
import { DIRT_TILESET } from "./pixel-game/maps/dirtTilesetMap";
import {
  FOLIAGE_TILESET,
  FoliageInstance,
} from "./pixel-game/maps/foliageTilesetMap";
import { PATH_TILESET } from "./pixel-game/maps/pathTilesetMap";
import {
  WALL_TILESET,
  DOOR_TILESET,
  ROOF_TILESET,
  getWallTile,
  getRoofTile,
} from "./pixel-game/maps/houseTilesetMap";
import { getAutoFenceTile } from "./pixel-game/maps/fenceTilesetMap";
import { useSprites } from "./pixel-game/hooks/useSprites";
import { generateMap } from "./pixel-game/mapGeneration";
import {
  TILE_SIZE,
  TILESET_TILE_SIZE,
  PLAYER_SPRITE_SIZE,
  PLAYER_RENDER_SIZE,
  CHICKEN_SPRITE_SIZE,
  CHICKEN_RENDER_SIZE,
  COW_SPRITE_SIZE,
  COW_RENDER_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  EGG_SPRITE_SIZE,
  EGG_FRAMES,
  PLAYER_ANIMATIONS,
  CHICKEN_ANIMATIONS,
  COW_ANIMATIONS,
} from "./pixel-game/constants";
import type {
  Tile,
  Position,
  Animal,
  House,
  Decoration,
} from "./pixel-game/types";

export function PixelGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Tile[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
  });
  const [playerDirection, setPlayerDirection] = useState(0); // 0=down, 1=up, 2=left, 3=right
  const [playerFrame, setPlayerFrame] = useState(0);

  const [canvasSize, setCanvasSize] = useState({
    width: 0,
    height: 0,
  });
  const [animationFrame, setAnimationFrame] = useState(0);
  const [debugCollision, setDebugCollision] = useState(false); // Toggle with 'C' key

  const keysPressed = useRef<Set<string>>(new Set());
  const animals = useRef<Animal[]>([]);
  const decorations = useRef<Decoration[]>([]);
  const foliage = useRef<FoliageInstance[]>([]); // All foliage instances (trees, bushes, mushrooms, flowers, sunflowers)
  const playerFrameCounter = useRef(0);
  const house = useRef<House | null>(null); // Permanent house structure

  // Load all sprites using the hook
  const { spritesLoaded, sprites } = useSprites();

  // Sprite image refs
  const characterSprite = useRef<HTMLImageElement | null>(null);
  const chickenSprite = useRef<HTMLImageElement | null>(null);
  const eggsSprite = useRef<HTMLImageElement | null>(null);
  const breadSprite = useRef<HTMLImageElement | null>(null);
  const grassTileset = useRef<HTMLImageElement | null>(null);
  const dirtTileset = useRef<HTMLImageElement | null>(null);
  const foliageTileset = useRef<HTMLImageElement | null>(null);
  const pathTileset = useRef<HTMLImageElement | null>(null);
  const houseTileset = useRef<HTMLImageElement | null>(null);
  const furnitureTileset = useRef<HTMLImageElement | null>(
    null,
  );
  const fenceTileset = useRef<HTMLImageElement | null>(null);
  const fountainTileset = useRef<HTMLImageElement | null>(null);
  const campfireTileset = useRef<HTMLImageElement | null>(null);
  const chickenCoopSprite = useRef<HTMLImageElement | null>(
    null,
  );
  const forestTreeSprite = useRef<HTMLImageElement | null>(
    null,
  );
  const forestTreeDarkerSprite =
    useRef<HTMLImageElement | null>(null);
  const extraTreesTilesetRef = useRef<HTMLImageElement | null>(
    null,
  );
  const statueTilesetRef = useRef<HTMLImageElement | null>(
    null,
  );

  // Chicken coop positions in pens
  const chickenCoopPositions = useRef<
    Array<{ x: number; y: number }>
  >([]);

  // Fence positions: array of {x, y} tile coordinates
  const fencePositions = useRef<
    Array<{ x: number; y: number }>
  >([]);

  // Pen4 interior bounds - used to identify the glowing cow
  const glowingCowPenBounds = useRef<{
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null>(null);

  // Update refs when sprites are loaded
  useEffect(() => {
    if (spritesLoaded) {
      characterSprite.current = sprites.characterSprite;
      chickenSprite.current = sprites.chickenSprite;
      eggsSprite.current = sprites.eggsSprite;
      breadSprite.current = sprites.breadSprite;
      grassTileset.current = sprites.grassTileset;
      dirtTileset.current = sprites.dirtTileset;
      foliageTileset.current = sprites.foliageTileset;
      pathTileset.current = sprites.pathTileset;
      houseTileset.current = sprites.houseTileset;
      furnitureTileset.current = sprites.furnitureTileset;
      fenceTileset.current = sprites.fenceTileset;
      fountainTileset.current = sprites.fountainTileset;
      campfireTileset.current = sprites.campfireTileset;
      chickenCoopSprite.current = sprites.chickenCoop;
      forestTreeSprite.current = sprites.forestTree;
      forestTreeDarkerSprite.current = sprites.forestTreeDarker;
      extraTreesTilesetRef.current = sprites.extraTreesTileset;
      statueTilesetRef.current = sprites.statueTileset;
    }
  }, [spritesLoaded, sprites]);

  // Set canvas size to match window
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () =>
      window.removeEventListener("resize", updateSize);
  }, []);

  // Animation frame counter for water/wind effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((f) => (f + 1) % 60);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Create permanent house structure (non-procedural)
  useEffect(() => {
    house.current = createHouse();
  }, []);

  // Generate procedural map
  useEffect(() => {
    const result = generateMap(house.current);
    setMap(result.map);
    setPlayerPos(result.playerPos);
    foliage.current = result.foliage;
    fencePositions.current = result.fencePositions;
    glowingCowPenBounds.current = result.glowingCowPenBounds;
    chickenCoopPositions.current = result.chickenCoopPositions;
    animals.current = result.animals;
    decorations.current = result.decorations;
  }, []);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || map.length === 0 || canvasSize.width === 0)
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Check if player is inside house
    let playerInsideHouse = false;
    if (house.current) {
      const h = house.current;
      const playerTileX = Math.floor(playerPos.x);
      const playerTileY = Math.floor(playerPos.y);
      const playerRelativeX = playerTileX - h.x;
      const playerRelativeY = playerTileY - h.y;
      playerInsideHouse =
        playerRelativeX >= 0 &&
        playerRelativeX < h.width &&
        playerRelativeY >= 0 &&
        playerRelativeY < h.height;
    }

    const viewportWidth = Math.floor(canvas.width / TILE_SIZE);
    const viewportHeight = Math.floor(
      canvas.height / TILE_SIZE,
    );

    // Camera follows player - centered on player
    const targetCameraX = playerPos.x - viewportWidth / 2;
    const targetCameraY = playerPos.y - viewportHeight / 2;

    // Render tiles
    // Render tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        // Floor to prevent sub-pixel rendering that causes black lines
        const screenX = Math.floor(
          (x - targetCameraX) * TILE_SIZE,
        );
        const screenY = Math.floor(
          (y - targetCameraY) * TILE_SIZE,
        );

        if (
          screenX < -TILE_SIZE ||
          screenX > canvas.width ||
          screenY < -TILE_SIZE ||
          screenY > canvas.height
        ) {
          continue;
        }

        const tile = map[y][x];

        switch (tile) {
          case "grass":
          case "grass2":
            // Use grass tileset with 3x3 border system and foliage variations
            if (
              grassTileset.current &&
              grassTileset.current.complete
            ) {
              // Helper: treat grass, grass2, tree, and path as "grass-like" for edge detection
              const isGrassLike = (
                tx: number,
                ty: number,
              ): boolean => {
                if (
                  tx < 0 ||
                  tx >= MAP_WIDTH ||
                  ty < 0 ||
                  ty >= MAP_HEIGHT
                )
                  return false;
                const t = map[ty][tx];
                return (
                  t === "grass" ||
                  t === "grass2" ||
                  t === "tree" ||
                  t === "path"
                );
              };

              // Check if any cardinal neighbor is dirt (to draw dirt underneath)
              const hasAnyDirtNeighbor =
                (x > 0 && map[y][x - 1] === "dirt") ||
                (x < MAP_WIDTH - 1 &&
                  map[y][x + 1] === "dirt") ||
                (y > 0 && map[y - 1][x] === "dirt") ||
                (y < MAP_HEIGHT - 1 &&
                  map[y + 1][x] === "dirt");

              // Also check diagonal dirt neighbors for proper corner rendering
              const hasAnyDirtDiag =
                (x > 0 &&
                  y > 0 &&
                  map[y - 1][x - 1] === "dirt") ||
                (x < MAP_WIDTH - 1 &&
                  y > 0 &&
                  map[y - 1][x + 1] === "dirt") ||
                (x > 0 &&
                  y < MAP_HEIGHT - 1 &&
                  map[y + 1][x - 1] === "dirt") ||
                (x < MAP_WIDTH - 1 &&
                  y < MAP_HEIGHT - 1 &&
                  map[y + 1][x + 1] === "dirt");

              // If grass has dirt neighbors, draw dirt UNDERNEATH first (layered effect)
              if (
                (hasAnyDirtNeighbor || hasAnyDirtDiag) &&
                dirtTileset.current &&
                dirtTileset.current.complete
              ) {
                ctx.drawImage(
                  dirtTileset.current,
                  1 * TILESET_TILE_SIZE,
                  1 * TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  screenX,
                  screenY,
                  TILE_SIZE,
                  TILE_SIZE,
                );
              }

              // Compute full 47-tile autotile bitmask (cardinals + inner corners)
              const edgeMask = computeGrassEdgeMask(
                x,
                y,
                MAP_WIDTH,
                MAP_HEIGHT,
                isGrassLike,
              );

              let tileCol = 1;
              let tileRow = 1;

              if (edgeMask === 0) {
                // Center tile - use foliage variation or plain center
                const hash =
                  (x * 73856093 + y * 19349663) % 100;
                const usefoliage = hash < 30;

                if (usefoliage) {
                  const foliageVariations =
                    GRASS_TILESET.FOLIAGE;
                  const foliageHash =
                    ((x * 83 + y * 97) ^ (x * y)) %
                    foliageVariations.length;
                  const foliage =
                    foliageVariations[foliageHash];
                  tileCol = foliage.col;
                  tileRow = foliage.row;
                }
              } else {
                // Look up the correct edge/corner tile from the autotile table
                const autotile = GRASS_AUTOTILE[edgeMask];
                if (autotile) {
                  tileCol = autotile.col;
                  tileRow = autotile.row;
                }
                // If no exact match found, fall back to center (1,1)
              }

              // Draw the grass tile ON TOP (layered over dirt if present)
              ctx.drawImage(
                grassTileset.current,
                tileCol * TILESET_TILE_SIZE,
                tileRow * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            } else {
              // Fallback: Simple colored grass
              ctx.fillStyle =
                tile === "grass" ? "#4a7c59" : "#45735e";
              ctx.fillRect(
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
              ctx.fillStyle = "#5a8c69";
              ctx.fillRect(screenX + 4, screenY + 4, 4, 4);
            }
            break;
          case "dirt":
            // Dirt always uses center tile - NO EDGE CALCULATIONS
            if (
              dirtTileset.current &&
              dirtTileset.current.complete
            ) {
              // Always draw center dirt tile (1, 1)
              ctx.drawImage(
                dirtTileset.current,
                1 * TILESET_TILE_SIZE,
                1 * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            } else {
              // Fallback: Simple colored dirt
              ctx.fillStyle = "#8B7355";
              ctx.fillRect(
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
              ctx.fillStyle = "#7A624A";
              ctx.fillRect(screenX + 4, screenY + 4, 4, 4);
            }
            break;
          case "water":
            // Blue water fallback
            ctx.fillStyle = "#1e3a8a";
            ctx.fillRect(
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
            ctx.fillStyle = "#2563eb";
            ctx.fillRect(
              screenX + 2,
              screenY + 2,
              TILE_SIZE - 4,
              TILE_SIZE - 4,
            );
            break;
          case "path":
            // Draw grass UNDERNEATH path planks (path tiles are transparent)
            if (
              grassTileset.current &&
              grassTileset.current.complete
            ) {
              // Use center grass tile as background
              ctx.drawImage(
                grassTileset.current,
                1 * TILESET_TILE_SIZE,
                1 * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            } else {
              // Fallback grass color
              ctx.fillStyle = "#4a7c59";
              ctx.fillRect(
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            }

            // Draw wooden path planks ON TOP using path tileset
            if (
              pathTileset.current &&
              pathTileset.current.complete
            ) {
              const centerX = Math.floor(MAP_WIDTH / 2);
              const centerY = Math.floor(MAP_HEIGHT / 2);

              // Determine if this is horizontal or vertical path (3-tile thick paths)
              const isHorizontalPath =
                Math.abs(y - centerY) <= 1;
              const isVerticalPath = Math.abs(x - centerX) <= 1;

              let pathTileCol = 2; // Default to middle
              let pathTileRow = 3;

              if (isHorizontalPath && !isVerticalPath) {
                // Horizontal path - use horizontal planks (row 3)
                // Check neighbors to determine which variant
                const hasPathLeft =
                  x > 0 && map[y][x - 1] === "path";
                const hasPathRight =
                  x < MAP_WIDTH - 1 && map[y][x + 1] === "path";

                if (!hasPathLeft && hasPathRight) {
                  // Left edge - fewer planks on left
                  pathTileCol =
                    PATH_TILESET.HORIZONTAL.LEFT.col;
                  pathTileRow =
                    PATH_TILESET.HORIZONTAL.LEFT.row;
                } else if (hasPathLeft && !hasPathRight) {
                  // Right edge - fewer planks on right
                  pathTileCol =
                    PATH_TILESET.HORIZONTAL.RIGHT.col;
                  pathTileRow =
                    PATH_TILESET.HORIZONTAL.RIGHT.row;
                } else {
                  // Middle - consistent planks
                  pathTileCol =
                    PATH_TILESET.HORIZONTAL.MIDDLE.col;
                  pathTileRow =
                    PATH_TILESET.HORIZONTAL.MIDDLE.row;
                }
              } else if (isVerticalPath) {
                // Vertical path - use vertical planks (column 0)
                // Check neighbors to determine which variant
                const hasPathUp =
                  y > 0 && map[y - 1][x] === "path";
                const hasPathDown =
                  y < MAP_HEIGHT - 1 &&
                  map[y + 1][x] === "path";

                if (!hasPathUp && hasPathDown) {
                  // Top edge - fewer planks on top
                  pathTileCol = PATH_TILESET.VERTICAL.TOP.col;
                  pathTileRow = PATH_TILESET.VERTICAL.TOP.row;
                } else if (hasPathUp && !hasPathDown) {
                  // Bottom edge - fewer planks on bottom
                  pathTileCol =
                    PATH_TILESET.VERTICAL.BOTTOM.col;
                  pathTileRow =
                    PATH_TILESET.VERTICAL.BOTTOM.row;
                } else {
                  // Middle - consistent planks
                  pathTileCol =
                    PATH_TILESET.VERTICAL.MIDDLE.col;
                  pathTileRow =
                    PATH_TILESET.VERTICAL.MIDDLE.row;
                }
              }

              ctx.drawImage(
                pathTileset.current,
                pathTileCol * TILESET_TILE_SIZE,
                pathTileRow * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            } else {
              // Fallback: simple brown path
              ctx.fillStyle = "#92783f";
              ctx.fillRect(
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            }
            break;
          case "tree":
            // Trees are now rendered from foliage tileset with depth sorting
            // Just draw grass background here
            ctx.fillStyle = "#4a7c59";
            ctx.fillRect(
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
            break;
          case "sign":
            // Draw grass background for sign tile
            ctx.fillStyle = "#4a7c59";
            ctx.fillRect(
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
            break;
          case "building":
            // Buildings are rendered separately
            break;
        }
      }
    }

    // Add house FLOOR to regular tile rendering (always below player)
    if (
      house.current &&
      houseTileset.current &&
      houseTileset.current.complete
    ) {
      const h = house.current;

      // Render floor tiles (center floor tiles) - these render with the ground layer
      for (let hy = 0; hy < h.height; hy++) {
        for (let hx = 0; hx < h.width; hx++) {
          const houseTile = h.tiles[hy][hx];
          if (
            houseTile.type === "floor" ||
            houseTile.type === "door"
          ) {
            const screenX =
              (h.x + hx - targetCameraX) * TILE_SIZE;
            const screenY =
              (h.y + hy - targetCameraY) * TILE_SIZE;
            ctx.drawImage(
              houseTileset.current,
              WALL_TILESET.center.x * TILESET_TILE_SIZE,
              WALL_TILESET.center.y * TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
          }
        }
      }
    }

    // Render INTERIOR floor tiles at remote location
    if (
      house.current &&
      houseTileset.current &&
      houseTileset.current.complete
    ) {
      const h = house.current;
      for (let hy = 0; hy < h.interiorHeight; hy++) {
        for (let hx = 0; hx < h.interiorWidth; hx++) {
          const worldX = h.interiorX + hx;
          const worldY = h.interiorY + hy;
          const screenX = (worldX - targetCameraX) * TILE_SIZE;
          const screenY = (worldY - targetCameraY) * TILE_SIZE;

          // Skip if off-screen
          if (
            screenX < -TILE_SIZE ||
            screenX > canvas.width ||
            screenY < -TILE_SIZE ||
            screenY > canvas.height
          ) {
            continue;
          }

          // Render floor tile
          ctx.drawImage(
            houseTileset.current,
            WALL_TILESET.center.x * TILESET_TILE_SIZE,
            WALL_TILESET.center.y * TILESET_TILE_SIZE,
            TILESET_TILE_SIZE,
            TILESET_TILE_SIZE,
            screenX,
            screenY,
            TILE_SIZE,
            TILE_SIZE,
          );
        }
      }
    }

    // Decorations are now rendered in the depth sorting system below

    // Depth-sorted rendering: trees, player, animals, and decorations
    // Sort by Y position (lower Y = render first = appears behind)
    interface DepthEntity {
      type: "tree" | "player" | "animal" | "decoration";
      y: number; // Y position for sorting (bottom-most point)
      renderFn: () => void;
    }

    const depthEntities: DepthEntity[] = [];

    // Add ALL foliage types to depth sorting (trees, bushes, mushrooms, flowers, sunflowers)
    foliage.current.forEach((item) => {
      // Calculate bottom Y for depth sorting
      // For 1x1 at y=10: bottomY = 10 (the tile it's on)
      // For 1x2 at y=10: bottomY = 11 (the bottom tile)
      // For player at y=10: playerY should be 10 (standing on tile 10)
      // Player should render in FRONT of items on the same tile, so foliage gets a slight offset
      // Sunflowers are tall but skinny — depth sorts at their very bottom so player goes behind only when directly below
      const bottomY =
        item.type === "sunflower"
          ? item.y + item.height - 0.5 - 0.1 // Half tile up from bottom for skinny sunflowers
          : item.type === "bush"
            ? item.y + item.height - 0.5 - 0.1 // Bushes: half tile lower for better depth perception
            : item.y + item.height - 1 - 0.1; // Normal: subtract 0.1 so foliage behind player on same tile

      depthEntities.push({
        type: "tree",
        y: bottomY,
        renderFn: () => {
          // Render foliage from foliage tileset
          if (
            !foliageTileset.current ||
            !foliageTileset.current.complete
          )
            return;

          if (item.type === "tree") {
            // Render forest trees (3x3, single sprite image)
            if (item.treeType === "forest") {
              if (
                forestTreeSprite.current &&
                forestTreeSprite.current.complete
              ) {
                const screenX =
                  (item.x - targetCameraX) * TILE_SIZE;
                const screenY =
                  (item.y - targetCameraY) * TILE_SIZE;
                ctx.drawImage(
                  forestTreeSprite.current,
                  0,
                  0,
                  48,
                  48, // source: full 48x48 image
                  screenX,
                  screenY,
                  TILE_SIZE * 3,
                  TILE_SIZE * 3, // dest: 3x3 tiles
                );
              }
            } else if (item.treeType === "forestDarker") {
              if (
                forestTreeDarkerSprite.current &&
                forestTreeDarkerSprite.current.complete
              ) {
                const screenX =
                  (item.x - targetCameraX) * TILE_SIZE;
                const screenY =
                  (item.y - targetCameraY) * TILE_SIZE;
                ctx.drawImage(
                  forestTreeDarkerSprite.current,
                  0,
                  0,
                  48,
                  48, // source: full 48x48 image
                  screenX,
                  screenY,
                  TILE_SIZE * 3,
                  TILE_SIZE * 3, // dest: 3x3 tiles
                );
              }
            } else if (
              item.treeType === "eucalyptus" ||
              item.treeType === "willow"
            ) {
              // Render eucalyptus (2x3) or willow (2x3) from extra trees tileset
              if (
                extraTreesTilesetRef.current &&
                extraTreesTilesetRef.current.complete
              ) {
                const screenX =
                  (item.x - targetCameraX) * TILE_SIZE;
                const screenY =
                  (item.y - targetCameraY) * TILE_SIZE;
                // Eucalyptus: tileset pos (30,8), Willow: tileset pos (32,8) — each 2x4 tiles at 16px
                const srcX =
                  item.treeType === "eucalyptus"
                    ? 30 * 16
                    : 32 * 16;
                const srcY = 8 * 16;
                ctx.drawImage(
                  extraTreesTilesetRef.current,
                  srcX,
                  srcY,
                  32,
                  64, // source: 2x4 tiles at 16px = 32x64
                  screenX,
                  screenY,
                  TILE_SIZE * 2,
                  TILE_SIZE * 4, // dest: 2x4 tiles
                );
              }
            } else if (item.treeType === "small") {
              // 1x2 small tree
              const smallTree = FOLIAGE_TILESET.SMALL_TREE;
              const topScreenX =
                (item.x - targetCameraX) * TILE_SIZE;
              const topScreenY =
                (item.y - targetCameraY) * TILE_SIZE;
              ctx.drawImage(
                foliageTileset.current!,
                smallTree.TOP.col * TILESET_TILE_SIZE,
                smallTree.TOP.row * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                topScreenX,
                topScreenY,
                TILE_SIZE,
                TILE_SIZE,
              );

              const bottomScreenX =
                (item.x - targetCameraX) * TILE_SIZE;
              const bottomScreenY =
                (item.y + 1 - targetCameraY) * TILE_SIZE;
              ctx.drawImage(
                foliageTileset.current!,
                smallTree.BOTTOM.col * TILESET_TILE_SIZE,
                smallTree.BOTTOM.row * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                bottomScreenX,
                bottomScreenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            } else {
              // 2x2 trees (medium and fruit)
              const treeData =
                item.treeType === "medium"
                  ? FOLIAGE_TILESET.MEDIUM_TREE
                  : FOLIAGE_TILESET.FRUIT_TREE;
              const tiles = [
                { tile: treeData.TOP_LEFT, x: 0, y: 0 },
                { tile: treeData.TOP_RIGHT, x: 1, y: 0 },
                { tile: treeData.BOTTOM_LEFT, x: 0, y: 1 },
                { tile: treeData.BOTTOM_RIGHT, x: 1, y: 1 },
              ];

              tiles.forEach(({ tile, x, y }) => {
                const screenX =
                  (item.x + x - targetCameraX) * TILE_SIZE;
                const screenY =
                  (item.y + y - targetCameraY) * TILE_SIZE;
                ctx.drawImage(
                  foliageTileset.current!,
                  tile.col * TILESET_TILE_SIZE,
                  tile.row * TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  screenX,
                  screenY,
                  TILE_SIZE,
                  TILE_SIZE,
                );
              });
            }
          } else if (item.type === "bush") {
            // Render bush (1x1)
            const bushData =
              FOLIAGE_TILESET.BUSHES[item.variant || 0];
            const screenX =
              (item.x - targetCameraX) * TILE_SIZE;
            const screenY =
              (item.y - targetCameraY) * TILE_SIZE;
            ctx.drawImage(
              foliageTileset.current!,
              bushData.col * TILESET_TILE_SIZE,
              bushData.row * TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
          } else if (item.type === "mushroom") {
            // Render mushroom (1x1)
            const mushroomData =
              FOLIAGE_TILESET.MUSHROOMS[item.variant || 0];
            const screenX =
              (item.x - targetCameraX) * TILE_SIZE;
            const screenY =
              (item.y - targetCameraY) * TILE_SIZE;
            ctx.drawImage(
              foliageTileset.current!,
              mushroomData.col * TILESET_TILE_SIZE,
              mushroomData.row * TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
          } else if (item.type === "flower") {
            // Render flower (1x1)
            const flowerData =
              FOLIAGE_TILESET.FLOWERS[item.variant || 0];
            const screenX =
              (item.x - targetCameraX) * TILE_SIZE;
            const screenY =
              (item.y - targetCameraY) * TILE_SIZE;
            ctx.drawImage(
              foliageTileset.current!,
              flowerData.col * TILESET_TILE_SIZE,
              flowerData.row * TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
          } else if (item.type === "sunflower") {
            // Render sunflower (1x2)
            const topScreenX =
              (item.x - targetCameraX) * TILE_SIZE;
            const topScreenY =
              (item.y - targetCameraY) * TILE_SIZE;
            ctx.drawImage(
              foliageTileset.current!,
              FOLIAGE_TILESET.SUNFLOWER.TOP.col *
                TILESET_TILE_SIZE,
              FOLIAGE_TILESET.SUNFLOWER.TOP.row *
                TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              topScreenX,
              topScreenY,
              TILE_SIZE,
              TILE_SIZE,
            );

            const bottomScreenX =
              (item.x - targetCameraX) * TILE_SIZE;
            const bottomScreenY =
              (item.y + 1 - targetCameraY) * TILE_SIZE;
            ctx.drawImage(
              foliageTileset.current!,
              FOLIAGE_TILESET.SUNFLOWER.BOTTOM.col *
                TILESET_TILE_SIZE,
              FOLIAGE_TILESET.SUNFLOWER.BOTTOM.row *
                TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              bottomScreenX,
              bottomScreenY,
              TILE_SIZE,
              TILE_SIZE,
            );
          } else if (item.type === "stump") {
            // Render tree stump (1x1)
            const screenX =
              (item.x - targetCameraX) * TILE_SIZE;
            const screenY =
              (item.y - targetCameraY) * TILE_SIZE;
            ctx.drawImage(
              foliageTileset.current!,
              FOLIAGE_TILESET.TREE_STUMP.col *
                TILESET_TILE_SIZE,
              FOLIAGE_TILESET.TREE_STUMP.row *
                TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
          }
        },
      });
    });

    // Add house WALLS and ROOF to depth sorting (render house with its bottom at house.y + house.height)
    if (
      house.current &&
      houseTileset.current &&
      houseTileset.current.complete
    ) {
      const h = house.current;
      // House bottom Y is at h.y + h.height - 1
      const houseBottomY = h.y + h.height - 1;

      depthEntities.push({
        type: "tree", // Use 'tree' type for structures
        y: houseBottomY,
        renderFn: () => {
          if (
            !house.current ||
            !houseTileset.current ||
            !houseTileset.current.complete
          )
            return;
          const h = house.current;

          // House layout (8x4 with door at bottom center)
          // Row 0 (top): [TL] [TC] [TC] [TC] [TC] [TC] [TC] [TR]
          // Row 1-2 (sides): [ML] [floor] [floor] [floor] [floor] [floor] [floor] [MR]
          // Row 3 (bottom): [BL] [BC] [BC] [DOOR] [BC] [BC] [BC] [BR]

          // Render walls - HARDCODED positions
          for (let hy = 0; hy < h.height; hy++) {
            for (let hx = 0; hx < h.width; hx++) {
              const screenX =
                (h.x + hx - targetCameraX) * TILE_SIZE;
              const screenY =
                (h.y + hy - targetCameraY) * TILE_SIZE;

              // Skip floor tiles (already rendered below)
              if (h.tiles[hy][hx].type === "floor") continue;

              // Door
              if (h.tiles[hy][hx].type === "door") {
                const doorCoords = h.doorOpen
                  ? DOOR_TILESET.open
                  : DOOR_TILESET.closed;
                ctx.drawImage(
                  houseTileset.current!,
                  doorCoords.x * TILESET_TILE_SIZE,
                  doorCoords.y * TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  screenX,
                  screenY,
                  TILE_SIZE,
                  TILE_SIZE,
                );
                continue;
              }

              // Wall positions
              let wallX = 1,
                wallY = 2; // Default to center floor

              // Top row
              if (hy === 0) {
                if (hx === 0) {
                  wallX = 0;
                  wallY = 1;
                } // Top-left corner
                else if (hx === h.width - 1) {
                  wallX = 2;
                  wallY = 1;
                } // Top-right corner
                else {
                  wallX = 1;
                  wallY = 1;
                } // Top center wall
              }
              // Bottom row
              else if (hy === h.height - 1) {
                if (hx === 0) {
                  wallX = 0;
                  wallY = 3;
                } // Bottom-left corner
                else if (hx === h.width - 1) {
                  wallX = 2;
                  wallY = 3;
                } // Bottom-right corner
                else {
                  wallX = 1;
                  wallY = 3;
                } // Bottom center wall
              }
              // Left edge
              else if (hx === 0) {
                wallX = 0;
                wallY = 2; // Middle-left wall
              }
              // Right edge
              else if (hx === h.width - 1) {
                wallX = 2;
                wallY = 2; // Middle-right wall
              }

              ctx.drawImage(
                houseTileset.current!,
                wallX * TILESET_TILE_SIZE,
                wallY * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            }
          }
        },
      });
    }

    // Add decorations to depth sorting
    decorations.current.forEach((decoration) => {
      // Calculate bottom Y for depth sorting based on decoration size
      let bottomY = decoration.y;
      if (decoration.type === "fountain") {
        bottomY = decoration.y + 5 - 1; // Fountain is 5 tiles tall
      } else if (decoration.type === "campfire") {
        bottomY = decoration.y + 4 - 1; // Campfire is 4 tiles tall
      } else if (decoration.type === "well") {
        bottomY = decoration.y + 2 - 1; // Well is 2 tiles tall
      }

      depthEntities.push({
        type: "decoration",
        y: bottomY,
        renderFn: () => {
          const screenX =
            (decoration.x - targetCameraX) * TILE_SIZE;
          const screenY =
            (decoration.y - targetCameraY) * TILE_SIZE;

          if (
            screenX < -TILE_SIZE * 6 ||
            screenX > canvas.width ||
            screenY < -TILE_SIZE * 6 ||
            screenY > canvas.height
          ) {
            return;
          }

          if (
            decoration.type === "egg" &&
            eggsSprite.current &&
            eggsSprite.current.complete
          ) {
            // Eggs sprite sheet is 64x16 (4x1 grid), use EGG_FRAMES mapping
            const frameIndex = [
              EGG_FRAMES.egg,
              EGG_FRAMES.cracked_egg,
              EGG_FRAMES.nest,
            ][decoration.variant % 3];
            const srcX = frameIndex * EGG_SPRITE_SIZE;
            ctx.drawImage(
              eggsSprite.current,
              srcX,
              0,
              EGG_SPRITE_SIZE,
              EGG_SPRITE_SIZE,
              screenX,
              screenY,
              TILE_SIZE * 1.2,
              TILE_SIZE * 1.2,
            );
          } else if (
            decoration.type === "bread" &&
            breadSprite.current &&
            breadSprite.current.complete
          ) {
            // Bread sprite (cow sprite) is 96x64 (3x2 grid), 32x32 per frame - RENDER MUCH BIGGER
            const frameIndex = decoration.variant % 6; // 6 total frames
            const srcX = (frameIndex % 3) * COW_SPRITE_SIZE; // Column
            const srcY =
              Math.floor(frameIndex / 3) * COW_SPRITE_SIZE; // Row
            ctx.drawImage(
              breadSprite.current,
              srcX,
              srcY,
              COW_SPRITE_SIZE,
              COW_SPRITE_SIZE,
              screenX - TILE_SIZE / 2,
              screenY - TILE_SIZE / 2,
              COW_RENDER_SIZE,
              COW_RENDER_SIZE,
            );
          } else if (
            decoration.type === "fountain" &&
            fountainTileset.current &&
            fountainTileset.current.complete
          ) {
            // Fountain spritesheet: 800x96 total, 10 frames of 80x96 each
            // Fountain takes up 6x5 tiles on the map
            const animFrame = Math.floor(
              (Date.now() / 100) % 10,
            ); // Cycle through 10 frames, 100ms each
            const srcX = animFrame * 80; // Each frame is 80px wide
            const srcY = 0;
            const fountainWidth = TILE_SIZE * 6; // 6 tiles wide
            const fountainHeight = TILE_SIZE * 5; // 5 tiles tall

            // Draw glowing effect behind fountain
            drawSilhouetteGlow(
              ctx,
              fountainTileset.current,
              srcX,
              srcY,
              80, // Source width
              96, // Source height
              screenX,
              screenY,
              fountainWidth,
              fountainHeight,
            );

            // Draw fountain on top of glow
            ctx.drawImage(
              fountainTileset.current,
              srcX,
              srcY,
              80, // Source width
              96, // Source height
              screenX,
              screenY,
              fountainWidth,
              fountainHeight,
            );
          } else if (
            decoration.type === "campfire" &&
            campfireTileset.current &&
            campfireTileset.current.complete
          ) {
            // Campfire spritesheet: 384x64 total, 6 frames of 64x64 each
            // Campfire takes up 4x4 tiles on the map (64px sprite on 16px tiles = 4x scale)
            const animFrame = Math.floor(
              (Date.now() / 150) % 6,
            ); // Cycle through 6 frames, 150ms each
            const srcX = animFrame * 64; // Each frame is 64px wide
            const srcY = 0;
            const campfireSize = TILE_SIZE * 4; // 4x4 tiles

            ctx.drawImage(
              campfireTileset.current,
              srcX,
              srcY,
              64, // Source width
              64, // Source height
              screenX,
              screenY,
              campfireSize,
              campfireSize,
            );
          } else if (
            decoration.type === "well" &&
            statueTilesetRef.current &&
            statueTilesetRef.current.complete
          ) {
            // Well: 32x32 source image, renders as 2x2 tiles
            const wellRenderSize = TILE_SIZE * 2;

            // Draw glowing effect behind well
            drawSilhouetteGlow(
              ctx,
              statueTilesetRef.current,
              0,
              0,
              32,
              32,
              screenX,
              screenY,
              wellRenderSize,
              wellRenderSize,
            );

            // Draw well on top of glow
            ctx.drawImage(
              statueTilesetRef.current,
              0,
              0,
              32,
              32,
              screenX,
              screenY,
              wellRenderSize,
              wellRenderSize,
            );
          }
        },
      });
    });

    // Add player to depth sorting
    depthEntities.push({
      type: "player",
      y: playerPos.y,
      renderFn: () => {
        // Center the sprite on the player's collision position
        const playerCenterScreenX =
          (playerPos.x - targetCameraX) * TILE_SIZE;
        const playerCenterScreenY =
          (playerPos.y - targetCameraY) * TILE_SIZE;

        const playerScreenX =
          playerCenterScreenX - PLAYER_RENDER_SIZE / 2;
        const playerScreenY =
          playerCenterScreenY - PLAYER_RENDER_SIZE / 2;

        // Player shadow - positioned near the feet
        const shadowX = playerScreenX + PLAYER_RENDER_SIZE / 2;
        const shadowY =
          playerScreenY + PLAYER_RENDER_SIZE * 0.64;
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw player sprite
        if (
          characterSprite.current &&
          characterSprite.current.complete
        ) {
          const directionToRow = [0, 1, 2, 3];
          const row = directionToRow[playerDirection];

          const srcX = playerFrame * PLAYER_SPRITE_SIZE;
          const srcY = row * PLAYER_SPRITE_SIZE;

          ctx.drawImage(
            characterSprite.current,
            srcX,
            srcY,
            PLAYER_SPRITE_SIZE,
            PLAYER_SPRITE_SIZE,
            playerScreenX,
            playerScreenY,
            PLAYER_RENDER_SIZE,
            PLAYER_RENDER_SIZE,
          );
        } else {
          // Fallback player rendering
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(
            playerScreenX + PLAYER_RENDER_SIZE / 4,
            playerScreenY + PLAYER_RENDER_SIZE / 3,
            PLAYER_RENDER_SIZE / 2,
            PLAYER_RENDER_SIZE / 2,
          );
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(
            playerScreenX + PLAYER_RENDER_SIZE / 3,
            playerScreenY + PLAYER_RENDER_SIZE / 6,
            PLAYER_RENDER_SIZE / 3,
            PLAYER_RENDER_SIZE / 3,
          );
        }
      },
    });

    // Add FENCE tiles to depth sorting
    const fenceSet = new Set(
      fencePositions.current.map((f) => `${f.x},${f.y}`),
    );
    fencePositions.current.forEach((fence) => {
      depthEntities.push({
        type: "tree",
        y: fence.y - 0.05, // Slight offset so fences render behind player on same tile
        renderFn: () => {
          if (
            !fenceTileset.current ||
            !fenceTileset.current.complete
          )
            return;

          const screenX = (fence.x - targetCameraX) * TILE_SIZE;
          const screenY = (fence.y - targetCameraY) * TILE_SIZE;

          // Determine which neighbors are also fence tiles
          const hasUp = fenceSet.has(
            `${fence.x},${fence.y - 1}`,
          );
          const hasDown = fenceSet.has(
            `${fence.x},${fence.y + 1}`,
          );
          const hasLeft = fenceSet.has(
            `${fence.x - 1},${fence.y}`,
          );
          const hasRight = fenceSet.has(
            `${fence.x + 1},${fence.y}`,
          );

          const tile = getAutoFenceTile(
            hasUp,
            hasDown,
            hasLeft,
            hasRight,
          );

          ctx.drawImage(
            fenceTileset.current!,
            tile.col * TILESET_TILE_SIZE,
            tile.row * TILESET_TILE_SIZE,
            TILESET_TILE_SIZE,
            TILESET_TILE_SIZE,
            screenX,
            screenY,
            TILE_SIZE,
            TILE_SIZE,
          );
        },
      });
    });

    // Add CHICKEN COOPS to depth sorting
    chickenCoopPositions.current.forEach((coop) => {
      depthEntities.push({
        type: "tree", // Use tree type for static structures
        y: coop.y + 3 - 0.05, // Bottom of 3x3 coop, slight offset to render behind player
        renderFn: () => {
          if (
            !chickenCoopSprite.current ||
            !chickenCoopSprite.current.complete
          )
            return;

          const screenX = (coop.x - targetCameraX) * TILE_SIZE;
          const screenY = (coop.y - targetCameraY) * TILE_SIZE;

          // Render 48x48 source image at 3x3 tiles (144x144 pixels)
          ctx.drawImage(
            chickenCoopSprite.current,
            0,
            0,
            48,
            48, // Source: full 48x48 image
            screenX,
            screenY,
            TILE_SIZE * 3,
            TILE_SIZE * 3, // Destination: 3x3 tiles
          );
        },
      });
    });

    // Add INTERIOR WALLS to depth sorting
    if (
      house.current &&
      houseTileset.current &&
      houseTileset.current.complete
    ) {
      const h = house.current;
      const interiorBottomY =
        h.interiorY + h.interiorHeight - 1;

      depthEntities.push({
        type: "tree",
        y: interiorBottomY,
        renderFn: () => {
          if (
            !house.current ||
            !houseTileset.current ||
            !houseTileset.current.complete
          )
            return;

          const h = house.current;

          // Render interior walls
          for (let hy = 0; hy < h.interiorHeight; hy++) {
            for (let hx = 0; hx < h.interiorWidth; hx++) {
              const worldX = h.interiorX + hx;
              const worldY = h.interiorY + hy;
              const screenX =
                (worldX - targetCameraX) * TILE_SIZE;
              const screenY =
                (worldY - targetCameraY) * TILE_SIZE;

              const interiorTile = h.interiorTiles[hy][hx];

              // Only render walls and doors
              if (
                interiorTile.type === "wall" ||
                interiorTile.type === "door"
              ) {
                if (interiorTile.type === "door") {
                  const doorCoords = h.doorOpen
                    ? DOOR_TILESET.open
                    : DOOR_TILESET.closed;
                  ctx.drawImage(
                    houseTileset.current,
                    doorCoords.x * TILESET_TILE_SIZE,
                    doorCoords.y * TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    screenX,
                    screenY,
                    TILE_SIZE,
                    TILE_SIZE,
                  );
                } else {
                  // Wall tile - determine which wall piece based on position
                  let wallX = 1;
                  let wallY = 2;

                  if (hy === 0) {
                    // Top wall
                    if (hx === 0)
                      ((wallX = 0), (wallY = 1)); // Top-left
                    else if (hx === h.interiorWidth - 1)
                      ((wallX = 2), (wallY = 1)); // Top-right
                    else ((wallX = 1), (wallY = 1)); // Top center
                  } else if (hy === h.interiorHeight - 1) {
                    // Bottom wall
                    if (hx === 0)
                      ((wallX = 0), (wallY = 3)); // Bottom-left
                    else if (hx === h.interiorWidth - 1)
                      ((wallX = 2), (wallY = 3)); // Bottom-right
                    else ((wallX = 1), (wallY = 3)); // Bottom center
                  } else if (hx === 0) {
                    ((wallX = 0), (wallY = 2)); // Left wall
                  } else if (hx === h.interiorWidth - 1) {
                    ((wallX = 2), (wallY = 2)); // Right wall
                  }

                  ctx.drawImage(
                    houseTileset.current,
                    wallX * TILESET_TILE_SIZE,
                    wallY * TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    screenX,
                    screenY,
                    TILE_SIZE,
                    TILE_SIZE,
                  );
                }
              }
            }
          }

          // Render furniture
          if (
            furnitureTileset.current &&
            furnitureTileset.current.complete
          ) {
            for (const furn of h.furniture) {
              // Silhouette glow BEFORE furniture tiles so it renders behind
              if (
                furn.x === 1 &&
                furn.y === 1 &&
                furnitureTileset.current
              ) {
                const cabWorldX = h.interiorX + furn.x;
                const cabWorldY = h.interiorY + furn.y;
                const cabScreenX =
                  (cabWorldX - targetCameraX) * TILE_SIZE;
                const cabScreenY =
                  (cabWorldY - targetCameraY) * TILE_SIZE;
                drawSilhouetteGlow(
                  ctx,
                  furnitureTileset.current,
                  furn.tileX * TILESET_TILE_SIZE,
                  furn.tileY * TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE * furn.width,
                  TILESET_TILE_SIZE * furn.height,
                  cabScreenX,
                  cabScreenY,
                  TILE_SIZE * furn.width,
                  TILE_SIZE * furn.height,
                );
              }

              for (let fy = 0; fy < furn.height; fy++) {
                for (let fx = 0; fx < furn.width; fx++) {
                  const worldX = h.interiorX + furn.x + fx;
                  const worldY = h.interiorY + furn.y + fy;
                  const furnScreenX =
                    (worldX - targetCameraX) * TILE_SIZE;
                  const furnScreenY =
                    (worldY - targetCameraY) * TILE_SIZE;

                  ctx.drawImage(
                    furnitureTileset.current,
                    (furn.tileX + fx) * TILESET_TILE_SIZE,
                    (furn.tileY + fy) * TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    furnScreenX,
                    furnScreenY,
                    TILE_SIZE,
                    TILE_SIZE,
                  );
                }
              }
            }
          }
        },
      });
    }

    // Add animals to depth sorting
    animals.current.forEach((animal) => {
      depthEntities.push({
        type: "animal",
        y: animal.type === "cow" ? animal.y + 0.5 : animal.y, // Cows are 2x2, sort by their bottom
        renderFn: () => {
          const renderSize =
            animal.type === "chicken"
              ? CHICKEN_RENDER_SIZE
              : COW_RENDER_SIZE;
          const screenX =
            (animal.x - targetCameraX) * TILE_SIZE -
            (renderSize - TILE_SIZE) / 2;
          const screenY =
            (animal.y - targetCameraY) * TILE_SIZE -
            (renderSize - TILE_SIZE) / 2;

          if (
            screenX < -renderSize ||
            screenX > canvas.width ||
            screenY < -renderSize ||
            screenY > canvas.height
          ) {
            return;
          }

          if (animal.type === "chicken") {
            const sprite = chickenSprite.current;
            if (
              !sprite ||
              !sprite.complete ||
              sprite.naturalHeight === 0
            ) {
              // Fallback rendering for chickens
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(
                screenX,
                screenY,
                CHICKEN_RENDER_SIZE,
                CHICKEN_RENDER_SIZE,
              );
              ctx.strokeStyle = "#FF0000";
              ctx.lineWidth = 2;
              ctx.strokeRect(
                screenX,
                screenY,
                CHICKEN_RENDER_SIZE,
                CHICKEN_RENDER_SIZE,
              );
            } else {
              try {
                let srcX: number, srcY: number;

                if (animal.moveTimer <= 0) {
                  // Walking animation - cycle through row 1: (0,1), (1,1), (2,1), (3,1)
                  const frameSequence = [0, 1, 2, 3];
                  const frameIndex =
                    frameSequence[animal.frame % 4];
                  srcX = frameIndex * CHICKEN_SPRITE_SIZE;
                  srcY = 1 * CHICKEN_SPRITE_SIZE; // Row 1
                } else {
                  // Idle - use (0,0)
                  srcX = 0;
                  srcY = 0;
                }

                ctx.save();

                if (animal.direction === 2) {
                  ctx.translate(
                    screenX + CHICKEN_RENDER_SIZE,
                    screenY,
                  );
                  ctx.scale(-1, 1);
                  ctx.drawImage(
                    sprite,
                    srcX,
                    srcY,
                    CHICKEN_SPRITE_SIZE,
                    CHICKEN_SPRITE_SIZE,
                    0,
                    0,
                    CHICKEN_RENDER_SIZE,
                    CHICKEN_RENDER_SIZE,
                  );
                } else {
                  ctx.drawImage(
                    sprite,
                    srcX,
                    srcY,
                    CHICKEN_SPRITE_SIZE,
                    CHICKEN_SPRITE_SIZE,
                    screenX,
                    screenY,
                    CHICKEN_RENDER_SIZE,
                    CHICKEN_RENDER_SIZE,
                  );
                }

                ctx.restore();
              } catch (error) {
                console.warn(
                  "Failed to draw chicken sprite:",
                  error,
                );
                ctx.fillStyle = "#FFFF00";
                ctx.fillRect(
                  screenX,
                  screenY,
                  CHICKEN_RENDER_SIZE,
                  CHICKEN_RENDER_SIZE,
                );
              }
            }
          } else if (animal.type === "cow") {
            const sprite = breadSprite.current;
            if (
              sprite &&
              sprite.complete &&
              sprite.naturalHeight !== 0
            ) {
              try {
                let srcX: number, srcY: number;

                if (animal.moveTimer <= 0) {
                  const walkFramePositions = [
                    { col: 0, row: 1 },
                    { col: 1, row: 0 },
                    { col: 1, row: 1 },
                  ];
                  const framePos =
                    walkFramePositions[animal.frame % 3];
                  srcX = framePos.col * COW_SPRITE_SIZE;
                  srcY = framePos.row * COW_SPRITE_SIZE;
                } else {
                  srcX = 2 * COW_SPRITE_SIZE;
                  srcY = 0;
                }

                // Check if this is the glowing pen4 cow
                const isGlowingCow =
                  animal.penned &&
                  animal.penBounds &&
                  glowingCowPenBounds.current &&
                  animal.penBounds.left ===
                    glowingCowPenBounds.current.left &&
                  animal.penBounds.top ===
                    glowingCowPenBounds.current.top;

                // Draw silhouette glow behind the cow if it's the pen4 cow
                if (isGlowingCow) {
                  drawSilhouetteGlow(
                    ctx,
                    sprite,
                    srcX,
                    srcY,
                    COW_SPRITE_SIZE,
                    COW_SPRITE_SIZE,
                    screenX,
                    screenY,
                    COW_RENDER_SIZE,
                    COW_RENDER_SIZE,
                    animal.direction === 2,
                  );
                }

                ctx.save();

                if (animal.direction === 2) {
                  ctx.translate(
                    screenX + COW_RENDER_SIZE,
                    screenY,
                  );
                  ctx.scale(-1, 1);
                  ctx.drawImage(
                    sprite,
                    srcX,
                    srcY,
                    COW_SPRITE_SIZE,
                    COW_SPRITE_SIZE,
                    0,
                    0,
                    COW_RENDER_SIZE,
                    COW_RENDER_SIZE,
                  );
                } else {
                  ctx.drawImage(
                    sprite,
                    srcX,
                    srcY,
                    COW_SPRITE_SIZE,
                    COW_SPRITE_SIZE,
                    screenX,
                    screenY,
                    COW_RENDER_SIZE,
                    COW_RENDER_SIZE,
                  );
                }

                ctx.restore();
              } catch (error) {
                console.warn("Failed to draw cow sprite");
              }
            } else {
              // Fallback rendering for cows
              ctx.save();

              if (animal.direction === 2) {
                ctx.translate(
                  screenX + COW_RENDER_SIZE,
                  screenY,
                );
                ctx.scale(-1, 1);
                ctx.fillStyle = "#8B4513";
                ctx.fillRect(
                  0,
                  0,
                  COW_RENDER_SIZE,
                  COW_RENDER_SIZE,
                );
              } else {
                ctx.fillStyle = "#8B4513";
                ctx.fillRect(
                  screenX,
                  screenY,
                  COW_RENDER_SIZE,
                  COW_RENDER_SIZE,
                );
              }

              ctx.restore();
            }
          }
        },
      });
    });

    // Sort by Y position (lower Y renders first, higher Y renders last = appears on top)
    depthEntities.sort((a, b) => a.y - b.y);

    // Render all entities in depth-sorted order
    depthEntities.forEach((entity) => entity.renderFn());

    // Roof rendering - always on top
    // Render roof AFTER all depth-sorted entities so it always appears on top
    // Hide roof if player is inside the house
    if (
      house.current &&
      houseTileset.current &&
      houseTileset.current.complete
    ) {
      const h = house.current;

      // Check if player is inside the house
      const playerTileX = Math.floor(playerPos.x);
      const playerTileY = Math.floor(playerPos.y);
      const playerRelativeX = playerTileX - h.x;
      const playerRelativeY = playerTileY - h.y;
      const playerInsideHouse =
        playerRelativeX >= 0 &&
        playerRelativeX < h.width &&
        playerRelativeY >= 0 &&
        playerRelativeY < h.height;

      // Only render roof if player is NOT inside the house
      if (!playerInsideHouse) {
        // Hardcoded roof as separate object
        // Roof matches the house width (no extensions)
        // Bottom row of roof is at the bottom wall (row 3 for 4-tall house, where door is)
        // Build roof upward from there using texture rows (properly ordered):
        // - Row 0 (bottom): lowerBottom* tiles (texture row 4) - bottom edge
        // - Row 1: lowerMiddle* tiles (texture row 3) - lower middle
        // - Row 2: lowerMiddle* tiles (texture row 3) - lower middle (repeated)
        // - Row 3 (center): peak* tiles (texture row 2) - center/peak (MOVED UP 1 BLOCK)
        // - Row 4: upperMiddle* tiles (texture row 1) - upper middle
        // - Row 5 (top): upperTop* tiles (texture row 0) - top edge

        const roofBottomRow = h.height - 1; // Bottom wall position (row 3)
        const roofHeight = 5; // Roof extends 5 tiles upward (made 1 block shorter)
        const roofWidth = h.width; // Matches house width exactly
        const roofStartX = 0; // Starts at house edge

        // Render roof from bottom to top
        for (let roofY = 0; roofY < roofHeight; roofY++) {
          const actualY = roofBottomRow - roofY; // Work upward from bottom

          for (let rx = 0; rx < roofWidth; rx++) {
            const actualX = roofStartX + rx; // Aligned with house
            const screenX =
              (h.x + actualX - targetCameraX) * TILE_SIZE;
            const screenY =
              (h.y + actualY - targetCameraY) * TILE_SIZE;

            let roofTileX, roofTileY;

            // Determine which texture row to use based on position in roof
            if (roofY === 0) {
              // Bottom row of roof - use lowerBottom* (texture row 4)
              roofTileY = 4;
              if (rx === 0) {
                roofTileX = 4; // lowerBottomLeft
              } else if (rx === roofWidth - 1) {
                roofTileX = 6; // lowerBottomRight
              } else {
                roofTileX = 5; // lowerBottomCenter
              }
            } else if (roofY === 1 || roofY === 2) {
              // Lower middle rows - use lowerMiddle* (texture row 3) - now 2 rows
              roofTileY = 3;
              if (rx === 0) {
                roofTileX = 4; // lowerMiddleLeft
              } else if (rx === roofWidth - 1) {
                roofTileX = 6; // lowerMiddleRight
              } else {
                roofTileX = 5; // lowerMiddleCenter
              }
            } else if (roofY === 3) {
              // Center/Peak row - use peak* (texture row 2) - MOVED DOWN BY 1
              roofTileY = 2;
              if (rx === 0) {
                roofTileX = 4; // peakLeft
              } else if (rx === roofWidth - 1) {
                roofTileX = 6; // peakRight
              } else {
                roofTileX = 5; // peakCenter
              }
            } else {
              // Top row - use upperTop* (texture row 0)
              roofTileY = 0;
              if (rx === 0) {
                roofTileX = 4; // upperTopLeft
              } else if (rx === roofWidth - 1) {
                roofTileX = 6; // upperTopRight
              } else {
                roofTileX = 5; // upperTopCenter
              }
            }

            ctx.drawImage(
              houseTileset.current,
              roofTileX * TILESET_TILE_SIZE,
              roofTileY * TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              TILESET_TILE_SIZE,
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE,
            );
          }
        }
      } // End playerInsideHouse check
    }

    // Draw collision boxes when debug mode is active
    if (debugCollision) {
      const playerRadius = 0.3;
      const playerScreenX =
        (playerPos.x - targetCameraX) * TILE_SIZE;
      const playerScreenY =
        (playerPos.y - targetCameraY) * TILE_SIZE;

      // Always draw player collision box
      ctx.strokeStyle = "#00ff00"; // Green for player
      ctx.lineWidth = 2;
      ctx.strokeRect(
        playerScreenX - playerRadius * TILE_SIZE,
        playerScreenY - playerRadius * TILE_SIZE,
        playerRadius * 2 * TILE_SIZE,
        playerRadius * 2 * TILE_SIZE,
      );

      // Draw player center point
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw coordinates
      ctx.fillStyle = "#00ff00";
      ctx.font = "12px monospace";
      ctx.fillText(
        `Player: (${playerPos.x.toFixed(2)}, ${playerPos.y.toFixed(2)})`,
        playerScreenX + 10,
        playerScreenY - 10,
      );

      if (house.current) {
        const h = house.current;

        // Check if player is in interior region
        const playerTileX = Math.floor(playerPos.x);
        const playerTileY = Math.floor(playerPos.y);
        const inInterior =
          playerTileX >= h.interiorX &&
          playerTileX < h.interiorX + h.interiorWidth &&
          playerTileY >= h.interiorY &&
          playerTileY < h.interiorY + h.interiorHeight;

        if (inInterior) {
          // Draw interior wall boundaries in world coordinates
          ctx.strokeStyle = "#ff00ff"; // Magenta for walls
          ctx.lineWidth = 3;

          // Left wall (x = interiorX)
          ctx.beginPath();
          ctx.moveTo(
            (h.interiorX - targetCameraX) * TILE_SIZE,
            (h.interiorY - targetCameraY) * TILE_SIZE,
          );
          ctx.lineTo(
            (h.interiorX - targetCameraX) * TILE_SIZE,
            (h.interiorY + h.interiorHeight - targetCameraY) *
              TILE_SIZE,
          );
          ctx.stroke();

          // Right wall (x = interiorX + interiorWidth - 1)
          ctx.beginPath();
          ctx.moveTo(
            (h.interiorX +
              h.interiorWidth -
              1 -
              targetCameraX) *
              TILE_SIZE,
            (h.interiorY - targetCameraY) * TILE_SIZE,
          );
          ctx.lineTo(
            (h.interiorX +
              h.interiorWidth -
              1 -
              targetCameraX) *
              TILE_SIZE,
            (h.interiorY + h.interiorHeight - targetCameraY) *
              TILE_SIZE,
          );
          ctx.stroke();

          // Top wall (y = interiorY)
          ctx.beginPath();
          ctx.moveTo(
            (h.interiorX - targetCameraX) * TILE_SIZE,
            (h.interiorY - targetCameraY) * TILE_SIZE,
          );
          ctx.lineTo(
            (h.interiorX + h.interiorWidth - targetCameraX) *
              TILE_SIZE,
            (h.interiorY - targetCameraY) * TILE_SIZE,
          );
          ctx.stroke();

          // Bottom wall (y = interiorY + interiorHeight - 1, with door gap)
          const doorX = h.interiorDoorX;
          ctx.beginPath();
          // Left side of bottom wall (before door)
          ctx.moveTo(
            (h.interiorX - targetCameraX) * TILE_SIZE,
            (h.interiorY +
              h.interiorHeight -
              1 -
              targetCameraY) *
              TILE_SIZE,
          );
          ctx.lineTo(
            (h.interiorX + doorX - 0.5 - targetCameraX) *
              TILE_SIZE,
            (h.interiorY +
              h.interiorHeight -
              1 -
              targetCameraY) *
              TILE_SIZE,
          );
          // Right side of bottom wall (after door)
          ctx.moveTo(
            (h.interiorX + doorX + 1.5 - targetCameraX) *
              TILE_SIZE,
            (h.interiorY +
              h.interiorHeight -
              1 -
              targetCameraY) *
              TILE_SIZE,
          );
          ctx.lineTo(
            (h.interiorX + h.interiorWidth - targetCameraX) *
              TILE_SIZE,
            (h.interiorY +
              h.interiorHeight -
              1 -
              targetCameraY) *
              TILE_SIZE,
          );
          ctx.stroke();

          // Draw furniture collision boxes
          ctx.strokeStyle = "#ffff00"; // Yellow for furniture
          ctx.lineWidth = 1;
          for (const furn of h.furniture) {
            if (furn.collidable) {
              const furnScreenX =
                (h.interiorX + furn.x - targetCameraX) *
                TILE_SIZE;
              const furnScreenY =
                (h.interiorY + furn.y - targetCameraY) *
                TILE_SIZE;
              ctx.strokeRect(
                furnScreenX,
                furnScreenY,
                furn.width * TILE_SIZE,
                furn.height * TILE_SIZE,
              );
            }
          }
        } else {
          // Outside - draw exterior house collision boxes
          ctx.strokeStyle = "#ff00ff"; // Magenta for house walls
          ctx.lineWidth = 2;
          ctx.strokeRect(
            (h.x - targetCameraX) * TILE_SIZE,
            (h.y - targetCameraY) * TILE_SIZE,
            h.width * TILE_SIZE,
            h.height * TILE_SIZE,
          );
        }
      }

      // Draw tree collision boxes (when outside)
      ctx.strokeStyle = "#8b4513"; // Brown for trees
      ctx.lineWidth = 1;
      for (const item of foliage.current) {
        if (item.type === "tree") {
          const treeScreenX =
            (item.x - targetCameraX) * TILE_SIZE;
          const treeScreenY =
            (item.y - targetCameraY) * TILE_SIZE;

          // Only draw if on screen
          if (
            treeScreenX < canvas.width + TILE_SIZE &&
            treeScreenX + item.width * TILE_SIZE > -TILE_SIZE &&
            treeScreenY < canvas.height + TILE_SIZE &&
            treeScreenY + item.height * TILE_SIZE > -TILE_SIZE
          ) {
            // Draw full tree bounds (light brown)
            ctx.strokeStyle = "#8b451355";
            ctx.lineWidth = 1;
            ctx.strokeRect(
              treeScreenX,
              treeScreenY,
              item.width * TILE_SIZE,
              item.height * TILE_SIZE,
            );

            // Draw actual collision area — all multi-tile trees use 1x1 hitbox at bottom-center; small trees use 1x1 naturally
            const collisionCenterX =
              item.x + (item.width - 1) / 2 + 0.5;
            const collisionCenterY = item.y + item.height - 0.5;
            const collisionHalfWidth = 0.5; // All trees: 1x1 centered hitbox
            const collisionHalfHeight = 0.5;

            const collisionScreenX =
              (collisionCenterX -
                collisionHalfWidth -
                targetCameraX) *
              TILE_SIZE;
            const collisionScreenY =
              (collisionCenterY -
                collisionHalfHeight -
                targetCameraY) *
              TILE_SIZE;
            const collisionWidth = 1 * TILE_SIZE;
            const collisionHeight = 1 * TILE_SIZE; // Only bottom tile

            ctx.strokeStyle = "#8b4513"; // Solid brown for collision area
            ctx.lineWidth = 2;
            ctx.strokeRect(
              collisionScreenX,
              collisionScreenY,
              collisionWidth,
              collisionHeight,
            );
          }
        }
      }

      // Draw fence collision boxes
      ctx.strokeStyle = "#00aaff"; // Light blue for fences
      ctx.lineWidth = 1;
      for (const fence of fencePositions.current) {
        const fenceScreenX =
          (fence.x - targetCameraX) * TILE_SIZE;
        const fenceScreenY =
          (fence.y - targetCameraY) * TILE_SIZE;

        if (
          fenceScreenX < canvas.width + TILE_SIZE &&
          fenceScreenX + TILE_SIZE > -TILE_SIZE &&
          fenceScreenY < canvas.height + TILE_SIZE &&
          fenceScreenY + TILE_SIZE > -TILE_SIZE
        ) {
          ctx.strokeRect(
            fenceScreenX,
            fenceScreenY,
            TILE_SIZE,
            TILE_SIZE,
          );
        }
      }

      // Draw chicken coop collision boxes
      ctx.strokeStyle = "#ff8800"; // Orange for coops
      ctx.lineWidth = 2;
      for (const coop of chickenCoopPositions.current) {
        const coopScreenX =
          (coop.x - targetCameraX) * TILE_SIZE;
        const coopScreenY =
          (coop.y - targetCameraY) * TILE_SIZE;
        ctx.strokeRect(
          coopScreenX,
          coopScreenY,
          TILE_SIZE * 3,
          TILE_SIZE * 3,
        );
      }

      // Draw decoration collision boxes
      for (const decoration of decorations.current) {
        if (decoration.type === "fountain") {
          // Fountain: Draw full bounds in light color, collision area in solid color
          const fountainScreenX =
            (decoration.x - targetCameraX) * TILE_SIZE;
          const fountainScreenY =
            (decoration.y - targetCameraY) * TILE_SIZE;
          const fountainWidth = 6 * TILE_SIZE;
          const fountainHeight = 5 * TILE_SIZE;

          // Full fountain bounds (light cyan)
          ctx.strokeStyle = "#00ffff55";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            fountainScreenX,
            fountainScreenY,
            fountainWidth,
            fountainHeight,
          );

          // Collision area (2x3: 3 tiles wide, 2 tiles tall, moved up to row 2) in solid cyan
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = 2;
          const collisionScreenX =
            fountainScreenX + 1.5 * TILE_SIZE; // Centered
          const collisionScreenY =
            fountainScreenY + 2 * TILE_SIZE; // Row 2
          const collisionWidth = 3 * TILE_SIZE;
          const collisionHeight = 2 * TILE_SIZE;
          ctx.strokeRect(
            collisionScreenX,
            collisionScreenY,
            collisionWidth,
            collisionHeight,
          );
        } else if (decoration.type === "campfire") {
          // Campfire: Draw full 4x4 bounds in light color, 2x2 center collision in solid color
          const campfireScreenX =
            (decoration.x - targetCameraX) * TILE_SIZE;
          const campfireScreenY =
            (decoration.y - targetCameraY) * TILE_SIZE;
          const campfireFullSize = 4 * TILE_SIZE;

          // Full bounds (light orange)
          ctx.strokeStyle = "#ff660055";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            campfireScreenX,
            campfireScreenY,
            campfireFullSize,
            campfireFullSize,
          );

          // Collision area (2x2 at center) in solid orange
          ctx.strokeStyle = "#ff6600";
          ctx.lineWidth = 2;
          const collisionCenterScreenX =
            campfireScreenX + 1 * TILE_SIZE;
          const collisionCenterScreenY =
            campfireScreenY + 1 * TILE_SIZE;
          ctx.strokeRect(
            collisionCenterScreenX,
            collisionCenterScreenY,
            TILE_SIZE * 2,
            TILE_SIZE * 2,
          );
        }
      }
    }
  }, [
    map,
    playerPos,
    playerDirection,
    playerFrame,
    canvasSize,
    animationFrame,
    spritesLoaded,
    debugCollision,
  ]);

  // Handle keyboard input
  useInput({
    keysPressed,
    setDebugCollision,
  });

  // Game loop for movement
  useGameLoop({
    keysPressed,
    playerPos,
    playerDirection,
    playerFrameCounter,
    foliage,
    fencePositions,
    chickenCoopPositions,
    decorations,
    house,
    map,
    setPlayerPos,
    setPlayerDirection,
    setPlayerFrame,
  });

  // Game loop for animals
  useAnimalAI({
    map,
    animals,
    foliage,
    fencePositions,
    chickenCoopPositions,
    decorations,
    house,
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900"
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}