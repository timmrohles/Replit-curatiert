// ============================================================================
// Creator Carousel Section - Frontend Render Component
// Large Carousel mit Curator Info
// ============================================================================

import { BookCarousel } from '../homepage/BookCarousel';
import { User, Sparkles } from 'lucide-react';
import { CreatorCarouselSectionProps } from './CreatorCarouselSection.schema';

export function CreatorCarouselSection({ section, books, className = '' }: CreatorCarouselSectionProps) {
  const { content, curatorType, curatorReason } = section;
  const description = content?.description;

  // Curator Type Icon & Color
  const getCuratorBadge = () => {
    switch (curatorType) {
      case 'redaktion':
        return {
          icon: <Sparkles className="w-4 h-4" />,
          label: 'coratiert Redaktion',
          color: 'var(--color-accent-primary)'
        };
      case 'community':
        return {
          icon: <User className="w-4 h-4" />,
          label: 'Community-Kuratiert',
          color: 'var(--color-accent-secondary)'
        };
      case 'extern':
        return {
          icon: <User className="w-4 h-4" />,
          label: 'Gast-Kuratiert',
          color: 'var(--color-accent-tertiary)'
        };
      default:
        return null;
    }
  };

  const curatorBadge = getCuratorBadge();

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 
              className="text-3xl md:text-4xl"
              style={{ 
                fontFamily: 'Fjalla One',
                color: 'var(--color-text-primary)'
              }}
            >
              {section.title}
            </h2>

            {/* Curator Badge */}
            {curatorBadge && (
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: curatorBadge.color }}
              >
                {curatorBadge.icon}
                {curatorBadge.label}
              </span>
            )}
          </div>

          {/* Description or Curator Reason */}
          {(description || curatorReason) && (
            <p 
              className="text-lg max-w-3xl"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description || curatorReason}
            </p>
          )}
        </div>

        {/* Books Carousel */}
        {books.length > 0 ? (
          <BookCarousel books={books} />
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
