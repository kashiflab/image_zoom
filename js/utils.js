/**
 * TradingView Image Viewer - Utility Functions
 */

/**
 * Clamp a numeric value between min and max bounds
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Get device pixel ratio with fallback
 */
function getDpr() {
  return window.devicePixelRatio || 1;
}

/**
 * Format scale as percentage string
 */
function formatPercent(scale) {
  return `${Math.round(scale * 100)}%`;
}

/**
 * Format pixel coordinate integer
 */
function formatCoord(val) {
  return Math.round(val);
}

/**
 * Align pixel position for subpixel-crisp 1px canvas drawing
 */
function crisp(val) {
  return Math.floor(val) + 0.5;
}

/**
 * Calculate Euclidean distance between two touch points
 */
function getTouchDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.hypot(dx, dy);
}

/**
 * Calculate midpoint between two touch points relative to element rectangle
 */
function getTouchMidpoint(touch1, touch2, rect) {
  return {
    x: (touch1.clientX + touch2.clientX) / 2 - rect.left,
    y: (touch1.clientY + touch2.clientY) / 2 - rect.top,
  };
}
