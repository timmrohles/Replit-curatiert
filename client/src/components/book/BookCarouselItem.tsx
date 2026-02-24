import React, { useState, memo, useEffect, useMemo, useCallback } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Tags, ArrowRight, Quote, ShoppingCart, Award } from 'lucide-react';
import { BookEnrichmentBadges } from './BookEnrichmentBadges';
import { useTheme } from '../../utils/ThemeContext';
import { Button } from '../ui/button';
import { Heading, Text } from '../ui/typography';
import { getBookUrl } from '../../utils/bookUrlHelper';
import { getAllONIXTags, ONIXTag } from '../../utils/api';
import { ONIX_TAG_COLORS, ONIX_TAG_ICONS } from '../../utils/tag-colors';
import { OptimizedImage } from '../common/OptimizedImage';
import { LikeButton } from '../favorites/LikeButton';
import { ReadingListButton } from '../reading-list/ReadingListButton';
import { SerieBadgeComponent } from '../common/SerieBadge';
import { useTextOverflow } from '../../hooks/useTextOverflow';

interface ActiveAffiliate {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  link_template: string;
  icon_url: string | null;
  favicon_url: string | null;
  display_order: number;
  show_in_carousel: boolean;
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
  is_indie?: boolean;
  indie_type?: string | null;
  is_hidden_gem?: boolean;
  award_count?: number;
  nomination_count?: number;
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
  onBookClick?: (bookId: string, isbn?: string) => void;
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
const BookCarouselItemComponent = ({ book, size = 'md', onBookClick }: BookCarouselItemProps) => {
  const navigate = useSafeNavigate();
  const { resolvedTheme } = useTheme();
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [showReviewsOverlay, setShowReviewsOverlay] = useState(false);
  const [showAwardsOverlay, setShowAwardsOverlay] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isKlappentextExpanded, setIsKlappentextExpanded] = useState(false);
  const [affiliates, setAffiliates] = useState<ActiveAffiliate[]>([]);
  const { textRef: klappentextRef, isOverflowing: isKlappentextOverflowing } = useTextOverflow<HTMLParagraphElement>();

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
    setShowAwardsOverlay(false);
    setShowReviewsOverlay(prev => !prev);
  }, []);

  const handleAwardsToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReviewsOverlay(false);
    setShowAwardsOverlay(prev => !prev);
  }, []);
  
  const handleKlappentextToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsKlappentextExpanded(prev => !prev);
  }, []);
  
  const handleNavigate = useCallback(() => {
    onBookClick?.(book.id, book.isbn);
    navigate(getBookUrl(book));
  }, [navigate, book, onBookClick]);


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

  const awardTags = useMemo(() => {
    const combined = [...alwaysVisibleBadges, ...prominentTags];
    const seen = new Set<string>();
    return combined.filter(tag => {
      if (seen.has(tag.id)) return false;
      seen.add(tag.id);
      return ['Auszeichnung', 'Medienecho', 'Status'].includes(tag.type);
    });
  }, [alwaysVisibleBadges, prominentTags]);

  return (
    <div 
      className="bg-transparent flex-shrink-0 flex flex-col group relative z-[1]"
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
          <div className="absolute top-3 right-3 flex flex-col gap-2" style={{ zIndex: 150 }}>
            <BookEnrichmentBadges book={book} />
            {awardTags.length > 0 && (
              <button
                onClick={handleAwardsToggle}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-md text-white"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
                title="ONIX-Auszeichnungen anzeigen"
                data-testid="badge-onix-awards"
              >
                <Award className="w-4 h-4" />
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
                className="absolute bottom-3 left-3 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-full shadow-lg backdrop-blur-sm font-headline"
                style={{ 
                  backgroundColor: book.matchPercentage >= 75 ? 'rgba(90, 150, 144, 0.95)' : book.matchPercentage >= 50 ? 'rgba(160, 206, 200, 0.95)' : 'rgba(247, 244, 239, 0.95)',
                  color: book.matchPercentage >= 50 ? '#FFFFFF' : '#3A3A3A',
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
                      entityColor={tag.color}
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
                      entityColor={tag.color}
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
            {showReviewsOverlay && book.reviews && (
              <div 
                className="absolute inset-0 p-3 md:p-4 flex flex-col gap-2 md:gap-3 overflow-y-auto bg-white"
                style={{ zIndex: 100 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Heading 
                  as="h5" 
                  variant="h6" 
                  className="text-[#2a2a2a] !normal-case"
                >
                  Pressestimmen
                </Heading>
                
                <div className="flex flex-col gap-2 md:gap-3">
                  {book.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <Text 
                        as="p" 
                        variant="small" 
                        className="text-[#2a2a2a] !normal-case !tracking-normal leading-relaxed italic"
                      >
                        "{review.quote}"
                      </Text>
                      <Text 
                        as="p" 
                        variant="xs" 
                        className="text-[#2a2a2a] opacity-60 !normal-case !tracking-normal"
                      >
                        — {review.source}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awards Overlay - Auszeichnungen */}
            {showAwardsOverlay && awardTags.length > 0 && (
              <div 
                className="absolute inset-0 p-3 md:p-4 flex flex-col gap-2 md:gap-3 overflow-y-auto bg-white"
                style={{ zIndex: 100 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Heading 
                  as="h5" 
                  variant="h6" 
                  className="text-[#2a2a2a] !normal-case"
                >
                  Auszeichnungen
                </Heading>
                
                <div className="flex flex-wrap gap-2">
                  {awardTags.map((tag) => (
                    <div 
                      key={tag.id}
                      className="bg-[#247ba0]/10 text-[#247ba0] border border-[#247ba0]/20 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5"
                    >
                      <span className="text-xs md:text-sm whitespace-nowrap">{tag.displayName}</span>
                      <LikeButton 
                        entityId={`onix-tag-${tag.id}`}
                        entityType="tag"
                        entityTitle={tag.displayName}
                        entitySubtitle={tag.type}
                        entityColor={tag.color}
                        variant="minimal"
                        size="sm"
                        iconColor="#247ba0"
                        backgroundColor="transparent"
                      />
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
        <div className="flex flex-col gap-1 flex-1 overflow-hidden">
          <p className="book-card-title flex-shrink-0">
            {book.title}
          </p>
          
          <p className="book-card-author flex-shrink-0">
            {book.author}
          </p>
          
          {/* Klappentext - nur dieser Bereich expandiert */}
          {(book.klappentext || book.shortDescription) && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className={`${isKlappentextExpanded ? 'flex-1 overflow-y-auto' : 'flex-shrink-0'}`}>
                <p 
                  ref={klappentextRef}
                  className={`book-card-klappentext ${isKlappentextExpanded ? '' : 'line-clamp-6 md:line-clamp-5'}`}
                >
                  {book.klappentext || book.shortDescription}
                </p>
              </div>
              {(isKlappentextOverflowing || isKlappentextExpanded) && (
                <button
                  onClick={handleKlappentextToggle}
                  className="text-left underline hover:no-underline transition-all mt-0.5 flex-shrink-0"
                  style={{
                    color: '#247ba0',
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem'
                  }}
                >
                  {isKlappentextExpanded ? 'Weniger lesen' : 'Mehr lesen'}
                </button>
              )}
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
            
            <ReadingListButton
              bookId={`book-${book.id}`}
              bookTitle={book.title}
              bookAuthor={book.author}
              bookCover={book.coverImage}
              size="md"
              iconColor="#3A3A3A"
            />
            
            {/* Affiliate Buttons - dynamisch aus DB */}
            {book.isbn && affiliates.length > 0 && (
              <div className="flex items-center gap-1.5">
                {affiliates.filter(aff => aff.show_in_carousel).map((aff) => (
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