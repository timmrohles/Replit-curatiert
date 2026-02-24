/**
 * ⚡ LCP Optimization Meta Tags
 * 
 * Sichere LCP-Optimierung ohne Layout-Manipulation
 * Nutzt native Browser-Features für bessere Performance
 */

import { useEffect } from 'react';

export function LCPOptimizationHead() {
  useEffect(() => {
    // DNS-Prefetch für externe Ressourcen
    const dnsPrefetchDomains = [
      'https://www.coratiert.com',
      'https://images.unsplash.com',
    ];

    dnsPrefetchDomains.forEach((domain) => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      }
    });

    // 3. Fetchpriority für kritische Ressourcen
    // Markiere kritische Bilder mit high priority
    const criticalImages = document.querySelectorAll('img[data-critical="true"]');
    criticalImages.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        img.fetchPriority = 'high';
      }
    });


  }, []);

  return null;
}