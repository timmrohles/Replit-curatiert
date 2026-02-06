/**
 * 🌙 Dark Mode Color Utilities
 * 
 * Konvertiert hardcodierte Hex-Farben zu CSS-Variablen,
 * die im Dark Mode automatisch zu hellen Farben werden.
 */

/**
 * Konvertiert standardisierte Textfarben zu CSS-Variablen
 * - #3A3A3A (coratiert Schwarz) → var(--charcoal) → im Dark Mode: #F5F5F0
 * - #247ba0 (coratiert Blau) → var(--cerulean) → im Dark Mode: #6db8e3
 */
export function getAdaptiveTextColor(color: string): string {
  switch (color) {
    case '#3A3A3A':
      return 'var(--charcoal)';
    case '#247ba0':
      return 'var(--cerulean)';
    case '#f25f5c':
      return 'var(--vibrant-coral)';
    case '#ffe066':
      return 'var(--royal-gold)';
    case '#70c1b3':
      return 'var(--tropical-teal)';
    default:
      return color;
  }
}

/**
 * Konvertiert Hintergrundfarben zu CSS-Variablen
 */
export function getAdaptiveBackgroundColor(color: string): string {
  switch (color) {
    case '#FFFFFF':
      return 'var(--color-white)';
    case '#F5F5F0':
    case '#F7F4EF':
      return 'var(--color-gray-50)';
    case '#3A3A3A':
      return 'var(--color-bg-dark)';
    default:
      return color;
  }
}

/**
 * Check if current theme is dark mode
 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Get text shadow for current theme
 */
export function getTextShadow(isDark?: boolean): string {
  const dark = isDark ?? isDarkMode();
  return dark 
    ? '2px 2px 4px rgba(255, 255, 255, 0.1)' // Heller Schatten im Dark Mode
    : '2px 2px 4px rgba(0, 0, 0, 0.15)'; // Dunkler Schatten im Light Mode
}

/**
 * Style-Objekt mit adaptiven Farben erstellen
 */
export function createAdaptiveStyle(styles: React.CSSProperties): React.CSSProperties {
  const adaptedStyles: React.CSSProperties = { ...styles };
  
  // Textfarbe anpassen
  if (styles.color && typeof styles.color === 'string') {
    adaptedStyles.color = getAdaptiveTextColor(styles.color);
  }
  
  // Hintergrundfarbe anpassen
  if (styles.backgroundColor && typeof styles.backgroundColor === 'string') {
    adaptedStyles.backgroundColor = getAdaptiveBackgroundColor(styles.backgroundColor);
  }
  
  // Text Shadow anpassen
  if (styles.textShadow) {
    adaptedStyles.textShadow = getTextShadow();
  }
  
  return adaptedStyles;
}
