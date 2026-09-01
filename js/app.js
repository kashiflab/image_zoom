/**
 * TradingView Image Viewer - Main Application Controller
 * Wires all engine modules together: Canvas, Camera, Grid, Renderer, Gestures,
 * ImageLoader, Toolbar controls, IndexedDB persistence, and PWA capabilities.
 */

// IndexedDB Persistence Configuration
const DB_NAME = 'TVImageViewerDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

/**
 * Open or create IndexedDB database
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Persist the last opened image data URL and filename in IndexedDB
 */
async function saveLastOpenedImage(dataUrl, fileName) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ dataUrl, fileName, timestamp: Date.now() }, 'lastOpenedImage');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save image:', err);
  }
}

/**
 * Retrieve the last saved image record from IndexedDB
 */
async function loadLastOpenedImage() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('lastOpenedImage');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to load stored image:', err);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const canvas = document.getElementById('imageCanvas');
  const viewport = document.getElementById('viewport');
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  // Application State
  let image = null;
  let currentFileName = '';

  // Cursor Tracking State
  const cursorState = {
    isInside: false,
    x: 0,
    y: 0,
  };

  // Modular Engine Instances
  const camera = new Camera({ isClamped: true });
  const grid = new Grid();
  const renderer = new Renderer(canvas, camera, grid);

  // Helper getters for current viewport & image dimensions
  function getDimensions() {
    const rect = viewport.getBoundingClientRect();
    return {
      viewW: rect.width,
      viewH: rect.height,
      imgW: image ? image.width : null,
      imgH: image ? image.height : null,
    };
  }

  // Camera Control Actions
  function fitToScreen() {
    const { viewW, viewH, imgW, imgH } = getDimensions();
    if (imgW && imgH) {
      camera.fitToScreen(viewW, viewH, imgW, imgH);
      render();
    }
  }

  function resetView() {
    const { viewW, viewH, imgW, imgH } = getDimensions();
    if (imgW && imgH) {
      camera.reset(viewW, viewH, imgW, imgH);
      render();
    }
  }

  function zoomAtPoint(factorX, factorY, focalX, focalY) {
    const { viewW, viewH, imgW, imgH } = getDimensions();
    camera.zoomAt(factorX, factorY, focalX, focalY, viewW, viewH, imgW, imgH);
    render();
  }

  // Toolbar Instance with bound actions
  const toolbar = new Toolbar({
    // onFit: () => fitToScreen(),
    // onReset: () => resetView(),
    // onToggleLockX: (isLocked) => {
    //   camera.lockX = isLocked;
    //   render();
    // },
    // onToggleLockY: (isLocked) => {
    //   camera.lockY = isLocked;
    //   render();
    // },
    // onZoomIn: () => {
    //   const { viewW, viewH } = getDimensions();
    //   zoomAtPoint(1.25, 1.25, viewW / 2, viewH / 2);
    // },
    // onZoomOut: () => {
    //   const { viewW, viewH } = getDimensions();
    //   zoomAtPoint(0.8, 0.8, viewW / 2, viewH / 2);
    // },
  });

  // Modular Image Loader Instance
  const imageLoader = new ImageLoader({
    fileInput,
    targetElement: viewport,
    dropZone,
    onImageLoaded: (loadedImage, fileName, src) => {
      image = loadedImage;
      currentFileName = fileName || 'Image';
      // toolbar.setFileName(currentFileName);
      fitToScreen();

      // Persist to IndexedDB for automatic startup restoration
      if (src) {
        saveLastOpenedImage(src, currentFileName);
      }
    },
    onError: (msg) => {
      console.error('[ImageLoader] Error:', msg);
    },
  });

  // Modular Gesture Handler Instance
  const gestureHandler = new GestureHandler(viewport, {
    onPan: (dx, dy) => {
      const { viewW, viewH, imgW, imgH } = getDimensions();
      camera.pan(dx, dy, viewW, viewH, imgW, imgH);
      render();
    },
    onZoom: (factorX, factorY, focalX, focalY) => {
      const { viewW, viewH, imgW, imgH } = getDimensions();
      camera.zoomAt(factorX, factorY, focalX, focalY, viewW, viewH, imgW, imgH);
      render();
    },
    onCursorMove: (x, y, isInside) => {
      cursorState.x = x;
      cursorState.y = y;
      cursorState.isInside = isInside;
      render();
    },
  });

  // Main Render Pass & UI Update
  function render() {
    renderer.render(image, cursorState);
  }

  // Dynamic canvas resizing
  function resizeCanvas() {
    const rect = viewport.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);
    render();
  }

  window.addEventListener('resize', resizeCanvas);

  // Generate Procedural TradingView Style Demo Chart
  function createDemoChart() {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1200;
    offCanvas.height = 700;
    const octx = offCanvas.getContext('2d');

    // Canvas Background
    octx.fillStyle = THEME.BG_COLOR;
    octx.fillRect(0, 0, 1200, 700);

    // Chart Grid Lines
    octx.strokeStyle = THEME.GRID_MAJOR;
    octx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 60) {
      octx.beginPath();
      octx.moveTo(x, 0);
      octx.lineTo(x, 700);
      octx.stroke();
    }
    for (let y = 0; y < 700; y += 40) {
      octx.beginPath();
      octx.moveTo(0, y);
      octx.lineTo(1200, y);
      octx.stroke();
    }

    // Generate Candlestick Series
    let price = 150;
    const candles = [];
    for (let i = 0; i < 70; i++) {
      const change = (Math.random() - 0.48) * 8;
      const open = price;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 4;
      const low = Math.min(open, close) - Math.random() * 4;
      candles.push({ open, high, low, close, x: 50 + i * 15 });
      price = close;
    }

    // Draw Candlesticks
    candles.forEach((c) => {
      const isGreen = c.close >= c.open;
      const color = isGreen ? '#26a69a' : '#ef5350';
      octx.strokeStyle = color;
      octx.fillStyle = color;

      // Wick
      octx.beginPath();
      octx.moveTo(c.x, 700 - c.high * 3.5);
      octx.lineTo(c.x, 700 - c.low * 3.5);
      octx.lineWidth = 1.5;
      octx.stroke();

      // Body
      const topY = 700 - Math.max(c.open, c.close) * 3.5;
      const bodyH = Math.max(2, Math.abs(c.open - c.close) * 3.5);
      octx.fillRect(c.x - 4.5, topY, 9, bodyH);
    });

    // Moving Average Line
    octx.strokeStyle = THEME.ACCENT_COLOR;
    octx.lineWidth = 2.5;
    octx.beginPath();
    candles.forEach((c, idx) => {
      const avgY = 700 - ((c.open + c.close) / 2) * 3.5;
      if (idx === 0) octx.moveTo(c.x, avgY);
      else octx.lineTo(c.x, avgY);
    });
    octx.stroke();

    // Chart Title & Subtitle Overlay
    octx.fillStyle = THEME.TEXT_PRIMARY;
    octx.font = 'bold 24px Inter, sans-serif';
    octx.fillText('BTC/USD 4H • TradingView Image Viewer Engine', 40, 50);

    octx.fillStyle = THEME.TEXT_MUTED;
    octx.font = '14px Inter, sans-serif';
    octx.fillText('Upload your own chart or image via toolbar or drag & drop', 40, 80);

    const demoDataUrl = offCanvas.toDataURL();
    imageLoader.loadImageFromSrc(demoDataUrl, 'Demo Chart');
  }

  // Keyboard Shortcuts Configuration
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key.toLowerCase()) {
      case 'o':
        e.preventDefault();
        imageLoader.openFileDialog();
        break;
      // case 'f':
      //   e.preventDefault();
      //   fitToScreen();
      //   break;
      // case 'r':
      //   e.preventDefault();
      //   resetView();
      //   break;
      // case 'x':
      //   e.preventDefault();
      //   camera.lockX = !camera.lockX;
      //   toolbar.setLockX(camera.lockX);
      //   render();
      //   break;
      // case 'y':
      //   e.preventDefault();
      //   camera.lockY = !camera.lockY;
      //   toolbar.setLockY(camera.lockY);
      //   render();
      //   break;
      case '=':
      case '+':
        e.preventDefault();
        const { viewW: wIn, viewH: hIn } = getDimensions();
        zoomAtPoint(1.25, 1.25, wIn / 2, hIn / 2);
        break;
      case '-':
      case '_':
        e.preventDefault();
        const { viewW: wOut, viewH: hOut } = getDimensions();
        zoomAtPoint(0.8, 0.8, wOut / 2, hOut / 2);
        break;
    }
  });

  // Startup Initialization & Restoration
  resizeCanvas();

  loadLastOpenedImage()
    .then((stored) => {
      if (stored && stored.dataUrl) {
        console.log('[App] Restoring last opened image from IndexedDB:', stored.fileName);
        imageLoader.loadImageFromSrc(stored.dataUrl, stored.fileName || 'Restored Image');
      } else {
        console.log('[App] Generating default demo chart.');
        createDemoChart();
      }
    })
    .catch((err) => {
      console.warn('[App] Startup restoration failed, generating demo chart:', err);
      createDemoChart();
    });
});
