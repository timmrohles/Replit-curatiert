import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import { BookCarouselItem, BookCarouselItemData } from "../book/BookCarouselItem";
import { EditorialBookCard, EditorialBookCardData } from "../book/EditorialBookCard";
import { CarouselContainer } from "../carousel/CarouselContainer";
import { CreatorHeader } from "./CreatorHeader";
import { Text } from "../ui/typography";
import { BRAND_COLORS, TURQUOISE_VARIANTS } from '../../utils/tag-colors';
import { getAllONIXTags, ONIXTag } from '../../utils/api';

// Helper function to calculate luminance and determine text color
function getContrastTextColor(backgroundColor: string): string {
  // Handle transparent or invalid colors
  if (!backgroundColor || backgroundColor === 'transparent') {
    return 'var(--charcoal)'; // Default dark text
  }

  // Convert hex to RGB
  let r = 0, g = 0, b = 0;
  
  // Handle hex colors
  if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  // Handle rgb/rgba colors
  else if (backgroundColor.startsWith('rgb')) {
    const match = backgroundColor.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    }
  }
  
  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? 'var(--charcoal)' : 'var(--color-white)';
}

interface Book {
  id: string | number;
  cover: string;
  title: string;
  author: string;
  price: string;
  newPrice?: string; // ONIX-konform: Neu-Preis
  usedPrice?: string; // ONIX-konform: Gebraucht-Preis
  publisher?: string;
  year?: string;
  category?: string;
  tags?: string[];
  isbn?: string; // ISBN-13 or ISBN-10
  onixTagIds?: string[]; // NEW: ONIX Tag IDs from API
  shortDescription?: string; // ONIX TextType 02 - Short Description for flip cards
  klappentext?: string; // ONIX TextType 03 - Fallback description
  // Updated sorting metadata based on database fields
  followCount?: number; // Number of follows (for Beliebtheit)
  awards?: number; // Number of awards/prizes (for Auszeichnungen)
  reviewCount?: number; // Number of reviews (for Kritiker-Lieblinge)
  shortlists?: number; // Number of shortlist nominations
  longlists?: number; // Number of longlist nominations
  releaseDate?: string; // ISO date string (for Relevant/Trending)
  reviews?: Array<{ source: string; quote: string }>; // NEW: Pressestimmen from ONIX
  matchPercentage?: number; // NEW: Match percentage for editorial layout
}

interface CreatorCarouselProps {
  // Creator Info
  creatorAvatar: string;
  creatorName: string;
  creatorFocus: string;
  occasion: string;
  curationReason: string;
  showSocials?: boolean;
  creatorBio?: string;
  creatorWebsiteUrl?: string;
  isAmbassador?: boolean;
  isVerified?: boolean;
  showHeader?: boolean;
  
  // Books
  books: Book[];
  
  // Tags and Categories
  category?: string;
  categories?: string[];
  tags?: string[];
  
  // CTA
  showCta?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
  
  // Background
  backgroundColor?: 'white' | 'beige';
  sectionBackgroundColor?: string;
  bookCardBgColor?: 'white' | 'beige' | 'transparent';
  applyBackgroundToContent?: boolean; // NEW: Only apply background color if explicitly requested
  
  // Storefront mode - enables automatic color calculation
  isStorefront?: boolean;
  
  // Video
  showVideo?: boolean;
  videoThumbnail?: string;
  videoUrl?: string; // NEW: Video URL (YouTube embed, Vimeo, or direct MP4)
  videoTitle?: string; // NEW: Video title/description
  
  // Color customization
  textColor?: string;
  iconColor?: string;
  borderColor?: string;
  tagBorderColor?: string;
  tagHoverBg?: string;
  selectBg?: string;
  selectBorder?: string;
  buttonBg?: string;
  buttonHoverBg?: string;
  arrowBg?: string;
  arrowHoverBg?: string;
  videoCardBg?: string;
  
  // Performance
  isLCP?: boolean; // ⚡ PERFORMANCE: Mark as LCP section for priority loading
  useEditorialLayout?: boolean; // Use minimalist editorial card layout
}

export const CreatorCarousel = memo(function CreatorCarousel({
  creatorAvatar,
  creatorName,
  creatorFocus,
  occasion,
  curationReason,
  showSocials = false,
  creatorBio,
  creatorWebsiteUrl,
  isAmbassador = false,
  isVerified = false,
  showHeader = true,
  books,
  category,
  categories,
  tags,
  showCta = true,
  ctaText = "Alle Bücher ansehen",
  onCtaClick,
  backgroundColor = 'white',
  sectionBackgroundColor = 'transparent',
  bookCardBgColor = 'beige',
  applyBackgroundToContent = false, // NEW: Default to false
  isStorefront = false,
  showVideo = true,
  videoThumbnail = "https://images.unsplash.com/photo-1692014957131-d0d992bf47ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rc3RvcmUlMjBjdXJhdG9yJTIwcHJlc2VudGF0aW9ufGVufDF8fHx8MTc2Mzc1NjE4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
  videoUrl, // NEW: Video URL (YouTube embed, Vimeo, or direct MP4)
  videoTitle, // NEW: Video title/description
  textColor = 'var(--creator-text-dark)',
  iconColor = 'var(--creator-text-dark)',
  borderColor = 'var(--creator-dark-bg)/20',
  tagBorderColor = 'var(--creator-dark-bg)/20',
  tagHoverBg = 'var(--creator-accent)/5',
  selectBg = 'transparent',
  selectBorder = 'var(--creator-dark-bg)/20',
  buttonBg = 'var(--creator-dark-bg)',
  buttonHoverBg = 'var(--creator-accent)',
  arrowBg = 'var(--creator-dark-bg)',
  arrowHoverBg = 'var(--creator-accent)',
  videoCardBg = '#F5F5F5',
  isLCP = false, // ⚡ PERFORMANCE: Mark as LCP section for priority loading
  useEditorialLayout = false, // Use minimalist editorial card layout
}: CreatorCarouselProps) {
  const sortChipsRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [hoveredSort, setHoveredSort] = useState<string | null>(null);
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);

  // Load ONIX Tags on mount with cleanup
  useEffect(() => {
    let isMounted = true;
    
    getAllONIXTags()
      .then(tags => {
        if (isMounted) {
          setOnixTags(tags);
        }
      })
      .catch(error => {
        if (isMounted) {
          console.error('Error loading ONIX tags:', error);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Generate ONIX-based filter options from book tags
  const onixFilterOptions = useMemo(() => {
    const filters: Array<{ id: string; label: string; tooltip: string; onixCode: string; type: string }> = [];
    const seen = new Set<string>();
    
    // Collect unique ONIX tags from all books
    books.forEach(book => {
      if (!book.onixTagIds) return;
      
      book.onixTagIds.forEach(tagId => {
        const tag = onixTags.find(t => t.id === tagId);
        if (!tag) return;
        
        // Check if this is a relevant identifier type
        const isWGS = tag.type === 'Gattung'; // Identifier 26 (WGS)
        const isThema = tag.type === 'Genre (THEMA)'; // Identifier 93 (Thema)
        const isLesemotiv = tag.type === 'Feeling'; // Identifier 80 (Lesemotive)
        
        if (!isWGS && !isThema && !isLesemotiv) return;
        
        // Create unique key to avoid duplicates
        const key = `${tag.type}-${tag.onixCode}`;
        if (seen.has(key)) return;
        seen.add(key);
        
        filters.push({
          id: `onix-${tag.id}`,
          label: tag.displayName,
          tooltip: `${tag.type}: ${(tag as any).originalName || tag.displayName}`,
          onixCode: (tag as any).onixCode as string || '',
          type: tag.type
        });
      });
    });
    
    return filters;
  }, [books, onixTags]);

  // Define sort options with icons and tooltips
  // Use ONIX-based filters if available, otherwise fall back to default options
  const sortOptions = useMemo(() => {
    // If ONIX filters are available, combine them with default options
    if (onixFilterOptions.length > 0) {
      return [
        { 
          id: 'popularity', 
          label: 'Beliebtheit',
          tooltip: 'Sortiert nach Saves, Interaktionen und Plattform-Engagement'
        },
        { 
          id: 'awarded', 
          label: 'Auszeichnungen',
          tooltip: 'Sortiert nach Anzahl und Bedeutung von Preisen (Awards, Shortlists, Longlists)'
        },
        {
          id: 'independent',
          label: 'Independent',
          tooltip: 'Zeigt nur Bücher von unabhängigen Indie-Verlagen'
        },
        ...onixFilterOptions.map(f => ({
          id: f.id,
          label: f.label,
          tooltip: f.tooltip
        }))
      ];
    }
    
    // Fallback: Standard options without ONIX
    return [
      { 
        id: 'popularity', 
        label: 'Beliebtheit',
        tooltip: 'Sortiert nach Saves, Interaktionen und Plattform-Engagement'
      },
      { 
        id: 'awarded', 
        label: 'Auszeichnungen',
        tooltip: 'Sortiert nach Anzahl und Bedeutung von Preisen (Awards, Shortlists, Longlists)'
      },
      {
        id: 'independent',
        label: 'Independent',
        tooltip: 'Zeigt nur Bücher von unabhängigen Indie-Verlagen'
      },
      { 
        id: 'hidden-gems', 
        label: 'Hidden Gems',
        tooltip: 'Sortiert Bücher mit hohem Qualitäts-Score bei niedriger Sichtbarkeit'
      },
      { 
        id: 'trending', 
        label: 'Relevant (aktuell)',
        tooltip: 'Sortiert Neuerscheinungen nach Veröffentlichungszeitpunkt'
      },
    ];
  }, [onixFilterOptions]);

  // Calculate contrast text color based on background
  const calculatedTextColor = useMemo(() => {
    return getContrastTextColor(sectionBackgroundColor || 'transparent');
  }, [sectionBackgroundColor]);
  
  // ONLY use calculated text color for storefronts
  // For normal pages, use the provided textColor/iconColor props directly
  const effectiveTextColor = isStorefront && textColor === 'var(--creator-text-dark)' 
    ? calculatedTextColor 
    : textColor;
  const effectiveIconColor = isStorefront && iconColor === 'var(--creator-text-dark)' 
    ? calculatedTextColor 
    : iconColor;
  
  // Detect advertisement sections (ANZEIGE with blue or black background)
  const isBlueBackground = sectionBackgroundColor?.includes(BRAND_COLORS.blue) || 
                           sectionBackgroundColor?.includes('linear-gradient') && sectionBackgroundColor.includes(BRAND_COLORS.blue);
  const isBlackBackground = sectionBackgroundColor === BRAND_COLORS.black || sectionBackgroundColor === BRAND_COLORS.charcoal;
  const isAdvertisementSection = creatorFocus.includes('ANZEIGE') && (isBlueBackground || isBlackBackground);
  
  // Icon color logic for transparent backgrounds (bunter Pastell-Hintergrund)
  const isTransparentBackground = sectionBackgroundColor === 'transparent';
  
  // For advertisement sections, all hearts should be white
  // For transparent backgrounds (bunter Hintergrund):
  //   - Header follow heart should be BLUE
  //   - Product icons (share, cart, arrow) should be BLACK
  const finalIconColor = isAdvertisementSection 
    ? BRAND_COLORS.white
    : isTransparentBackground
      ? BRAND_COLORS.blue // BLUE for header follow heart on bunter Hintergrund
      : effectiveIconColor;

  // Sort books based on selected criteria
  const sortedBooks = useMemo(() => {
    const booksCopy = [...books];
    
    // Check if this is an ONIX filter
    if (sortBy.startsWith('onix-')) {
      const selectedTagId = sortBy.replace('onix-', '');
      const selectedTag = onixTags.find(t => t.id === selectedTagId);
      
      if (selectedTag) {
        // Filter books that have this ONIX tag
        return booksCopy.filter(book => 
          book.onixTagIds && book.onixTagIds.includes(selectedTagId)
        );
      }
    }
    
    switch (sortBy) {
      case 'popularity':
        // Beliebtheit = Anzahl der Follows
        return booksCopy.sort((a, b) => {
          const followsA = a.followCount ?? 0;
          const followsB = b.followCount ?? 0;
          return followsB - followsA;
        });
      
      case 'awarded':
        // Auszeichnungen = Nur Bücher mit Awards anzeigen + sortiert nach Anzahl
        return booksCopy
          .filter(book => {
            // Filter: Nur Bücher mit mindestens einem Award
            const awardsCount = book.awards ?? 0;
            return awardsCount > 0;
          })
          .sort((a, b) => {
            // Sort: Nach Anzahl der Awards (meiste zuerst)
            const awardsA = a.awards ?? 0;
            const awardsB = b.awards ?? 0;
            return awardsB - awardsA;
          });
      
      case 'independent':
        // Independent = Nur Bücher von Indie-Verlagen
        // Filtert nach Tag "indie", "independent" oder "Independent"
        return booksCopy.filter(book => {
          if (!book.tags || book.tags.length === 0) return false;
          return book.tags.some(tag => 
            tag.toLowerCase() === 'indie' || 
            tag.toLowerCase() === 'independent' ||
            tag.toLowerCase() === 'indie-verlag' ||
            tag.toLowerCase() === 'independentverlag'
          );
        });
      
      case 'hidden-gems':
        // Hidden Gems = (Shortlists + Longlists) - Awards
        return booksCopy.sort((a, b) => {
          const shortlistsA = a.shortlists ?? 0;
          const longlistsA = a.longlists ?? 0;
          const awardsA = a.awards ?? 0;
          const hiddenGemScoreA = (shortlistsA + longlistsA) - awardsA;
          
          const shortlistsB = b.shortlists ?? 0;
          const longlistsB = b.longlists ?? 0;
          const awardsB = b.awards ?? 0;
          const hiddenGemScoreB = (shortlistsB + longlistsB) - awardsB;
          
          return hiddenGemScoreB - hiddenGemScoreA;
        });
      
      case 'trending':
        // Relevant = Erscheinungsdatum (neueste zuerst)
        return booksCopy.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA;
        });
      
      default:
        return booksCopy; // Keep original order
    }
  }, [books, sortBy, onixTags]);

  return (
    <section 
      className="py-6 md:py-8 w-full px-4" 
      style={{ 
        backgroundColor: 'transparent',
        overflow: 'visible',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      } as React.CSSProperties}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      <div className="max-w-7xl mx-auto w-full" style={{ backgroundColor: 'transparent', overflow: 'visible' }}>
        {/* Header with Creator Info and CTA */}
        {showHeader && (
          <div className="w-full mb-4 md:mb-6">
            <CreatorHeader
              avatar={creatorAvatar}
              name={creatorName}
              focus={creatorFocus}
              occasion={occasion}
              curationReason={curationReason}
              showSocials={showSocials}
              textColor={effectiveTextColor}
              iconColor={finalIconColor}
              sectionBackgroundColor={sectionBackgroundColor}
              bio={creatorBio}
              websiteUrl={creatorWebsiteUrl}
              isAmbassador={isAmbassador}
              isVerified={isVerified}
              category={category}
              categories={categories}
              tags={tags}
              isLCP={isLCP}
            />

            {/* Optional CTA */}
            {showCta && (
              <></>
            )}
          </div>
        )}

        {/* Sort Field - ISOLATED from other sections */}
        <div className="mb-4 md:mb-6">
          {/* Sort Chips - Mobile horizontal scroll, Desktop flex wrap */}
          <div className="flex justify-end">
            <div 
              ref={sortChipsRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full md:flex-wrap md:overflow-visible select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {sortOptions.map((option) => {
                const isActive = sortBy === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    onMouseEnter={() => setHoveredSort(option.id)}
                    onMouseLeave={() => setHoveredSort(null)}
                    className="sort-chip"
                    aria-pressed={isActive}
                  >
                    <Text 
                      as="span" 
                      variant="xs" 
                      className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                    >
                      {option.label}
                    </Text>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Horizontal Carousel with CarouselContainer */}
        <div className="mb-12">
          <CarouselContainer
            showDesktopButtons={sortedBooks.length >= 6}
            showMobileButtons={sortedBooks.length >= 3}
            className="pb-4"
            buttonOffset={8}
          >
            <div className="flex -ml-4">
              {/* Video Item (First, if showVideo is true) */}
              {showVideo && videoUrl && (
                <div className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4">
                  <div className="group cursor-pointer">
                    <div className="pl-2 pb-2 pt-1 pr-1 md:pl-3 md:pb-3 md:pt-2 md:pr-2 relative">
                      <div 
                        className="relative aspect-[2/3] rounded-[1px] overflow-hidden" 
                        style={{ 
                          border: '1px solid var(--color-border)',
                          boxShadow: 'var(--shadow-book-cover)'
                        }}
                      >
                        {/* Video Element or Iframe */}
                        {(videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be') || videoUrl?.includes('vimeo.com')) ? (
                          // YouTube/Vimeo Embed
                          <iframe
                            src={videoUrl}
                            className="w-full h-full object-cover absolute inset-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            style={{ border: 'none' }}
                            title={videoTitle || 'Video'}
                          />
                        ) : (
                          // Direct Video (MP4, WebM, etc.)
                          <video
                            src={videoUrl}
                            poster={videoThumbnail}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                            aria-label={videoTitle || 'Video'}
                          />
                        )}
                        
                        {/* Video Overlay with Title */}
                        {videoTitle && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                            <p className="text-white font-semibold text-sm line-clamp-2">
                              {videoTitle}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Items */}
              {sortedBooks.map((book) => {
                // Prepare book data for both card types
                const commonBookData = {
                  id: book.id.toString(),
                  title: book.title,
                  author: book.author,
                  coverImage: book.cover,
                  isbn: book.isbn || book.id.toString(),
                  shortDescription: book.shortDescription,
                  onixTagIds: book.onixTagIds,
                  matchPercentage: book.matchPercentage,
                };
                
                // Render Editorial or Standard layout
                if (useEditorialLayout) {
                  const editorialData: EditorialBookCardData = {
                    ...commonBookData,
                    klappentext: book.klappentext,
                    // Convert reviews array to string for Editorial card
                    reviews: book.reviews && book.reviews.length > 0
                      ? book.reviews.map(r => `"${r.quote}" – ${r.source}`).join('\n\n')
                      : undefined,
                  };
                  
                  return (
                    <div key={book.id} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4">
                      <EditorialBookCard book={editorialData} />
                    </div>
                  );
                } else {
                  const standardData: BookCarouselItemData = {
                    ...commonBookData,
                    price: book.price,
                    newPrice: book.newPrice,
                    usedPrice: book.usedPrice,
                    publisher: book.publisher,
                    categories: book.category ? [book.category] : undefined,
                    tags: book.tags,
                    reviews: book.reviews,
                  };
                  
                  return (
                    <div key={book.id} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4">
                      <BookCarouselItem book={standardData} size="md" />
                    </div>
                  );
                }
              })}
            </div>
          </CarouselContainer>
        </div>


      </div>
    </section>
  );
});