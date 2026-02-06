import React, { useState, useEffect, useMemo } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Header } from '../layout/Header';
import { InfoBar } from '../layout/InfoBar';
import { Footer } from '../layout/Footer';
import { CreatorHeader } from './CreatorHeader';
import { ContentTabs } from '../common/ContentTabs';
import { BookCard } from '../book/BookCard';
import { CreatorEventsSection } from './CreatorEventsSection';
import { GenreCarouselSection } from '../carousel/GenreCarouselSection';
import { DSSectionHeader, DSCarousel, DSGenreCard } from './design-system';
import { Loader2 } from 'lucide-react';
import { EventCard } from '../events/EventCard';
import { Container } from '../ui/container';
import { Section } from '../ui/section';
import { Heading, Text } from '../ui/typography';

// Import Author-specific modules
import {
  CommunitySectionModule,
  BookClubSectionModule,
  BonusExtrasModule,
  SupportMemberModule,
  NewsletterModule,
  FAQModule
} from './storefront-modules';

// Event Type Mapping (EventsPage compatible)
type EventTypeLabel = 
  | 'Buchsignierung'
  | 'Lesung' 
  | 'Podcast Live-Episode' 
  | 'Livestream' 
  | 'Panel' 
  | 'Buchveröffentlichung'
  | 'Workshop'
  | 'Seminar';

// Re-use types from PublicStorefront
interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  price: string;
}

interface BookSeries {
  id: string;
  type: 'static' | 'dynamic';
  title: string;
  description: string;
  reason?: string;
  books: Book[];
  sortOrder: 'popular' | 'newest' | 'az' | 'rating';
  isOwnBooks?: boolean;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
  heroBackground?: string;
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

interface Event {
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
}

interface AuthorStorefrontData {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  colors: ColorScheme;
  books: Book[];
  bookSeries: BookSeries[];
  socialMedia?: SocialMedia;
  introVideo?: string;
  // Author-specific fields
  authorBio?: string;
  isVerified?: boolean;
}

const API_BASE = '/api';

type AuthorStorefrontState = {
  storefront: AuthorStorefrontData | null;
  loading: boolean;
  error: string;
  activeTab: 'bücher' | 'rezensionen' | 'veranstaltungen' | 'bonusinhalte';
  events: Event[];
};

type AuthorStorefrontAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_STOREFRONT'; payload: AuthorStorefrontData }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'SET_ACTIVE_TAB'; payload: 'bücher' | 'rezensionen' | 'veranstaltungen' | 'bonusinhalte' };

const initialState: AuthorStorefrontState = {
  storefront: null,
  loading: true,
  error: '',
  activeTab: 'bücher',
  events: []
};

function authorStorefrontReducer(state: AuthorStorefrontState, action: AuthorStorefrontAction): AuthorStorefrontState {
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
    default:
      return state;
  }
}

export function AuthorStorefront({ authorId }: { authorId: string }) {
  const navigate = useSafeNavigate();
  const [state, dispatch] = useReducer(authorStorefrontReducer, initialState);

  // Fetch storefront data
  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })        
        const response = await fetch(`${API_BASE}/storefront/${encodeURIComponent(authorId)}`, {
          headers: {
          }
        });

        if (!response.ok) {
          throw new Error('Storefront nicht gefunden');
        }

        const data = await response.json();
        dispatch({ type: 'SET_STOREFRONT', payload: data });

        // Fetch events
        const eventsResponse = await fetch(`${API_BASE}/events?storefrontSlug=${encodeURIComponent(authorId)}`, {
          headers: {
          }
        });

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          dispatch({ type: 'SET_EVENTS', payload: eventsData });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Inhalte konnten nicht geladen werden' });
      }
    };

    fetchStorefront();
  }, [authorId]);

  const ownBooksSeries = useMemo(() => 
    state.storefront?.bookSeries.find(series => series.isOwnBooks),
    [state.storefront?.bookSeries]
  );

  const curatedSeries = useMemo(() => 
    state.storefront?.bookSeries.filter(series => !series.isOwnBooks) || [],
    [state.storefront?.bookSeries]
  );

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-[#247ba0]" aria-label="Lädt Inhalte" />
      </div>
    );
  }

  if (state.error || !state.storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="alert">
          <p className="text-xl mb-4" style={{ color: '#3A3A3A' }}>
            {state.error || 'Storefront nicht gefunden'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-[#247ba0] hover:underline"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  const { storefront, activeTab, events } = state;
  const heroBackgroundColor = storefront.colors.heroBackground || storefront.colors.primary;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <InfoBar />

      {/* Creator Header */}
      <CreatorHeader
        name={storefront.name}
        tagline={storefront.tagline}
        description={storefront.description}
        logoUrl={storefront.logoUrl}
        backgroundColor={heroBackgroundColor}
        socialMedia={storefront.socialMedia}
        introVideo={storefront.introVideo}
      />

      {/* Main Content */}
      <div 
        className="gradient-bg"
      >
        {/* Own Books Section */}
        {ownBooksSeries && ownBooksSeries.books.length > 0 && (
          <section className="py-16 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 
                className="mb-8"
                style={{ 
                  fontFamily: 'Fjalla One',
                  color: '#3A3A3A'
                }}
              >
                Bücher von {storefront.name}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {ownBooksSeries.books.map((book) => (
                  <BookCard key={book.id} {...book} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Content Tabs - Kurationen, Rezensionen, Veranstaltungen */}
        <ContentTabs
          activeTab={activeTab}
          onTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })}
        />

        {/* Tab Content */}
        {activeTab === 'bücher' && curatedSeries.length > 0 && (
          <section className="py-8 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-16">
              {curatedSeries.map((series) => (
                <div key={series.id}>
                  <h3 
                    className="mb-6"
                    style={{ 
                      fontFamily: 'Fjalla One',
                      color: '#3A3A3A'
                    }}
                  >
                    {series.title}
                  </h3>
                  {series.description && (
                    <p className="mb-6" style={{ color: '#666666' }}>
                      {series.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {series.books.map((book) => (
                      <BookCard key={book.id} {...book} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'veranstaltungen' && (
          <CreatorEventsSection
            events={events}
            creatorName={storefront.name}
          />
        )}

        {/* AUTHOR-SPECIFIC MODULES */}
        
        {/* Community Section */}
        <CommunitySectionModule
          authorName={storefront.name}
          backgroundColor="#FFFFFF"
          isPublic={false}
        />

        {/* Book Club Section */}
        <BookClubSectionModule
          authorName={storefront.name}
          currentBook={{
            cover: ownBooksSeries?.books[0]?.cover || '',
            title: ownBooksSeries?.books[0]?.title || 'Aktuelles Buch',
            author: storefront.name
          }}
          nextMeetingDate="15. Januar 2025"
          backgroundColor="#F5F5F5"
        />

        {/* Bonus Extras */}
        <BonusExtrasModule backgroundColor="#FFFFFF" />

        {/* Support/Member Section */}
        <SupportMemberModule
          authorName={storefront.name}
          backgroundColor="#F5F5F5"
        />

        {/* Newsletter */}
        <NewsletterModule
          authorName={storefront.name}
          backgroundColor="#FFFFFF"
        />

        {/* FAQ */}
        <FAQModule
          authorName={storefront.name}
          backgroundColor="#F5F5F5"
        />

        {/* Genre Carousel */}
        <GenreCarouselSection
          backgroundColor="#3A3A3A"
          titleColor="#FFFFFF"
        />

        {/* Weitere Genres Section */}
        <section className="py-12 px-4 md:px-8 bg-[#3A3A3A]">
          <div className="max-w-7xl mx-auto">
            <DSSectionHeader
              title="Weitere Genres entdecken"
              backgroundColor="#3A3A3A"
              titleColor="#FFFFFF"
            />
            
            <DSCarousel
              itemWidth={176}
              gap={16}
              showArrows={true}
              arrowColor="#FFFFFF"
              arrowBg="rgba(255, 255, 255, 0.1)"
            >
              <DSGenreCard label="Belletristik" image="https://images.unsplash.com/photo-1698954634383-eba274a1b1c7?w=800" onClick={() => navigate('/belletristik')} />
              <DSGenreCard label="Romane & Erzählungen" image="https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800" onClick={() => navigate('/romane-erzaehlungen')} />
              <DSGenreCard label="Krimis & Thriller" image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800" />
              <DSGenreCard label="Fantasy & Science Fiction" image="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800" />
              <DSGenreCard label="Liebesromane" image="https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800" />
            </DSCarousel>
          </div>
        </section>

        {/* Events Section */}
        {events.length > 0 && (
          <Section variant="default">
            <Container>
              <div className="space-y-8">
                <Heading level={2} className="text-center md:text-left">
                  Veranstaltungen von {storefront.name}
                </Heading>

                {/* Events Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" aria-label="Veranstaltungen">
                  {events.slice(0, 6).map(event => {
                    const eventType = (event.type as EventTypeLabel) || 'Lesung';
                    return (
                      <EventCard
                        key={event.id}
                        id={event.id}
                        title={event.title}
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        locationType={event.isOnline ? 'virtual' : 'physical'}
                        description={event.description}
                        eventType={eventType}
                        curatorName={storefront.name}
                        curatorImage={storefront.logoUrl}
                        curatorSlug={authorId}
                        curatorFocus={storefront.tagline}
                        websiteLink={event.registrationUrl}
                      />
                    );
                  })}
                </div>

                {/* Alle Events Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => navigate('/events')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-90 transition-all duration-200 ease-out relative overflow-hidden"
                    style={{
                      fontFamily: 'Fjalla One',
                      letterSpacing: '0.02em'
                    }}
                    aria-label="Zu allen Veranstaltungen navigieren"
                  >
                    <span className="relative z-10">Alle Events</span>
                  </button>
                </div>
              </div>
            </Container>
          </Section>
        )}
      </div>

      <Footer />
    </div>
  );
}