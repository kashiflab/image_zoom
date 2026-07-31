/**
 * TradingView Image Viewer - High-DPI Canvas Renderer
 */

class Renderer {
  constructor(canvas, camera, grid) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.grid = grid || new Grid();

    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.dpr = getDpr();
  }

  /**
   * Resize canvas backing buffer according to Device Pixel Ratio
   */
  resize(width, height) {
    this.dpr = getDpr();
    this.viewportWidth = width;
    this.viewportHeight = height;

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);

    // Apply high quality smoothing
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Main render loop draw call
   */
  render(image, cursorState = { isInside: false, x: 0, y: 0 }) {
    const { ctx, dpr, viewportWidth, viewportHeight, camera, grid } = this;

    ctx.save();
    
    // Scale for high-DPI resolution
    ctx.scale(dpr, dpr);

    // 1. Clear Viewport Background
    ctx.fillStyle = THEME.BG_COLOR;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // 2. Draw TradingView Grid
    if (grid) {
      grid.draw(ctx, camera, viewportWidth, viewportHeight);
    }

    // 3. Render Uploaded Image with Camera Transforms
    if (image && image.complete && image.naturalWidth !== 0) {
      const renderW = image.width * camera.scaleX;
      const renderH = image.height * camera.scaleY;

      ctx.drawImage(
        image,
        camera.offsetX,
        camera.offsetY,
        renderW,
        renderH
      );

      // Draw Image Border Accent
      ctx.strokeStyle = THEME.BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        crisp(camera.offsetX),
        crisp(camera.offsetY),
        renderW,
        renderH
      );
    }

    // 4. Render TradingView Interactive Crosshair Overlay
    if (cursorState.isInside) {
      this.drawCrosshair(ctx, cursorState.x, cursorState.y, viewportWidth, viewportHeight, image);
    }

    ctx.restore();
  }

  /**
   * Draw TradingView-style crosshair with axis position badges
   */
  drawCrosshair(ctx, cursorX, cursorY, viewportWidth, viewportHeight, image) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = THEME.CROSSHAIR_COLOR;
    ctx.lineWidth = 1;

    const cx = crisp(cursorX);
    const cy = crisp(cursorY);

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, viewportHeight);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(viewportWidth, cy);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash pattern

    // If image exists, draw axis coordinate labels on edge bounds
    if (image) {
      const worldPos = this.camera.screenToWorld(cursorX, cursorY);
      const imgX = Math.round(worldPos.x);
      const imgY = Math.round(worldPos.y);

      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillStyle = THEME.CROSSHAIR_LABEL_BG;
      ctx.strokeStyle = THEME.BORDER_COLOR;

      // X-Axis Badge at bottom
      const xText = `X: ${imgX}`;
      const xMetrics = ctx.measureText(xText);
      const xBadgeW = xMetrics.width + 12;
      const xBadgeH = 18;
      const xBadgeX = clamp(cursorX - xBadgeW / 2, 4, viewportWidth - xBadgeW - 4);
      const xBadgeY = viewportHeight - xBadgeH - 4;

      ctx.fillRect(xBadgeX, xBadgeY, xBadgeW, xBadgeH);
      ctx.strokeRect(xBadgeX, xBadgeY, xBadgeW, xBadgeH);

      ctx.fillStyle = THEME.CROSSHAIR_LABEL_TEXT;
      ctx.fillText(xText, xBadgeX + 6, xBadgeY + 13);

      // Y-Axis Badge at right
      const yText = `Y: ${imgY}`;
      const yMetrics = ctx.measureText(yText);
      const yBadgeW = yMetrics.width + 12;
      const yBadgeH = 18;
      const yBadgeX = viewportWidth - yBadgeW - 4;
      const yBadgeY = clamp(cursorY - yBadgeH / 2, 4, viewportHeight - yBadgeH - 4);

      ctx.fillStyle = THEME.CROSSHAIR_LABEL_BG;
      ctx.fillRect(yBadgeX, yBadgeY, yBadgeW, yBadgeH);
      ctx.strokeRect(yBadgeX, yBadgeY, yBadgeW, yBadgeH);

      ctx.fillStyle = THEME.CROSSHAIR_LABEL_TEXT;
      ctx.fillText(yText, yBadgeX + 6, yBadgeY + 13);
    }

    ctx.restore();
  }
}
