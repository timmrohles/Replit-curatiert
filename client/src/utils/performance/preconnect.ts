/**
 * ⚡ Performance: Preconnect zu externen Ressourcen
 * 
 * Etabliert frühe Verbindungen zu externen Domains,
 * um DNS-Lookup, TCP-Handshake und TLS-Negotiation zu beschleunigen.
 */

export function setupPreconnects(): void {
  // Nur einmal ausführen
  if (typeof document === 'undefined' || document.querySelector('link[rel="preconnect"][href*="images.unsplash.com"]')) {
    return;
  }

  const preconnects = [
    // Unsplash CDN (für Hero-Bilder)
    { href: 'https://images.unsplash.com', crossorigin: true },
    // ibb.co CDN (für Buchcover)
    { href: 'https://i.ibb.co', crossorigin: true }
  ];

  preconnects.forEach(({ href, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
}

/**
 * DNS-Prefetch als Fallback für Browser ohne preconnect-Support
 */
export function setupDnsPrefetch(): void {
  if (typeof document === 'undefined') return;

  const domains = [
    'https://images.unsplash.com',
    'https://i.ibb.co'
  ];

  domains.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  });
}
