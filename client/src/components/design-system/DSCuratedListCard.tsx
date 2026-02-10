import React, { memo, useRef, useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, ChevronDown, Globe } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useFavorites } from '../favorites/FavoritesContext';
import { CoRatiertLogo } from '../common/CoRatiertLogo';
import { Text } from '../ui/typography';

interface DSCuratedListCardProps {
  // Legacy props (for backwards compatibility)
  title?: string;
  reason?: string;
  curator?: string;
  curatorAvatar?: string;
  curatorBio?: string;
  covers?: string[];
  onClick?: () => void;
  backgroundColor?: string;
  textColor?: string;
  
  // NEW PROPS from AllListsPage usage
  creatorAvatar?: string;
  creatorName?: string;
  creatorFocus?: string;
  occasion?: string;
  curationReason?: string;
  books?: Array<{
    id: number | string;
    cover: string;
    title: string;
    author: string;
    price?: string;
    publisher?: string;
    year?: string;
  }>;
  category?: string;
  showHeader?: boolean;
  showVideo?: boolean;
  videoThumbnail?: string;
  showCta?: boolean;
  sectionBackgroundColor?: string;
  applyBackgroundToContent?: boolean;
  isStorefront?: boolean;
  websiteUrl?: string;
  isAmbassador?: boolean;
}

/**
 * DSCuratedListCard - Kuratierte Listen Card im Book Carousel Section Layout
 * 
 * Layout: Grid mit Creator Info links und Bücher-Carousel rechts
 * - Links: Großes Avatar + Name + Focus + Bio + Curation Reason
 * - Rechts: Horizontales Bücher-Carousel mit Navigation
 * 
 * Entspricht dem Layout der CuratedBookSection/CreatorCarousel
 * 
 * @example
 * <DSCuratedListCard
 *   creatorName="Lisa Weber"
 *   creatorAvatar="..."
 *   creatorFocus="Feministische Literatur"
 *   occasion="Frauen erzählen"
 *   curationReason="Starke weibliche Stimmen..."
 *   books={[...]}
 * />
 */
export const DSCuratedListCard = memo(function DSCuratedListCard({
  // Legacy props
  title,
  reason,
  curator,
  curatorAvatar,
  curatorBio,
  covers,
  onClick,
  backgroundColor = 'transparent',
  textColor = 'var(--charcoal)',
  
  // New props
  creatorAvatar,
  creatorName,
  creatorFocus,
  occasion,
  curationReason,
  books,
  category,
  showHeader = true,
  showVideo = false,
  videoThumbnail,
  showCta = false,
  sectionBackgroundColor = 'transparent',
  applyBackgroundToContent = false,
  isStorefront = false,
  websiteUrl,
  isAmbassador = false
}: DSCuratedListCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // ✅ Normalize props (handle both old and new prop names)
  const displayOccasion = title || occasion || '';
  const displayCurationReason = reason || curationReason || '';
  const displayCreatorName = curator || creatorName || '';
  const displayCreatorAvatar = curatorAvatar || creatorAvatar;
  const displayCreatorFocus = creatorFocus || '';
  const displayCreatorBio = curatorBio || '';
  
  // Build book list from either covers or books
  const displayBooks = books || (covers ? covers.map((cover, i) => ({
    id: i,
    cover,
    title: '',
    author: '',
    price: ''
  })) : []);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      id: `curator-${displayCreatorName}`,
      type: 'creator',
      title: displayCreatorName,
      subtitle: displayCreatorFocus,
      image: displayCreatorAvatar,
    });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newPosition = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  const isCuratorFavorite = isFavorite(`curator-${displayCreatorName}`);
  const isAdSection = displayCreatorFocus.includes('ANZEIGE');

  return (
    <section className="py-6 md:py-8 w-full px-4">
      <div className="max-w-7xl mx-auto w-full">
        {/* Grid Layout: Creator Info (Left) + Books Carousel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 md:gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Creator Header */}
          <div className="flex flex-col gap-4">
            {/* Avatar + Name + Focus */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <ImageWithFallback
                    src={displayCreatorAvatar || ''}
                    alt={displayCreatorName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div 
                    className={`kuratorname flex items-center gap-1.5 ${
                      isAdSection ? 'text-white' : 'text-blue'
                    }`}
                  >
                    {displayCreatorName.toLowerCase().startsWith('coratiert') ? (
                      <>
                        <CoRatiertLogo size="md" />
                        <span className={isAdSection ? 'text-white' : 'text-blue'}>
                          {displayCreatorName.replace(/^coratiert\s*/i, '')}
                        </span>
                      </>
                    ) : (
                      displayCreatorName
                    )}
                  </div>
                  
                  <button
                    onClick={handleFavoriteClick}
                    className="flex-shrink-0 transition-transform hover:scale-110"
                    aria-label={isCuratorFavorite ? 'Nicht mehr folgen' : 'Folgen'}
                    title={isCuratorFavorite ? 'Nicht mehr folgen' : 'Folgen'}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isCuratorFavorite ? 'fill-blue text-blue' : 'text-blue'
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>

                  {isAmbassador && (
                    <Text 
                      as="span"
                      variant="xs"
                      className="font-headline px-2.5 py-1 rounded-full bg-charcoal text-white uppercase tracking-wider"
                    >
                      Ambassador
                    </Text>
                  )}
                </div>

                {/* Focus & Website */}
                <div className="flex flex-wrap items-center gap-x-2 mt-1">
                  <Text 
                    as="span"
                    variant="xs" 
                    className={isAdSection ? 'text-white' : 'text-foreground'}
                  >
                    {displayCreatorFocus.includes('ANZEIGE') ? (
                      <>
                        {displayCreatorFocus.split('ANZEIGE')[0]}
                        <span className="text-coral font-semibold">ANZEIGE</span>
                        {displayCreatorFocus.split('ANZEIGE')[1]}
                      </>
                    ) : (
                      displayCreatorFocus
                    )}
                  </Text>

                  {websiteUrl && (
                    <>
                      <Text as="span" variant="xs" className={isAdSection ? 'text-white/50' : 'text-foreground/50'}>
                        •
                      </Text>
                      <a 
                        href={websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline transition-all"
                      >
                        <Globe className="w-3 h-3" />
                        <Text 
                          as="span" 
                          variant="xs"
                          className={isAdSection ? 'text-white' : 'text-foreground'}
                        >
                          {websiteUrl.replace(/^https?:\/\//,'').replace(/\/$/,'')}
                        </Text>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Occasion (Title) */}
            {displayOccasion && (
              <div>
                <Text as="h3" variant="h3" className="text-foreground mb-2">
                  {displayOccasion}
                </Text>
              </div>
            )}

            {/* Curation Reason */}
            {displayCurationReason && (
              <div>
                <Text 
                  as="p" 
                  variant="small"
                  className="text-foreground/80 leading-relaxed"
                >
                  {displayCurationReason}
                </Text>
              </div>
            )}

            {/* Bio (collapsible) */}
            {displayCreatorBio && (
              <div className="mt-2">
                {showMoreInfo && (
                  <Text 
                    as="div"
                    variant="xs"
                    className={`font-normal leading-relaxed mb-2 ${isAdSection ? 'text-white' : 'text-foreground/80'}`}
                  >
                    {displayCreatorBio}
                  </Text>
                )}
                
                <button
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                  className="font-headline flex items-center gap-1 text-blue hover:text-blue hover:opacity-80 uppercase tracking-tight transition-colors"
                >
                  <Text as="span" variant="xs" className="text-blue">
                    {showMoreInfo ? 'Weniger' : 'Mehr Info'}
                  </Text>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showMoreInfo ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Books Carousel */}
          <div className="relative group">
            {/* Left Arrow */}
            <button
              onClick={() => scroll('left')}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-surface shadow-lg rounded-full p-3 transition-opacity hover:bg-[var(--color-brand-beige)] dark:hover:bg-surface-elevated items-center justify-center opacity-90 hover:opacity-100"
              aria-label="Nach links scrollen"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>

            {/* Scrollable Container */}
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-12 lg:px-12 overscroll-x-contain"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {displayBooks.map((book) => (
                <div key={book.id} className="flex-shrink-0 w-[117px]">
                  <div 
                    className="rounded-sm w-[117px] h-[156px] shadow-[4px_4px_8px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-transform hover:scale-105"
                    onClick={onClick}
                  >
                    <img 
                      src={book.cover} 
                      alt={book.title || ''}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {book.title && (
                    <div className="mt-2">
                      <Text as="p" variant="xs" className="font-semibold line-clamp-2 text-foreground">
                        {book.title}
                      </Text>
                      {book.author && (
                        <Text as="p" variant="xs" className="text-foreground/70 line-clamp-1">
                          {book.author}
                        </Text>
                      )}
                      {book.price && (
                        <Text as="p" variant="xs" className="text-blue font-semibold mt-1">
                          {book.price}
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll('right')}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-surface shadow-lg rounded-full p-3 transition-opacity hover:bg-[var(--color-brand-beige)] dark:hover:bg-surface-elevated items-center justify-center opacity-90 hover:opacity-100"
              aria-label="Nach rechts scrollen"
            >
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});
