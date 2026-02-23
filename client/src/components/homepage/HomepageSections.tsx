import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import { BookCarousel } from './BookCarousel';
import { CreatorCarousel } from '../creator/CreatorCarousel';
import { CuratedListCard } from './CuratedListCard';
import { StorefrontCard } from './StorefrontCard';
import { SupportersSection } from './SupportersSection';
import { EventCard } from '../events/EventCard';
import { TopicTag } from './TopicTag';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { scrollCarousel, SCROLL_AMOUNTS } from '../../utils/carousel-helpers';
import { Section, Container, Heading, Text } from '../ui';
import { Book, Event, Storefront, DiverseList, Topic, CarouselRefs } from '../../types/homepage';
import { ScrollSection } from './ScrollSection';
import { SectionHeader } from './SectionHeader';
import { GenreCategoriesSection } from '../tags/GenreCategoriesSection';

interface HomepageSectionsProps {
  newBooks: Book[];
  queerBooks: Book[];
  debutBooks: Book[];
  translations: Book[];
  storefronts: Storefront[];
  diverseLists: DiverseList[];
  topics: Topic[];
  filteredEvents: Event[];
  selectedEventType: string;
  selectedEventLocation: string;
  setSelectedEventType: (type: string) => void;
  setSelectedEventLocation: (location: string) => void;
  refs: CarouselRefs;
}

const EVENT_TYPE_KEYS: Record<string, string> = {
  'Alle': 'homepage.eventTypes.all',
  'Lesung': 'homepage.eventTypes.reading',
  'Workshop': 'homepage.eventTypes.workshop',
  'Diskussion': 'homepage.eventTypes.discussion',
  'Panel': 'homepage.eventTypes.panel',
  'Livestream': 'homepage.eventTypes.livestream',
  'Podcast Live-Episode': 'homepage.eventTypes.podcastLive',
};

const LOCATION_TYPE_KEYS: Record<string, string> = {
  'Alle': 'homepage.locationTypes.all',
  'Online': 'homepage.locationTypes.online',
  'Live': 'homepage.locationTypes.live',
};

export function HomepageSections({
  newBooks,
  queerBooks,
  debutBooks,
  translations,
  storefronts,
  diverseLists,
  topics,
  filteredEvents,
  selectedEventType,
  selectedEventLocation,
  setSelectedEventType,
  setSelectedEventLocation,
  refs
}: HomepageSectionsProps) {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();

  return (
    <>
      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400"
            creatorName={t('homepage.editorialTeam')}
            creatorFocus={t('homepage.newBooks')}
            occasion=""
            curationReason={t('homepage.newBooksReason')}
            showSocials={false}
            showHeader={true}
            books={newBooks}
            category={t('homepage.newBooks')}
            showCta={false}
            backgroundColor="white"
            sectionBackgroundColor="transparent"
            bookCardBgColor="beige"
            applyBackgroundToContent={false}
            isStorefront={false}
            showVideo={false}
            useEditorialLayout={true}
          />
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
            creatorName={t('homepage.editorialTeam')}
            creatorFocus={t('homepage.queerFocus')}
            occasion=""
            curationReason={t('homepage.queerReason')}
            showSocials={false}
            showHeader={true}
            books={queerBooks}
            category={t('homepage.queerCategory')}
            showCta={false}
            backgroundColor="white"
            sectionBackgroundColor="transparent"
            bookCardBgColor="beige"
            applyBackgroundToContent={false}
            isStorefront={false}
            showVideo={false}
            useEditorialLayout={true}
          />
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
            creatorName={t('homepage.editorialTeam')}
            creatorFocus={t('homepage.debutFocus')}
            occasion=""
            curationReason={t('homepage.debutReason')}
            showSocials={false}
            showHeader={true}
            books={debutBooks}
            category={t('homepage.debutCategory')}
            showCta={false}
            backgroundColor="white"
            sectionBackgroundColor="transparent"
            bookCardBgColor="beige"
            applyBackgroundToContent={false}
            isStorefront={false}
            showVideo={false}
            useEditorialLayout={true}
          />
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
            creatorName={t('homepage.editorialTeam')}
            creatorFocus={t('homepage.translationsFocus')}
            occasion=""
            curationReason={t('homepage.translationsReason')}
            showSocials={false}
            showHeader={true}
            books={translations}
            category={t('homepage.translationsCategory')}
            showCta={false}
            backgroundColor="white"
            sectionBackgroundColor="transparent"
            bookCardBgColor="beige"
            applyBackgroundToContent={false}
            isStorefront={false}
            showVideo={false}
            useEditorialLayout={true}
          />
        </div>
      </section>

      {storefronts.length > 0 && (
        <ScrollSection
          id="storefronts"
          title={t('homepage.storefrontsTitle')}
          subtitle={t('homepage.storefrontsSubtitle')}
          carouselRef={refs.storefrontsCarouselRef}
          scrollAmount={SCROLL_AMOUNTS.STOREFRONT}
        >
          <div className="flex gap-6">
            {storefronts.map(storefront => (
              <StorefrontCard 
                key={storefront.id} 
                {...storefront}
                onNavigate={() => navigate(`/creator/${storefront.id}`)}
              />
            ))}
          </div>
        </ScrollSection>
      )}

      {filteredEvents.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title={t('homepage.eventsTitle')}
              subtitle={t('homepage.eventsSubtitle')}
            />
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex flex-wrap gap-2">
                {['Alle', 'Lesung', 'Workshop', 'Diskussion', 'Panel', 'Livestream', 'Podcast Live-Episode'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedEventType(type)}
                    className="filter-chip-coral text-sm font-medium"
                    aria-pressed={selectedEventType === type}
                    aria-label={t('homepage.filterBy', { type: t(EVENT_TYPE_KEYS[type] || type) })}
                  >
                    {type === 'Alle' ? t('homepage.allTypes') : t(EVENT_TYPE_KEYS[type] || type)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {['Alle', 'Online', 'Live'].map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => setSelectedEventLocation(location)}
                    className="filter-chip-coral text-sm font-medium"
                    aria-pressed={selectedEventLocation === location}
                    aria-label={t('homepage.filterBy', { type: t(LOCATION_TYPE_KEYS[location] || location) })}
                  >
                    {location === 'Alle' ? t('homepage.allLocations') : location === 'Live' ? t('homepage.onSite') : t(LOCATION_TYPE_KEYS[location] || location)}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                ref={refs.eventsCarouselRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-proximity md:snap-mandatory overscroll-x-contain"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {filteredEvents.map(event => (
                  <div key={event.id} className="snap-start shrink-0">
                    <EventCard {...event} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollCarousel(refs.eventsCarouselRef, 'left', SCROLL_AMOUNTS.EVENT)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-background dark:bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground hover:dark:bg-background transition-colors z-10"
                aria-label={t('homepage.previousEvents')}
              >
                <ChevronLeft className="w-6 h-6 text-foreground dark:text-background" />
              </button>
              <button
                onClick={() => scrollCarousel(refs.eventsCarouselRef, 'right', SCROLL_AMOUNTS.EVENT)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-background dark:bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground hover:dark:bg-background transition-colors z-10"
                aria-label={t('homepage.nextEvents')}
              >
                <ChevronRight className="w-6 h-6 text-foreground dark:text-background" />
              </button>
            </div>
          </div>
        </section>
      )}

      <GenreCategoriesSection />

      <SupportersSection />
    </>
  );
}
