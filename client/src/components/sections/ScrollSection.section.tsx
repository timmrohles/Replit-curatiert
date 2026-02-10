// ============================================================================
// Scroll Section - Frontend Render Component
// Generic scrolling container with arrows
// ============================================================================

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '../homepage/SectionHeader';
import { ScrollSectionProps } from './ScrollSection.schema';

export function ScrollSection({ 
  id,
  title, 
  subtitle,
  children, 
  carouselRef,
  scrollAmount,
  className = '', 
  fadeColor = '#F5F5F0' 
}: ScrollSectionProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (!carouselRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollability();
    // Check again after a short delay to ensure content is loaded
    const timer = setTimeout(checkScrollability, 100);
    window.addEventListener('resize', checkScrollability);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [children]); // Re-check when children change

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const newScrollLeft = direction === 'left' 
      ? carouselRef.current.scrollLeft - scrollAmount
      : carouselRef.current.scrollLeft + scrollAmount;
    
    carouselRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <section id={id} className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title={title} subtitle={subtitle} />
        
        <div className="relative">
          {/* Fade-out effect on the right */}
          {canScrollRight && (
            <div 
              className="absolute right-0 top-0 bottom-0 w-24 md:w-32 pointer-events-none z-[5]" 
              style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }}
            ></div>
          )}

          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="flex absolute left-2 top-1/2 -translate-y-1/2 md:-translate-x-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg items-center justify-center hover:bg-gray-50 transition-all"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-charcoal" />
            </button>
          )}

          {/* Scrollable Content */}
          <div
            ref={carouselRef}
            onScroll={checkScrollability}
            className={`overflow-x-auto scrollbar-hide overscroll-x-contain ${className}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {children}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="flex absolute right-2 top-1/2 -translate-y-1/2 md:translate-x-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg items-center justify-center hover:bg-gray-50 transition-all"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-charcoal" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
