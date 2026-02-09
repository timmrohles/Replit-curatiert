import { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { DSButton } from '../design-system/DSButton';
import { useSafeNavigate } from '../../utils/routing';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  locationType: 'Live' | 'Online';
  image: string;
  curatorName: string;
  curatorImage: string;
}

interface CreatorEventsSectionProps {
  creatorName?: string;
  creatorImage?: string;
  creatorSlug?: string;
  events?: Event[];
  backgroundColor?: string;
}

export function CreatorEventsSection({ 
  creatorName = 'Dieser Creator', 
  creatorImage = '', 
  creatorSlug = '',
  events = [], 
  backgroundColor = '#F5F5F0' 
}: CreatorEventsSectionProps) {
  const navigate = useSafeNavigate();
  const [selectedEventType, setSelectedEventType] = useState('Alle');
  const [selectedEventLocation, setSelectedEventLocation] = useState('Alle');
  const [eventsScrollLeft, setEventsScrollLeft] = useState(0);
  const eventsCarouselRef = useRef<HTMLDivElement>(null);

  // Get unique event types from the events
  const eventTypes = ['Alle', ...Array.from(new Set(events.map(e => e.type)))];

  // Filter events
  const filteredEvents = events.filter(event => {
    const typeMatch = selectedEventType === 'Alle' || event.type === selectedEventType;
    const locationMatch = selectedEventLocation === 'Alle' || event.locationType === selectedEventLocation;
    return typeMatch && locationMatch;
  });

  // Handle scroll for navigation buttons
  useEffect(() => {
    const handleScroll = () => {
      if (eventsCarouselRef.current) {
        setEventsScrollLeft(eventsCarouselRef.current.scrollLeft);
      }
    };

    const carousel = eventsCarouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll);
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollEventsCarousel = (direction: 'left' | 'right') => {
    if (eventsCarouselRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = direction === 'left' 
        ? eventsCarouselRef.current.scrollLeft - scrollAmount
        : eventsCarouselRef.current.scrollLeft + scrollAmount;
      
      eventsCarouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-16" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-foreground">
        <div className="mb-6 md:mb-8">
          <h2 
            className="mb-3 leading-tight"
            style={{ 
              fontFamily: 'Fjalla One',
              fontSize: '2.25rem',
              letterSpacing: '0.02em',
              color: 'var(--foreground)'
            }}
          >
            VERANSTALTUNGEN
          </h2>
          <p className="max-w-2xl" style={{ fontSize: '1rem', color: 'var(--foreground)' }}>
            Kommende Events von {creatorName}
          </p>
        </div>

        {/* Filter Buttons - Only show if events exist */}
        {filteredEvents.length > 0 && (
          <div className="mb-6 md:mb-8 space-y-4">
            {/* Event Type Filter */}
            <div>
              <p className="text-sm mb-2 font-medium" style={{ color: 'var(--foreground)' }}>Event-Typ:</p>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedEventType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedEventType === type
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Type Filter */}
            <div>
              <p className="text-sm mb-2 font-medium" style={{ color: 'var(--foreground)' }}>Ort:</p>
              <div className="flex flex-wrap gap-2">
                {['Alle', 'Live', 'Online'].map((location) => (
                  <button
                    key={location}
                    onClick={() => setSelectedEventLocation(location)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedEventLocation === location
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Display */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--foreground)', opacity: 0.6 }}>Keine Veranstaltungen gefunden.</p>
          </div>
        ) : (
          <>
            {/* Events Carousel */}
            <div className="relative">
              
              {/* Navigation Buttons */}
              {eventsScrollLeft > 0 && (
                <button
                  onClick={() => scrollEventsCarousel('left')}
                  aria-label="Vorherige Events anzeigen"
                  className="hidden lg:flex absolute left-2 md:left-0 top-1/2 -translate-y-1/2 md:-translate-x-6 z-20 w-12 h-12 rounded-full shadow-lg items-center justify-center transition-all"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    backgroundColor: 'var(--carousel-button-bg)',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'var(--carousel-button-border)'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18l-6-6 6-6" stroke="var(--carousel-button-icon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => scrollEventsCarousel('right')}
                aria-label="Nächste Events anzeigen"
                className="hidden lg:flex absolute right-2 md:right-0 top-1/2 -translate-y-1/2 md:translate-x-6 z-20 w-12 h-12 rounded-full shadow-lg items-center justify-center transition-all"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  backgroundColor: 'var(--carousel-button-bg)',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: 'var(--carousel-button-border)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18l6-6-6-6" stroke="var(--carousel-button-icon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Scrollable Container */}
              <div 
                ref={eventsCarouselRef}
                className="overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex gap-6">
                  {filteredEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex-shrink-0 w-[360px]"
                      style={{ scrollSnapAlign: 'start' }}
                      onClick={() => navigate('/events')}
                    >
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={event.image}
                          alt="Event"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4">
                          <span 
                            className="text-white px-3 py-1 rounded-full text-xs uppercase tracking-wide"
                            style={{ backgroundColor: 'var(--color-charcoal)' }}
                          >
                            {event.type}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <img
                            src={event.curatorImage}
                            alt="Curator"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{event.curatorName}</p>
                            <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>{event.date}</p>
                          </div>
                        </div>
                        <h3 
                          className="mb-2 leading-tight" 
                          style={{ 
                            fontFamily: 'Fjalla One', 
                            fontSize: '20px', 
                            letterSpacing: '0.01em',
                            color: 'var(--foreground)'
                          }}
                        >
                          {event.title}
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                          {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-6 md:mt-8">
              <DSButton 
                variant="primary" 
                onClick={() => navigate('/events')}
                className="md:hidden w-full"
              >
                Alle Veranstaltungen
              </DSButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
}