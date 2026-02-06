/**
 * ONIX Tag Type Colors
 * Zentrale Definition für Genre/Tag-Farben
 */

export const ONIX_TAG_COLORS = {
  'Auszeichnung': '#FFD700',       // Gold
  'Medienecho': '#9C27B0',         // Purple
  'Motiv (MVB)': '#ffe066',        // Light Yellow
  'Stil-Veredelung': '#FF5722',    // Deep Orange
  'Schauplatz': '#E67E22',         // Orange
  'Genre (THEMA)': '#247ba0',      // Blue
  'Zielgruppe': '#2ECC71',         // Green
  'Zeitgeist': '#E91E63',          // Pink
  'Herkunft': '#70c1b3',           // Teal
  'default': '#70c1b3'             // Default Teal
} as const;

export const ONIX_TAG_ICONS = {
  'Auszeichnung': '🏆',
  'Medienecho': '📺',
  'Motiv (MVB)': '💫',
  'Stil-Veredelung': '✍️',
  'Schauplatz': '📍',
  'Genre (THEMA)': '🎭',
  'Zielgruppe': '👥',
  'Zeitgeist': '🕰️',
  'Herkunft': '🌍',
  'default': '🏷️'
} as const;

export const SOCIAL_MEDIA_COLORS = {
  linkedin: '#0077B5',
  whatsapp: '#25D366',
  facebook: '#1877F2',
  twitter: '#1DA1F2'
} as const;

/**
 * Brand Colors - Central Color Constants
 * Diese Konstanten werden verwendet, wenn CSS-Variablen nicht verfügbar sind
 * oder für spezifische Logik-Checks (z.B. backgroundColor comparison)
 */
export const BRAND_COLORS = {
  // Primary Brand Colors
  charcoal: '#2a2a2a',
  coral: '#f25f5c',
  gold: '#ffe066',
  blue: '#247ba0',
  teal: '#70c1b3',
  
  // Extended Palette
  beige: '#F5EFE7',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',
  
  // Advertisement Section Colors
  adBlue: '#247ba0',
  adTextLight: '#E8E8E8',
  
  // Video Card Colors
  videoCardBg: '#2a2a2a',
  videoCardText: '#FFFFFF',
  
  // Tag Colors
  tagBg: '#f25f5c',        // Vibrant Coral
  tagText: '#F5EFE7',      // Beige
} as const;

/**
 * Turquoise color variations for background detection
 */
export const TURQUOISE_VARIANTS = [
  '#a0cec8',
  'rgb(160,206,200)',
  'rgb(160, 206, 200)',
  '#A0CEC8'
] as const;
