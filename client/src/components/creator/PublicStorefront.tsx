import { useState, useEffect, memo, useReducer, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import { BookCard } from '../book/BookCard';
import { EventCard } from '../events/EventCard';
import { ChevronLeft, ChevronRight, Share2, Heart, Youtube, Twitter, Podcast, Instagram, Linkedin, Globe, Loader2 } from 'lucide-react';
import { useFavorites } from '../favorites/FavoritesContext';
import { logger } from '../../utils/logger';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { InfoBar } from '../layout/InfoBar';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { SectionHeader } from '../homepage/SectionHeader';
import { GenreCarouselSection } from '../carousel/GenreCarouselSection';
import { CreatorEventsSection } from './CreatorEventsSection';
import { CreatorCarousel } from './CreatorCarousel';
import { GenreCategoriesSection } from '../tags/GenreCategoriesSection';
import { ContentTabs } from '../common/ContentTabs';
import { SupportSection } from '../layout/SupportSection';
import { BonusContentSection } from '../book/BonusContentSection';
import { DSTag } from '../design-system/DSTag';
import { LikeButton } from '../favorites/LikeButton';
import { VideoEmbed } from '../common/VideoEmbed';
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastRan = 0;
  
  return function(this: any, ...args: any[]) {
    const now = Date.now();
    
    if (now - lastRan >= delay) {
      func.apply(this, args);
      lastRan = now;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastRan = Date.now();
      }, delay - (now - lastRan));
    }
  };
};

interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  price: string;
  description?: string; // NEW: Book description for flip cards
  shortDescription?: string; // NEW: Alias for description
}

interface BookSeries {
  id: string;
  type: 'static' | 'dynamic';
  title: string;
  description: string;
  reason?: string;
  occasion?: string;
  books: Book[];
  filters?: {
    publishers?: string[];
    authors?: string[];
    categories?: string[];
    tags?: string[];
  };
  sortOrder: 'popular' | 'newest' | 'az' | 'rating';
  isOwnBooks?: boolean;
  publisherLink?: string;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
  heroBackground?: string;
  carouselBackground?: string;
  contentBackground?: string;
  contentText?: string;
}

interface SocialMedia {
  youtube?: string;
  spotify?: string;
  podcast?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
}

interface StorefrontEvent {
  id: string;
  storefrontSlug: string;
  title: string;
  description: string;
  type: string;
  location: string;
  date: string;
  time: string;
  image: string;
  isOnline: boolean;
  registrationUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Storefront {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  colors: ColorScheme;
  textColors?: {
    onHeroBackground?: string;
  };
  books: Book[];
  bookSeries: BookSeries[];
  creatorFocus?: string;
  creatorBio?: string;
  socialMedia?: SocialMedia;
  introVideo?: string;
}

const API_BASE = '/api';

// PERFORMANCE: State-Reducer to reduce number of useState hooks
type StorefrontState = {
  storefront: Storefront | null;
  loading: boolean;
  error: string;
  activeTab: 'bücher' | 'rezensionen' | 'veranstaltungen' | 'bonusinhalte' | 'autor:innen';
  events: StorefrontEvent[];
  selectedEventType: string;
  selectedEventLocation: string;
  eventsScrollLeft: number;
};

type StorefrontAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_STOREFRONT'; payload: Storefront }
  | { type: 'SET_EVENTS'; payload: StorefrontEvent[] }
  | { type: 'SET_ACTIVE_TAB'; payload: 'bücher' | 'rezensionen' | 'veranstaltungen' | 'bonusinhalte' | 'autor:innen' }
  | { type: 'SET_EVENT_TYPE'; payload: string }
  | { type: 'SET_EVENT_LOCATION'; payload: string }
  | { type: 'SET_EVENTS_SCROLL'; payload: number };

const initialState: StorefrontState = {
  storefront: null,
  loading: true,
  error: '',
  activeTab: 'bücher',
  events: [],
  selectedEventType: 'Alle',
  selectedEventLocation: 'Alle',
  eventsScrollLeft: 0,
};

function storefrontReducer(state: StorefrontState, action: StorefrontAction): StorefrontState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_STOREFRONT':
      return { ...state, storefront: action.payload, loading: false, error: '' };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_EVENT_TYPE':
      return { ...state, selectedEventType: action.payload };
    case 'SET_EVENT_LOCATION':
      return { ...state, selectedEventLocation: action.payload };
    case 'SET_EVENTS_SCROLL':
      return { ...state, eventsScrollLeft: action.payload };
    default:
      return state;
  }
}

export const PublicStorefront = memo(function PublicStorefront({ storefrontId }: { storefrontId: string }) {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const [state, dispatch] = useReducer(storefrontReducer, initialState);
  const eventsCarouselRef = useRef<HTMLDivElement>(null);

  // Helper function to determine if a color is light or dark
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? 'var(--charcoal)' : '#FFFFFF';
  };

  // Memoize computed values for performance
  const ownBooksSeries = useMemo(() => 
    state.storefront?.bookSeries.find(series => series.isOwnBooks),
    [state.storefront?.bookSeries]
  );

  const otherBookSeries = useMemo(() => 
    state.storefront?.bookSeries.filter(series => !series.isOwnBooks) || [],
    [state.storefront?.bookSeries]
  );

  const heroBackgroundColor = useMemo(() => 
    state.storefront?.colors?.heroBackground || state.storefront?.colors?.accent || '#A0CEC8',
    [state.storefront?.colors]
  );

  const accentColor = useMemo(() => 
    state.storefront?.colors?.accent || '#A0CEC8',
    [state.storefront?.colors]
  );

  // Calculate text color based on background
  const textColorOnHero = useMemo(() => 
    state.storefront?.textColors?.onHeroBackground || getContrastColor(heroBackgroundColor),
    [state.storefront?.textColors?.onHeroBackground, heroBackgroundColor]
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    async function loadStorefront() {
      if (!storefrontId) return;
      
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: '' });

        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
          `${API_BASE}/storefronts/${storefrontId}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(t('storefront.notFound'));
        }

        const data = await response.json();

        if (data.ok && data.data && isMounted) {
          const sf = data.data;
          const storefront: Storefront = {
            id: sf.id,
            name: sf.name || sf.curator?.name || '',
            tagline: sf.tagline || '',
            description: sf.description || sf.curator?.bio || '',
            logoUrl: sf.logo_url || sf.curator?.avatar || '',
            colors: {
              primary: sf.color_scheme?.primary || '#247ba0',
              secondary: sf.color_scheme?.secondary || '#f7f4ef',
              background: sf.color_scheme?.background || '#f7f4ef',
              accent: sf.color_scheme?.accent || '#70c1b3',
              heroBackground: sf.color_scheme?.heroBackground || '#0B1F33',
              carouselBackground: sf.color_scheme?.carouselBackground || '#f7f4ef',
              contentBackground: sf.color_scheme?.contentBackground || '#ffffff',
              contentText: sf.color_scheme?.contentText || '#2a2a2a',
            },
            books: [],
            bookSeries: (sf.bookSeries || []).map((s: any) => ({
              id: s.id,
              type: s.type || 'static',
              title: s.title || '',
              description: s.description || '',
              reason: s.reason || '',
              occasion: s.occasion || '',
              books: (s.books || []).map((b: any) => ({
                id: b.id,
                title: b.title || '',
                author: b.author || '',
                cover: b.cover || b.cover_url || '',
                description: b.description || '',
                price: b.price || '',
              })),
              sortOrder: s.sortOrder || 'popular',
              isOwnBooks: s.isOwnBooks || false,
            })),
            creatorFocus: sf.curator?.focus || '',
            creatorBio: sf.curator?.bio || '',
            socialMedia: sf.curator?.socialMedia || sf.social_media || {},
          };
          dispatch({ type: 'SET_STOREFRONT', payload: storefront });
        } else {
          throw new Error(t('storefront.notFound'));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          if (isMounted) {
            dispatch({ type: 'SET_ERROR', payload: 'Der Bookstore lädt zu lange. Bitte versuche es später erneut.' });
          }
          return;
        }
        if (isMounted) {
          dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : t('storefront.loadError') });
        }
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    }

    loadStorefront();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [storefrontId]);

  // PERFORMANCE: Filter events with useMemo
  const filteredEvents = useMemo(() => {
    return state.events.filter((event) => {
      const typeMatch = state.selectedEventType === 'Alle' || event.type === state.selectedEventType;
      const locationMatch = 
        state.selectedEventLocation === 'Alle' ||
        (state.selectedEventLocation === 'Online' && event.isOnline) ||
        (state.selectedEventLocation === 'Live' && !event.isOnline);
      
      // Only show upcoming events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event.date);
      const isFuture = eventDate >= today;

      return typeMatch && locationMatch && isFuture;
    });
  }, [state.events, state.selectedEventType, state.selectedEventLocation]);

  // Scroll carousel with useCallback
  const scrollEventsCarousel = useCallback((direction: 'left' | 'right') => {
    if (!eventsCarouselRef.current) return;
    
    const scrollAmount = 400;
    const newScrollLeft = direction === 'left' 
      ? eventsCarouselRef.current.scrollLeft - scrollAmount
      : eventsCarouselRef.current.scrollLeft + scrollAmount;
    
    eventsCarouselRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  }, []);

  // Track scroll position with throttling (200ms for better performance)
  useEffect(() => {
    const carousel = eventsCarouselRef.current;
    if (!carousel) return;

    // PERFORMANCE: Throttle scroll event to 200ms (5 checks per second max)
    const handleScroll = throttle(() => {
      dispatch({ type: 'SET_EVENTS_SCROLL', payload: carousel.scrollLeft });
    }, 200);

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-elevated">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-teal-light" />
          <p className="text-foreground">Lade Bookstore...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-elevated">
        <div className="text-center max-w-md">
          <h1 
            className="text-3xl mb-4"
            style={{ fontFamily: 'Fjalla One', color: 'var(--charcoal)' }}
          >
            BOOKSTORE NICHT GEFUNDEN
          </h1>
          <p className="mb-6 text-foreground" style={{ opacity: 0.7 }}>
            {state.error || t('storefront.doesNotExist')}
          </p>
          <a 
            href="/"
            className="inline-block px-6 py-3 rounded-lg transition-colors bg-teal text-white hover:bg-teal/90"
          >
            Zur Startseite
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <InfoBar />
      <Header 
        isHomePage={false}
        backgroundColor={heroBackgroundColor}
        textColor={textColorOnHero}
      />
      <div className="min-h-screen bg-surface-elevated">
        {/* Hero Section */}
        <section className="pb-0 pt-16 px-8 bg-surface-elevated">
          <div className="max-w-7xl mx-auto">
            {/* Centered Hero Layout with colored background */}
            <div className="relative">
              {/* Colored Hero Background */}
              <div 
                className="relative pt-0 pb-16 px-8 -mx-8 w-screen overflow-hidden"
                style={{ 
                  marginLeft: 'calc(-50vw + 50%)',
                  marginTop: '-64px',
                  paddingTop: '80px',
                  background: `linear-gradient(135deg, ${heroBackgroundColor} 0%, ${heroBackgroundColor} 100%)`
                }}
              >
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
                    {/* Round Avatar */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-xl ring-4 ring-white/30">
                        {state.storefront.logoUrl ? (
                          <ImageWithFallback
                            src={state.storefront.logoUrl}
                            alt={state.storefront.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/20">
                            <span className="text-5xl" style={{ fontFamily: 'Fjalla One', color: textColorOnHero }}>
                              {state.storefront.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Text and Video */}
                    <div className="flex-1 flex flex-col lg:flex-row items-start gap-8 w-full">
                      {/* Creator Info */}
                      <div className="flex-1 text-center md:text-left w-full">
                        {/* Creator Name */}
                        <h1 
                          className="text-[36px] md:text-[48px] leading-tight mb-2"
                          style={{ fontFamily: 'Fjalla One', color: textColorOnHero, letterSpacing: '0.02em' }}
                        >
                          {state.storefront.name}
                        </h1>

                        {/* Bio Section - Above Social Links */}
                        <div className="mb-6 space-y-2 text-center md:text-left" style={{ color: textColorOnHero }}>
                          {state.storefront.description ? (
                            state.storefront.description.split('\n\n').map((paragraph, index) => (
                              <p key={index} className="text-sm leading-relaxed font-bold">{paragraph}</p>
                            ))
                          ) : (
                            <p className="text-sm leading-relaxed">{state.storefront.description}</p>
                          )}
                        </div>

                        {/* Social Links & Focus Badge Row */}
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                          {/* Social Links */}
                          {state.storefront.socialMedia && (
                            <div className="flex items-center gap-3">
                              {state.storefront.socialMedia.youtube && (
                                <a href={state.storefront.socialMedia.youtube} target="_blank" rel="noopener noreferrer">
                                  <button
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-lg"
                                    style={{ borderColor: textColorOnHero, color: textColorOnHero }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = textColorOnHero;
                                      e.currentTarget.style.color = heroBackgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = textColorOnHero;
                                    }}
                                  >
                                    <Youtube className="w-5 h-5" />
                                  </button>
                                </a>
                              )}
                              {state.storefront.socialMedia.twitter && (
                                <a href={state.storefront.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                                  <button
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-lg"
                                    style={{ borderColor: textColorOnHero, color: textColorOnHero }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = textColorOnHero;
                                      e.currentTarget.style.color = heroBackgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = textColorOnHero;
                                    }}
                                  >
                                    <Twitter className="w-5 h-5" />
                                  </button>
                                </a>
                              )}
                              {state.storefront.socialMedia.podcast && (
                                <a href={state.storefront.socialMedia.podcast} target="_blank" rel="noopener noreferrer">
                                  <button
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-lg"
                                    style={{ borderColor: textColorOnHero, color: textColorOnHero }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = textColorOnHero;
                                      e.currentTarget.style.color = heroBackgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = textColorOnHero;
                                    }}
                                  >
                                    <Podcast className="w-5 h-5" />
                                  </button>
                                </a>
                              )}
                              {state.storefront.socialMedia.instagram && (
                                <a href={state.storefront.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                                  <button
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-lg"
                                    style={{ borderColor: textColorOnHero, color: textColorOnHero }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = textColorOnHero;
                                      e.currentTarget.style.color = heroBackgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = textColorOnHero;
                                    }}
                                  >
                                    <Instagram className="w-5 h-5" />
                                  </button>
                                </a>
                              )}
                              {state.storefront.socialMedia.linkedin && (
                                <a href={state.storefront.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                                  <button
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-lg"
                                    style={{ borderColor: textColorOnHero, color: textColorOnHero }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = textColorOnHero;
                                      e.currentTarget.style.color = heroBackgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = textColorOnHero;
                                    }}
                                  >
                                    <Linkedin className="w-5 h-5" />
                                  </button>
                                </a>
                              )}
                              {state.storefront.socialMedia.website && (
                                <a href={state.storefront.socialMedia.website} target="_blank" rel="noopener noreferrer">
                                  <button
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-lg"
                                    style={{ borderColor: textColorOnHero, color: textColorOnHero }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = textColorOnHero;
                                      e.currentTarget.style.color = heroBackgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = textColorOnHero;
                                    }}
                                  >
                                    <Globe className="w-5 h-5" />
                                  </button>
                                </a>
                              )}
                              
                              {/* Follow Heart Button - REMOVED */}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Intro Video */}
                      {state.storefront.introVideo && (
                        <div className="w-full lg:w-[420px] flex-shrink-0">
                          <div className="rounded-lg overflow-hidden shadow-xl ring-4 ring-white/20">
                            <VideoEmbed url={state.storefront.introVideo} className="aspect-video" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Genre Carousel Section - Was möchtest du lesen? */}
        <GenreCarouselSection backgroundColor={heroBackgroundColor} titleColor={textColorOnHero} />

        {/* Meine Veröffentlichungen Section */}
        {state.storefront.books.length > 0 && (
          <section className="py-0" style={{ backgroundColor: state.storefront.colors?.heroBackground || '#70c1b3' }}>
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                title={`Meine Veröffentlichungen (${state.storefront.books.length})`}
                backgroundColor={state.storefront.colors?.heroBackground || '#70c1b3'}
                textColor={textColorOnHero}
              />
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-12 scrollbar-hide overscroll-x-contain">
                {state.storefront.books.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book as any} 
                    cardBackgroundColor="transparent"
                    textColor={textColorOnHero}
                    iconColor={textColorOnHero}
                    sectionBackgroundColor={state.storefront!.colors?.heroBackground || '#70c1b3'}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Veranstaltungen Preview Section - Shows upcoming events */}
        {filteredEvents.length > 0 && (
          <CreatorEventsSection 
            creatorName={state.storefront.name}
            creatorImage={state.storefront.logoUrl || ''}
            events={filteredEvents.slice(0, 4) as any}
            backgroundColor={heroBackgroundColor as any}
          />
        )}

        {/* Eigene Bücher Section - First series with isOwnBooks */}
        {ownBooksSeries && (
          <CreatorCarousel
            key={ownBooksSeries.id}
            creatorAvatar={state.storefront.logoUrl || ''}
            creatorName={state.storefront.name}
            creatorFocus={state.storefront.creatorFocus || ''}
            creatorBio={state.storefront.creatorBio}
            creatorWebsiteUrl={state.storefront.socialMedia?.website}
            occasion={ownBooksSeries.title}
            curationReason={ownBooksSeries.reason || ownBooksSeries.description}
            showSocials={false}
            books={ownBooksSeries.books.map((book, bookIndex) => {
              const mappedBook = {
                id: `${ownBooksSeries.id}-book-${bookIndex}-${book.id}`,
                title: book.title,
                author: book.author,
                price: book.price,
                cover: book.cover,
                publisher: book.publisher,
                year: book.year,
                // ONIX TextType 02 (Short Description) -> Fallback to klappentext or generate
                shortDescription: (book as any).shortDescription || (book as any).klappentext || `Ein faszinierendes Werk von ${book.author}. ${book.title} bietet einen einzigartigen Blick auf das Thema und lädt zum Nachdenken ein.`
              };
              
              return mappedBook;
            })}
            showCta={false}
            backgroundColor={(state.storefront!.colors?.carouselBackground || '#FFFFFF') as any}
          />
        )}

        {/* Medien & Buch Section - AUSGEBLENDET */}
        {/* <MediaAndBooksSection storefront={state.storefront} /> */}

        {/* Weitere Kategorien Section */}
        <GenreCategoriesSection />

        {/* Content Tabs */}
        <ContentTabs 
          activeTab={state.activeTab} 
          onTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })} 
          accentColor={heroBackgroundColor}
        />

        {/* Bücher Tab - Use heroBackground color */}
        {state.activeTab === 'bücher' && (
          <div style={{ backgroundColor: heroBackgroundColor }}>
            {/* Book Series as CreatorCarousel - exclude isOwnBooks series */}
            {otherBookSeries.map((series, seriesIndex) => (
              <CreatorCarousel
                key={series.id}
                creatorAvatar={state.storefront!.logoUrl || ''}
                creatorName={state.storefront!.name}
                creatorFocus={state.storefront!.creatorFocus || ''}
                creatorBio={state.storefront!.creatorBio}
                creatorWebsiteUrl={state.storefront!.socialMedia?.website}
                occasion={series.title}
                curationReason={series.reason || series.description}
                showSocials={false}
                books={series.books.map((book, bookIndex) => ({
                  id: `${series.id}-book-${bookIndex}-${book.id}`,
                  title: book.title,
                  author: book.author,
                  price: book.price,
                  cover: book.cover,
                  publisher: book.publisher,
                  year: book.year,
                  shortDescription: (book as any).shortDescription || (book as any).klappentext || `Ein faszinierendes Werk von ${book.author}. ${book.title} bietet einen einzigartigen Blick auf das Thema und lädt zum Nachdenken ein.` // ONIX TextType 02
                }))}
                showCta={false}
                sectionBackgroundColor={heroBackgroundColor}
                bookCardBgColor="transparent"
                textColor={textColorOnHero}
                iconColor={textColorOnHero}
                applyBackgroundToContent={true}
              />
            ))}

            {/* Empty State */}
            {state.storefront.books.length === 0 && state.storefront.bookSeries.length === 0 && (
              <section className="py-16 px-8" style={{ backgroundColor: heroBackgroundColor }}>
                <div className="max-w-7xl mx-auto text-center">
                  <p className="mb-2" style={{ color: textColorOnHero, opacity: 0.7 }}>
                    {t('storefront.noBooksYet')}
                  </p>
                  <p className="text-sm" style={{ color: textColorOnHero, opacity: 0.5 }}>
                    {t('storefront.noBooksDescription')}
                  </p>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Rezensionen Tab - Use heroBackground color */}
        {state.activeTab === 'rezensionen' && (
          <section className="py-0" style={{ backgroundColor: heroBackgroundColor }}>
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                title={`Rezensionen von ${state.storefront.name}`}
                backgroundColor={heroBackgroundColor}
                textColor={state.storefront.textColors?.onHeroBackground || '#FFFFFF'}
              />
              <div className="py-16 text-center">
                <p className="mb-2" style={{ color: state.storefront.textColors?.onHeroBackground || '#FFFFFF', opacity: 0.7 }}>
                  Noch keine Rezensionen verfügbar
                </p>
                <p className="text-sm" style={{ color: state.storefront.textColors?.onHeroBackground || '#FFFFFF', opacity: 0.5 }}>
                  Rezensionen werden bald hinzugefügt
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Bonusinhalte Tab */}
        {state.activeTab === 'bonusinhalte' && (
          <BonusContentSection storefront={state.storefront} />
        )}

        {/* Veranstaltungen Tab */}
        {state.activeTab === 'veranstaltungen' && (
          <>
            {filteredEvents.length > 0 ? (
              <section className="py-16 px-8" style={{ backgroundColor: heroBackgroundColor }}>
                <div className="max-w-7xl mx-auto">
                  <div className="mb-8">
                    <h2 
                      className="text-[var(--charcoal)] mb-3 leading-tight"
                      style={{ 
                        fontFamily: 'Fjalla One',
                        fontSize: '2.25rem',
                        letterSpacing: '0.02em'
                      }}
                    >
                      ANSTEHENDE VERANSTALTUNGEN
                    </h2>
                    <p className="text-[var(--charcoal)]/70 max-w-2xl" style={{ fontSize: '1rem' }}>
                      Kommende Events von {state.storefront.name}
                    </p>
                  </div>

                  {/* Filter Buttons */}
                  <div className="mb-8 space-y-4">
                    {/* Event Type Filter */}
                    <div>
                      <p className="text-[var(--charcoal)]/70 text-sm mb-2">Art der Veranstaltung</p>
                      <div className="flex flex-wrap gap-2">
                        {['Alle', 'Lesung', 'Podcast Live', 'Panel', 'Livestream', 'Buchveröffentlichung'].map((type) => (
                          <DSTag
                            key={type}
                            onClick={() => dispatch({ type: 'SET_EVENT_TYPE', payload: type })}
                            active={state.selectedEventType === type}
                          >
                            {type === 'Alle' ? t('storefront.allCategory') : type}
                          </DSTag>
                        ))}
                      </div>
                    </div>

                    {/* Location Type Filter */}
                    <div>
                      <p className="text-[var(--charcoal)]/70 text-sm mb-2">Ort</p>
                      <div className="flex flex-wrap gap-2">
                        {['Alle', 'Live', 'Online'].map((location) => (
                          <DSTag
                            key={location}
                            onClick={() => dispatch({ type: 'SET_EVENT_LOCATION', payload: location })}
                            active={state.selectedEventLocation === location}
                          >
                            {location === 'Alle' ? t('storefront.allCategory') : location}
                          </DSTag>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Events Carousel */}
                  <div className="relative">
                    {/* Fade-out effect on the right */}
                    <div className="absolute right-0 top-0 bottom-4 w-24 md:w-32 pointer-events-none z-10" style={{ background: `linear-gradient(to left, ${heroBackgroundColor}, transparent)` }}></div>
                    
                    {/* Navigation Buttons */}
                    {state.eventsScrollLeft > 0 && (
                      <button
                        onClick={() => scrollEventsCarousel('left')}
                        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 w-12 h-12 rounded-full items-center justify-center hover:scale-110 transition-all"
                        style={{ backgroundColor: '#1a1a1a', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 18l-6-6 6-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => scrollEventsCarousel('right')}
                      className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-12 h-12 rounded-full items-center justify-center hover:scale-110 transition-all"
                      style={{ backgroundColor: '#1a1a1a', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18l6-6-6-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Scrollable Container */}
                    <div 
                      ref={eventsCarouselRef}
                      className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 overscroll-x-contain"
                      style={{ scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}
                    >
                      {filteredEvents.map((event) => (
                        <div 
                          key={event.id}
                          className="group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex-shrink-0 w-[360px]"
                          style={{ scrollSnapAlign: 'start' }}
                          onClick={() => event.registrationUrl && window.open(event.registrationUrl, '_blank')}
                        >
                          {event.image ? (
                            <div className="relative h-48 overflow-hidden">
                              <ImageWithFallback
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-4 left-4">
                                <span className="bg-[#0B1F33] text-white px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                                  {event.type}
                                </span>
                              </div>
                              {event.isOnline && (
                                <div className="absolute top-4 right-4">
                                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
                                    <Globe size={12} />
                                    Online
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative h-48 bg-gradient-to-br from-[#A0CEC8] to-[#5a9690] flex items-center justify-center">
                              <div className="absolute top-4 left-4">
                                <span className="bg-[#0B1F33] text-white px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                                  {event.type}
                                </span>
                              </div>
                              {event.isOnline && (
                                <div className="absolute top-4 right-4">
                                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
                                    <Globe size={12} />
                                    Online
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-start gap-3 mb-3">
                              {state.storefront!.logoUrl && (
                                <ImageWithFallback
                                  src={state.storefront!.logoUrl}
                                  alt={state.storefront!.name}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                                  {state.storefront!.name}
                                </p>
                                <p className="text-xs text-[var(--charcoal)]/60">
                                  {new Date(event.date).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                  {event.time && ` • ${event.time}`}
                                </p>
                              </div>
                            </div>
                            <h3 className="text-[var(--charcoal)] mb-2 leading-tight" style={{ fontFamily: 'Fjalla One', fontSize: '20px', letterSpacing: '0.01em' }}>
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="text-[var(--charcoal)]/70 text-sm mb-3 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            {event.location && (
                              <p className="text-[var(--charcoal)]/70 text-sm">
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="py-16 px-8" style={{ backgroundColor: '#F5F5F0' }}>
                <div className="max-w-7xl mx-auto text-center">
                  <p className="mb-2" style={{ color: 'var(--charcoal)', opacity: 0.7 }}>
                    Noch keine Veranstaltungen geplant
                  </p>
                  <p className="text-sm" style={{ color: 'var(--charcoal)', opacity: 0.5 }}>
                    Veranstaltungen werden bald hinzugefügt
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        {/* Support Section */}
        <SupportSection 
          creatorName={state.storefront.name}
          backgroundColor={heroBackgroundColor}
        />
      </div>
      <Footer />
    </>
  );
});