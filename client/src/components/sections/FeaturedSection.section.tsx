// ============================================================================
// Featured Section - Frontend Render Component
// Editorial Highlight mit Image + Books
// ============================================================================

import { BookCard } from '../book/BookCard';
import { FeaturedSectionProps } from './FeaturedSection.schema';

export function FeaturedSection({ section, books = [], className = '' }: FeaturedSectionProps) {
  const { content } = section;
  const description = content?.description;
  const imageUrl = content?.image_url;

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image Side */}
          {imageUrl && (
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
              <img 
                src={imageUrl} 
                alt={section.title}
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
                }}
              />
            </div>
          )}

          {/* Content Side */}
          <div>
            <h2 
              className="text-3xl md:text-4xl mb-4"
              style={{ 
                fontFamily: 'Fjalla One',
                color: 'var(--color-text-primary)'
              }}
            >
              {section.title}
            </h2>

            {description && (
              <p 
                className="text-lg mb-6"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {description}
              </p>
            )}

            {/* Featured Books (max 3) */}
            {books.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {books.slice(0, 3).map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book as any}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
