/**
 * TradingView Image Viewer - Image Loader Engine
 * Handles file input uploads, drag-and-drop operations, and asynchronous image loading.
 */

class ImageLoader {
  /**
   * @param {Object} options
   * @param {HTMLInputElement} options.fileInput - File input DOM element
   * @param {HTMLElement} options.targetElement - Target viewport element for drag and drop
   * @param {HTMLElement} options.dropZone - Overlay dropzone element to show on dragover
   * @param {Function} options.onImageLoaded - (HTMLImageElement, fileName) => void
   * @param {Function} options.onError - (errorMessage) => void
   */
  constructor(options = {}) {
    this.fileInput = options.fileInput || null;
    this.targetElement = options.targetElement || null;
    this.dropZone = options.dropZone || null;
    this.onImageLoaded = options.onImageLoaded || null;
    this.onError = options.onError || null;

    this.currentImage = null;
    this.currentFileName = '';

    this.init();
  }

  /**
   * Initialize event listeners for File Input and Drag & Drop
   */
  init() {
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileInput(e));
    }

    if (this.targetElement) {
      this.setupDragAndDrop();
    }
  }

  /**
   * Handle file input selection event
   */
  handleFileInput(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      this.loadFromFile(file);
    }
  }

  /**
   * Read and load image from a File object
   * @param {File} file
   */
  loadFromFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (this.onError) {
        this.onError('Invalid file format. Please upload a valid image file (PNG, JPEG, WebP, GIF, SVG, etc.).');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.loadImageFromSrc(e.target.result, file.name);
    };
    reader.onerror = () => {
      if (this.onError) {
        this.onError('Error reading file from disk.');
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Load image asynchronously from source URL or Data URL
   * @param {string} src - Image URL or data URI
   * @param {string} fileName - Optional file name label
   */
  loadImageFromSrc(src, fileName = 'Image') {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      this.currentImage = img;
      this.currentFileName = fileName;
      if (this.onImageLoaded) {
        this.onImageLoaded(img, fileName, src);
      }
    };

    img.onerror = () => {
      if (this.onError) {
        this.onError('Failed to parse or load image.');
      }
    };

    img.src = src;
  }

  /**
   * Setup Drag and Drop listeners on target element
   */
  setupDragAndDrop() {
    const el = this.targetElement;
    const dropZone = this.dropZone;

    const showDropZone = () => {
      if (dropZone) dropZone.classList.remove('hidden');
    };

    const hideDropZone = () => {
      if (dropZone) dropZone.classList.add('hidden');
    };

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showDropZone();
    });

    el.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showDropZone();
    });

    el.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZone && (e.target === dropZone || !el.contains(e.relatedTarget))) {
        hideDropZone();
      }
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideDropZone();

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.loadFromFile(files[0]);
      }
    });
  }

  /**
   * Open native file selection dialog programmatically
   */
  openFileDialog() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }
}
