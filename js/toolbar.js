/**
 * TradingView Image Viewer - Toolbar Component
 * Controls and binds user actions to toolbar controls and status displays.
 */

class Toolbar {
  /**
   * @param {Object} options
   * @param {Function} options.onFit - Fit to screen callback
   * @param {Function} options.onReset - Reset view callback
   * @param {Function} options.onToggleLockX - Lock X toggle callback (isLocked) => void
   * @param {Function} options.onToggleLockY - Lock Y toggle callback (isLocked) => void
   * @param {Function} options.onZoomIn - Floating zoom in callback
   * @param {Function} options.onZoomOut - Floating zoom out callback
   */
  constructor(options = {}) {
    this.onFit = options.onFit || null;
    this.onReset = options.onReset || null;
    this.onToggleLockX = options.onToggleLockX || null;
    this.onToggleLockY = options.onToggleLockY || null;
    this.onZoomIn = options.onZoomIn || null;
    this.onZoomOut = options.onZoomOut || null;

    // DOM Elements
    this.btnFit = document.getElementById('btnFit');
    this.btnReset = document.getElementById('btnReset');
    this.btnLockX = document.getElementById('btnLockX');
    this.btnLockY = document.getElementById('btnLockY');
    this.zoomReadout = document.getElementById('zoomReadout');
    this.readoutX = document.getElementById('readoutX');
    this.readoutY = document.getElementById('readoutY');
    this.floatZoomIn = document.getElementById('floatZoomIn');
    this.floatZoomOut = document.getElementById('floatZoomOut');
    this.brandTitle = document.querySelector('.brand-title');

    this.bindEvents();
  }

  /**
   * Attach click event listeners for toolbar actions
   */
  bindEvents() {
    if (this.btnFit) {
      this.btnFit.addEventListener('click', () => {
        if (this.onFit) this.onFit();
      });
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        if (this.onReset) this.onReset();
      });
    }

    if (this.btnLockX) {
      this.btnLockX.addEventListener('click', () => {
        const isLocked = !this.btnLockX.classList.contains('active');
        this.setLockX(isLocked);
        if (this.onToggleLockX) this.onToggleLockX(isLocked);
      });
    }

    if (this.btnLockY) {
      this.btnLockY.addEventListener('click', () => {
        const isLocked = !this.btnLockY.classList.contains('active');
        this.setLockY(isLocked);
        if (this.onToggleLockY) this.onToggleLockY(isLocked);
      });
    }

    if (this.floatZoomIn) {
      this.floatZoomIn.addEventListener('click', () => {
        if (this.onZoomIn) this.onZoomIn();
      });
    }

    if (this.floatZoomOut) {
      this.floatZoomOut.addEventListener('click', () => {
        if (this.onZoomOut) this.onZoomOut();
      });
    }
  }

  /**
   * Update Lock X UI button active status
   */
  setLockX(locked) {
    if (this.btnLockX) {
      this.btnLockX.classList.toggle('active', !!locked);
    }
  }

  /**
   * Update Lock Y UI button active status
   */
  setLockY(locked) {
    if (this.btnLockY) {
      this.btnLockY.classList.toggle('active', !!locked);
    }
  }

  /**
   * Update Zoom Level Readout badge
   */
  updateZoomReadout(scaleX, scaleY) {
    if (!this.zoomReadout) return;

    if (Math.abs(scaleX - scaleY) > 0.001) {
      this.zoomReadout.textContent = `X:${formatPercent(scaleX)} Y:${formatPercent(scaleY)}`;
    } else {
      this.zoomReadout.textContent = formatPercent(scaleX);
    }
  }

  /**
   * Update World Coordinates Readout badge
   */
  updateCoordinates(worldX, worldY, isInside) {
    if (!this.readoutX || !this.readoutY) return;

    if (isInside && worldX !== null && worldY !== null) {
      this.readoutX.textContent = formatCoord(worldX);
      this.readoutY.textContent = formatCoord(worldY);
    } else {
      this.readoutX.textContent = '0';
      this.readoutY.textContent = '0';
    }
  }

  /**
   * Update file title display in brand header
   */
  setFileName(fileName) {
    if (this.brandTitle && fileName) {
      this.brandTitle.textContent = `TV Viewer - ${fileName}`;
    }
  }
}
