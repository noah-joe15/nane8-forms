/**
 * TANTRADE Image Loading Optimizer
 * Handles fast image loading, caching, and error handling
 */

class ImageOptimizer {
  constructor() {
    this.cache = new Map();
    this.observer = null;
    this.init();
  }

  init() {
    // Preload critical images on page load
    this.preloadCriticalImages();
    
    // Setup lazy loading for non-critical images
    this.setupLazyLoading();
    
    // Handle all images on the page
    this.optimizeAllImages();
  }

  /**
   * Preload critical images (background, logos, etc.)
   */
  preloadCriticalImages() {
    const criticalImages = [
      'resources.png',  // Your main background
      'logo.png',       // Your logo
      // Add other critical images here
    ];

    criticalImages.forEach(src => {
      this.preloadImage(src);
    });
  }

  /**
   * Preload a single image
   */
  preloadImage(src) {
    if (this.cache.has(src)) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      this.cache.set(src, img);
      console.log(`[ImageOptimizer] Preloaded: ${src}`);
    };

    img.onerror = () => {
      console.warn(`[ImageOptimizer] Failed to preload: ${src}`);
      this.handleImageError(src);
    };
  }

  /**
   * Setup lazy loading for images below the fold
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            this.observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      // Observe all images with loading="lazy" attribute
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        this.observer.observe(img);
      });
    }
  }

  /**
   * Optimize all images on the page
   */
  optimizeAllImages() {
    // Add loading class to all images
    document.querySelectorAll('img').forEach(img => {
      if (!img.complete) {
        img.classList.add('loading');
        
        // Add loading spinner
        this.addLoadingPlaceholder(img);
      }

      // Handle load success
      img.addEventListener('load', () => {
        img.classList.remove('loading');
        img.classList.add('loaded');
        this.fadeInImage(img);
      });

      // Handle load error
      img.addEventListener('error', () => {
        this.handleImageError(img.src, img);
      });
    });
  }

  /**
   * Load image with error handling
   */
  loadImage(img) {
    const src = img.dataset.src || img.src;
    
    if (this.cache.has(src)) {
      img.src = src;
      return;
    }

    const image = new Image();
    image.src = src;
    
    image.onload = () => {
      this.cache.set(src, image);
      img.src = src;
    };

    image.onerror = () => {
      this.handleImageError(src, img);
    };
  }

  /**
   * Add loading placeholder
   */
  addLoadingPlaceholder(img) {
    // Add a placeholder background
    img.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
    img.style.backgroundSize = '200% 100%';
    img.style.animation = 'shimmer 1.5s infinite';
    
    // Add shimmer animation
    if (!document.getElementById('shimmer-style')) {
      const style = document.createElement('style');
      style.id = 'shimmer-style';
      style.textContent = `
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        img.loading {
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        img.loaded {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Fade in image when loaded
   */
  fadeInImage(img) {
    img.style.opacity = '0';
    setTimeout(() => {
      img.style.transition = 'opacity 0.3s ease';
      img.style.opacity = '1';
    }, 50);
  }

  /**
   * Handle image load error
   */
  handleImageError(src, img = null) {
    console.warn(`[ImageOptimizer] Failed to load: ${src}`);
    
    // If it's the background image, use a fallback color
    if (src === 'resources.png') {
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      console.log('[ImageOptimizer] Using gradient fallback for background');
    }
    
    // For other images, add error class
    if (img) {
      img.classList.add('error');
      img.style.background = '#f0f0f0';
      img.alt = 'Image failed to load';
    }
  }

  /**
   * Cache image to localStorage (for small images)
   */
  cacheImageToStorage(src, dataUrl) {
    try {
      localStorage.setItem(`img_${src}`, dataUrl);
    } catch (e) {
      console.warn('[ImageOptimizer] Storage full, cannot cache image');
    }
  }

  /**
   * Get image from localStorage cache
   */
  getImageFromStorage(src) {
    try {
      return localStorage.getItem(`img_${src}`);
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear image cache
   */
  clearCache() {
    this.cache.clear();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('img_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('[ImageOptimizer] Cache cleared');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizer();
  });
} else {
  window.imageOptimizer = new ImageOptimizer();
}

// Service Worker for offline image caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw-images.js').catch(error => {
    console.log('[ImageOptimizer] Service Worker registration failed:', error);
  });
}
