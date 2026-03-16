import { useEffect, MutableRefObject } from "react";
import { FoliageInstance } from "../maps/foliageTilesetMap";
import { MAP_WIDTH, MAP_HEIGHT } from "../constants";
import type { Tile, Animal, House, Decoration } from "../types";

interface UseAnimalAIOptions {
  map: Tile[][];
  animals: MutableRefObject<Animal[]>;
  foliage: MutableRefObject<FoliageInstance[]>;
  fencePositions: MutableRefObject<Array<{ x: number; y: number }>>;
  chickenCoopPositions: MutableRefObject<Array<{ x: number; y: number }>>;
  decorations: MutableRefObject<Decoration[]>;
  house: MutableRefObject<House | null>;
}

export function useAnimalAI({
  map,
  animals,
  foliage,
  fencePositions,
  chickenCoopPositions,
  decorations,
  house,
}: UseAnimalAIOptions) {
  useEffect(() => {
    if (map.length === 0) return;

    // Helper: check if a position is clear of all collidables (1-tile buffer)
    const isAnimalTargetClear = (px: number, py: number): boolean => {
      const buffer = 1.0;

      // Check if near any water/lake tile (within 2 tiles)
      const waterBuffer = 2;
      for (let dy = -waterBuffer; dy <= waterBuffer; dy++) {
        for (let dx = -waterBuffer; dx <= waterBuffer; dx++) {
          const checkX = Math.floor(px) + dx;
          const checkY = Math.floor(py) + dy;
          if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
            const t = map[checkY]?.[checkX];
            if (t === "water" || t === "lake") {
              return false;
            }
          }
        }
      }

      // Check foliage (trees)
      for (const item of foliage.current) {
        if (item.type === "tree") {
          const treeCenterX = item.x + (item.width - 1) / 2 + 0.5;
          const treeCenterY = item.y + item.height - 0.5;
          if (Math.abs(px - treeCenterX) < 0.5 + buffer && Math.abs(py - treeCenterY) < 0.5 + buffer) {
            return false;
          }
        }
      }
      // Check chicken coops
      for (const coop of chickenCoopPositions.current) {
        if (px >= coop.x - buffer && px < coop.x + 3 + buffer &&
            py >= coop.y - buffer && py < coop.y + 3 + buffer) {
          return false;
        }
      }
      // Check fences
      for (const fence of fencePositions.current) {
        if (Math.abs(px - (fence.x + 0.5)) < 0.5 + buffer && Math.abs(py - (fence.y + 0.5)) < 0.5 + buffer) {
          return false;
        }
      }
      // Check decorations
      for (const dec of decorations.current) {
        if (dec.type === "fountain") {
          if (px >= dec.x + 1.5 - buffer && px < dec.x + 4.5 + buffer &&
              py >= dec.y + 2 - buffer && py < dec.y + 4 + buffer) return false;
        } else if (dec.type === "campfire") {
          if (px >= dec.x + 1 - buffer && px < dec.x + 3 + buffer &&
              py >= dec.y + 1 - buffer && py < dec.y + 3 + buffer) return false;
        } else if (dec.type === "well") {
          if (px >= dec.x - buffer && px < dec.x + 2 + buffer &&
              py >= dec.y - buffer && py < dec.y + 2 + buffer) return false;
        }
      }
      // Check house
      if (house.current) {
        const h = house.current;
        if (px >= h.x - buffer && px < h.x + h.width + buffer &&
            py >= h.y - buffer && py < h.y + h.height + 2 + buffer) return false;
      }
      return true;
    };

    // Helper function to pick a valid target within pen bounds (for penned animals)
    const pickPenTarget = (bounds: { left: number; top: number; right: number; bottom: number }): { x: number; y: number } => {
      for (let attempts = 0; attempts < 15; attempts++) {
        const x = bounds.left + Math.random() * (bounds.right - bounds.left);
        const y = bounds.top + Math.random() * (bounds.bottom - bounds.top);
        if (isAnimalTargetClear(x, y)) {
          return { x, y };
        }
      }
      return { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 };
    };

    // Helper function to pick a valid target that avoids all collidables
    const pickValidTarget = (): { x: number; y: number } => {
      for (let attempts = 0; attempts < 20; attempts++) {
        const targetX = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
        const targetY = Math.floor(Math.random() * (MAP_HEIGHT - 10)) + 5;

        if (isAnimalTargetClear(targetX, targetY)) {
          return { x: targetX, y: targetY };
        }
      }
      return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    };

    const pickNewTarget = (animal: Animal) => {
      return animal.penned && animal.penBounds
        ? pickPenTarget(animal.penBounds)
        : pickValidTarget();
    };

    const redirectAnimal = (animal: Animal) => {
      const target = pickNewTarget(animal);
      animal.targetX = target.x;
      animal.targetY = target.y;
      animal.moveTimer = Math.floor(Math.random() * 60) + 30;
    };

    let frameCounter = 0;
    const animalLoop = setInterval(() => {
      frameCounter++;

      animals.current.forEach((animal) => {
        animal.moveTimer--;

        if (
          animal.moveTimer <= 0 &&
          Math.abs(animal.x - animal.targetX) < 0.1 &&
          Math.abs(animal.y - animal.targetY) < 0.1
        ) {
          // Pick new target
          const newTarget = pickNewTarget(animal);
          animal.targetX = newTarget.x;
          animal.targetY = newTarget.y;
          animal.moveTimer = Math.floor(Math.random() * 60) + 30;
        } else if (animal.moveTimer <= 0) {
          const dx = animal.targetX - animal.x;
          const dy = animal.targetY - animal.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0.1) {
            const stepX = (dx / distance) * animal.speed;
            const stepY = (dy / distance) * animal.speed;
            const newX = animal.x + stepX;
            const newY = animal.y + stepY;
            const tileX = Math.floor(newX);
            const tileY = Math.floor(newY);

            let canMoveAnimal = true;

            // Check house collision
            if (house.current) {
              const h = house.current;
              const houseLeft = h.x - 1;
              const houseRight = h.x + h.width + 1;
              const houseTop = h.y - 1;
              const houseBottom = h.y + h.height + 2;

              if (tileX >= houseLeft && tileX < houseRight && tileY >= houseTop && tileY < houseBottom) {
                canMoveAnimal = false;
                redirectAnimal(animal);
              }
            }

            // Check fence collision
            if (canMoveAnimal) {
              for (const fence of fencePositions.current) {
                if (Math.floor(newX) === fence.x && Math.floor(newY) === fence.y) {
                  canMoveAnimal = false;
                  redirectAnimal(animal);
                  break;
                }
              }
            }

            // Check foliage collision (trees only)
            if (canMoveAnimal) {
              const animalRadius = 0.3;
              for (const item of foliage.current) {
                if (item.type === "tree") {
                  const treeCenterX = item.x + (item.width - 1) / 2 + 0.5;
                  const treeCenterY = item.y + item.height - 0.5;
                  const treeHalfWidth = 0.5;
                  const treeHalfHeight = 0.5;

                  const tdx = Math.abs(newX - treeCenterX);
                  const tdy = Math.abs(newY - treeCenterY);

                  if (tdx < animalRadius + treeHalfWidth && tdy < animalRadius + treeHalfHeight) {
                    canMoveAnimal = false;
                    redirectAnimal(animal);
                    break;
                  }
                }
              }
            }

            // Check chicken coop collision (3x3 tiles)
            if (canMoveAnimal) {
              for (const coop of chickenCoopPositions.current) {
                const coopCenterX = coop.x + 1.5;
                const coopCenterY = coop.y + 1.5;
                const cdx = Math.abs(newX - coopCenterX);
                const cdy = Math.abs(newY - coopCenterY);
                if (cdx < 1.8 && cdy < 1.8) {
                  canMoveAnimal = false;
                  redirectAnimal(animal);
                  break;
                }
              }
            }

            // Check decoration collision
            if (canMoveAnimal) {
              for (const decoration of decorations.current) {
                let collides = false;

                if (decoration.type === "fountain") {
                  const fountainCollisionX = decoration.x + 1.5;
                  const fountainCollisionY = decoration.y + 2;
                  if (
                    newX >= fountainCollisionX && newX < fountainCollisionX + 3 &&
                    newY >= fountainCollisionY && newY < fountainCollisionY + 2
                  ) collides = true;
                } else if (decoration.type === "campfire") {
                  const campfireCenterX = decoration.x + 1;
                  const campfireCenterY = decoration.y + 1;
                  if (
                    newX >= campfireCenterX && newX < campfireCenterX + 2 &&
                    newY >= campfireCenterY && newY < campfireCenterY + 2
                  ) collides = true;
                } else if (decoration.type === "well") {
                  if (
                    newX >= decoration.x && newX < decoration.x + 2 &&
                    newY >= decoration.y && newY < decoration.y + 2
                  ) collides = true;
                }

                if (collides) {
                  canMoveAnimal = false;
                  redirectAnimal(animal);
                  break;
                }
              }
            }

            if (tileY >= 0 && tileY < MAP_HEIGHT && tileX >= 0 && tileX < MAP_WIDTH && canMoveAnimal) {
              const tile = map[tileY]?.[tileX];
              if (tile !== "water" && tile !== "tree" && tile !== "building" && tile !== "lake" && tile !== "dock") {
                // Check if animal is within 2 tiles of any water/lake tile
                let nearWater = false;
                const animalWaterBuffer = 2;
                for (let cy = Math.floor(newY) - animalWaterBuffer; cy <= Math.floor(newY) + animalWaterBuffer; cy++) {
                  for (let cx = Math.floor(newX) - animalWaterBuffer; cx <= Math.floor(newX) + animalWaterBuffer; cx++) {
                    if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) {
                      const t = map[cy]?.[cx];
                      if (t === "lake" || t === "water") {
                        nearWater = true;
                      }
                    }
                  }
                }
                if (!nearWater) {
                  animal.x = newX;
                  animal.y = newY;
                } else {
                  redirectAnimal(animal);
                }
              } else {
                redirectAnimal(animal);
              }
            } else if (!canMoveAnimal) {
              redirectAnimal(animal);
            }

            if (dx > 0.01) {
              animal.direction = 3; // facing right
            } else if (dx < -0.01) {
              animal.direction = 2; // facing left
            }
            // else: purely vertical movement — keep current direction

            // Slower animation tick for animals
            if (frameCounter % 12 === 0) {
              animal.frame =
                (animal.frame + 1) %
                (animal.type === "cow" ? 3 : 2);
            }
          }
        } else {
          animal.frame = 0;
        }
      });
    }, 16);

    return () => clearInterval(animalLoop);
  }, [map]);
}