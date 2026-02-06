/**
 * ⚡ Critical CSS Head Component
 * 
 * DEAKTIVIERT - Verhindert Layout-Probleme
 * Alternative Lösung für LCP-Optimierung wird implementiert
 */

import { useEffect } from 'react';

export function CriticalCSSHead() {
  useEffect(() => {
    // DEAKTIVIERT - Diese aggressive CSS-Manipulation zerschießt das Layout
    // Stattdessen nutzen wir link[rel="preload"] im HTML-Head
    
    console.log('⚡ CriticalCSSHead: Deaktiviert (Layout-Schutz)');
    console.log('💡 Für LCP-Optimierung: Nutze <link rel="preload" as="style"> im HTML');
  }, []);

  return null;
}