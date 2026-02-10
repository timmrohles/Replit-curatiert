// ============================================================================
// Book Carousel Section - Frontend Render Component
// ============================================================================

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BookCard } from '../../book/BookCard';
import { BookCarouselProps } from './BookCarousel.schema';

export function BookCarouselSection({ books }: BookCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newPosition = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group px-12">
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-surface shadow-lg rounded-full p-3 transition-opacity hover:bg-[var(--color-brand-beige)] dark:hover:bg-surface-elevated items-center justify-center opacity-90 hover:opacity-100"
        aria-label="Nach links scrollen"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth overscroll-x-contain"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {books.map((book) => (
          <div key={book.id} className="flex-shrink-0 w-48">
            <BookCard
              cover={book.cover}
              title={book.title}
              author={book.author}
              publisher={book.publisher}
              price={book.price}
            />
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-surface shadow-lg rounded-full p-3 transition-opacity hover:bg-[var(--color-brand-beige)] dark:hover:bg-surface-elevated items-center justify-center opacity-90 hover:opacity-100"
        aria-label="Nach rechts scrollen"
      >
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>
    </div>
  );
}
