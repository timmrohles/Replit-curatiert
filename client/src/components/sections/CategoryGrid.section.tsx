import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2
            className="font-headline text-fluid-h2 uppercase mb-6 md:mb-8 text-center text-foreground"
            data-testid="category-grid-title"
          >
            {title}
          </h2>
        )}

        <div className="relative group">
          {canScrollLeft && (
            <div
              className="absolute left-0 top-0 bottom-0 w-16 lg:w-24 pointer-events-none z-[5]"
              style={{
                background: 'linear-gradient(to right, var(--background), transparent)',
              }}
            />
          )}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-charcoal text-white shadow-lg transition-all hover:scale-110"
              aria-label="Nach links scrollen"
              data-testid="category-scroll-left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="category-scroll flex gap-0 overflow-x-auto scroll-smooth"
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
                    className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-book-cover dark:shadow-book-cover-dark transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean"
                    style={{
                      width: 'clamp(180px, 22vw, 280px)',
                      aspectRatio: '16/9',
                      margin: '8px 6px',
                    }}
                    data-testid={`category-card-${item.id}`}
                  >
                    {imageUrl ? (
                      <ImageWithFallback
                        src={imageUrl}
                        alt={itemTitle}
                        className="absolute inset-0 w-full h-full object-cover scale-105"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-coral to-cerulean opacity-20"
                      />
                    )}

                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(20, 60, 100, 0.45), rgba(10, 30, 60, 0.55))',
                      }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <h3 className="text-white font-headline text-lg md:text-xl lg:text-2xl leading-tight uppercase tracking-wide text-center drop-shadow-lg">
                        {itemTitle}
                      </h3>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex-shrink-0 w-full py-12 text-center rounded-xl border-2 border-dashed border-border">
                <p className="font-sans text-muted-foreground">
                  Kategorien mit Bildern hinzufügen, um diesen Bereich zu füllen.
                </p>
              </div>
            )}
          </div>

          {canScrollRight && (
            <div
              className="absolute right-0 top-0 bottom-0 w-16 lg:w-24 pointer-events-none z-[5]"
              style={{
                background: 'linear-gradient(to left, var(--background), transparent)',
              }}
            />
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-charcoal text-white shadow-lg transition-all hover:scale-110"
              aria-label="Nach rechts scrollen"
              data-testid="category-scroll-right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
