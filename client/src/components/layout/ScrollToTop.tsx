import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Scrollt automatisch nach ganz oben, wenn die Route sich ändert.
 * Wird einmal im Router platziert und funktioniert für alle Seitenwechsel.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Sofort nach oben scrollen (smooth für bessere UX)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 'instant' für sofortiges Scrollen, 'smooth' für animiert
    });
  }, [pathname]); // Wird bei jeder Route-Änderung ausgeführt

  return null; // Rendert nichts
}