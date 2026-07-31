/**
 * TradingView Image Viewer - Camera Engine
 * Manages 2D view transformation with independent scaleX/scaleY, panning, clamping, and zoom operations.
 */

class Camera {
  constructor(options = {}) {
    this.minZoom = options.minZoom || CAMERA_DEFAULTS.MIN_ZOOM;
    this.maxZoom = options.maxZoom || CAMERA_DEFAULTS.MAX_ZOOM;
    
    this.scaleX = options.scaleX || CAMERA_DEFAULTS.DEFAULT_SCALE_X;
    this.scaleY = options.scaleY || CAMERA_DEFAULTS.DEFAULT_SCALE_Y;
    this.offsetX = options.offsetX || CAMERA_DEFAULTS.DEFAULT_OFFSET_X;
    this.offsetY = options.offsetY || CAMERA_DEFAULTS.DEFAULT_OFFSET_Y;

    this.lockX = options.lockX || false;
    this.lockY = options.lockY || false;
    this.isClamped = options.isClamped !== undefined ? options.isClamped : true;
  }

  /**
   * Set independent scales directly or with clamping
   */
  setScale(scaleX, scaleY = scaleX) {
    if (!this.lockX) {
      this.scaleX = clamp(scaleX, this.minZoom, this.maxZoom);
    }
    if (!this.lockY) {
      this.scaleY = clamp(scaleY, this.minZoom, this.maxZoom);
    }
  }

  /**
   * Set offsets directly
   */
  setOffset(x, y) {
    if (!this.lockX) this.offsetX = x;
    if (!this.lockY) this.offsetY = y;
  }

  /**
   * Pan camera by delta (dx, dy), respecting axis locks and optional bounds clamping
   */
  pan(dx, dy, viewportWidth = null, viewportHeight = null, imageWidth = null, imageHeight = null) {
    if (!this.lockX) this.offsetX += dx;
    if (!this.lockY) this.offsetY += dy;

    if (this.isClamped && viewportWidth && viewportHeight && imageWidth && imageHeight) {
      this.clampPan(viewportWidth, viewportHeight, imageWidth, imageHeight);
    }
  }

  /**
   * Perform cursor-centered zoom operation around focal point (focalX, focalY).
   * Supports independent factorX and factorY.
   */
  zoomAt(factorX, factorY = factorX, focalX, focalY, viewportWidth = null, viewportHeight = null, imageWidth = null, imageHeight = null) {
    const newScaleX = this.lockX ? this.scaleX : clamp(this.scaleX * factorX, this.minZoom, this.maxZoom);
    const newScaleY = this.lockY ? this.scaleY : clamp(this.scaleY * factorY, this.minZoom, this.maxZoom);

    const effectiveFactorX = newScaleX / this.scaleX;
    const effectiveFactorY = newScaleY / this.scaleY;

    if (!this.lockX) {
      this.offsetX = focalX - (focalX - this.offsetX) * effectiveFactorX;
      this.scaleX = newScaleX;
    }

    if (!this.lockY) {
      this.offsetY = focalY - (focalY - this.offsetY) * effectiveFactorY;
      this.scaleY = newScaleY;
    }

    if (this.isClamped && viewportWidth && viewportHeight && imageWidth && imageHeight) {
      this.clampPan(viewportWidth, viewportHeight, imageWidth, imageHeight);
    }
  }

  /**
   * Fit target image to screen viewport maintaining uniform aspect ratio
   */
  fitToScreen(viewportWidth, viewportHeight, imageWidth, imageHeight, paddingRatio = CAMERA_DEFAULTS.PADDING_RATIO) {
    if (!imageWidth || !imageHeight) return;

    const fitScaleX = (viewportWidth / imageWidth) * paddingRatio;
    const fitScaleY = (viewportHeight / imageHeight) * paddingRatio;
    const fitScale = Math.min(fitScaleX, fitScaleY);

    if (!this.lockX) {
      this.scaleX = clamp(fitScale, this.minZoom, this.maxZoom);
      this.offsetX = (viewportWidth - imageWidth * this.scaleX) / 2;
    }
    if (!this.lockY) {
      this.scaleY = clamp(fitScale, this.minZoom, this.maxZoom);
      this.offsetY = (viewportHeight - imageHeight * this.scaleY) / 2;
    }
  }

  /**
   * Reset camera scale to 1:1 and center image in viewport
   */
  reset(viewportWidth, viewportHeight, imageWidth, imageHeight) {
    if (!this.lockX) {
      this.scaleX = 1.0;
      this.offsetX = (viewportWidth - (imageWidth || 0)) / 2;
    }
    if (!this.lockY) {
      this.scaleY = 1.0;
      this.offsetY = (viewportHeight - (imageHeight || 0)) / 2;
    }
  }

  /**
   * Clamp panning so image cannot be completely panned off-screen.
   * Keeps at least a minimum visible margin.
   */
  clampPan(viewportWidth, viewportHeight, imageWidth, imageHeight) {
    if (!imageWidth || !imageHeight) return;

    const imgDisplayWidth = imageWidth * this.scaleX;
    const imgDisplayHeight = imageHeight * this.scaleY;

    // Minimum visible overlap on screen
    const marginX = Math.min(50, viewportWidth * 0.2);
    const marginY = Math.min(50, viewportHeight * 0.2);

    // X bounds
    const minX = marginX - imgDisplayWidth;
    const maxX = viewportWidth - marginX;

    // Y bounds
    const minY = marginY - imgDisplayHeight;
    const maxY = viewportHeight - marginY;

    if (!this.lockX) {
      this.offsetX = clamp(this.offsetX, minX, maxX);
    }
    if (!this.lockY) {
      this.offsetY = clamp(this.offsetY, minY, maxY);
    }
  }

  /**
   * Convert viewport screen coordinates (px) to image pixel coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.offsetX) / this.scaleX,
      y: (screenY - this.offsetY) / this.scaleY,
    };
  }

  /**
   * Convert image pixel coordinates to viewport screen coordinates (px)
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.scaleX + this.offsetX,
      y: worldY * this.scaleY + this.offsetY,
    };
  }
}
