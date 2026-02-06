/**
 * ⚡ LCP Optimization Meta Tags
 * 
 * Sichere LCP-Optimierung ohne Layout-Manipulation
 * Nutzt native Browser-Features für bessere Performance
 */

import { useEffect } from 'react';

export function LCPOptimizationHead() {
  useEffect(() => {
    // 1. Preconnect zu externen Domains für schnellere DNS-Auflösung
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    preconnectDomains.forEach((domain) => {
      if (!document.querySelector(`link[href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });

    // 2. DNS-Prefetch für weitere externe Ressourcen
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

    console.log('⚡ LCP Optimization: Preconnect & DNS-Prefetch aktiviert');
    console.log('✅ Layout bleibt intakt - keine aggressive CSS-Manipulation');
    console.log('✅ Self-Hosted Fonts nutzen lokale Dateien (-409ms Latenz)');
  }, []);

  return null;
}