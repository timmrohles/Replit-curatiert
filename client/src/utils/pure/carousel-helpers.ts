// Import React für den Hook
import React from 'react';

/**
 * Generic Carousel Scroll Helper
 * DRY-Prinzip: Wiederverwendbare Scroll-Funktion für alle Karussells
 */
export const scrollCarousel = (
  ref: React.RefObject<HTMLDivElement>,
  direction: 'left' | 'right',
  scrollAmount: number
): void => {
  if (ref.current) {
    const newScrollLeft = ref.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    ref.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  }
};

/**
 * Scroll Amounts für verschiedene Karussell-Typen
 */
export const SCROLL_AMOUNTS = {
  GENRE_CARDS: 280, // card width (256) + gap (24)
  EVENT_CARDS: 380, // card width (360) + gap (24)
  STOREFRONT_CARDS: 280,
  BOOK_CARDS: 160, // book width (128) + gap (16)
  FULL_WIDTH: (ref: React.RefObject<HTMLDivElement>) => ref.current?.offsetWidth || 0,
  // Aliases for homepage sections
  BOOK: 240,
  EVENT: 380,
  STOREFRONT: 320,
  LIST: 300,
} as const;

/**
 * Hook für Scroll-Event-Listener
 * Performance: Konsolidiert alle Scroll-Listener in einen Hook
 */
export const useScrollTracking = (
  refs: Map<string, React.RefObject<HTMLDivElement>>,
  setScrollState: (key: string, value: number) => void
) => {
  React.useEffect(() => {
    const listeners = new Map<string, () => void>();

    refs.forEach((ref, key) => {
      const handleScroll = () => {
        if (ref.current) {
          setScrollState(key, ref.current.scrollLeft);
        }
      };

      if (ref.current) {
        ref.current.addEventListener('scroll', handleScroll);
        listeners.set(key, handleScroll);
      }
    });

    return () => {
      refs.forEach((ref, key) => {
        const handleScroll = listeners.get(key);
        if (ref.current && handleScroll) {
          ref.current.removeEventListener('scroll', handleScroll);
        }
      });
    };
  }, [refs, setScrollState]);
};
