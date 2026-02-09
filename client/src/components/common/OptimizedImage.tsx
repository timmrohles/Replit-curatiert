import React, { useState, useEffect, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fetchpriority?: 'high' | 'low' | 'auto';
  title?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * ⚡ Optimized Image Component
 * 
 * Features:
 * - Native lazy loading
 * - Responsive image sizes
 * - Blur placeholder during load
 * - WebP format support (Unsplash auto-converts)
 * - Automatic srcset generation
 * - Performance monitoring
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  style = {},
  loading = 'lazy',
  sizes,
  width,
  height,
  priority = false,
  fetchpriority,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);
    setImageSrc(optimizeImageUrl(src, 400)); // Default size
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
    // Fallback to original URL without optimization
    setImageSrc(src);
  };

  // Generate srcset for responsive images (Unsplash specific)
  const generateSrcSet = (url: string): string => {
    if (!url.includes('unsplash.com') && !url.includes('images.')) {
      return '';
    }

    const sizes = [400, 600, 800, 1200];
    return sizes
      .map(size => `${optimizeImageUrl(url, size)} ${size}w`)
      .join(', ');
  };

  // Default sizes attribute for responsive images
  const defaultSizes = sizes || '(max-width: 640px) 176px, (max-width: 768px) 240px, 240px';

  const srcSet = generateSrcSet(src);

  // Determine fetchpriority based on priority prop or explicit prop
  const determinedFetchPriority = fetchpriority || (priority ? 'high' : 'auto');

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Blur placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-[1px]"
          style={{ zIndex: 1 }}
        />
      )}

      {/* Actual image */}
      <img
        src={imageSrc || optimizeImageUrl(src, 800)}
        srcSet={srcSet || undefined}
        sizes={defaultSizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        fetchPriority={determinedFetchPriority as any}
        decoding="async"
        className={`w-full h-full object-cover rounded-[1px] transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          objectPosition: 'center',
          zIndex: 2,
          position: 'relative'
        }}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-300 flex items-center justify-center rounded-[1px]" style={{ zIndex: 3 }}>
          <div className="text-center text-gray-500 px-4">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Bild nicht verfügbar</p>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Optimize image URL for better performance
 * - Unsplash: Add width, quality, format parameters
 * - Other CDNs: Return as-is
 */
function optimizeImageUrl(url: string, width: number = 800, quality: number = 80): string {
  if (!url) return '';

  try {
    // Unsplash optimization
    if (url.includes('unsplash.com')) {
      const urlObj = new URL(url);
      
      // Add/update optimization parameters
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('fm', 'webp'); // Force WebP format
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('auto', 'format'); // Auto-select best format
      
      return urlObj.toString();
    }

    // ibb.co optimization
    if (url.includes('ibb.co')) {
      // ibb.co doesn't support query params, return as-is
      return url;
    }

    // Other URLs: return as-is
    return url;
  } catch (error) {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Preload critical images (for above-the-fold content)
 */
export function preloadImage(src: string, width: number = 800): void {
  if (!src) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimizeImageUrl(src, width);
  link.imageSrcset = generatePreloadSrcSet(src);
  document.head.appendChild(link);
}

function generatePreloadSrcSet(url: string): string {
  if (!url.includes('unsplash.com')) return '';
  
  const sizes = [400, 800, 1200];
  return sizes
    .map(size => `${optimizeImageUrl(url, size)} ${size}w`)
    .join(', ');
}