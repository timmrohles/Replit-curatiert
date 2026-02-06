import { useEffect } from 'react';

export interface SEOMetadata {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  keywords?: string[];
  author?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

interface SEOHeadProps {
  metadata: SEOMetadata;
}

export function SEOHead({ metadata }: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    if (metadata.metaTitle || metadata.title) {
      document.title = metadata.metaTitle || metadata.title || 'coratiert.de';
    }

    // Helper to update or create meta tag
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };

    // Update link tag (canonical)
    const updateLinkTag = (rel: string, href: string) => {
      if (!href) return;
      
      let tag = document.querySelector(`link[rel="${rel}"]`);
      
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('href', href);
    };

    // Standard meta tags
    if (metadata.metaDescription) {
      updateMetaTag('description', metadata.metaDescription);
    }

    if (metadata.keywords && metadata.keywords.length > 0) {
      updateMetaTag('keywords', metadata.keywords.join(', '));
    }

    if (metadata.author) {
      updateMetaTag('author', metadata.author);
    }

    // Robots meta
    const robotsContent = [];
    if (metadata.noIndex) robotsContent.push('noindex');
    if (metadata.noFollow) robotsContent.push('nofollow');
    if (robotsContent.length > 0) {
      updateMetaTag('robots', robotsContent.join(', '));
    }

    // Canonical URL
    if (metadata.canonicalUrl) {
      updateLinkTag('canonical', metadata.canonicalUrl);
    }

    // Open Graph tags
    updateMetaTag('og:title', metadata.ogTitle || metadata.metaTitle || metadata.title || '', true);
    updateMetaTag('og:description', metadata.ogDescription || metadata.metaDescription || '', true);
    updateMetaTag('og:type', metadata.ogType || 'website', true);
    
    if (metadata.ogImage) {
      updateMetaTag('og:image', metadata.ogImage, true);
    }

    if (metadata.canonicalUrl) {
      updateMetaTag('og:url', metadata.canonicalUrl, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', metadata.twitterCard || 'summary_large_image');
    updateMetaTag('twitter:title', metadata.ogTitle || metadata.metaTitle || metadata.title || '');
    updateMetaTag('twitter:description', metadata.ogDescription || metadata.metaDescription || '');
    
    if (metadata.ogImage) {
      updateMetaTag('twitter:image', metadata.ogImage);
    }

  }, [metadata]);

  return null; // This component doesn't render anything
}

// Character count helpers for admin
export function getMetaTitleLength(title: string): number {
  return title.length;
}

export function getMetaDescriptionLength(description: string): number {
  return description.length;
}

export function isMetaTitleValid(title: string): { valid: boolean; message: string } {
  if (title.length === 0) {
    return { valid: false, message: 'Titel fehlt' };
  }
  if (title.length > 60) {
    return { valid: false, message: `Zu lang (${title.length}/60 Zeichen) - wird abgeschnitten` };
  }
  if (title.length > 50) {
    return { valid: true, message: `OK für Desktop (${title.length}/60), aber auf Mobile gekürzt` };
  }
  if (title.length < 30) {
    return { valid: true, message: `Könnte länger sein (${title.length}/50)` };
  }
  return { valid: true, message: `✓ Perfekt für Mobile & Desktop (${title.length}/50)` };
}

export function isMetaDescriptionValid(description: string): { valid: boolean; message: string } {
  if (description.length === 0) {
    return { valid: false, message: 'Beschreibung fehlt' };
  }
  if (description.length > 160) {
    return { valid: false, message: `Zu lang (${description.length}/160 Zeichen) - wird abgeschnitten` };
  }
  if (description.length > 130) {
    return { valid: true, message: `OK für Desktop (${description.length}/160), aber auf Mobile gekürzt` };
  }
  if (description.length < 100) {
    return { valid: true, message: `Könnte länger sein (${description.length}/130)` };
  }
  return { valid: true, message: `✓ Perfekt für Mobile & Desktop (${description.length}/130)` };
}