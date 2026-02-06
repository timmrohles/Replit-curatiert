import { useEffect, useRef, useState } from 'react';

interface ImagePerformanceMetrics {
  loadTime: number;
  isLoaded: boolean;
  hasError: boolean;
}

/**
 * ⚡ Performance Hook for Image Loading
 * 
 * Tracks image loading performance and provides metrics
 * Only active in development mode
 */
export function useImagePerformance(src: string, enabled: boolean = true): ImagePerformanceMetrics {
  const [metrics, setMetrics] = useState<ImagePerformanceMetrics>({
    loadTime: 0,
    isLoaded: false,
    hasError: false
  });
  
  const startTimeRef = useRef<number>(0);
  const isDevelopment = typeof import.meta !== 'undefined' && 
                        import.meta.env && 
                        import.meta.env.DEV;

  useEffect(() => {
    if (!enabled || !isDevelopment) return;

    startTimeRef.current = performance.now();

    const img = new Image();
    img.src = src;

    const handleLoad = () => {
      const loadTime = performance.now() - startTimeRef.current;
      
      setMetrics({
        loadTime,
        isLoaded: true,
        hasError: false
      });

      // Log slow images (> 1 second)
      if (loadTime > 1000) {
        console.warn(`⚠️ Slow image load: ${src.substring(0, 50)}... (${loadTime.toFixed(0)}ms)`);
      }
    };

    const handleError = () => {
      setMetrics({
        loadTime: 0,
        isLoaded: false,
        hasError: true
      });

      console.error(`❌ Image failed to load: ${src}`);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src, enabled, isDevelopment]);

  return metrics;
}

/**
 * ⚡ Intersection Observer Hook for Lazy Loading
 * 
 * Triggers callback when element enters viewport
 * More efficient than native lazy loading for custom logic
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callbackRef.current();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Load 50px before entering viewport
        threshold: 0.01,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return ref;
}

/**
 * ⚡ Progressive Image Loading Hook
 * 
 * Loads low-quality placeholder first, then high-quality image
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
): {
  src: string;
  blur: boolean;
} {
  const [src, setSrc] = useState(lowQualitySrc);
  const [blur, setBlur] = useState(true);

  useEffect(() => {
    // Start with low quality
    setSrc(lowQualitySrc);
    setBlur(true);

    // Preload high quality image
    const img = new Image();
    img.src = highQualitySrc;
    
    img.onload = () => {
      setSrc(highQualitySrc);
      setBlur(false);
    };

    return () => {
      img.onload = null;
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { src, blur };
}

/**
 * ⚡ Batch Image Preloader
 * 
 * Preloads multiple images in order of priority
 */
export function preloadImages(urls: string[], priority: number[] = []): Promise<void[]> {
  // Sort by priority if provided
  const sortedUrls = priority.length === urls.length
    ? urls
        .map((url, index) => ({ url, priority: priority[index] }))
        .sort((a, b) => b.priority - a.priority)
        .map(item => item.url)
    : urls;

  return Promise.all(
    sortedUrls.map(
      url =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
          img.src = url;
        })
    )
  );
}
