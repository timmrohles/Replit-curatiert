import React, { useState, memo, useEffect, useMemo, useCallback } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Tags, ArrowRight, Quote, ShoppingCart, Share2 } from 'lucide-react';
import { useTheme } from '../../utils/ThemeContext';
import { Button } from '../ui/button';
import { Heading, Text } from '../ui/typography';
import { getBookUrl } from '../../utils/bookUrlHelper';
import { getAllONIXTags, ONIXTag } from '../../utils/api';
import { ONIX_TAG_COLORS, ONIX_TAG_ICONS } from '../../utils/tag-colors';
import { OptimizedImage } from '../common/OptimizedImage';
import { LikeButton } from '../favorites/LikeButton';
import { SerieBadgeComponent } from '../common/SerieBadge';

interface ActiveAffiliate {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  link_template: string;
  icon_url: string | null;
  favicon_url: string | null;
  display_order: number;
}

let cachedAffiliates: ActiveAffiliate[] | null = null;
let affiliatePromise: Promise<ActiveAffiliate[]> | null = null;

function fetchActiveAffiliates(): Promise<ActiveAffiliate[]> {
  if (cachedAffiliates) return Promise.resolve(cachedAffiliates);
  if (affiliatePromise) return affiliatePromise;
  affiliatePromise = fetch('/api/affiliates/active')
    .then(r => r.json())
    .then(data => {
      cachedAffiliates = data.ok ? data.data : [];
      return cachedAffiliates!;
    })
    .catch(() => {
      cachedAffiliates = [];
      return [];
    });
  return affiliatePromise;
}

function buildAffiliateUrl(template: string, isbn: string): string {
  return template.replace(/\{isbn13\}/g, isbn).replace(/\{isbn\}/g, isbn);
}

function getAffiliateIcon(affiliate: ActiveAffiliate): string {
  if (affiliate.icon_url) return affiliate.icon_url;
  if (affiliate.favicon_url) return affiliate.favicon_url;
  if (affiliate.website_url) {
    try {
      const domain = new URL(affiliate.website_url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {}
  }
  return `https://www.google.com/s2/favicons?domain=${affiliate.slug}.de&sz=64`;
}

export interface BookCarouselItemData {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  price: string;
  newPrice?: string; // NEW: Neupreis für Dual-Price Display
  usedPrice?: string; // NEW: Gebrauchtpreis (Bestpreis) für Dual-Price Display
  isbn?: string;
  publisher?: string;
  year?: string;
  shortDescription?: string;
  categories?: string[];
  tags?: string[];
  reviews?: Array<{ source: string; quote: string }>; // NEW: Pressestimmen
  collectionNumber?: number;
  matchPercentage?: number; // 0-100: Match zwischen User-Profil und Buch
  onixTagIds?: string[]; // NEW: ONIX Tag IDs for awards/badges
  seriesName?: string; // NEW: Name der Buchreihe für Badge
  seriesSlug?: string; // NEW: Slug der Buchreihe für Verlinkung
  klappentext?: string; // Klappentext/Beschreibung
  
  // ============================================
  // ONIX 3.0 IMAGE METADATA (ResourceFeature - Codelist 160)
  // ============================================
  coverImageAlt?: string; // ResourceFeature 07 (Resource description)
  coverImageCaption?: string; // ResourceFeature 08 (Caption)
  coverImageCredit?: string; // ResourceFeature 06 (Credit line)
}

interface BookCarouselItemProps {
  book: BookCarouselItemData;
  /** Optional: Size variant - controls width and height */
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable Book Carousel Item Component
 * - Standardized styling for all book carousels (matches BookCard)
 * - Flip animation for short description
 * - Reviews overlay for press reviews
 * - Interactive icons (Info, Quote)
 * - ONIX tags support (Serie badges, awards, hover tags)
 * - Affiliate buttons (bücher.de, geniallokal)
 * - PERFORMANCE OPTIMIZED: Memoized component with useCallback handlers
 */
const BookCarouselItemComponent = ({ book, size = 'md' }: BookCarouselItemProps) => {
  const navigate = useSafeNavigate();
  const { resolvedTheme } = useTheme();
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [showReviewsOverlay, setShowReviewsOverlay] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isKlappentextExpanded, setIsKlappentextExpanded] = useState(false);
  const [affiliates, setAffiliates] = useState<ActiveAffiliate[]>([]);

  // ✅ TEMPORARY: Add mock reviews for testing if not present
  const bookWithMockReviews = useMemo(() => {
    if (book.reviews && book.reviews.length > 0) {
      return book;
    }
    
    // Add mock reviews to every 3rd book for testing
    const shouldAddMockReviews = parseInt(book.id) % 3 === 0;
    
    if (shouldAddMockReviews) {
      return {
        ...book,
        reviews: [
          {
            source: 'Die Zeit',
            quote: 'Ein brillantes Meisterwerk, das den Leser von der ersten bis zur letzten Seite fesselt.'
          },
          {
            source: 'Süddeutsche Zeitung',
            quote: 'Sprachgewaltig und bewegend. Ein Roman, der noch lange nachhallt.'
          },
          {
            source: 'Der Spiegel',
            quote: 'Eine literarische Entdeckung ersten Ranges.'
          }
        ]
      };
    }
    
    return book;
  }, [book]);

  // ✅ TEMPORARY: Add mock klappentext for testing if not present
  const bookWithMockData = useMemo(() => {
    // If klappentext or shortDescription already exists, use it
    if (bookWithMockReviews.klappentext || bookWithMockReviews.shortDescription) {
      return bookWithMockReviews;
    }
    
    // Mock klappentexte for different books
    const mockKlappentexte = [
      'Eine Stadt hinter einer Mauer, ein Mann auf der Suche nach verlorener Liebe. Murakamis neuester Roman ist eine magische Reise zwischen Realität und Traum, die den Leser in ihren Bann zieht und nicht mehr loslässt.',
      'Eine Frau verliert ihre Sprache nach einem Trauma. Ihr Griechischlehrer versucht, ihr das Sprechen zurückzugeben. Ein poetischer Roman über Verlust und Heilung, über die Macht der Worte und die Suche nach Identität.',
      'Ein fesselnder Roman über Familie, Identität und die Suche nach dem eigenen Platz in der Welt. Mit großer Erzählkraft und tiefem Einblick in die menschliche Seele geschrieben.',
      'Eine Geschichte, die unter die Haut geht. Einfühlsam und präzise erzählt, voller unvergesslicher Charaktere und Momente, die noch lange nachwirken.',
      'Ein literarisches Meisterwerk, das die großen Fragen des Lebens stellt: Wer sind wir? Wohin gehen wir? Was bleibt von uns? Sprachgewaltig und bewegend.',
    ];
    
    // Select klappentext based on book ID
    const klappentextIndex = parseInt(bookWithMockReviews.id) % mockKlappentexte.length;
    
    return {
      ...bookWithMockReviews,
      klappentext: mockKlappentexte[klappentextIndex]
    };
  }, [bookWithMockReviews]);

  // Fetch ONIX Tags and Affiliates
  useEffect(() => {
    getAllONIXTags()
      .then(setOnixTags)
      .catch(error => {
        console.error('Error loading ONIX tags in BookCarouselItem:', error);
        setOnixTags([]);
      });
    fetchActiveAffiliates().then(setAffiliates);
  }, []);

  // Memoized callbacks for better performance
  const handleReviewsToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReviewsOverlay(prev => !prev);
  }, []);
  
  const handleKlappentextToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsKlappentextExpanded(prev => !prev);
  }, []);
  
  const handleNavigate = useCallback(() => {
    navigate(getBookUrl(book));
  }, [navigate, book]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const bookUrl = `${window.location.origin}${getBookUrl(book)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `${book.title} von ${book.author}`,
          url: bookUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(bookUrl);
      // TODO: Show toast notification
    }
  }, [book]);

  // Size variants - matches BookCard sizing
  const sizeClasses = {
    sm: "min-h-[480px] md:min-h-[600px]",
    md: "min-h-[520px] md:min-h-[680px]",
    lg: "min-h-[580px] md:min-h-[750px]"
  };

  // Get prominent ONIX tags for this book (SAME LOGIC AS BOOKCARD)
  const prominentTags = useMemo(() => {
    if (!onixTags.length || !book.onixTagIds?.length) return [];
    
    return onixTags
      .filter(tag => 
        book.onixTagIds!.includes(tag.id) && 
        tag.visible && 
        tag.visibilityLevel === 'prominent'
      )
      .slice(0, 3); // Max 3 tags on cover
  }, [onixTags, book.onixTagIds]);

  // Get Award/Status tags that should ALWAYS be visible (SAME LOGIC AS BOOKCARD)
  const alwaysVisibleBadges = useMemo(() => {
    if (!onixTags.length || !book.onixTagIds?.length) return [];
    
    return onixTags
      .filter(tag => 
        book.onixTagIds!.includes(tag.id) && 
        tag.visible && 
        tag.visibilityLevel === 'prominent' &&
        ['Auszeichnung', 'Status', 'Medienecho'].includes(tag.type)
      )
      .slice(0, 2); // Max 2 always-visible badges
  }, [onixTags, book.onixTagIds]);

  // Get other prominent tags (visible on hover) (SAME LOGIC AS BOOKCARD)
  const hoverTags = useMemo(() => {
    if (!onixTags.length || !book.onixTagIds?.length) return [];
    
    const alwaysVisibleIds = alwaysVisibleBadges.map(t => t.id);
    return prominentTags.filter(tag => !alwaysVisibleIds.includes(tag.id));
  }, [prominentTags, alwaysVisibleBadges]);

  // Get Serie/Band tags for badges (SAME LOGIC AS BOOKCARD)
  const serieTags = useMemo(() => {
    if (!onixTags.length || !book.onixTagIds?.length) return [];
    
    return onixTags.filter(tag => 
      book.onixTagIds!.includes(tag.id) && 
      tag.visible && 
      (tag.type === 'Serie' || tag.type === 'Band')
    );
  }, [onixTags, book.onixTagIds]);

  // Extract Band number from ONIX tags (SAME LOGIC AS BOOKCARD)
  const bandNumber = useMemo(() => {
    const bandTag = serieTags.find(tag => tag.type === 'Band');
    if (!bandTag) return null;
    // Extract number from "Band 1", "Part 1", etc.
    const match = bandTag.displayName.match(/\d+/);
    return match ? match[0] : null;
  }, [serieTags]);

  return (
    <div 
      className="bg-transparent flex-shrink-0 flex flex-col group relative z-10"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="pl-2 pb-2 pt-1 pr-1 md:pl-3 md:pb-3 md:pt-2 md:pr-2 relative">
        {/* 🏆 Serie Badge - PROMINENT using new component (SAME AS BOOKCARD) */}
        {onixTags.length > 0 && book.onixTagIds && book.onixTagIds.length > 0 && (
          <div className="mb-2 md:mb-3">
            <SerieBadgeComponent 
              onixTags={onixTags.filter(tag => book.onixTagIds!.includes(tag.id))}
              context="cover"
            />
          </div>
        )}

        {/* Cover mit BookCard-Styling und Flip */}
        <div className="aspect-[2/3] bg-muted rounded-[1px] relative overflow-visible">
          {/* Interactive Icons - OUTSIDE flip container, always visible */}
          <div className="absolute top-3 right-3 flex flex-row gap-2" style={{ zIndex: 150 }}>
            {/* Pressestimmen Button */}
            {bookWithMockReviews.reviews && bookWithMockReviews.reviews.length > 0 && (
              <button
                onClick={handleReviewsToggle}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                style={{ 
                  backgroundColor: showReviewsOverlay ? 'var(--color-blue)' : (resolvedTheme === 'dark' ? '#FFFFFF' : '#2a2a2a'),
                  color: showReviewsOverlay ? '#FFFFFF' : (resolvedTheme === 'dark' ? '#2a2a2a' : '#FFFFFF')
                }}
                title="Pressestimmen anzeigen"
              >
                <Quote className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
          </div>

          {/* Cover Container - NO MORE FLIP */}
          <div 
            className="aspect-[2/3] bg-muted rounded-[1px] relative overflow-hidden" 
            style={{ 
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-book-cover)'
            }}
            onClick={handleNavigate}
          >
            {/* Book Cover */}
            <OptimizedImage
              src={book.coverImage}
              alt={book.coverImageAlt || `Buchcover: ${book.title} von ${book.author}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              title={book.coverImageCaption}
            />
            
            {/* Match Badge - unten links */}
            {book.matchPercentage !== undefined && book.matchPercentage > 0 && (
              <div 
                className="absolute bottom-3 left-3 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-full shadow-lg backdrop-blur-sm"
                style={{ 
                  backgroundColor: book.matchPercentage >= 75 ? 'rgba(90, 150, 144, 0.95)' : book.matchPercentage >= 50 ? 'rgba(160, 206, 200, 0.95)' : 'rgba(247, 244, 239, 0.95)',
                  color: book.matchPercentage >= 50 ? '#FFFFFF' : '#3A3A3A',
                  fontFamily: 'Fjalla One',
                  zIndex: 51
                }}
                title={`${book.matchPercentage}% Match zu deinem Profil`}
              >
                {book.matchPercentage}% Match
              </div>
            )}
            
            {/* ONIX Tags on Cover - visible on hover (SAME AS BOOKCARD) */}
            {hoverTags.length > 0 && (
              <div className="absolute top-3 left-3 right-16 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 50 }}>
                {hoverTags.map((tag) => (
                  <div 
                    key={tag.id}
                    className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm border border-transparent rounded-full transition-all duration-200 inline-flex items-center gap-1 shadow-lg" 
                    style={{ 
                      backgroundColor: tag.color || ONIX_TAG_COLORS[tag.type] || '#70c1b3',
                      color: 'var(--color-white)'
                    }}
                    title={`${tag.type}: ${tag.displayName}`}
                  >
                    <span className="whitespace-nowrap">{ONIX_TAG_ICONS[tag.type] || '🏷️'} {tag.displayName}</span>
                    <LikeButton 
                      entityId={`onix-tag-${tag.id}`}
                      entityType="tag"
                      entityTitle={tag.displayName}
                      entitySubtitle={tag.type}
                      variant="minimal"
                      size="sm"
                      iconColor="var(--color-white)"
                      backgroundColor={tag.color || ONIX_TAG_COLORS[tag.type] || '#70c1b3'}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Always-visible badges (SAME AS BOOKCARD) */}
            {alwaysVisibleBadges.length > 0 && (
              <div className="absolute top-3 left-3 right-16 flex flex-wrap gap-2" style={{ zIndex: 50 }}>
                {alwaysVisibleBadges.map((tag) => (
                  <div 
                    key={tag.id}
                    className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm border border-transparent rounded-full transition-all duration-200 inline-flex items-center gap-1 shadow-lg" 
                    style={{ 
                      backgroundColor: tag.color || ONIX_TAG_COLORS[tag.type] || '#70c1b3',
                      color: 'var(--color-white)'
                    }}
                    title={`${tag.type}: ${tag.displayName}`}
                  >
                    <span className="whitespace-nowrap">{ONIX_TAG_ICONS[tag.type] || '🏷️'} {tag.displayName}</span>
                    <LikeButton 
                      entityId={`onix-tag-${tag.id}`}
                      entityType="tag"
                      entityTitle={tag.displayName}
                      entitySubtitle={tag.type}
                      variant="minimal"
                      size="sm"
                      iconColor="var(--color-white)"
                      backgroundColor={tag.color || ONIX_TAG_COLORS[tag.type] || '#70c1b3'}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Reviews Overlay - Pressestimmen */}
            {showReviewsOverlay && bookWithMockReviews.reviews && (
              <div 
                className="absolute inset-0 p-3 md:p-4 flex flex-col gap-2 md:gap-3 overflow-y-auto bg-black/90 backdrop-blur-[8px]"
                style={{ zIndex: 100 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Heading 
                  as="h5" 
                  variant="h6" 
                  className="text-white !normal-case"
                >
                  Pressestimmen
                </Heading>
                
                {/* Reviews - Display first 2-3 reviews */}
                <div className="flex flex-col gap-2 md:gap-3">
                  {bookWithMockReviews.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <Text 
                        as="p" 
                        variant="small" 
                        className="text-white !normal-case !tracking-normal leading-relaxed italic"
                      >
                        "{review.quote}"
                      </Text>
                      <Text 
                        as="p" 
                        variant="xs" 
                        className="text-white opacity-75 !normal-case !tracking-normal"
                      >
                        — {review.source}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Produktdetails - FESTE HÖHE für einheitliche Cards */}
      <div className="px-2 md:px-3 pb-2 md:pb-3 flex flex-col gap-1 h-[340px] md:h-[320px]">
        {/* Content-Bereich - Titel und Autor bleiben immer gleich */}
        <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
          <Heading 
            as="h4" 
            variant="h4" 
            className="text-foreground line-clamp-2 !normal-case min-h-[4rem] flex-shrink-0"
          >
            {book.title}
          </Heading>
          
          <Text 
            as="p" 
            variant="base" 
            className="text-foreground-muted !normal-case !font-bold !tracking-normal line-clamp-2 min-h-[2.5rem] flex-shrink-0"
          >
            {book.author}
          </Text>
          
          {/* Klappentext - nur dieser Bereich expandiert */}
          {(bookWithMockData.klappentext || bookWithMockData.shortDescription) && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className={`${isKlappentextExpanded ? 'flex-1 overflow-y-auto' : 'h-[6.5rem] md:h-[7rem] flex-shrink-0'}`}>
                <Text 
                  as="p" 
                  variant="small" 
                  className={`leading-relaxed ${isKlappentextExpanded ? '' : 'line-clamp-6 md:line-clamp-5'}`}
                  style={{ 
                    color: 'var(--color-foreground-muted)'
                  }}
                >
                  {bookWithMockData.klappentext || bookWithMockData.shortDescription}
                </Text>
              </div>
              <button
                onClick={handleKlappentextToggle}
                className="text-left underline hover:no-underline transition-all mt-3 md:mt-1.5 flex-shrink-0"
                style={{
                  color: 'var(--color-blue)',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem'
                }}
              >
                {isKlappentextExpanded ? 'Weniger lesen' : 'Mehr lesen'}
              </button>
            </div>
          )}
        </div>
        
        {/* Buttons - IMMER unten mit mt-auto - FESTE POSITION */}
        <div className="mt-auto flex flex-col pt-1 flex-shrink-0">
          {/* Divider */}
          <div className="border-t border-foreground/20 my-0.5" />
          
          {/* Action Buttons - Simplified: Like + Arrow always, Affiliate on hover */}
          <div className="flex items-center gap-1.5 -mt-0.5">
            <LikeButton 
              entityId={`book-${book.id}`}
              entityType="book"
              entityTitle={book.title}
              entitySubtitle={book.author}
              size="md" 
              iconColor="#3A3A3A"
            />
            
            {/* Share Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 md:h-11 md:w-11 shadow-none"
              onClick={handleShare}
              title="Teilen"
            >
              <Share2 
                className="w-5 h-5"
                aria-hidden="true"
              />
            </Button>
            
            {/* Affiliate Buttons - dynamisch aus DB */}
            {book.isbn && affiliates.length > 0 && (
              <div className="flex items-center gap-1.5">
                {affiliates.map((aff) => (
                  <Button
                    key={aff.id}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-11 md:w-11 shadow-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = buildAffiliateUrl(aff.link_template, book.isbn!);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    title={`Bei ${aff.name} kaufen`}
                    data-testid={`button-affiliate-${aff.slug}`}
                  >
                    <img
                      src={getAffiliateIcon(aff)}
                      alt={aff.name}
                      className="w-5 h-5"
                      loading="lazy"
                    />
                  </Button>
                ))}
              </div>
            )}
            
            {/* Arrow Right Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 md:h-11 md:w-11 ml-auto shadow-none text-foreground"
              onClick={handleNavigate}
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6" style={{ strokeWidth: 1.5 }} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const BookCarouselItem = memo(BookCarouselItemComponent);