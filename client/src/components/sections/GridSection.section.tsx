// ============================================================================
// Grid Section - Frontend Render Component
// Grid view (3-4 columns)
// ============================================================================

import { BookCard } from '../book/BookCard';
import { GridSectionProps } from './GridSection.schema';

export function GridSection({ section, books, className = '' }: GridSectionProps) {
  const { content } = section;
  const description = content?.description;

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 
            className="text-3xl md:text-4xl mb-3"
            style={{ 
              fontFamily: 'Fjalla One',
              color: 'var(--color-text-primary)'
            }}
          >
            {section.title}
          </h2>

          {description && (
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard 
                key={book.id} 
                book={book as any}
              />
            ))}
          </div>
        ) : (
          <div 
            className="text-center py-12 border-2 border-dashed rounded-lg"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p style={{ color: 'var(--color-text-muted)' }}>
              Keine Bücher in dieser Sektion
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
