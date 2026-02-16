import React, { useRef, useEffect, useState, useCallback, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselContainerProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  scrollAmount?: number;
  showDesktopButtons?: boolean;
  showMobileButtons?: boolean;
  buttonOffset?: number; // px - Abstand vom Viewport-Rand (positiv = innen, negativ = außen)
}

// Zentrale Definition der Button-Positionierung
const BUTTON_OFFSET = {
  mobile: 8,    // px vom Viewport-Rand
  tablet: 8,    // px vom Viewport-Rand  
  desktop: 8    // px vom Viewport-Rand - EINHEITLICH!
};

const BUTTON_SIZE = 48; // px - Button width/height (STANDARD-GRÖSSE)
const SCROLL_PADDING = 8; // px - Minimales Content-Padding zum Viewport-Rand

/**
 * CarouselContainer - Einheitliche Wrapper-Komponente für alle Karusselle
 * 
 * Features:
 * - Zentrale Button-Offset-Konstanten für konsistente Positionierung
 * - Unified scroll logic für alle Karusselle
 * - Konsistentes Padding-Management
 * - Responsive visibility control für Buttons
 * 
 * Usage:
 * <CarouselContainer>
 *   <div className="flex gap-4">
 *     {items.map(item => <BookCard key={item.id} {...item} />)}
 *   </div>
 * </CarouselContainer>
 */
export function CarouselContainer({
  children,
  className = '',
  scrollAmount = 300,
  showDesktopButtons = true,
  showMobileButtons = false,
  buttonOffset = -8, // Default: Buttons außerhalb des Viewports
}: CarouselContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Initial check
    checkScroll();
    
    // Check after content loads with a slight delay
    const timer = setTimeout(() => checkScroll(), 100);
    
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      clearTimeout(timer);
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    console.log('🔄 Scroll triggered:', direction);
    console.log('   Current scrollLeft:', scrollRef.current.scrollLeft);
    console.log('   Container width:', scrollRef.current.clientWidth);
    console.log('   Total scroll width:', scrollRef.current.scrollWidth);
    
    const container = scrollRef.current;
    
    // Simple scroll: use container width as scroll distance
    const scrollDistance = container.clientWidth * 0.8; // 80% of container width
    const newPosition = direction === 'right' 
      ? container.scrollLeft + scrollDistance 
      : container.scrollLeft - scrollDistance;
    
    console.log('   Scrolling to:', newPosition);
    
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    
    // Re-check scroll state after animation
    setTimeout(() => {
      checkScroll();
      console.log('   After scroll - scrollLeft:', container.scrollLeft);
    }, 500);
  };

  return (
    <div className="relative">
      {/* Left Scroll Button - Desktop */}
      {canScrollLeft && showDesktopButtons && (
        <button
          onClick={() => scroll('left')}
          style={{ 
            position: 'absolute',
            left: `${buttonOffset}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 9999,
            width: `${BUTTON_SIZE}px`,
            height: `${BUTTON_SIZE}px`,
            borderRadius: '9999px',
            border: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            pointerEvents: 'auto',
          }}
          className="hidden lg:flex hover:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" style={{ color: '#ffffff' }} />
        </button>
      )}

      {/* Right Scroll Button - Desktop */}
      {canScrollRight && showDesktopButtons && (
        <button
          onClick={() => scroll('right')}
          style={{ 
            position: 'absolute',
            right: `${buttonOffset}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 9999,
            width: `${BUTTON_SIZE}px`,
            height: `${BUTTON_SIZE}px`,
            borderRadius: '9999px',
            border: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            pointerEvents: 'auto',
          }}
          className="hidden lg:flex hover:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" style={{ color: '#ffffff' }} />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        style={{
          paddingLeft: `${SCROLL_PADDING}px`,
          paddingRight: `${SCROLL_PADDING}px`,
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
          cursor: 'grab',
          overflowX: 'auto',
          overflowY: 'visible',
        }}
        className={`scrollbar-hide scroll-smooth ${className}`}
        onScroll={checkScroll}
        onMouseDown={(e) => {
          const container = scrollRef.current;
          if (!container) return;
          container.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          const container = scrollRef.current;
          if (!container) return;
          container.style.cursor = 'grab';
        }}
        onMouseLeave={(e) => {
          const container = scrollRef.current;
          if (!container) return;
          container.style.cursor = 'grab';
        }}
      >
        {children}
      </div>
    </div>
  );
}