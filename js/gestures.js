/**
 * TradingView Image Viewer - Gesture Engine
 * Pointer Events based gesture detector for desktop and mobile.
 * Supports:
 * - Mouse & Touch Single-Pointer Drag Pan
 * - Mouse Wheel Vertical Zoom (scaleY)
 * - Ctrl + Mouse Wheel Horizontal Zoom (scaleX)
 * - Touch Multi-Pointer Smart Pinch Zoom (Horizontal -> scaleX, Vertical -> scaleY, Diagonal -> scaleX & scaleY)
 */

class GestureHandler {
  /**
   * @param {HTMLElement} element - The interactive viewport DOM element
   * @param {Object} callbacks
   * @param {Function} callbacks.onPan - (dx, dy) => void
   * @param {Function} callbacks.onZoom - (factorX, factorY, focalX, focalY) => void
   * @param {Function} callbacks.onCursorMove - (x, y, isInside) => void
   */
  constructor(element, callbacks = {}) {
    this.element = element;
    this.onPan = callbacks.onPan || null;
    this.onZoom = callbacks.onZoom || null;
    this.onCursorMove = callbacks.onCursorMove || null;

    // Active pointers map: pointerId -> { clientX, clientY }
    this.activePointers = new Map();

    // Single-pointer drag state
    this.isDragging = false;
    this.lastPointerPos = null;

    // Multi-touch pinch state
    this.pinchState = null;

    // Prevent default touch browser behaviors (scrolling/pull-refresh)
    this.element.style.touchAction = 'none';

    this.bindEvents();
  }

  /**
   * Attach Pointer and Wheel event listeners
   */
  bindEvents() {
    const el = this.element;

    // Pointer Events
    el.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    el.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    el.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    el.addEventListener('pointercancel', (e) => this.handlePointerUp(e));
    el.addEventListener('pointerleave', (e) => this.handlePointerLeave(e));
    el.addEventListener('pointerenter', (e) => this.handlePointerEnter(e));

    // Mouse Wheel Event
    el.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
  }

  /**
   * Pointer Down Event Handler
   */
  handlePointerDown(e) {
    // Only primary mouse button or touch inputs
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    try {
      this.element.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignore fallback if pointer capture fails
    }

    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = this.element.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (this.onCursorMove) {
      this.onCursorMove(currentX, currentY, true);
    }

    if (this.activePointers.size === 1) {
      // Start single pointer drag pan
      this.isDragging = true;
      this.lastPointerPos = { x: currentX, y: currentY };
      this.pinchState = null;
    } else if (this.activePointers.size === 2) {
      // Transition to 2-finger pinch zoom
      this.isDragging = false;
      this.initPinchState();
    }
  }

  /**
   * Pointer Move Event Handler
   */
  handlePointerMove(e) {
    const rect = this.element.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Update active pointer position if tracked
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (this.onCursorMove) {
      this.onCursorMove(currentX, currentY, true);
    }

    if (this.activePointers.size === 1 && this.isDragging && this.lastPointerPos) {
      // Handle Single Pointer Pan
      const dx = currentX - this.lastPointerPos.x;
      const dy = currentY - this.lastPointerPos.y;

      if ((dx !== 0 || dy !== 0) && this.onPan) {
        this.onPan(dx, dy);
      }

      this.lastPointerPos = { x: currentX, y: currentY };
    } else if (this.activePointers.size === 2) {
      // Handle Multi-Touch Pinch Zoom
      this.handlePinchMove(rect);
    }
  }

  /**
   * Pointer Up / Cancel Event Handler
   */
  handlePointerUp(e) {
    if (this.activePointers.has(e.pointerId)) {
      try {
        this.element.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore fallback
      }
      this.activePointers.delete(e.pointerId);
    }

    if (this.activePointers.size === 0) {
      this.isDragging = false;
      this.lastPointerPos = null;
      this.pinchState = null;
    } else if (this.activePointers.size === 1) {
      // If 1 finger remains, switch back to single pointer panning seamlessly
      this.pinchState = null;
      this.isDragging = true;
      const remainingPointer = Array.from(this.activePointers.values())[0];
      const rect = this.element.getBoundingClientRect();
      this.lastPointerPos = {
        x: remainingPointer.x - rect.left,
        y: remainingPointer.y - rect.top,
      };
    }
  }

  /**
   * Pointer Leave Event Handler
   */
  handlePointerLeave(e) {
    if (this.activePointers.size === 0) {
      if (this.onCursorMove) {
        const rect = this.element.getBoundingClientRect();
        this.onCursorMove(e.clientX - rect.left, e.clientY - rect.top, false);
      }
    }
  }

  /**
   * Pointer Enter Event Handler
   */
  handlePointerEnter(e) {
    if (this.onCursorMove) {
      const rect = this.element.getBoundingClientRect();
      this.onCursorMove(e.clientX - rect.left, e.clientY - rect.top, true);
    }
  }

  /**
   * Initialize 2-finger pinch state tracking
   */
  initPinchState() {
    const pointers = Array.from(this.activePointers.values());
    if (pointers.length < 2) return;

    const p1 = pointers[0];
    const p2 = pointers[1];

    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

    this.pinchState = {
      prevP1: { ...p1 },
      prevP2: { ...p2 },
      prevDx: dx,
      prevDy: dy,
      prevDist: dist,
    };
  }

  /**
   * Handle Smart Pinch Gestures with direction detection
   */
  handlePinchMove(rect) {
    if (!this.pinchState || this.activePointers.size < 2) return;

    const pointers = Array.from(this.activePointers.values());
    const p1 = pointers[0];
    const p2 = pointers[1];

    const currDx = Math.abs(p1.x - p2.x);
    const currDy = Math.abs(p1.y - p2.y);
    const currDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

    if (currDist < 5 || this.pinchState.prevDist < 5) return;

    // Midpoint between fingers relative to element
    const focalX = (p1.x + p2.x) / 2 - rect.left;
    const focalY = (p1.y + p2.y) / 2 - rect.top;

    // Midpoint delta for concurrent panning during pinch
    const prevMidX = (this.pinchState.prevP1.x + this.pinchState.prevP2.x) / 2;
    const prevMidY = (this.pinchState.prevP1.y + this.pinchState.prevP2.y) / 2;
    const currMidX = (p1.x + p2.x) / 2;
    const currMidY = (p1.y + p2.y) / 2;
    const panDx = currMidX - prevMidX;
    const panDy = currMidY - prevMidY;

    if ((panDx !== 0 || panDy !== 0) && this.onPan) {
      this.onPan(panDx, panDy);
    }

    // Overall Euclidean scale factor
    const overallFactor = currDist / this.pinchState.prevDist;

    // Angle of finger separation (in degrees: 0° = horizontal, 90° = vertical)
    const angleDeg = Math.atan2(currDy, currDx) * (180 / Math.PI);

    let factorX = 1.0;
    let factorY = 1.0;

    /**
     * Smart Pinch Detection Rules:
     * - Horizontal pinch (angle < 25°): changes scaleX
     * - Vertical pinch (angle > 65°): changes scaleY
     * - Diagonal pinch (25° <= angle <= 65°): changes both scaleX and scaleY
     */
    if (angleDeg < 25) {
      // Horizontal Pinch -> Scale X
      factorX = (this.pinchState.prevDx > 10 && currDx > 10) ? (currDx / this.pinchState.prevDx) : overallFactor;
      factorY = 1.0;
    } else if (angleDeg > 65) {
      // Vertical Pinch -> Scale Y
      factorX = 1.0;
      factorY = (this.pinchState.prevDy > 10 && currDy > 10) ? (currDy / this.pinchState.prevDy) : overallFactor;
    } else {
      // Diagonal Pinch -> Scale Both
      factorX = (this.pinchState.prevDx > 10 && currDx > 10) ? (currDx / this.pinchState.prevDx) : overallFactor;
      factorY = (this.pinchState.prevDy > 10 && currDy > 10) ? (currDy / this.pinchState.prevDy) : overallFactor;
    }

    if (this.onZoom) {
      this.onZoom(factorX, factorY, focalX, focalY);
    }

    // Update previous state
    this.pinchState = {
      prevP1: { ...p1 },
      prevP2: { ...p2 },
      prevDx: currDx,
      prevDy: currDy,
      prevDist: currDist,
    };
  }

  /**
   * Handle Mouse Wheel Event
   * - Ctrl + Wheel -> Horizontal Zoom (scaleX)
   * - Wheel -> Vertical Zoom (scaleY)
   * - Shift + Wheel -> Uniform Zoom (scaleX & scaleY)
   */
  handleWheel(e) {
    e.preventDefault();

    const rect = this.element.getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;

    // Calculate smooth zoom factor based on wheel delta
    const baseStep = 0.12;
    const zoomFactor = e.deltaY < 0 ? (1 + baseStep) : (1 / (1 + baseStep));

    let factorX = 1.0;
    let factorY = 1.0;

    if (e.ctrlKey) {
      // Ctrl + Wheel: Horizontal Zoom
      factorX = zoomFactor;
      factorY = 1.0;
    } else if (e.shiftKey) {
      // Shift + Wheel: Uniform Zoom (Both)
      factorX = zoomFactor;
      factorY = zoomFactor;
    } else {
      // Mouse Wheel: Vertical Zoom
      factorX = 1.0;
      factorY = zoomFactor;
    }

    if (this.onZoom) {
      this.onZoom(factorX, factorY, focalX, focalY);
    }
  }
}
