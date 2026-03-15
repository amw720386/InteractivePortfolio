// Offscreen canvas for creating white silhouette glow effects
const glowCanvas = document.createElement("canvas");
const glowCtx = glowCanvas.getContext("2d")!;

/**
 * Draws a pulsing white silhouette glow behind a sprite.
 * Copies the sprite frame to an offscreen canvas, composites it to solid white,
 * then draws scaled-up copies behind the actual sprite position.
 */
export function drawSilhouetteGlow(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  flipX?: boolean,
) {
  const time = Date.now() / 1000;
  const pulse = (Math.sin(time * 2.5) + 1) / 2;
  const scaleExtra = 1.0 + pulse * 0.15;
  const glowAlpha = 0.35 + pulse * 0.5;

  glowCanvas.width = srcW;
  glowCanvas.height = srcH;
  glowCtx.clearRect(0, 0, srcW, srcH);

  // Draw the sprite frame
  glowCtx.drawImage(sprite, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

  // Composite to solid white keeping only the alpha channel shape
  glowCtx.globalCompositeOperation = "source-in";
  glowCtx.fillStyle = "#ffffff";
  glowCtx.fillRect(0, 0, srcW, srcH);
  glowCtx.globalCompositeOperation = "source-over";

  const expandedW = destW * scaleExtra;
  const expandedH = destH * scaleExtra;
  const offsetX = (expandedW - destW) / 2;
  const offsetY = (expandedH - destH) / 2;

  ctx.save();
  ctx.globalAlpha = glowAlpha;

  if (flipX) {
    ctx.save();
    ctx.translate(destX + destW, destY);
    ctx.scale(-1, 1);
    ctx.drawImage(glowCanvas, 0, 0, srcW, srcH, -offsetX, -offsetY, expandedW, expandedH);
    ctx.restore();
    ctx.globalAlpha = glowAlpha * 0.4;
    ctx.save();
    ctx.translate(destX + destW, destY);
    ctx.scale(-1, 1);
    ctx.drawImage(glowCanvas, 0, 0, srcW, srcH, -offsetX, -offsetY, expandedW, expandedH);
    ctx.restore();
  } else {
    ctx.drawImage(glowCanvas, 0, 0, srcW, srcH, destX - offsetX, destY - offsetY, expandedW, expandedH);
    ctx.globalAlpha = glowAlpha * 0.4;
    ctx.drawImage(glowCanvas, 0, 0, srcW, srcH, destX - offsetX, destY - offsetY, expandedW, expandedH);
  }

  ctx.restore();
}
