/**
 * ⚡ Critical CSS Utility
 * 
 * Optimiert CSS-Loading für besseren LCP (Largest Contentful Paint)
 * - Lädt non-critical CSS asynchron
 * - Inline Critical CSS für above-the-fold Content
 * - Verhindert render-blocking CSS
 */

/**
 * Load CSS asynchronously (non-blocking)
 * @param href URL der CSS-Datei
 * @param id Optionale ID für das link-Element
 */
export function loadCSSAsync(href: string, id?: string): void {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print'; // Trick: Load as print stylesheet first (non-blocking)
  
  if (id) {
    link.id = id;
  }
  
  // Once loaded, switch to 'all' media
  link.onload = () => {
    link.media = 'all';
  };
  
  document.head.appendChild(link);
}

/**
 * Preload CSS file
 * @param href URL der CSS-Datei
 */
export function preloadCSS(href: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  
  // Add actual stylesheet after preload
  link.onload = () => {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = href;
    document.head.appendChild(stylesheet);
  };
  
  document.head.appendChild(link);
}

/**
 * Critical CSS für coratiert.de
 * Enthält nur die CSS für above-the-fold Content (Header, Hero)
 */
export const CRITICAL_CSS = `
/* ===== CRITICAL CSS - Above the fold only ===== */

/* Typography - Critical */
body {
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #3A3A3A;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Fjalla One', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #3A3A3A;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.15);
}

/* Layout - Critical */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Gradient Background - Critical */
body {
  background: linear-gradient(
    135deg,
    #f8b195 0%,
    #f67280 25%,
    #c06c84 50%,
    #6c5b7b 75%,
    #355c7d 100%
  );
  background-attachment: fixed;
  min-height: 100vh;
}

/* Header - Critical */
header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* InfoBar - Critical */
.info-bar {
  background: #247ba0;
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
}

/* Loading States - Critical */
.loading-spinner {
  display: inline-block;
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top-color: #247ba0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Skeleton Loading - Critical */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.06) 25%,
    rgba(0, 0, 0, 0.12) 50%,
    rgba(0, 0, 0, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Hide non-critical content initially */
.below-fold {
  content-visibility: auto;
}
`;

/**
 * Inject Critical CSS inline into <head>
 */
export function injectCriticalCSS(): void {
  // Check if already injected
  if (document.getElementById('critical-css')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = CRITICAL_CSS;
  
  // Insert at the beginning of <head> for highest priority
  document.head.insertBefore(style, document.head.firstChild);
}

/**
 * Setup optimized CSS loading strategy
 */
export function setupOptimizedCSS(): void {
  // 1. Inject Critical CSS inline (blocking, but small)
  injectCriticalCSS();
  
  // 2. Preload main stylesheet
  const mainStylesheet = document.querySelector('link[rel="stylesheet"]');
  if (mainStylesheet && mainStylesheet instanceof HTMLLinkElement) {
    const href = mainStylesheet.href;
    
    // Remove the blocking stylesheet
    mainStylesheet.remove();
    
    // Load it asynchronously instead
    loadCSSAsync(href, 'main-stylesheet');
  }
  
  // 3. Defer external component CSS
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link instanceof HTMLLinkElement && link.href.includes('_components')) {
      const href = link.href;
      link.remove();
      
      // Load after page load
      if (document.readyState === 'complete') {
        loadCSSAsync(href);
      } else {
        window.addEventListener('load', () => loadCSSAsync(href));
      }
    }
  });
}

/**
 * Initialize CSS optimization
 * Call this as early as possible in your app
 */
export function initCSSOptimization(): void {
  // Run immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupOptimizedCSS);
  } else {
    setupOptimizedCSS();
  }
}
