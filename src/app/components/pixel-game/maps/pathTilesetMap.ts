// Path tileset mapping - 64x64 image with 16x16 tiles (4x4 grid)
export const PATH_TILESET = {
  // Vertical path blocks (column 0, rows 1-3)
  VERTICAL: {
    TOP: { col: 0, row: 1 },      // Fewer planks at top
    MIDDLE: { col: 0, row: 2 },   // Consistent planks
    BOTTOM: { col: 0, row: 3 },   // Fewer planks at bottom
  },
  
  // Horizontal path blocks (row 3, columns 1-3)
  HORIZONTAL: {
    LEFT: { col: 1, row: 3 },     // Fewer planks at left
    MIDDLE: { col: 2, row: 3 },   // Consistent planks
    RIGHT: { col: 3, row: 3 },    // Fewer planks at right
  },
};
