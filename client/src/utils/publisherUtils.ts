/**
 * Publisher Utilities
 * Hilfsfunktionen für Verlags-Logik
 */

/**
 * Prüft ob ein Publisher eine eigene Verlagsseite haben sollte
 * Selfpublishing-Bücher haben keinen Verlag und werden nicht verlinkt
 */
export function isRealPublisher(publisherName: string | undefined | null): boolean {
  if (!publisherName) return false;
  
  const normalized = publisherName.toLowerCase().trim();
  
  // Selfpublishing ist kein "echter" Verlag und hat keine Seite
  if (normalized === 'selfpublishing' || normalized === 'self-publishing') {
    return false;
  }
  
  return true;
}

/**
 * Generiert einen Verlags-Slug aus dem Namen
 */
export function getPublisherSlug(publisherName: string): string {
  return publisherName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Liste von Publisher-Namen die keine Verlagsseite haben
 */
export const EXCLUDED_PUBLISHERS = ['selfpublishing', 'self-publishing'];
