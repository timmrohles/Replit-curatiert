import { ReactNode, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DSCarouselProps {
  children: ReactNode;
  itemWidth?: number; // Breite eines Items in px für Scroll-Berechnung
  gap?: number; // Gap zwischen Items in px
  showArrows?: boolean;
  arrowColor?: string;
  arrowBg?: string;
  arrowHoverBg?: string;
  className?: string;
}

/**
 * DSCarousel - Universelle Carousel Komponente für coratiert.de
 * 
 * Features:
 * - Horizontales Scrollen
 * - Navigation mit Pfeilen (optional)
 * - Touch-freundlich
 * - Automatisches Ausblenden der Pfeile wenn nicht scrollbar
 * - Snap-to-Grid (optional via className)
 * 
 * Verwendung:
 * - Buch-Karussells
 * - Genre-Kategorien
 * - Creator-Listen
 * - Event-Slider
 * 
 * @example
 * <DSCarousel itemWidth={200} gap={16} showArrows>
 *   {books.map(book => <BookCard key={book.id} {...book} />)}
 * </DSCarousel>
 */
export function DSCarousel({
  children,
  itemWidth = 200,
  gap = 16,
  showArrows = true,
  arrowColor = '#FFFFFF',
  arrowBg = '#247ba0',
  arrowHoverBg = '#70c1b3',
  className = ''
}: DSCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Track scroll position
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      setScrollLeft(carousel.scrollLeft);
      setMaxScroll(carousel.scrollWidth - carousel.clientWidth);
    };

    // Initial calculation
    handleScroll();

    carousel.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;

    const scrollAmount = itemWidth + gap;
    const newScrollLeft = carouselRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    
    carouselRef.current.scrollTo({ 
      left: newScrollLeft, 
      behavior: 'smooth' 
    });
  };

  const canScrollLeft = scrollLeft > 5; // 5px threshold
  const canScrollRight = scrollLeft < maxScroll - 5;
  const hasOverflow = maxScroll > 0;

  return (
    <div className="relative">
      {/* Left Arrow */}
      {showArrows && canScrollLeft && hasOverflow && (
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all duration-300 ${
            !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-gray-100'
          } bg-surface items-center justify-center`}
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
          }}
        >
          <ChevronLeft className="w-6 h-6" style={{ color: arrowColor || '#FFFFFF' }} />
        </button>
      )}

      {/* Right Arrow */}
      {showArrows && canScrollRight && hasOverflow && (
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all duration-300 ${
            !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-gray-100'
          } bg-surface items-center justify-center`}
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
          }}
        >
          <ChevronRight className="w-6 h-6" style={{ color: arrowColor || '#FFFFFF' }} />
        </button>
      )}

      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className={`flex overflow-x-auto pb-4 scrollbar-hide overscroll-x-contain ${className}`}
        style={{ 
          gap: `${gap}px`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
}