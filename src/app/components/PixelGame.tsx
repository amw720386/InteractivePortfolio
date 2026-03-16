import { useEffect, useRef, useState, useCallback } from "react";
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
import { getDockTileCoords, type DockSegment } from "./pixel-game/maps/dockTilesetMap";
import { BOAT_TILESET, type BoatInstance } from "./pixel-game/maps/boatTilesetMap";
import { WATER_DECO_TILESET, type WaterDecoInstance } from "./pixel-game/maps/waterDecoTilesetMap";
import { useSprites } from "./pixel-game/hooks/useSprites";
import { generateMap } from "./pixel-game/mapGeneration";
import { GameModal } from "./pixel-game/ui/GameModal";
import { ProjectsModal } from "./pixel-game/ui/ProjectsModal";
import { HelpModal } from "./pixel-game/ui/HelpModal";
import { MobileControls } from "./pixel-game/ui/MobileControls";
import { LoadingScreen } from "./pixel-game/ui/LoadingScreen";
import { PortraitWarning } from "./pixel-game/ui/PortraitWarning";
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
  SIGN_X,
  SIGN_Y,
} from "./pixel-game/constants";
import type {
  Tile,
  Position,
  Animal,
  House,
  Decoration,
} from "./pixel-game/types";
import { ASSET_URLS } from "./pixel-game/assets";

// Load pixel font globally on module init
(function loadPixelFont() {
  try {
    const font = new FontFace("PixelFont", `url(${ASSET_URLS.pixelFont})`);
    font.load().then((f) => document.fonts.add(f)).catch(() => {});
  } catch {}
})();

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
  const [playerIsMoving, setPlayerIsMoving] = useState(false);

  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth || 960,
    height: window.innerHeight || 540,
  });
  const [animationFrame, setAnimationFrame] = useState(0);
  const [debugCollision, setDebugCollision] = useState(false); // Toggle with 'C' key
  const [modalOpen, setModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [dialogueText, setDialogueText] = useState("");
  const dialogueSpeakerRef = useRef<Animal | null>(null);
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: window.innerWidth || 960, height: window.innerHeight || 540 });

  const keysPressed = useRef<Set<string>>(new Set());
  const animals = useRef<Animal[]>([]);
  const decorations = useRef<Decoration[]>([]);
  const dockSegmentsRef = useRef<Map<string, DockSegment>>(new Map());
  const boatsRef = useRef<BoatInstance[]>([]);
  const stoneCirclesRef = useRef<Array<{ x: number; y: number }>>([]);
  const npcsRef = useRef<Array<{ x: number; y: number; direction: number; frame: number }>>([]);
  const waterDecorationsRef = useRef<WaterDecoInstance[]>([]);
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
  const waterTileset = useRef<HTMLImageElement | null>(null);
  const dockTileset = useRef<HTMLImageElement | null>(null);
  const stonePathTileset = useRef<HTMLImageElement | null>(null);
  const boatTilesetRef = useRef<HTMLImageElement | null>(null);
  const waterDecoTilesetRef = useRef<HTMLImageElement | null>(null);
  const dialogueTilesetRef = useRef<HTMLImageElement | null>(null);
  const signTilesetRef = useRef<HTMLImageElement | null>(null);

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
      waterTileset.current = sprites.waterTileset;
      dockTileset.current = sprites.dockTileset;
      stonePathTileset.current = sprites.stonePathTileset;
      boatTilesetRef.current = sprites.boatTileset;
      waterDecoTilesetRef.current = sprites.waterDecoTileset;
      dialogueTilesetRef.current = sprites.dialogueTileset;
      signTilesetRef.current = sprites.signTileset;
    }
  }, [spritesLoaded, sprites]);

  // Detect mobile — touch capability OR narrow viewport (for emulators)
  useEffect(() => {
    const check = () => {
      const hasTouch =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const narrowViewport = window.innerWidth < 1024;
      setIsMobile(hasTouch || narrowViewport);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Set canvas size — uniform scale to guarantee 6 tiles in each direction
  useEffect(() => {
    const MIN_LOGICAL = 12 * TILE_SIZE; // 576px — 12 tiles minimum per axis
    const updateSize = () => {
      const dw = window.innerWidth || MIN_LOGICAL;
      const dh = window.innerHeight || MIN_LOGICAL;
      // Uniform scale: pick the most constrained axis so aspect ratio is preserved
      const scale = Math.min(1, dw / MIN_LOGICAL, dh / MIN_LOGICAL);
      const logicalW = Math.round(dw / (scale || 1));
      const logicalH = Math.round(dh / (scale || 1));
      setCanvasSize({ width: logicalW, height: logicalH });
      setDisplaySize({ width: dw, height: dh });
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
    dockSegmentsRef.current = result.dockSegments;
    boatsRef.current = result.boats;
    stoneCirclesRef.current = result.stoneCircles;
    npcsRef.current = result.npcs;
    waterDecorationsRef.current = result.waterDecorations;
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
                  t === "path" ||
                  t === "sign"
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

              // Check if any neighbor is lake or dock (to draw water underneath)
              const isLakeOrDock = (t: string) => t === "lake" || t === "dock";
              const hasAnyLakeNeighbor =
                (x > 0 && isLakeOrDock(map[y][x - 1])) ||
                (x < MAP_WIDTH - 1 && isLakeOrDock(map[y][x + 1])) ||
                (y > 0 && isLakeOrDock(map[y - 1][x])) ||
                (y < MAP_HEIGHT - 1 && isLakeOrDock(map[y + 1][x]));
              const hasAnyLakeDiag =
                (x > 0 && y > 0 && isLakeOrDock(map[y - 1][x - 1])) ||
                (x < MAP_WIDTH - 1 && y > 0 && isLakeOrDock(map[y - 1][x + 1])) ||
                (x > 0 && y < MAP_HEIGHT - 1 && isLakeOrDock(map[y + 1][x - 1])) ||
                (x < MAP_WIDTH - 1 && y < MAP_HEIGHT - 1 && isLakeOrDock(map[y + 1][x + 1]));

              // If grass has lake neighbors, draw animated water UNDERNEATH first
              if (
                (hasAnyLakeNeighbor || hasAnyLakeDiag) &&
                waterTileset.current &&
                waterTileset.current.complete
              ) {
                const lakeEdgeFrame = Math.floor(animationFrame / 8) % 4;
                ctx.drawImage(
                  waterTileset.current,
                  lakeEdgeFrame * TILESET_TILE_SIZE,
                  0,
                  TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  screenX,
                  screenY,
                  TILE_SIZE,
                  TILE_SIZE,
                );
              }

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
          case "lake": {
            // Animated water using 4-frame tileset (64x16, each frame 16x16)
            const waterFrame = Math.floor(animationFrame / 8) % 4; // Cycle through 4 frames
            if (
              waterTileset.current &&
              waterTileset.current.complete
            ) {
              ctx.drawImage(
                waterTileset.current,
                waterFrame * TILESET_TILE_SIZE,
                0,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            } else {
              // Fallback
              ctx.fillStyle = "#1e3a8a";
              ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = "#2563eb";
              ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
            break;
          }

          case "dock": {
            // Draw animated water underneath the dock
            const dockWaterFrame = Math.floor(animationFrame / 8) % 4;
            if (
              waterTileset.current &&
              waterTileset.current.complete
            ) {
              ctx.drawImage(
                waterTileset.current,
                dockWaterFrame * TILESET_TILE_SIZE,
                0,
                TILESET_TILE_SIZE,
                TILESET_TILE_SIZE,
                screenX,
                screenY,
                TILE_SIZE,
                TILE_SIZE,
              );
            } else {
              ctx.fillStyle = "#2563eb";
              ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
            // Draw dock plank texture on top
            if (
              dockTileset.current &&
              dockTileset.current.complete
            ) {
              // Look up dock segment metadata for correct tile selection
              const dockKey = `${x},${y}`;
              const segment = dockSegmentsRef.current.get(dockKey);
              if (segment) {
                const tileCoords = getDockTileCoords(segment);
                ctx.drawImage(
                  dockTileset.current,
                  tileCoords.col * TILESET_TILE_SIZE,
                  tileCoords.row * TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  screenX,
                  screenY,
                  TILE_SIZE,
                  TILE_SIZE,
                );
              } else {
                // Fallback: use vertical left tile
                ctx.drawImage(
                  dockTileset.current,
                  0 * TILESET_TILE_SIZE,
                  1 * TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  TILESET_TILE_SIZE,
                  screenX,
                  screenY,
                  TILE_SIZE,
                  TILE_SIZE,
                );
              }
            }
            break;
          }
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
            // Draw grass background for sign tile using the tileset
            if (grassTileset.current && grassTileset.current.complete) {
              // Use center grass tile (row 1, col 1) from the tileset
              ctx.drawImage(
                grassTileset.current,
                1 * TILESET_TILE_SIZE, 1 * TILESET_TILE_SIZE,
                TILESET_TILE_SIZE, TILESET_TILE_SIZE,
                screenX, screenY,
                TILE_SIZE, TILE_SIZE,
              );
            } else {
              ctx.fillStyle = "#4a7c59";
              ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
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

    // Render stone circles on top of grass but below depth-sorted entities
    if (stonePathTileset.current && stonePathTileset.current.complete) {
      const STONE_TILE = 16; // 16x16 source tiles
      const stoneTiles = [
        { dx: 0, dy: 0, col: 1, row: 1 }, // top-left of circle: bottom→right turn
        { dx: 1, dy: 0, col: 2, row: 1 }, // top-right of circle: left→bottom turn
        { dx: 0, dy: 1, col: 1, row: 2 }, // bottom-left of circle: top→right turn
        { dx: 1, dy: 1, col: 2, row: 2 }, // bottom-right of circle: left→top turn
      ];
      for (const sc of stoneCirclesRef.current) {
        for (const t of stoneTiles) {
          const screenX = (sc.x + t.dx - targetCameraX) * TILE_SIZE;
          const screenY = (sc.y + t.dy - targetCameraY) * TILE_SIZE;
          if (screenX < -TILE_SIZE || screenX > canvas.width || screenY < -TILE_SIZE || screenY > canvas.height) continue;
          ctx.drawImage(
            stonePathTileset.current,
            t.col * STONE_TILE,
            t.row * STONE_TILE,
            STONE_TILE,
            STONE_TILE,
            screenX,
            screenY,
            TILE_SIZE,
            TILE_SIZE,
          );
        }
      }
    }

    // Render water decorations (rocks, reeds, lily pads, dark water patches) on top of water tiles
    if (waterDecoTilesetRef.current && waterDecoTilesetRef.current.complete) {
      const DECO_SRC = 16; // 16x16 source tiles
      for (const deco of waterDecorationsRef.current) {
        const screenX = (deco.x - targetCameraX) * TILE_SIZE;
        const screenY = (deco.y - targetCameraY) * TILE_SIZE;
        if (screenX < -TILE_SIZE * 2 || screenX > canvas.width + TILE_SIZE || screenY < -TILE_SIZE || screenY > canvas.height + TILE_SIZE) continue;

        if (deco.type === "bigRock") {
          // Big rock is 2x1 tiles (cols 4-5, row 0)
          ctx.drawImage(
            waterDecoTilesetRef.current,
            WATER_DECO_TILESET.ROCK_BIG_LEFT.col * DECO_SRC,
            WATER_DECO_TILESET.ROCK_BIG_LEFT.row * DECO_SRC,
            DECO_SRC, DECO_SRC,
            screenX, screenY, TILE_SIZE, TILE_SIZE,
          );
          ctx.drawImage(
            waterDecoTilesetRef.current,
            WATER_DECO_TILESET.ROCK_BIG_RIGHT.col * DECO_SRC,
            WATER_DECO_TILESET.ROCK_BIG_RIGHT.row * DECO_SRC,
            DECO_SRC, DECO_SRC,
            screenX + TILE_SIZE, screenY, TILE_SIZE, TILE_SIZE,
          );
        } else if (deco.type === "rock") {
          // Single-tile rocks: variant 0=tiny, 1=small, 2=medium, 3=medium-big
          const rockTiles = [
            WATER_DECO_TILESET.ROCK_TINY,
            WATER_DECO_TILESET.ROCK_SMALL,
            WATER_DECO_TILESET.ROCK_MEDIUM,
            WATER_DECO_TILESET.ROCK_MEDIUM_BIG,
          ];
          const tile = rockTiles[deco.variant] || rockTiles[0];
          ctx.drawImage(
            waterDecoTilesetRef.current,
            tile.col * DECO_SRC, tile.row * DECO_SRC,
            DECO_SRC, DECO_SRC,
            screenX, screenY, TILE_SIZE, TILE_SIZE,
          );
        } else if (deco.type === "reed") {
          const reedTiles = [WATER_DECO_TILESET.REED_0, WATER_DECO_TILESET.REED_1];
          const tile = reedTiles[deco.variant] || reedTiles[0];
          ctx.drawImage(
            waterDecoTilesetRef.current,
            tile.col * DECO_SRC, tile.row * DECO_SRC,
            DECO_SRC, DECO_SRC,
            screenX, screenY, TILE_SIZE, TILE_SIZE,
          );
        } else if (deco.type === "lilypad") {
          const lilyTiles = [
            WATER_DECO_TILESET.LILYPAD_0, WATER_DECO_TILESET.LILYPAD_1,
            WATER_DECO_TILESET.LILYPAD_2, WATER_DECO_TILESET.LILYPAD_3,
          ];
          const tile = lilyTiles[deco.variant] || lilyTiles[0];
          ctx.drawImage(
            waterDecoTilesetRef.current,
            tile.col * DECO_SRC, tile.row * DECO_SRC,
            DECO_SRC, DECO_SRC,
            screenX, screenY, TILE_SIZE, TILE_SIZE,
          );
        }
      }
    }

    // Decorations are now rendered in the depth sorting system below

    // Depth-sorted rendering: trees, player, animals, and decorations
    // Sort by Y position (lower Y = render first = appears behind)
    interface DepthEntity {
      type: "tree" | "player" | "animal" | "decoration" | "boat" | "npc";
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
              item.treeType === "pine"
            ) {
              // Render eucalyptus (2x4) or pine (2x4) from extra trees tileset
              if (
                extraTreesTilesetRef.current &&
                extraTreesTilesetRef.current.complete
              ) {
                const screenX =
                  (item.x - targetCameraX) * TILE_SIZE;
                const screenY =
                  (item.y - targetCameraY) * TILE_SIZE;
                // Eucalyptus: tileset pos (30,8), Pine: tileset pos (32,8) — each 2x4 tiles at 16px
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

    // Add boats to depth sorting
    // Boat: 3 wide × 2 tall, top row overlaps grass, animates between 2 frames
    boatsRef.current.forEach((boat) => {
      const bottomY = boat.y + 1; // bottom row for depth sorting
      depthEntities.push({
        type: "boat",
        y: bottomY,
        renderFn: () => {
          if (!boatTilesetRef.current || !boatTilesetRef.current.complete) return;
          const screenX = (boat.x - targetCameraX) * TILE_SIZE;
          const screenY = (boat.y - targetCameraY) * TILE_SIZE;
          if (screenX < -TILE_SIZE * 4 || screenX > canvas.width || screenY < -TILE_SIZE * 3 || screenY > canvas.height) return;

          // Animate: alternate between frame 0 and frame 1
          const boatFrame = Math.floor(Date.now() / BOAT_TILESET.frameDuration) % BOAT_TILESET.frameCount;
          const frameTiles = boatFrame === 0 ? BOAT_TILESET.FRAME_0 : BOAT_TILESET.FRAME_1;
          const BOAT_SRC = 16; // 16x16 source tiles

          // Draw all 6 tiles (3 cols × 2 rows)
          const tilePositions = [
            { dx: 0, dy: 0, src: frameTiles.TOP_LEFT },
            { dx: 1, dy: 0, src: frameTiles.TOP_MID },
            { dx: 2, dy: 0, src: frameTiles.TOP_RIGHT },
            { dx: 0, dy: 1, src: frameTiles.BOTTOM_LEFT },
            { dx: 1, dy: 1, src: frameTiles.BOTTOM_MID },
            { dx: 2, dy: 1, src: frameTiles.BOTTOM_RIGHT },
          ];

          for (const tp of tilePositions) {
            ctx.drawImage(
              boatTilesetRef.current!,
              tp.src.col * BOAT_SRC,
              tp.src.row * BOAT_SRC,
              BOAT_SRC,
              BOAT_SRC,
              screenX + tp.dx * TILE_SIZE,
              screenY + tp.dy * TILE_SIZE,
              TILE_SIZE,
              TILE_SIZE,
            );
          }
        },
      });
    });

    // Add NPCs to depth sorting
    npcsRef.current.forEach((npc) => {
      depthEntities.push({
        type: "npc",
        y: npc.y,
        renderFn: () => {
          const npcCenterScreenX = (npc.x - targetCameraX) * TILE_SIZE;
          const npcCenterScreenY = (npc.y - targetCameraY) * TILE_SIZE;
          const npcScreenX = npcCenterScreenX - PLAYER_RENDER_SIZE / 2;
          const npcScreenY = npcCenterScreenY - PLAYER_RENDER_SIZE * 0.6;

          // Shadow
          const shadowX = npcScreenX + PLAYER_RENDER_SIZE / 2;
          const shadowY = npcScreenY + PLAYER_RENDER_SIZE * 0.64;
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(shadowX, shadowY, 20, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          if (characterSprite.current && characterSprite.current.complete) {
            // Idle animation: direction row from rows 0-3, cycle through 8 frames
            const directionToRow = [0, 1, 3, 2];
            const row = directionToRow[npc.direction];
            // Cycle idle frames based on time
            const npcIdleFrame = Math.floor(Date.now() / 160) % 8;
            const srcX = npcIdleFrame * PLAYER_SPRITE_SIZE;
            const srcY = row * PLAYER_SPRITE_SIZE;
            ctx.drawImage(
              characterSprite.current,
              srcX, srcY,
              PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE,
              npcScreenX, npcScreenY,
              PLAYER_RENDER_SIZE, PLAYER_RENDER_SIZE,
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
          // New spritesheet: rows 0-3 = idle (down, up, right, left)
          //                  rows 4-7 = walk (down, up, right, left)
          // Direction enum: 0=down, 1=up, 2=left, 3=right
          const directionToRow = [0, 1, 3, 2];
          const baseRow = directionToRow[playerDirection];
          const row = playerIsMoving ? baseRow + 4 : baseRow;

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

    // Add INTERIOR WALLS as background (always behind player)
    if (
      house.current &&
      houseTileset.current &&
      houseTileset.current.complete
    ) {
      const h = house.current;

      // Top wall rendered behind everything (player walks in front of it)
      depthEntities.push({
        type: "tree",
        y: h.interiorY - 1,
        renderFn: () => {
          if (
            !house.current ||
            !houseTileset.current ||
            !houseTileset.current.complete
          )
            return;

          const h = house.current;

          // Render ONLY top wall row (hy === 0)
          for (let hx = 0; hx < h.interiorWidth; hx++) {
            const worldX = h.interiorX + hx;
            const worldY = h.interiorY;
            const screenX = (worldX - targetCameraX) * TILE_SIZE;
            const screenY = (worldY - targetCameraY) * TILE_SIZE;

            let wallX = 1;
            let wallY = 1;
            if (hx === 0) { wallX = 0; wallY = 1; }
            else if (hx === h.interiorWidth - 1) { wallX = 2; wallY = 1; }

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
        },
      });

      // Side walls, bottom wall, and door rendered IN FRONT of player
      depthEntities.push({
        type: "tree",
        y: h.interiorY + h.interiorHeight,
        renderFn: () => {
          if (
            !house.current ||
            !houseTileset.current ||
            !houseTileset.current.complete
          )
            return;

          const h = house.current;

          // Render side walls (hy 1..height-2) and bottom wall (hy === height-1)
          for (let hy = 1; hy < h.interiorHeight; hy++) {
            for (let hx = 0; hx < h.interiorWidth; hx++) {
              const worldX = h.interiorX + hx;
              const worldY = h.interiorY + hy;
              const screenX = (worldX - targetCameraX) * TILE_SIZE;
              const screenY = (worldY - targetCameraY) * TILE_SIZE;

              const interiorTile = h.interiorTiles[hy][hx];

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
                  let wallX = 1;
                  let wallY = 2;

                  if (hy === h.interiorHeight - 1) {
                    if (hx === 0) { wallX = 0; wallY = 3; }
                    else if (hx === h.interiorWidth - 1) { wallX = 2; wallY = 3; }
                    else { wallX = 1; wallY = 3; }
                  } else if (hx === 0) {
                    wallX = 0; wallY = 2;
                  } else if (hx === h.interiorWidth - 1) {
                    wallX = 2; wallY = 2;
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
        },
      });

      // Each furniture piece as its own depth entity (sorted by bottom edge)
      if (
        furnitureTileset.current &&
        furnitureTileset.current.complete
      ) {
        for (const furn of h.furniture) {
          const furnBottomY = h.interiorY + furn.y + furn.height - 1;
          depthEntities.push({
            type: "tree",
            y: furnBottomY,
            renderFn: () => {
              if (
                !furnitureTileset.current ||
                !furnitureTileset.current.complete ||
                !house.current
              )
                return;
              const hRef = house.current;

              // Silhouette glow for the glowing drawer
              if (
                furn.x === 1 &&
                furn.y === 1 &&
                furnitureTileset.current
              ) {
                const cabWorldX = hRef.interiorX + furn.x;
                const cabWorldY = hRef.interiorY + furn.y;
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
                  const worldX = hRef.interiorX + furn.x + fx;
                  const worldY = hRef.interiorY + furn.y + fy;
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
            },
          });
        }
      }
    }

    // Add sign to depth sorting
    if (signTilesetRef.current && signTilesetRef.current.complete) {
      depthEntities.push({
        type: "decoration",
        y: SIGN_Y,
        renderFn: () => {
          if (!signTilesetRef.current || !signTilesetRef.current.complete) return;
          const screenX = (SIGN_X - targetCameraX) * TILE_SIZE;
          const screenY = (SIGN_Y - targetCameraY) * TILE_SIZE;
          if (
            screenX < -TILE_SIZE * 2 ||
            screenX > canvas.width + TILE_SIZE ||
            screenY < -TILE_SIZE * 2 ||
            screenY > canvas.height + TILE_SIZE
          ) return;
          // Draw the first 16x16 tile from the sign spritesheet at (0,0)
          ctx.drawImage(
            signTilesetRef.current,
            0, 0, 16, 16,
            screenX, screenY, TILE_SIZE, TILE_SIZE,
          );
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

    // Render dialogue bubble (9-slice from dialogue tileset)
    // Reads live position from dialogueSpeakerRef so the bubble follows the animal
    if (
      dialogueOpen &&
      dialogueSpeakerRef.current &&
      dialogueTilesetRef.current &&
      dialogueTilesetRef.current.complete
    ) {
      const speaker = dialogueSpeakerRef.current;
      const DT = 16; // source tile size in spritesheet
      const DS = 3; // scale factor (16 * 3 = 48px per border tile)
      const DB = DT * DS; // 48px border

      // 9-slice tile coords (col, row) in 16x16 grid
      const DSLICE = {
        TL: { sx: 28 * DT, sy: 8 * DT },
        T:  { sx: 29 * DT, sy: 8 * DT },
        TR: { sx: 30 * DT, sy: 8 * DT },
        L:  { sx: 28 * DT, sy: 9 * DT },  // Left edge with speech triangle
        C:  { sx: 29 * DT, sy: 9 * DT },
        R:  { sx: 30 * DT, sy: 9 * DT },
        BL: { sx: 28 * DT, sy: 10 * DT },
        B:  { sx: 29 * DT, sy: 10 * DT },
        BR: { sx: 30 * DT, sy: 10 * DT },
      };

      // Measure text to size the bubble
      ctx.save();
      ctx.font = "14px 'PixelFont', monospace";
      const textMetrics = ctx.measureText(dialogueText);
      const textWidth = textMetrics.width;
      const textHeight = 14; // pixel font height

      // Dialogue box dimensions
      const padX = 16;
      const padY = 12;
      const innerW = textWidth + padX * 2;
      const innerH = textHeight + padY * 2;
      const boxW = Math.max(innerW + DB * 2, DB * 4);
      const boxH = Math.max(innerH + DB * 2, DB * 3);

      // Position bubble to the RIGHT of the speaker, following their live position
      const speakerScreenX = (speaker.x - targetCameraX) * TILE_SIZE;
      const speakerScreenY = (speaker.y - targetCameraY) * TILE_SIZE;
      const boxX = Math.round(speakerScreenX + TILE_SIZE * 1.5);
      const boxY = Math.round(speakerScreenY - boxH - TILE_SIZE * 0.5 + TILE_SIZE * 3);

      // Clamp to canvas bounds
      const clampedX = Math.max(4, Math.min(canvas.width - boxW - 4, boxX));
      const clampedY = Math.max(4, Math.min(canvas.height - boxH - 4, boxY));

      ctx.imageSmoothingEnabled = false;

      const dtile = (key: keyof typeof DSLICE, dx: number, dy: number, dw: number, dh: number) => {
        const { sx, sy } = DSLICE[key];
        ctx.drawImage(dialogueTilesetRef.current!, sx, sy, DT, DT, dx, dy, dw, dh);
      };

      const iw = boxW - DB * 2;
      const ih = boxH - DB * 2;

      // Center fill
      for (let fy = 0; fy < ih; fy += DB) {
        for (let fx = 0; fx < iw; fx += DB) {
          dtile("C", clampedX + DB + fx, clampedY + DB + fy, Math.min(DB, iw - fx), Math.min(DB, ih - fy));
        }
      }
      // Top & bottom edges
      for (let fx = 0; fx < iw; fx += DB) {
        const tw = Math.min(DB, iw - fx);
        dtile("T", clampedX + DB + fx, clampedY, tw, DB);
        dtile("B", clampedX + DB + fx, clampedY + boxH - DB, tw, DB);
      }
      // Left & right edges
      for (let fy = 0; fy < ih; fy += DB) {
        const th = Math.min(DB, ih - fy);
        dtile("L", clampedX, clampedY + DB + fy, DB, th);
        dtile("R", clampedX + boxW - DB, clampedY + DB + fy, DB, th);
      }
      // Corners
      dtile("TL", clampedX, clampedY, DB, DB);
      dtile("TR", clampedX + boxW - DB, clampedY, DB, DB);
      dtile("BL", clampedX, clampedY + boxH - DB, DB, DB);
      dtile("BR", clampedX + boxW - DB, clampedY + boxH - DB, DB, DB);

      // Render text centered inside the box
      ctx.font = "14px 'PixelFont', monospace";
      ctx.fillStyle = "#3e2723";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        dialogueText,
        clampedX + boxW / 2,
        clampedY + boxH / 2,
      );

      ctx.restore();
    }

    // ── "E" interaction prompt over nearby interactables ─────────
    // Uses the 2×2 tile button graphic at col 38-39, row 0-1 on the dialogue tileset
    if (
      dialogueTilesetRef.current &&
      dialogueTilesetRef.current.complete
    ) {
      const DT = 16; // source tile size
      const SCALE = 3; // render scale
      const srcX = 38 * DT; // col 38
      const srcY = 0 * DT;  // row 0
      const srcW = 2 * DT;  // 2 tiles wide = 32px source
      const srcH = 2 * DT;  // 2 tiles tall = 32px source
      const destW = srcW * SCALE; // 96px rendered
      const destH = srcH * SCALE; // 96px rendered

      // Raised/flat animation: raised 1.5s, unraised 0.5s
      const cycleMs = 2000;
      const phase = Date.now() % cycleMs;
      const isRaised = phase < 1500;
      const yOff = isRaised ? -3 : 0;

      const drawPromptAt = (sx: number, sy: number) => {
        const px = Math.round(sx - destW / 2);
        const py = Math.round(sy - destH - 8 + yOff);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
          dialogueTilesetRef.current!,
          srcX, srcY, srcW, srcH,
          px, py, destW, destH,
        );

        // "E" letter centered on the button
        ctx.font = "bold 20px 'PixelFont', monospace";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("E", px + destW / 2 + 2, py + destH / 2 - 8);

        ctx.restore();
      };

      const INTERACT_RANGE = 3.5;

      // Check NPC proximity
      for (const npc of npcsRef.current) {
        const dx = playerPos.x - npc.x;
        const dy = playerPos.y - npc.y;
        if (Math.sqrt(dx * dx + dy * dy) < INTERACT_RANGE) {
          const sx = (npc.x - targetCameraX) * TILE_SIZE;
          const sy = (npc.y - targetCameraY) * TILE_SIZE - TILE_SIZE;
          drawPromptAt(sx, sy);
        }
      }

      // Check glowing drawer proximity (inside house)
      if (house.current) {
        const h = house.current;
        const dwx = h.interiorX + 1;
        const dwy = h.interiorY + 1;
        const dx = playerPos.x - dwx;
        const dy = playerPos.y - dwy;
        if (Math.sqrt(dx * dx + dy * dy) < 1.8) {
          const sx = (dwx - targetCameraX) * TILE_SIZE + TILE_SIZE * 0.5;
          const sy = (dwy - targetCameraY) * TILE_SIZE;
          drawPromptAt(sx, sy);
        }
      }

      // Check fountain proximity
      for (const dec of decorations.current) {
        if (dec.type === "fountain") {
          const fcx = dec.x + 3;
          const fcy = dec.y + 3;
          const dx = playerPos.x - fcx;
          const dy = playerPos.y - fcy;
          if (Math.sqrt(dx * dx + dy * dy) < INTERACT_RANGE) {
            const sx = (fcx - targetCameraX) * TILE_SIZE;
            const sy = (dec.y - targetCameraY) * TILE_SIZE;
            drawPromptAt(sx, sy);
          }
        }
      }

      // Check sign proximity
      {
        const dx = playerPos.x - SIGN_X;
        const dy = playerPos.y - SIGN_Y;
        if (Math.sqrt(dx * dx + dy * dy) < 4.5) {
          const sx = (SIGN_X - targetCameraX) * TILE_SIZE + TILE_SIZE * 0.5;
          const sy = (SIGN_Y - targetCameraY) * TILE_SIZE;
          drawPromptAt(sx, sy);
        }
      }

      // Check glowing cow proximity
      if (glowingCowPenBounds.current) {
        for (const animal of animals.current) {
          if (
            animal.type === "cow" &&
            animal.penned &&
            animal.penBounds &&
            animal.penBounds.left === glowingCowPenBounds.current!.left &&
            animal.penBounds.top === glowingCowPenBounds.current!.top
          ) {
            const dx = playerPos.x - animal.x;
            const dy = playerPos.y - animal.y;
            if (Math.sqrt(dx * dx + dy * dy) < 3) {
              const sx = (animal.x - targetCameraX) * TILE_SIZE;
              const sy = (animal.y - targetCameraY) * TILE_SIZE - TILE_SIZE;
              drawPromptAt(sx, sy);
            }
          }
        }
      }
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

          // Collision area (4 tiles wide x 2 tall, expanded 0.5 each side) in solid cyan
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = 2;
          const collisionScreenX =
            fountainScreenX + (1.5 - 0.5) * TILE_SIZE;
          const collisionScreenY =
            fountainScreenY + 2 * TILE_SIZE;
          const collisionWidth = (3 + 1) * TILE_SIZE;
          const collisionHeight = 2 * TILE_SIZE;
          ctx.strokeRect(
            collisionScreenX,
            collisionScreenY,
            collisionWidth,
            collisionHeight,
          );
        } else if (decoration.type === "campfire") {
          // Campfire: Draw full 4x4 bounds in light color, expanded collision in solid color
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

          // Collision area (3 tiles wide x 2 tall, expanded 0.5 each side) in solid orange
          ctx.strokeStyle = "#ff6600";
          ctx.lineWidth = 2;
          const collisionCenterScreenX =
            campfireScreenX + (1 - 0.5) * TILE_SIZE;
          const collisionCenterScreenY =
            campfireScreenY + 1 * TILE_SIZE;
          ctx.strokeRect(
            collisionCenterScreenX,
            collisionCenterScreenY,
            (2 + 1) * TILE_SIZE,
            TILE_SIZE * 2,
          );
        } else if (decoration.type === "well") {
          // Well: 2x2 collision box in purple
          const wellScreenX =
            (decoration.x - targetCameraX) * TILE_SIZE;
          const wellScreenY =
            (decoration.y - targetCameraY) * TILE_SIZE;

          ctx.strokeStyle = "#aa44ff";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            wellScreenX,
            wellScreenY,
            2 * TILE_SIZE,
            2 * TILE_SIZE,
          );
        }
      }

      // Draw water/lake collision zones (tile + 0.5-tile extended collision area)
      const viewLeft = Math.floor(targetCameraX);
      const viewTop = Math.floor(targetCameraY);
      const viewRight = Math.ceil(targetCameraX + canvas.width / TILE_SIZE);
      const viewBottom = Math.ceil(targetCameraY + canvas.height / TILE_SIZE);

      for (let ty = Math.max(0, viewTop - 1); ty <= Math.min(MAP_HEIGHT - 1, viewBottom + 1); ty++) {
        for (let tx = Math.max(0, viewLeft - 1); tx <= Math.min(MAP_WIDTH - 1, viewRight + 1); tx++) {
          const tile = map[ty]?.[tx];
          if (tile === "lake" || tile === "water") {
            const tileScreenX = (tx - targetCameraX) * TILE_SIZE;
            const tileScreenY = (ty - targetCameraY) * TILE_SIZE;

            // Draw the actual tile boundary (solid blue)
            ctx.strokeStyle = "#0066ff88";
            ctx.lineWidth = 1;
            ctx.strokeRect(tileScreenX, tileScreenY, TILE_SIZE, TILE_SIZE);

            // Draw the 0.5-tile extended collision area (dashed red outline)
            ctx.strokeStyle = "#ff000066";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            const ext = 0.5 * TILE_SIZE;
            ctx.strokeRect(
              tileScreenX - ext,
              tileScreenY - ext,
              TILE_SIZE + ext * 2,
              TILE_SIZE + ext * 2,
            );
            ctx.setLineDash([]);
          }
        }
      }
    }
  }, [
    map,
    playerPos,
    playerDirection,
    playerFrame,
    playerIsMoving,
    canvasSize,
    animationFrame,
    spritesLoaded,
    debugCollision,
    dialogueOpen,
    dialogueText,
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
    animals,
    house,
    map,
    setPlayerPos,
    setPlayerDirection,
    setPlayerFrame,
    setPlayerIsMoving,
    frozen: modalOpen || projectsModalOpen || helpModalOpen,
  });

  // Show a timed dialogue bubble that follows a speaker animal
  const showDialogue = useCallback((text: string, speaker: Animal, durationMs: number) => {
    // Clear any existing dialogue timer
    if (dialogueTimerRef.current) {
      clearTimeout(dialogueTimerRef.current);
    }
    dialogueSpeakerRef.current = speaker;
    setDialogueText(text);
    setDialogueOpen(true);
    dialogueTimerRef.current = setTimeout(() => {
      setDialogueOpen(false);
      setDialogueText("");
      dialogueSpeakerRef.current = null;
      dialogueTimerRef.current = null;
    }, durationMs);
  }, []);

  // Interact: check NPC proximity and open modal, or glowing cow for dialogue, or glowing drawer for projects
  const tryInteract = useCallback(() => {
    if (modalOpen || projectsModalOpen || helpModalOpen) return;

    // Check sign proximity
    {
      const dx = playerPos.x - SIGN_X;
      const dy = playerPos.y - SIGN_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4.5) {
        setHelpModalOpen(true);
        return;
      }
    }

    // Check glowing drawer proximity (furniture at interior x=1, y=1)
    if (house.current) {
      const h = house.current;
      const drawerWorldX = h.interiorX + 1;
      const drawerWorldY = h.interiorY + 1;
      const dx = playerPos.x - drawerWorldX;
      const dy = playerPos.y - drawerWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.8) {
        setProjectsModalOpen(true);
        return;
      }
    }

    // Check fountain proximity — opens resume link
    for (const dec of decorations.current) {
      if (dec.type === "fountain") {
        // Fountain center is roughly at (x+3, y+3) for a 6x5 sprite
        const fountainCenterX = dec.x + 3;
        const fountainCenterY = dec.y + 3;
        const dx = playerPos.x - fountainCenterX;
        const dy = playerPos.y - fountainCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3.5) {
          // TODO: Replace with your actual resume URL
          window.open("https://your-resume-url.com/resume.pdf", "_blank", "noopener,noreferrer");
          return;
        }
      }
    }

    // Check NPC proximity
    for (const npc of npcsRef.current) {
      const dx = playerPos.x - npc.x;
      const dy = playerPos.y - npc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2.5) {
        setModalOpen(true);
        return;
      }
    }

    // Check glowing cow proximity
    if (glowingCowPenBounds.current) {
      for (const animal of animals.current) {
        if (
          animal.type === "cow" &&
          animal.penned &&
          animal.penBounds &&
          animal.penBounds.left === glowingCowPenBounds.current!.left &&
          animal.penBounds.top === glowingCowPenBounds.current!.top
        ) {
          const dx = playerPos.x - animal.x;
          const dy = playerPos.y - animal.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 3) {
            showDialogue("Bellooo!, I'm a glowing cow", animal, 3000);
            return;
          }
        }
      }
    }
  }, [playerPos, modalOpen, projectsModalOpen, helpModalOpen, showDialogue]);

  // E key to interact with nearby NPCs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") tryInteract();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tryInteract]);

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
      <PortraitWarning />
      <LoadingScreen loaded={spritesLoaded && map.length > 0} />
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: displaySize.width || "100%",
          height: displaySize.height || "100%",
          imageRendering: "pixelated",
        }}
      />
      {isMobile && !modalOpen && !helpModalOpen && (
        <MobileControls
          keysPressed={keysPressed}
          onInteract={tryInteract}
          visible={!modalOpen}
        />
      )}
      <GameModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ProjectsModal isOpen={projectsModalOpen} onClose={() => setProjectsModalOpen(false)} />
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  );
}