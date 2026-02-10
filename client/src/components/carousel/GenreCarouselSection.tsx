import { useState, useRef, useEffect } from 'react';
import { LikeButton } from '../favorites/LikeButton';

interface GenreCarouselSectionProps {
  backgroundColor?: string;
  titleColor?: string;
}

export function GenreCarouselSection({ backgroundColor = 'var(--charcoal)', titleColor = '#FFFFFF' }: GenreCarouselSectionProps) {
  const genreCarouselRef = useRef<HTMLDivElement>(null);
  const [genreScrollLeft, setGenreScrollLeft] = useState(0);

  const scrollGenreCarousel = (direction: 'left' | 'right') => {
    if (genreCarouselRef.current) {
      const scrollAmount = 280; // card width (256) + gap (24)
      const newScrollLeft = genreCarouselRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      genreCarouselRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  // Add scroll listener to track scroll position
  useEffect(() => {
    const genreCarousel = genreCarouselRef.current;

    const handleGenreScroll = () => {
      if (genreCarousel) {
        setGenreScrollLeft(genreCarousel.scrollLeft);
      }
    };

    if (genreCarousel) {
      genreCarousel.addEventListener('scroll', handleGenreScroll);
    }

    return () => {
      if (genreCarousel) {
        genreCarousel.removeEventListener('scroll', handleGenreScroll);
      }
    };
  }, []);

  return (
    <section className="pt-8 pb-16 px-4 md:px-8" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <h2 
            className="mb-8 text-center"
            style={{ 
              fontFamily: 'Fjalla One', 
              fontSize: '32px', 
              letterSpacing: '0.02em', 
              color: titleColor === '#FFFFFF' ? '#3A3A3A' : titleColor,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
            }}
          >
            Was möchtest du lesen?
          </h2>
          
          <div className="relative">
            {/* Scroll Container */}
            <div 
              ref={genreCarouselRef}
              className="flex gap-2 md:gap-3 overflow-x-auto pb-4 px-4 scrollbar-hide snap-x snap-proximity md:snap-mandatory overscroll-x-contain"
            >
              {/* Hardboiled */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/35q39pqr/hardboiled.jpg"
                    alt="Hardboiled"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Hardboiled
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-hardboiled" 
                        entityType="genre"
                        entityTitle="Hardboiled"
                        entityImage="https://i.ibb.co/35q39pqr/hardboiled.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* New Adult */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/jPHqSQcp/new-adult.jpg"
                    alt="New Adult"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    New Adult
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-new-adult" 
                        entityType="genre"
                        entityTitle="New Adult"
                        entityImage="https://i.ibb.co/jPHqSQcp/new-adult.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LGBTQ+ */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/zjmj35F/lgbtq.jpg"
                    alt="LGBTQ+"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    LGBTQ+
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-lgbtq" 
                        entityType="genre"
                        entityTitle="LGBTQ+"
                        entityImage="https://i.ibb.co/zjmj35F/lgbtq.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Urban Fantasy */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/jv1cbVbk/urban-fantasy.jpg"
                    alt="Urban Fantasy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Urban Fantasy
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-urban-fantasy" 
                        entityType="genre"
                        entityTitle="Urban Fantasy"
                        entityImage="https://i.ibb.co/jv1cbVbk/urban-fantasy.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternate History */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/sJzYdzFz/alternate-history.jpg"
                    alt="Alternate History"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Alternate History
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-alternate-history" 
                        entityType="genre"
                        entityTitle="Alternate History"
                        entityImage="https://i.ibb.co/sJzYdzFz/alternate-history.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Slam Poetry */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/jknx2D8H/poetry-slam.jpg"
                    alt="Slam Poetry"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Slam Poetry
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-slam-poetry" 
                        entityType="genre"
                        entityTitle="Slam Poetry"
                        entityImage="https://i.ibb.co/jknx2D8H/poetry-slam.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Start-ups */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/zzxyBPC/startup.jpg"
                    alt="Start-ups"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Start-ups
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-startups" 
                        entityType="genre"
                        entityTitle="Start-ups"
                        entityImage="https://i.ibb.co/zzxyBPC/startup.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feminism */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/Lqp8JQT/feminismus.jpg"
                    alt="Feminism"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Feminism
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-feminism" 
                        entityType="genre"
                        entityTitle="Feminism"
                        entityImage="https://i.ibb.co/Lqp8JQT/feminismus.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Migration */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/mVJr0KRt/migration.jpg"
                    alt="Migration"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Migration
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-migration" 
                        entityType="genre"
                        entityTitle="Migration"
                        entityImage="https://i.ibb.co/mVJr0KRt/migration.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Klima & Umwelt */}
              <div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
                <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <img
                    src="https://i.ibb.co/dwDT54JL/klima.jpg"
                    alt="Klima & Umwelt"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white" style={{ fontFamily: 'Fjalla One', fontSize: '14px' }}>
                    Klima & Umwelt
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1 shadow-lg">
                      <LikeButton 
                        entityId="genre-klima" 
                        entityType="genre"
                        entityTitle="Klima & Umwelt"
                        entityImage="https://i.ibb.co/dwDT54JL/klima.jpg"
                        size="sm" 
                        variant="minimal"
                        iconColor="#247ba0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows for Carousel */}
            {genreScrollLeft > 0 && (
              <button 
                onClick={() => scrollGenreCarousel('left')}
                className="flex absolute left-2 md:left-0 top-1/2 -translate-y-1/2 md:-translate-x-6 z-20 w-12 h-12 rounded-full bg-white shadow-lg items-center justify-center hover:bg-gray-50 transition-all"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18l-6-6 6-6" stroke="var(--charcoal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <button 
              onClick={() => scrollGenreCarousel('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-12 h-12 rounded-full bg-white shadow-lg items-center justify-center hover:bg-gray-50 transition-all"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="var(--charcoal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}