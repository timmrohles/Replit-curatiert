import React, { useEffect, useRef, useState, memo } from 'react';
import { BookCard } from './BookCard';
import { Book } from '../utils/api';

interface LazyBookCardProps {
  cover?: string;
  title?: string;
  author?: string;
  price?: string;
  publisher?: string;
  year?: string;
  cardBackgroundColor?: 'white' | 'beige' | 'transparent';
  textColor?: string;
  iconColor?: string;
  borderColor?: string;
  viewMode?: 'grid' | 'list';
  sectionBackgroundColor?: string;
  book?: Book;
}

/**
 * ⚡ LazyBookCard with Intersection Observer
 * Only renders BookCard when visible in viewport
 */
export const LazyBookCard = memo(function LazyBookCard(props: LazyBookCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, stop observing
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef}>
      {isVisible ? (
        <BookCard {...props} />
      ) : (
        // Placeholder with same dimensions as BookCard
        <div 
          className="w-44 md:w-60 min-h-[400px] md:min-h-[520px] bg-transparent flex-shrink-0"
          style={{ visibility: 'hidden' }}
        />
      )}
    </div>
  );
});