/**
 * TradingView Image Viewer - Grid Component
 * Draws a TradingView-style dark grid with subpixel-crisp lines and adaptive grid spacing.
 */

class Grid {
  constructor(options = {}) {
    this.baseStep = options.baseStep || GRID_DEFAULTS.BASE_STEP;
    this.majorColor = options.majorColor || THEME.GRID_MAJOR;
    this.minorColor = options.minorColor || THEME.GRID_MINOR;
  }

  /**
   * Draw high-DPI crisp TradingView background grid
   */
  draw(ctx, camera, viewportWidth, viewportHeight) {
    ctx.save();
    
    // Draw adaptive background grid
    ctx.lineWidth = 1;

    // Viewport-aligned minor grid lines (for smooth UI background texture)
    ctx.strokeStyle = this.minorColor;
    const step = this.baseStep;

    ctx.beginPath();
    for (let x = 0; x <= viewportWidth; x += step) {
      const cx = crisp(x);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, viewportHeight);
    }
    for (let y = 0; y <= viewportHeight; y += step) {
      const cy = crisp(y);
      ctx.moveTo(0, cy);
      ctx.lineTo(viewportWidth, cy);
    }
    ctx.stroke();

    // World-aligned major grid lines (moves dynamically with camera pan & zoom)
    ctx.strokeStyle = this.majorColor;
    ctx.beginPath();

    // Calculate adaptive grid spacing in world space
    let worldStepX = 100;
    while (worldStepX * camera.scaleX < GRID_DEFAULTS.MIN_CELL_SIZE) worldStepX *= 2;
    while (worldStepX * camera.scaleX > GRID_DEFAULTS.MAX_CELL_SIZE) worldStepX /= 2;

    let worldStepY = 100;
    while (worldStepY * camera.scaleY < GRID_DEFAULTS.MIN_CELL_SIZE) worldStepY *= 2;
    while (worldStepY * camera.scaleY > GRID_DEFAULTS.MAX_CELL_SIZE) worldStepY /= 2;

    const screenStepX = worldStepX * camera.scaleX;
    const screenStepY = worldStepY * camera.scaleY;

    // Start offset aligned to camera pan
    const startX = (camera.offsetX % screenStepX + screenStepX) % screenStepX;
    const startY = (camera.offsetY % screenStepY + screenStepY) % screenStepY;

    for (let x = startX; x <= viewportWidth; x += screenStepX) {
      const cx = crisp(x);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, viewportHeight);
    }

    for (let y = startY; y <= viewportHeight; y += screenStepY) {
      const cy = crisp(y);
      ctx.moveTo(0, cy);
      ctx.lineTo(viewportWidth, cy);
    }
    ctx.stroke();

    ctx.restore();
  }
}
