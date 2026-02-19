import { useRef, useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { linkForTarget } from '../../utils/link-resolver';
import { CategoryGridProps } from './CategoryGrid.schema';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function CategoryGrid({ section }: CategoryGridProps) {
  const navigate = useSafeNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const sortedItems = [...section.items].sort((a, b) => a.sortOrder - b.sortOrder);
  const title = section.config?.title || 'Was möchtest du lesen?';

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [sortedItems.length]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section className="py-8 md:py-12 px-4 md:px-6 lg:px-8" data-testid="category-grid-section">
      <div className="max-w-[1440px] mx-auto">
        {title && (
          <h2
            className="text-2xl md:text-3xl lg:text-4xl mb-6 md:mb-8 text-center"
            style={{ fontFamily: 'Fjalla One', color: 'var(--foreground, #2a2a2a)' }}
            data-testid="category-grid-title"
          >
            {title}
          </h2>
        )}

        <div className="relative group">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(to right, rgba(247,244,239,0.95), transparent)',
              }}
              aria-label="Nach links scrollen"
              data-testid="category-scroll-left"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="var(--charcoal, #2a2a2a)" />
              </svg>
            </button>
          )}

          <div
            ref={scrollRef}
            className="category-scroll flex gap-4 overflow-x-auto pb-2 scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <style>{`.category-scroll::-webkit-scrollbar { display: none; }`}</style>

            {sortedItems.length > 0 ? (
              sortedItems.map((item) => {
                const itemTitle =
                  item.data?.title ||
                  (item.target?.type === 'category' ? item.target.category?.name : '');
                const imageUrl = item.data?.imageUrl || item.data?.image_url || '';
                const link = linkForTarget(item.target);

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(link)}
                    className="relative flex-shrink-0 rounded-xl overflow-hidden transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      width: 'clamp(140px, 20vw, 200px)',
                      aspectRatio: '3/4',
                    }}
                    data-testid={`category-card-${item.id}`}
                  >
                    {imageUrl ? (
                      <ImageWithFallback
                        src={imageUrl}
                        alt={itemTitle}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, var(--color-coral, #e07a5f) 0%, var(--cerulean, #247ba0) 100%)`,
                          opacity: 0.2,
                        }}
                      />
                    )}

                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.1) 60%, transparent)',
                      }}
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3
                        className="text-white text-sm md:text-base leading-snug"
                        style={{ fontFamily: 'Fjalla One' }}
                      >
                        {itemTitle}
                      </h3>
                    </div>
                  </button>
                );
              })
            ) : (
              <div
                className="flex-shrink-0 w-full py-12 text-center rounded-xl"
                style={{
                  border: '2px dashed var(--color-brand-gray, #ccc)',
                  color: 'var(--color-brand-gray, #888)',
                }}
              >
                <p style={{ fontFamily: 'Inter' }}>
                  Kategorien mit Bildern hinzufügen, um diesen Bereich zu füllen.
                </p>
              </div>
            )}
          </div>

          {canScrollRight && (
            <div
              className="absolute right-0 top-0 bottom-0 w-16 md:w-24 pointer-events-none z-[5]"
              style={{
                background: 'linear-gradient(to left, var(--color-brand-beige, #f7f4ef), transparent)',
              }}
            />
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Nach rechts scrollen"
              data-testid="category-scroll-right"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="var(--charcoal, #2a2a2a)" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
