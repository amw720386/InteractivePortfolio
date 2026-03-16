/**
 * UI Panel 9-slice tile map
 * =========================
 * Mapped from the dialogue tileset spritesheet (16x16 grid).
 *
 * 4 colours × 2 variants (raised / flat) = 8 panel styles.
 *
 *  Colour       Raised cols/rows   Flat cols/rows
 *  ──────────   ────────────────   ──────────────
 *  white        0-2 / 0-2          3-5 / 0-2
 *  birch        0-2 / 3-5          3-5 / 3-5
 *  lightBrown   0-2 / 6-8          3-5 / 6-8
 *  darkBrown    0-2 / 9-11         3-5 / 9-11
 *
 * Each 9-slice has: TL, T, TR, L, C, R, BL, B, BR
 */

export type PanelColour = "white" | "birch" | "lightBrown" | "darkBrown";
export type PanelVariant = "raised" | "flat";

interface SliceTile {
  col: number;
  row: number;
}

export interface NineSlice {
  TL: SliceTile;
  T: SliceTile;
  TR: SliceTile;
  L: SliceTile;
  C: SliceTile;
  R: SliceTile;
  BL: SliceTile;
  B: SliceTile;
  BR: SliceTile;
}

const COLOUR_ROW_START: Record<PanelColour, number> = {
  white: 0,
  birch: 3,
  lightBrown: 6,
  darkBrown: 9,
};

const VARIANT_COL_START: Record<PanelVariant, number> = {
  raised: 0,
  flat: 3,
};

export function getPanelSlice(
  colour: PanelColour,
  variant: PanelVariant
): NineSlice {
  const c = VARIANT_COL_START[variant];
  const r = COLOUR_ROW_START[colour];
  return {
    TL: { col: c, row: r },
    T: { col: c + 1, row: r },
    TR: { col: c + 2, row: r },
    L: { col: c, row: r + 1 },
    C: { col: c + 1, row: r + 1 },
    R: { col: c + 2, row: r + 1 },
    BL: { col: c, row: r + 2 },
    B: { col: c + 1, row: r + 2 },
    BR: { col: c + 2, row: r + 2 },
  };
}

/** Pre-built lookup for quick access */
export const UI_PANELS = {
  white: {
    raised: getPanelSlice("white", "raised"),
    flat: getPanelSlice("white", "flat"),
  },
  birch: {
    raised: getPanelSlice("birch", "raised"),
    flat: getPanelSlice("birch", "flat"),
  },
  lightBrown: {
    raised: getPanelSlice("lightBrown", "raised"),
    flat: getPanelSlice("lightBrown", "flat"),
  },
  darkBrown: {
    raised: getPanelSlice("darkBrown", "raised"),
    flat: getPanelSlice("darkBrown", "flat"),
  },
} as const;