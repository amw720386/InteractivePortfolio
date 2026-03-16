import { useEffect, useRef, useState } from "react";
import { ASSET_URLS } from "../assets";

export interface GameSprites {
  characterSprite: HTMLImageElement | null;
  chickenSprite: HTMLImageElement | null;
  eggsSprite: HTMLImageElement | null;
  breadSprite: HTMLImageElement | null;
  grassTileset: HTMLImageElement | null;
  dirtTileset: HTMLImageElement | null;
  foliageTileset: HTMLImageElement | null;
  pathTileset: HTMLImageElement | null;
  houseTileset: HTMLImageElement | null;
  furnitureTileset: HTMLImageElement | null;
  fenceTileset: HTMLImageElement | null;
  fountainTileset: HTMLImageElement | null;
  campfireTileset: HTMLImageElement | null;
  chickenCoop: HTMLImageElement | null;
  forestTree: HTMLImageElement | null;
  forestTreeDarker: HTMLImageElement | null;
  extraTreesTileset: HTMLImageElement | null;
  statueTileset: HTMLImageElement | null;
  waterTileset: HTMLImageElement | null;
  dockTileset: HTMLImageElement | null;
  stonePathTileset: HTMLImageElement | null;
  boatTileset: HTMLImageElement | null;
  waterDecoTileset: HTMLImageElement | null;
  dialogueTileset: HTMLImageElement | null;
  signTileset: HTMLImageElement | null;
}

export function useSprites() {
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  
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
  const furnitureTileset = useRef<HTMLImageElement | null>(null);
  const fenceTileset = useRef<HTMLImageElement | null>(null);
  const fountainTileset = useRef<HTMLImageElement | null>(null);
  const campfireTileset = useRef<HTMLImageElement | null>(null);
  const chickenCoop = useRef<HTMLImageElement | null>(null);
  const forestTree = useRef<HTMLImageElement | null>(null);
  const forestTreeDarker = useRef<HTMLImageElement | null>(null);
  const extraTreesTileset = useRef<HTMLImageElement | null>(null);
  const statueTileset = useRef<HTMLImageElement | null>(null);
  const waterTileset = useRef<HTMLImageElement | null>(null);
  const dockTileset = useRef<HTMLImageElement | null>(null);
  const stonePathTileset = useRef<HTMLImageElement | null>(null);
  const boatTileset = useRef<HTMLImageElement | null>(null);
  const waterDecoTileset = useRef<HTMLImageElement | null>(null);
  const dialogueTileset = useRef<HTMLImageElement | null>(null);
  const signTileset = useRef<HTMLImageElement | null>(null);

  // Load all sprites
  useEffect(() => {
    let loadedCount = 0;
    
    // Build sprite loading list dynamically to avoid count mismatches
    const spriteEntries: Array<{ ref: React.RefObject<HTMLImageElement | null>; url: string; name: string }> = [
      { ref: characterSprite, url: ASSET_URLS.characterSprite, name: "character" },
      { ref: chickenSprite, url: ASSET_URLS.chickenSprite, name: "chicken" },
      { ref: eggsSprite, url: ASSET_URLS.eggsSprite, name: "eggs" },
      { ref: breadSprite, url: ASSET_URLS.breadSprite, name: "bread" },
      { ref: grassTileset, url: ASSET_URLS.grassTileset, name: "grass tileset" },
      { ref: dirtTileset, url: ASSET_URLS.dirtTileset, name: "dirt tileset" },
      { ref: foliageTileset, url: ASSET_URLS.foliageTileset, name: "foliage tileset" },
      { ref: pathTileset, url: ASSET_URLS.pathTileset, name: "path tileset" },
      { ref: houseTileset, url: ASSET_URLS.houseTileset, name: "house tileset" },
      { ref: furnitureTileset, url: ASSET_URLS.furnitureTileset, name: "furniture tileset" },
      { ref: fenceTileset, url: ASSET_URLS.fenceTileset, name: "fence tileset" },
      { ref: fountainTileset, url: ASSET_URLS.fountainTileset, name: "fountain tileset" },
      { ref: campfireTileset, url: ASSET_URLS.campfireTileset, name: "campfire tileset" },
      { ref: chickenCoop, url: ASSET_URLS.chickenCoop, name: "chicken coop" },
      { ref: forestTree, url: ASSET_URLS.forestTree, name: "forest tree" },
      { ref: forestTreeDarker, url: ASSET_URLS.forestTreeDarker, name: "forest tree darker" },
      { ref: extraTreesTileset, url: ASSET_URLS.extraTreesTileset, name: "extra trees tileset" },
      { ref: statueTileset, url: ASSET_URLS.statueTileset, name: "statue tileset" },
      { ref: waterTileset, url: ASSET_URLS.waterTileset, name: "water tileset" },
      { ref: dockTileset, url: ASSET_URLS.dockTileset, name: "dock tileset" },
      { ref: stonePathTileset, url: ASSET_URLS.stonePathTileset, name: "stone path tileset" },
      { ref: boatTileset, url: ASSET_URLS.boatTileset, name: "boat tileset" },
      { ref: waterDecoTileset, url: ASSET_URLS.waterDecoTileset, name: "water deco tileset" },
      { ref: dialogueTileset, url: ASSET_URLS.dialogueTileset, name: "dialogue tileset" },
      { ref: signTileset, url: ASSET_URLS.signTileset, name: "sign tileset" },
    ];
    
    const totalSprites = spriteEntries.length;

    const onSpriteLoad = (name: string) => {
      loadedCount++;
      if (loadedCount >= totalSprites) {
        setSpritesLoaded(true);
      }
    };

    const onSpriteError = (name: string) => {
      console.error(`[Sprites] FAILED to load: ${name}`);
      loadedCount++;
      if (loadedCount >= totalSprites) {
        console.warn("[Sprites] All sprites processed (some failed). Continuing...");
        setSpritesLoaded(true);
      }
    };

    try {
      for (const entry of spriteEntries) {
        const img = new Image();
        img.src = entry.url;
        img.onload = () => onSpriteLoad(entry.name);
        img.onerror = () => onSpriteError(entry.name);
        entry.ref.current = img;
      }
    } catch (error) {
      console.error("Error loading sprites:", error);
      setSpritesLoaded(true); // Continue anyway
    }
  }, []);

  return {
    spritesLoaded,
    sprites: {
      characterSprite: characterSprite.current,
      chickenSprite: chickenSprite.current,
      eggsSprite: eggsSprite.current,
      breadSprite: breadSprite.current,
      grassTileset: grassTileset.current,
      dirtTileset: dirtTileset.current,
      foliageTileset: foliageTileset.current,
      pathTileset: pathTileset.current,
      houseTileset: houseTileset.current,
      furnitureTileset: furnitureTileset.current,
      fenceTileset: fenceTileset.current,
      fountainTileset: fountainTileset.current,
      campfireTileset: campfireTileset.current,
      chickenCoop: chickenCoop.current,
      forestTree: forestTree.current,
      forestTreeDarker: forestTreeDarker.current,
      extraTreesTileset: extraTreesTileset.current,
      statueTileset: statueTileset.current,
      waterTileset: waterTileset.current,
      dockTileset: dockTileset.current,
      stonePathTileset: stonePathTileset.current,
      boatTileset: boatTileset.current,
      waterDecoTileset: waterDecoTileset.current,
      dialogueTileset: dialogueTileset.current,
      signTileset: signTileset.current,
    },
  };
}