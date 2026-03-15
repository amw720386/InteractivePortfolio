// Core tile and building types
export type Tile =
  | "grass"
  | "grass2"
  | "water"
  | "path"
  | "tree"
  | "building"
  | "sign"
  | "dirt";

export interface Position {
  x: number;
  y: number;
}

export interface Animal {
  x: number;
  y: number;
  type: "chicken" | "cow";
  direction: number;
  frame: number;
  speed: number;
  targetX: number;
  targetY: number;
  moveTimer: number;
  penned?: boolean; // If true, animal stays within pen bounds
  penBounds?: { left: number; top: number; right: number; bottom: number };
}

// House and interior types
export interface HouseTile {
  type: "wall" | "floor" | "roof" | "door";
  doorOpen?: boolean;
  collidable?: boolean;
}

export interface Furniture {
  x: number; // Position in interior coordinates (24x12 space)
  y: number;
  tileX: number; // Texture position in tileset
  tileY: number;
  width: number; // Size in tiles (1x1, 1x2, etc.)
  height: number;
  collidable: boolean;
  onWall?: boolean; // Whether it's a wall decoration (rendering hint)
}

export interface House {
  // EXTERIOR building
  x: number; // Top-left position on map
  y: number;
  width: number; // Width in tiles (8x4)
  height: number; // Height in tiles
  roofHeight: number; // Height of roof in tiles
  tiles: HouseTile[][]; // 2D array of exterior house tiles
  doorX: number; // Door position relative to house
  doorY: number;
  doorOpen: boolean; // Door state
  
  // INTERIOR location (separate area on map)
  interiorX: number; // Interior location on map (far away)
  interiorY: number;
  interiorWidth: number; // Interior size in tiles (24x12)
  interiorHeight: number;
  interiorTiles: HouseTile[][]; // 2D array of interior tiles
  interiorDoorX: number; // Exit door position in interior
  interiorDoorY: number;
  furniture: Furniture[]; // All furniture in interior coordinates
}

export interface Decoration {
  x: number;
  y: number;
  type: "egg" | "bread" | "fountain" | "campfire" | "chickenCoop" | "well";
  variant: number;
}