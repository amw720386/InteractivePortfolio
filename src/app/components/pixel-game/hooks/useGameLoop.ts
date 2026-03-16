import { useEffect, MutableRefObject } from "react";
import { FoliageInstance } from "../maps/foliageTilesetMap";
import { MAP_WIDTH, MAP_HEIGHT, SIGN_X, SIGN_Y } from "../constants";
import type { Tile, Position, House, Decoration, Animal } from "../types";

interface UseGameLoopOptions {
  keysPressed: MutableRefObject<Set<string>>;
  playerPos: Position;
  playerDirection: number;
  playerFrameCounter: MutableRefObject<number>;
  foliage: MutableRefObject<FoliageInstance[]>;
  fencePositions: MutableRefObject<Array<{ x: number; y: number }>>;
  chickenCoopPositions: MutableRefObject<Array<{ x: number; y: number }>>;
  decorations: MutableRefObject<Decoration[]>;
  animals: MutableRefObject<Animal[]>;
  house: MutableRefObject<House | null>;
  map: Tile[][];
  setPlayerPos: (pos: Position) => void;
  setPlayerDirection: (dir: number) => void;
  setPlayerFrame: (fn: (f: number) => number) => void;
  setPlayerIsMoving: (moving: boolean) => void;
  frozen?: boolean;
}

export function useGameLoop({
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
  frozen,
}: UseGameLoopOptions) {
  useEffect(() => {
    const gameLoop = setInterval(() => {
      // If frozen (e.g. modal open), just idle animate — don't move
      if (frozen) {
        setPlayerIsMoving(false);
        playerFrameCounter.current++;
        if (playerFrameCounter.current % 10 === 0) {
          setPlayerFrame((f: number) => (f + 1) % 8);
        }
        return;
      }

      const keys = keysPressed.current;

      // Calculate movement vector
      let deltaX = 0;
      let deltaY = 0;
      let newDirection = playerDirection;

      if (keys.has("w") || keys.has("arrowup")) {
        deltaY -= 1;
        newDirection = 1;
      }
      if (keys.has("s") || keys.has("arrowdown")) {
        deltaY += 1;
        newDirection = 0;
      }
      if (keys.has("a") || keys.has("arrowleft")) {
        deltaX -= 1;
        newDirection = 2;
      }
      if (keys.has("d") || keys.has("arrowright")) {
        deltaX += 1;
        newDirection = 3;
      }

      // Normalize diagonal movement (Pythagorean theorem fix)
      const actuallyMoving = deltaX !== 0 || deltaY !== 0;
      if (actuallyMoving) {
        const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Check if player is inside house - if so, move 3x slower to compensate for 3x interior scaling
        const isInsideHouse =
          house.current &&
          playerPos.x >= house.current.x &&
          playerPos.x < house.current.x + house.current.width &&
          playerPos.y >= house.current.y &&
          playerPos.y < house.current.y + house.current.height;

        const speed = isInsideHouse ? 0.06 / 3 : 0.06;
        deltaX = (deltaX / magnitude) * speed;
        deltaY = (deltaY / magnitude) * speed;
      }

      let newX = playerPos.x + deltaX;
      let newY = playerPos.y + deltaY;

      if (actuallyMoving) {
        setPlayerIsMoving(true);
        setPlayerDirection(newDirection);
        playerFrameCounter.current++;
        if (playerFrameCounter.current % 6 === 0) {
          setPlayerFrame((f: number) => (f + 1) % 8);
        }
      } else {
        setPlayerIsMoving(false);
        // Idle animation: cycle through 8 idle frames slowly
        playerFrameCounter.current++;
        if (playerFrameCounter.current % 10 === 0) {
          setPlayerFrame((f: number) => (f + 1) % 8);
        }
      }

      if (!actuallyMoving) return;

      // Calculate tile position BEFORE clamping for door checks
      const tileX = Math.floor(newX);
      const tileY = Math.floor(newY);

      let canMove = true;
      let playerOnDoor = false;

      // Check collision with foliage (trees)
      const playerRadius = 0.3;
      for (const item of foliage.current) {
        if (item.type === "tree") {
          const treeCenterX = item.x + (item.width - 1) / 2 + 0.5;
          const treeCenterY = item.y + item.height - 0.5;
          const treeHalfWidth = 0.5;
          const treeHalfHeight = 0.5;

          const dx = Math.abs(newX - treeCenterX);
          const dy = Math.abs(newY - treeCenterY);

          if (dx < playerRadius + treeHalfWidth && dy < playerRadius + treeHalfHeight) {
            canMove = false;
            break;
          }
        }
      }

      // Check collision with fence tiles
      if (canMove) {
        for (const fence of fencePositions.current) {
          const fenceCenterX = fence.x + 0.5;
          const fenceCenterY = fence.y + 0.5;
          const dx = Math.abs(newX - fenceCenterX);
          const dy = Math.abs(newY - fenceCenterY);
          if (dx < playerRadius + 0.4 && dy < playerRadius + 0.4) {
            canMove = false;
            break;
          }
        }
      }

      // Check collision with decorations (fountain, campfires, well)
      if (canMove) {
        for (const decoration of decorations.current) {
          if (decoration.type === "fountain") {
            const fountainCollisionX = decoration.x + 1.5 - 0.5;
            const fountainCollisionY = decoration.y + 2;
            const collisionWidth = 3 + 1;
            const collisionHeight = 2;

            if (
              newX >= fountainCollisionX &&
              newX < fountainCollisionX + collisionWidth &&
              newY >= fountainCollisionY &&
              newY < fountainCollisionY + collisionHeight
            ) {
              canMove = false;
              break;
            }
          } else if (decoration.type === "campfire") {
            const campfireCenterX = decoration.x + 1 - 0.5;
            const campfireCenterY = decoration.y + 1;

            if (
              newX >= campfireCenterX &&
              newX < campfireCenterX + 2 + 1 &&
              newY >= campfireCenterY &&
              newY < campfireCenterY + 2
            ) {
              canMove = false;
              break;
            }
          } else if (decoration.type === "well") {
            if (
              newX >= decoration.x &&
              newX < decoration.x + 2 &&
              newY >= decoration.y &&
              newY < decoration.y + 2
            ) {
              canMove = false;
              break;
            }
          }
        }
      }

      // Check collision with sign
      if (canMove) {
        const signCenterX = SIGN_X + 0.5;
        const signCenterY = SIGN_Y + 0.5;
        const dx = Math.abs(newX - signCenterX);
        const dy = Math.abs(newY - signCenterY);
        if (dx < playerRadius + 0.4 && dy < playerRadius + 0.4) {
          canMove = false;
        }
      }

      // Check collision with chicken coops (3x3 tiles)
      if (canMove) {
        for (const coop of chickenCoopPositions.current) {
          const coopCenterX = coop.x + 1.5;
          const coopCenterY = coop.y + 1.5;
          const dx = Math.abs(newX - coopCenterX);
          const dy = Math.abs(newY - coopCenterY);
          if (dx < playerRadius + 1.3 && dy < playerRadius + 1.3) {
            canMove = false;
            break;
          }
        }
      }

      if (house.current) {
        const h = house.current;

        // Check if player is walking through EXTERIOR door (entering house)
        const atExteriorDoor =
          tileX === h.x + h.doorX &&
          tileY === h.y + h.doorY;

        if (atExteriorDoor) {
          setPlayerPos({
            x: h.interiorX + h.interiorDoorX + 0.5,
            y: h.interiorY + h.interiorDoorY - 1 + 0.5,
          });
          house.current.doorOpen = true;
          return;
        }

        // Check if player is walking through INTERIOR door (exiting house)
        const atInteriorDoor =
          tileX === h.interiorX + h.interiorDoorX &&
          tileY === h.interiorY + h.interiorDoorY;

        if (atInteriorDoor) {
          setPlayerPos({
            x: h.x + h.doorX + 0.5,
            y: h.y + h.doorY + 1 + 0.5,
          });
          return;
        }

        // Check collision with interior walls
        const inInterior =
          tileX >= h.interiorX &&
          tileX < h.interiorX + h.interiorWidth &&
          tileY >= h.interiorY &&
          tileY < h.interiorY + h.interiorHeight;

        if (inInterior) {
          const interiorRelX = tileX - h.interiorX;
          const interiorRelY = tileY - h.interiorY;

          if (
            interiorRelX >= 0 &&
            interiorRelX < h.interiorWidth &&
            interiorRelY >= 0 &&
            interiorRelY < h.interiorHeight
          ) {
            const interiorTile = h.interiorTiles[interiorRelY][interiorRelX];

            if (interiorTile.collidable) {
              canMove = false;
            }

            // Check furniture collision in interior
            if (canMove) {
              for (const furn of h.furniture) {
                if (furn.collidable) {
                  const furnLeft = h.interiorX + furn.x;
                  const furnRight = furnLeft + furn.width - 1;
                  const furnTop = h.interiorY + furn.y;
                  const furnBottom = furnTop + furn.height - 1;

                  if (
                    tileX >= furnLeft &&
                    tileX <= furnRight &&
                    tileY >= furnTop &&
                    tileY <= furnBottom
                  ) {
                    canMove = false;
                    break;
                  }
                }
              }
            }
          }
        }

        // Check collision with exterior walls
        const relativeX = tileX - h.x;
        const relativeY = tileY - h.y;

        if (
          relativeX >= 0 &&
          relativeX < h.width &&
          relativeY >= 0 &&
          relativeY < h.height
        ) {
          const houseTile = h.tiles[relativeY][relativeX];

          if (houseTile.collidable) {
            canMove = false;
          }
        }

        // Close the door if player is not on it
        if (!playerOnDoor && h.doorOpen) {
          house.current.doorOpen = false;
        }
      }

      // Check if player is in interior region
      const inInteriorRegion = house.current &&
        tileX >= house.current.interiorX &&
        tileX < house.current.interiorX + house.current.interiorWidth &&
        tileY >= house.current.interiorY &&
        tileY < house.current.interiorY + house.current.interiorHeight;

      // Only clamp position to map bounds if NOT in interior
      if (!inInteriorRegion) {
        newX = Math.max(0, Math.min(MAP_WIDTH - 1, newX));
        newY = Math.max(0, Math.min(MAP_HEIGHT - 1, newY));
      }

      // Apply movement if within valid bounds (or in interior)
      if (canMove) {
        if (inInteriorRegion) {
          setPlayerPos({ x: newX, y: newY });
        } else if (
          tileY >= 0 &&
          tileY < MAP_HEIGHT &&
          tileX >= 0 &&
          tileX < MAP_WIDTH
        ) {
          const tile = map[tileY]?.[tileX];
          if (tile !== "water" && tile !== "building" && tile !== "lake") {
            // If player is on a dock tile, skip the water proximity check
            if (tile === "dock") {
              setPlayerPos({ x: newX, y: newY });
            } else {
              // Check if player is within 0.5 tiles of any lake tile
              let nearLake = false;
              const checkRadius = 0.5;
              for (let cy = Math.floor(newY - checkRadius); cy <= Math.floor(newY + checkRadius); cy++) {
                for (let cx = Math.floor(newX - checkRadius); cx <= Math.floor(newX + checkRadius); cx++) {
                  if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) {
                    const t = map[cy]?.[cx];
                    if (t === "lake" || t === "water") {
                      // Check sub-tile distance
                      const closestX = Math.max(cx, Math.min(cx + 1, newX));
                      const closestY = Math.max(cy, Math.min(cy + 1, newY));
                      const distX = Math.abs(newX - closestX);
                      const distY = Math.abs(newY - closestY);
                      if (distX < checkRadius && distY < checkRadius) {
                        nearLake = true;
                      }
                    }
                  }
                }
              }
              if (!nearLake) {
                setPlayerPos({ x: newX, y: newY });
              }
            }
          }
        }
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [playerPos, map, playerDirection, frozen]);
}