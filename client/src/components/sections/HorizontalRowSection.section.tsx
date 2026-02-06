// ============================================================================
// Horizontal Row Section - Frontend Render Component
// Compact horizontal book row
// ============================================================================

import { HorizontalBookRow } from '../HorizontalBookRow';
import { HorizontalRowSectionProps } from './HorizontalRowSection.schema';

export function HorizontalRowSection({ section, books, className = '' }: HorizontalRowSectionProps) {
  const { content } = section;
  const description = content?.description;

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-2xl md:text-3xl mb-2"
            style={{ 
              fontFamily: 'Fjalla One',
              color: 'var(--color-text-primary)'
            }}
          >
            {section.title}
          </h2>

          {description && (
            <p 
              className="text-base"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Books Row */}
        {books.length > 0 ? (
          <HorizontalBookRow books={books} />
        ) : (
          <div 
            className="text-center py-8 border-2 border-dashed rounded-lg"
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
