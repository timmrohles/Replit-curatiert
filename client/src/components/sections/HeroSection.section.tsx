import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useSafeNavigate } from '../../utils/routing';
import { HeroSectionProps } from './HeroSection.schema';

interface CuratorWithStorefront {
  id: number;
  name: string;
  bio: string;
  avatarUrl: string;
  slug: string;
  focus: string;
  storefrontId: number;
  storefrontName: string;
  storefrontSlug: string;
  tagline: string;
  heroImageUrl: string;
}

export function HeroSection({ section }: HeroSectionProps) {
  const navigate = useSafeNavigate();
  const [curators, setCurators] = useState<CuratorWithStorefront[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = section?.config || {};
  const headline = config.title || 'DIE PERSÖNLICHSTE BUCHHANDLUNG IM NETZ.';
  const subtitle = config.subtitle || 'Kuratiert von Menschen mit Leidenschaft und Expertise.';
  const description = config.description || 'coratiert, die Community-Buchhandlung, in der Kurator*innen und Expert*innen ihre Lieblingswerke vorstellen. Entdecke Bücher abseits vom Mainstream, unterstütze mit jedem Kauf Publizist*innen und trage somit zu einer vielfältigen Kultur- und Medienlandschaft bei.';

  useEffect(() => {
    fetch('/api/curators/with-storefronts')
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.data)) {
          setCurators(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (curators.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % curators.length);
      }, 4000);
    }
  }, [curators.length]);

  useEffect(() => {
    startAutoplay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startAutoplay]);

  const goTo = (dir: 'prev' | 'next') => {
    setActiveIndex(prev =>
      dir === 'next'
        ? (prev + 1) % curators.length
        : (prev - 1 + curators.length) % curators.length
    );
    startAutoplay();
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-beige)' }}
      data-testid="hero-section"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-[var(--space-12)] md:py-[var(--space-16)]">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-5">
            <h1 className="font-headline leading-tight tracking-wide text-fluid-h1">
              <span className="text-cerulean">
                {headline}
              </span>{' '}
              <span className="text-foreground">
                {subtitle}
              </span>
            </h1>

            <p className="max-w-xl font-sans text-muted-foreground text-fluid-body leading-relaxed">
              {description}
            </p>
          </div>

          <div className="relative flex flex-col items-center" data-testid="hero-curator-cards">
            {curators.length > 0 ? (
              <>
                <div className="relative w-full max-w-[300px] md:max-w-[340px] h-[380px] md:h-[440px]">
                  {curators.slice(0, Math.min(curators.length, 5)).map((curator, index) => {
                    const offset = index - activeIndex;
                    const isActive = index === activeIndex;
                    const absOffset = Math.abs(offset);
                    const rotation = offset * 6;
                    const translateX = offset * 20;
                    const scale = isActive ? 1 : 0.92 - absOffset * 0.03;
                    const zIndex = 10 - absOffset;
                    const opacity = absOffset > 2 ? 0 : 1;

                    return (
                      <div
                        key={curator.id}
                        className="absolute top-0 left-1/2 w-[240px] md:w-[280px] cursor-pointer"
                        style={{
                          transform: `translateX(calc(-50% + ${translateX}px)) rotate(${rotation}deg) scale(${scale})`,
                          zIndex,
                          opacity,
                          transition: 'all 0.5s ease-out',
                        }}
                        onClick={() => {
                          if (isActive && curator.storefrontSlug) {
                            navigate(`/storefront/${curator.storefrontSlug}`);
                          } else if (isActive && curator.slug) {
                            navigate(`/kuratoren/${curator.slug}`);
                          } else {
                            setActiveIndex(index);
                            startAutoplay();
                          }
                        }}
                        data-testid={`hero-curator-card-${curator.id}`}
                      >
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                          <ImageWithFallback
                            src={curator.avatarUrl || curator.heroImageUrl || ''}
                            alt={curator.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {isActive && (
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-b-2xl p-4"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)',
                            }}
                          >
                            <p className="text-white text-lg mb-0.5 font-headline">
                              {curator.name}
                            </p>
                            <p className="text-white/80 text-sm font-sans">
                              {curator.focus || curator.tagline || ''}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {curators.length > 1 && (
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => goTo('prev')}
                      aria-label="Vorherige:r Kurator:in"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-charcoal text-white"
                      data-testid="hero-prev-curator"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex gap-1.5">
                      {curators.slice(0, Math.min(curators.length, 5)).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setActiveIndex(i); startAutoplay(); }}
                          className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-cerulean' : 'bg-muted-foreground/40'}`}
                          aria-label={`Kurator:in ${i + 1}`}
                          data-testid={`hero-dot-${i}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => goTo('next')}
                      aria-label="Nächste:r Kurator:in"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-charcoal text-white"
                      data-testid="hero-next-curator"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div
                className="w-full max-w-[300px] aspect-[3/4] rounded-2xl flex items-center justify-center bg-muted/30 border-2 border-dashed border-border"
              >
                <p className="text-center px-6 font-sans text-muted-foreground">
                  Kurator:innen mit veröffentlichten Bookstores erscheinen hier automatisch.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
