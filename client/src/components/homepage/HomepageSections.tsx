import { useSafeNavigate } from '../../utils/routing';
import { BookCarousel } from './BookCarousel';
import { CreatorCarousel } from '../CreatorCarousel';
import { CuratedListCard } from './CuratedListCard';
import { StorefrontCard } from './StorefrontCard';
import { SupportersSection } from './SupportersSection';
import { EventCard } from '../EventCard';
import { TopicTag } from './TopicTag';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { scrollCarousel, SCROLL_AMOUNTS } from '../../utils/carousel-helpers';
import { Section, Container, Heading, Text } from '../ui'; // ✅ FIXED: UISection → Section
import { Book, Event, Storefront, DiverseList, Topic, CarouselRefs } from '../../types/homepage';
import { ScrollSection } from './ScrollSection';
import { SectionHeader } from './SectionHeader';
import { GenreCategoriesSection } from '../GenreCategoriesSection';
// ❌ REMOVED: HowItWorksSection - Component does not exist

/**
 * HomepageSections - Alle weiteren Sektionen der Homepage
 * (nach Hero, Categories und Curator Section)
 */

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
  const navigate = useSafeNavigate();

  return (
    <>
      {/* Neue Bücher Section */}
      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400"
            creatorName="coratiert Redaktion"
            creatorFocus="Neue Bücher"
            occasion=""
            curationReason="Frisch erschienen und handverlesen"
            showSocials={false}
            showHeader={true}
            books={newBooks}
            category="Neue Bücher"
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

      {/* Queere Bücher Section */}
      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
            creatorName="coratiert Redaktion"
            creatorFocus="LGBTQIA+ Literatur"
            occasion=""
            curationReason="LGBTQIA+ Geschichten, die bewegen"
            showSocials={false}
            showHeader={true}
            books={queerBooks}
            category="Queere Perspektiven"
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

      {/* Debut Bücher Section */}
      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
            creatorName="coratiert Redaktion"
            creatorFocus="Debüt-Literatur"
            occasion=""
            curationReason="Erste Werke vielversprechender Autor*innen"
            showSocials={false}
            showHeader={true}
            books={debutBooks}
            category="Spannende Debüts"
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

      {/* Übersetzungen Section */}
      <section>
        <div className="max-w-7xl mx-auto">
          <CreatorCarousel
            creatorAvatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
            creatorName="coratiert Redaktion"
            creatorFocus="Internationale Literatur"
            occasion=""
            curationReason="Weltliteratur in deutscher Übersetzung"
            showSocials={false}
            showHeader={true}
            books={translations}
            category="Aus aller Welt"
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

      {/* Creator Storefronts Section */}
      {storefronts.length > 0 && (
        <ScrollSection
          id="storefronts"
          title="Creator Storefronts"
          subtitle="Entdecke kuratierte Buchläden von Expert*innen"
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

      {/* Events Section */}
      {filteredEvents.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Literarische Events"
              subtitle="Lesungen, Diskussionen und Workshops"
            />
            
            {/* Event Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              {/* Event Type Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {['Alle', 'Lesung', 'Workshop', 'Diskussion', 'Panel', 'Livestream', 'Podcast Live-Episode'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedEventType(type)}
                    className="filter-chip-coral text-sm font-medium"
                    aria-pressed={selectedEventType === type}
                    aria-label={`Filter nach ${type}`}
                  >
                    {type === 'Alle' ? 'Alle Typen' : type}
                  </button>
                ))}
              </div>

              {/* Location Type Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {['Alle', 'Online', 'Live'].map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => setSelectedEventLocation(location)}
                    className="filter-chip-coral text-sm font-medium"
                    aria-pressed={selectedEventLocation === location}
                    aria-label={`Filter nach ${location}`}
                  >
                    {location === 'Alle' ? 'Alle Orte' : location === 'Live' ? 'Vor Ort' : location}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Carousel */}
            <div className="relative">
              <div
                ref={refs.eventsCarouselRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredEvents.map(event => (
                  <div key={event.id} className="snap-start shrink-0">
                    <EventCard {...event} />
                  </div>
                ))}
              </div>

              {/* Scroll Arrows */}
              <button
                onClick={() => scrollCarousel(refs.eventsCarouselRef, 'left', SCROLL_AMOUNTS.EVENT)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-background dark:bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground hover:dark:bg-background transition-colors z-10"
                aria-label="Vorherige Events"
              >
                <ChevronLeft className="w-6 h-6 text-foreground dark:text-background" />
              </button>
              <button
                onClick={() => scrollCarousel(refs.eventsCarouselRef, 'right', SCROLL_AMOUNTS.EVENT)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-background dark:bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground hover:dark:bg-background transition-colors z-10"
                aria-label="Nächste Events"
              >
                <ChevronRight className="w-6 h-6 text-foreground dark:text-background" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Medien & Buch Section */}
      <GenreCategoriesSection />

      {/* Supporters Section */}
      <SupportersSection />
    </>
  );
}