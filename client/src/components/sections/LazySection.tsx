import { useRef, useState, useEffect, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  rootMargin?: string;
  placeholder?: ReactNode;
  forceVisible?: boolean;
}

const defaultPlaceholder = (
  <div className="min-h-[200px]" />
);

export function LazySection({ 
  children, 
  rootMargin = '400px',
  placeholder = defaultPlaceholder,
  forceVisible = false,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(forceVisible);

  useEffect(() => {
    if (forceVisible || isVisible) return;

    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [forceVisible, rootMargin, isVisible]);

  if (isVisible) {
    return <>{children}</>;
  }

  return <div ref={ref}>{placeholder}</div>;
}
