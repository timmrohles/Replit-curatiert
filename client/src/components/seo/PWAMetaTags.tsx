import { Helmet } from 'react-helmet-async';

/**
 * PWA Meta Tags Component
 * 
 * Fügt alle notwendigen Meta-Tags für Progressive Web App hinzu:
 * - Manifest Link
 * - Theme Color (unterstützt Light/Dark Mode)
 * - Apple Mobile Web App Tags
 * - Touch Icons
 */
export function PWAMetaTags() {
  return (
    <Helmet>
      {/* PWA Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Theme Color - unterstützt Light/Dark Mode */}
      <meta name="theme-color" content="#f25f5c" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f25f5c" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#3A3A3A" />
      
      {/* Apple Mobile Web App */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="coratiert" />
      <link rel="apple-touch-icon" href="/icon-192.png" />
      
      {/* Microsoft Tiles */}
      <meta name="msapplication-TileColor" content="#f25f5c" />
      <meta name="msapplication-TileImage" content="/icon-192.png" />
      
      {/* Mobile Browser UI Customization */}
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Prevent auto-detection of phone numbers */}
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
}
