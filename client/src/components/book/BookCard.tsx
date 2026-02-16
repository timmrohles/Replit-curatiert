import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { useSafeNavigate, buildBookUrl } from '../../utils/routing';
import { Info, Tags, Quote, Award, ArrowRight, ShoppingCart } from 'lucide-react';
import { useTheme } from '../../utils/ThemeContext';
import { Button } from '../ui/button';
import { Heading, Text } from '../ui/typography';
import { getBookUrl } from '../../utils/bookUrlHelper';
import { getAllONIXTags, ONIXTag, Book } from '../../utils/api';
import { ONIX_TAG_COLORS, ONIX_TAG_ICONS } from '../../utils/tag-colors';
import { OptimizedImage } from '../common/OptimizedImage';
import { LikeButton } from '../favorites/LikeButton';
import { ReadingListButton } from '../reading-list/ReadingListButton';
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

interface BookCardProps {
  cover?: string;
  title?: string;
  author?: string;
  price?: string;
  publisher?: string;
  year?: string;
  cardBackgroundColor?: 'white' | 'beige' | 'transparent';
  textColor?: string;
  iconColor?: string;
  borderColor?: string;
  viewMode?: 'grid' | 'list' | 'compact';
  sectionBackgroundColor?: string;
  book?: Book;
  matchPercentage?: number;
}

export const BookCard = memo(function BookCard({ 
  cover: propCover, 
  title: propTitle, 
  author: propAuthor, 
  price: propPrice, 
  publisher: propPublisher, 
  year: propYear,
  cardBackgroundColor = 'transparent',
  viewMode = 'grid',
  book,
  matchPercentage
}: BookCardProps) {
  // Support both individual props and book object
  const cover = book?.coverUrl || propCover || '';
  const title = book?.title || propTitle || '';
  const author = book?.author || propAuthor || '';
  const price = book?.price || propPrice || '';
  const newPrice = book?.newPrice || propPrice || price;
  const usedPrice = book?.usedPrice;
  const publisher = book?.publisher || propPublisher;
  const year = book?.year || propYear;
  const onixTagIds = book?.onixTagIds || [];
  const klappentext = book?.klappentext;
  const tags = book?.tags;
  const isIndie = (book as any)?.is_indie;
  const indieType = (book as any)?.indie_type;
  const isHiddenGem = (book as any)?.is_hidden_gem;
  const awardCount = (book as any)?.award_count;
  const nominationCount = (book as any)?.nomination_count;
  
  const safeNav = useSafeNavigate();
  const { resolvedTheme } = useTheme();
  const [showAwardsOverlay, setShowAwardsOverlay] = useState(false);
  const [showReviewsOverlay, setShowReviewsOverlay] = useState(false);
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [affiliates, setAffiliates] = useState<ActiveAffiliate[]>([]);

  // Load ONIX tags from centralized cache with cleanup
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
    
    fetchActiveAffiliates().then(setAffiliates);
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  const bookId = book?.id || `book-${title.toLowerCase().replace(/\s+/g, '-')}`;
  
  const bgColor = cardBackgroundColor === 'white' ? 'bg-white' : cardBackgroundColor === 'beige' ? 'bg-[#F7F4EF]' : 'bg-transparent';

  // Get prominent ONIX tags for this book
  const prominentTags = useMemo(() => {
    if (!onixTags.length || !onixTagIds.length) return [];
    
    return onixTags
      .filter(tag => 
        onixTagIds.includes(tag.id) && 
        tag.visible && 
        tag.visibilityLevel === 'prominent'
      )
      .slice(0, 3);
  }, [onixTags, onixTagIds]);

  // Get Award/Status tags that should ALWAYS be visible
  const alwaysVisibleBadges = useMemo(() => {
    if (!onixTags.length || !onixTagIds.length) return [];
    
    return onixTags
      .filter(tag => 
        onixTagIds.includes(tag.id) && 
        tag.visible && 
        tag.visibilityLevel === 'prominent' &&
        ['Auszeichnung', 'Status', 'Medienecho'].includes(tag.type)
      )
      .slice(0, 2);
  }, [onixTags, onixTagIds]);

  // Get other prominent tags (visible on hover)
  const hoverTags = useMemo(() => {
    if (!onixTags.length || !onixTagIds.length) return [];
    
    const alwaysVisibleIds = alwaysVisibleBadges.map(t => t.id);
    return prominentTags.filter(tag => !alwaysVisibleIds.includes(tag.id));
  }, [onixTags, onixTagIds, alwaysVisibleBadges, prominentTags]);

  const awardTags = useMemo(() => {
    if (!onixTags.length || !onixTagIds.length) return [];
    return onixTags.filter(tag =>
      onixTagIds.includes(tag.id) &&
      tag.visible &&
      ['Auszeichnung', 'Medienecho', 'Status'].includes(tag.type)
    );
  }, [onixTags, onixTagIds]);

  // Get Serie/Band info
  const serieInfo = useMemo(() => {
    if (!book?.seriesName || !book?.collectionNumber) return null;
    return {
      name: book.seriesName,
      number: book.collectionNumber,
      slug: book.seriesSlug
    };
  }, [book]);

  // ✅ SAFE NAVIGATION: Use safe navigate with book URL builder
  const handleBookClick = useCallback(() => {
    if (book) {
      const url = buildBookUrl(book);
      safeNav(url || `/book/${bookId}`); // Fallback to old method
    } else {
      safeNav(`/book/${bookId}`);
    }
  }, [safeNav, bookId, book]);

  return (
    <div className={`${viewMode === 'compact' ? 'w-full' : 'w-44 md:w-60'} ${viewMode === 'compact' ? 'min-h-[360px] md:min-h-[440px]' : 'min-h-[400px] md:min-h-[520px]'} ${bgColor} flex-shrink-0 flex flex-col group cursor-pointer relative z-10`} onClick={handleBookClick}>
      <div className={`${viewMode === 'compact' ? 'pl-1.5 pb-1.5 pt-1 pr-1 md:pl-2 md:pb-2 md:pt-1.5 md:pr-1.5' : 'pl-2 pb-2 pt-1 pr-1 md:pl-3 md:pb-3 md:pt-2 md:pr-2'} relative`}>
        {/* 🏆 Serie Badge - PROMINENT using new component */}
        {onixTags.length > 0 && onixTagIds.length > 0 && (
          <div className="mb-2 md:mb-3">
            <SerieBadgeComponent 
              onixTags={onixTags.filter(tag => onixTagIds.includes(tag.id))}
              context="cover"
            />
          </div>
        )}

        {/* Cover mit BookCarouselItem-Styling */}
        <div className="aspect-[2/3] bg-muted rounded-[1px] relative overflow-visible">
          {/* Interactive Icons - OUTSIDE flip container, always visible */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-50">
            {(klappentext || (book as any)?.reviews) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReviewsOverlay(!showReviewsOverlay);
                  setShowAwardsOverlay(false);
                }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                style={{ 
                  backgroundColor: '#247ba0',
                  color: '#FFFFFF'
                }}
                title="Pressestimmen anzeigen"
              >
                <Quote className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
            
            {awardTags.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAwardsOverlay(!showAwardsOverlay);
                  setShowReviewsOverlay(false);
                }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                style={{ 
                  backgroundColor: '#247ba0',
                  color: '#FFFFFF'
                }}
                title="Auszeichnungen anzeigen"
              >
                <Award className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
          </div>

          {/* Cover Container - NO FLIP */}
          <div 
            className="aspect-[2/3] bg-muted rounded-[1px] relative overflow-hidden" 
            style={{ 
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-book-cover)'
            }}
          >
            {/* Book Cover */}
            <OptimizedImage
              src={cover}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 640px) 176px, (max-width: 768px) 240px, 240px"
            />
            
            {/* Match Badge - unten links */}
            {matchPercentage !== undefined && matchPercentage > 0 && (
              <div 
                className="absolute bottom-3 left-3 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-full shadow-lg backdrop-blur-sm font-headline"
                style={{ 
                  backgroundColor: matchPercentage >= 75 ? 'rgba(90, 150, 144, 0.95)' : matchPercentage >= 50 ? 'rgba(160, 206, 200, 0.95)' : 'rgba(247, 244, 239, 0.95)',
                  color: matchPercentage >= 50 ? '#FFFFFF' : '#3A3A3A',
                  zIndex: 51
                }}
                title={`${matchPercentage}% Match zu deinem Profil`}
              >
                {matchPercentage}% Match
              </div>
            )}
            
            {/* Enrichment Badges - top right corner */}
            {(isIndie || (awardCount && awardCount > 0) || isHiddenGem) && (
              <div className="absolute top-2 right-2 flex flex-col gap-1" style={{ zIndex: 52 }}>
                {isIndie && (
                  <div className="px-2 py-0.5 text-[10px] font-semibold rounded-sm shadow-sm" style={{ backgroundColor: 'var(--color-teal, #70c1b3)', color: '#fff' }}>
                    INDIE
                  </div>
                )}
                {awardCount !== undefined && awardCount > 0 && (
                  <div className="px-2 py-0.5 text-[10px] font-semibold rounded-sm shadow-sm" style={{ backgroundColor: 'var(--color-gold, #ffe066)', color: '#2a2a2a' }}>
                    AUSGEZEICHNET
                  </div>
                )}
                {isHiddenGem && (
                  <div className="px-2 py-0.5 text-[10px] font-semibold rounded-sm shadow-sm" style={{ backgroundColor: 'var(--color-coral-vibrant, #f25f5c)', color: '#fff' }}>
                    HIDDEN GEM
                  </div>
                )}
              </div>
            )}

            {/* ONIX Tags on Cover - visible on hover */}
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
            
            {/* Always-visible badges */}
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
            
            {/* Awards Overlay */}
            {showAwardsOverlay && awardTags.length > 0 && (
              <div 
                className="absolute inset-0 p-4 flex flex-col gap-3 overflow-y-auto bg-white"
              >
                <Heading 
                  as="h5" 
                  variant="h6" 
                  className="text-[#2a2a2a] !normal-case"
                >
                  Auszeichnungen
                </Heading>
                
                <div className="flex flex-wrap gap-x-2 gap-y-2">
                  {awardTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="bg-[#247ba0]/10 text-[#247ba0] border border-[#247ba0]/20 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5"
                    >
                      <Text 
                        as="span" 
                        variant="small"
                        className="!normal-case !tracking-normal"
                      >
                        {tag.displayName}
                      </Text>
                      <LikeButton 
                        entityId={`onix-tag-${tag.id}`}
                        entityType="tag"
                        entityTitle={tag.displayName}
                        entitySubtitle={tag.type}
                        entityColor={tag.color}
                        variant="minimal"
                        size="sm"
                        iconColor="#247ba0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Reviews Overlay */}
            {showReviewsOverlay && (klappentext || book?.reviews) && (
              <div 
                className="absolute inset-0 p-4 flex flex-col gap-3 overflow-y-auto bg-white"
              >
                <Heading 
                  as="h5" 
                  variant="h6" 
                  className="text-[#2a2a2a] !normal-case"
                >
                  Pressestimmen
                </Heading>
                
                <Text 
                  as="p" 
                  variant="small" 
                  className="text-[#2a2a2a] !normal-case !tracking-normal leading-relaxed"
                >
                  {klappentext}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Produktdetails - IDENTISCH mit BookCarouselItem */}
      <div className={`${viewMode === 'compact' ? 'px-1.5 md:px-2 pb-1.5 md:pb-2' : 'px-2 md:px-3 pb-2 md:pb-3'} flex flex-col gap-1 ${viewMode === 'compact' ? 'min-h-[160px] md:min-h-[180px]' : 'min-h-[200px] md:min-h-[220px]'}`}>
        {/* Content-Bereich mit flex-grow - passt sich an */}
        <div className={`flex flex-col ${viewMode === 'compact' ? 'gap-1.5' : 'gap-2'} ${viewMode === 'compact' ? 'h-[7.5rem]' : 'h-[9rem]'}`}>
          <Heading 
            as="h4" 
            variant={viewMode === 'compact' ? 'h5' : 'h4'}
            className={`text-foreground line-clamp-2 !normal-case ${viewMode === 'compact' ? 'min-h-[3.5rem]' : 'min-h-[3rem]'}`}
          >
            {title}
          </Heading>
          
          <Text 
            as="p" 
            variant={viewMode === 'compact' ? 'small' : 'base'}
            className={`text-foreground-muted !normal-case !font-bold !tracking-normal line-clamp-2 ${viewMode === 'compact' ? 'min-h-[2rem]' : 'min-h-[2.5rem]'}`}
          >
            {author}
          </Text>
          
          {/* Publisher - IMMER anzeigen für einheitliche Höhe */}
          <Text 
            as="p" 
            variant="xs"
            className="text-foreground-muted !normal-case !font-normal !tracking-normal line-clamp-1 min-h-[1.25rem]"
          >
            {(publisher || year) ? (
              <>
                {publisher && <span>{publisher}</span>}
                {publisher && year && <span>, </span>}
                {year && <span>{year}</span>}
              </>
            ) : '\u00A0'}
          </Text>
          
          {/* Series Badge - klickbar mit Link zur Buchreihe */}
          {serieInfo && (
            <a
              href={serieInfo.slug ? `/reihen/${serieInfo.slug}/` : '#'}
              onClick={(e) => {
                if (serieInfo.slug) {
                  e.stopPropagation();
                  safeNav(`/reihen/${serieInfo.slug}/`);
                } else {
                  e.preventDefault();
                }
              }}
              className="inline-block w-fit mt-1"
            >
              <Text 
                as="span" 
                variant="xs" 
                className="series-link !normal-case !tracking-normal font-semibold"
              >
                Band {serieInfo.number} der {serieInfo.name}
              </Text>
            </a>
          )}
          
          {/* Spacer wenn keine Series - FESTE HÖHE für Uniformität */}
          {!serieInfo && (
            <div className="h-[1.5rem]" />
          )}
        </div>
        
        {/* Preis und Buttons - IMMER unten mit mt-auto */}
        <div className="mt-auto flex flex-col gap-2">
          {/* Dual Price Display (ONIX-konform: Neu + Gebraucht) - FESTE HÖHE */}
          <div className={`flex flex-col ${viewMode === 'compact' ? 'gap-1' : 'gap-1.5'} ${viewMode === 'compact' ? 'min-h-[2.5rem]' : 'min-h-[3.5rem]'}`}>
            {/* Neu-Preis (Zeile 1: Label links, Preis rechts) */}
            <div className="flex items-center justify-between gap-2">
              <Text 
                as="p" 
                variant="price-label"
                className="text-foreground !normal-case !tracking-normal"
              >
                Neu ab:
              </Text>
              <Text 
                as="p" 
                variant="price-label"
                className="text-foreground !normal-case !tracking-normal"
              >
                {newPrice}
              </Text>
            </div>
            
            {/* Gebraucht-Preis (Zeile 2: Label links, Preis rechts) */}
            {usedPrice && (
              <div className="flex items-center justify-between gap-2">
                <Text 
                  as="p" 
                  variant="price-label"
                  className="text-foreground-muted !normal-case !tracking-normal"
                >
                  Gebraucht ab:
                </Text>
                <Text 
                  as="p" 
                  variant="price-label"
                  className="text-foreground-muted !normal-case !tracking-normal"
                >
                  {usedPrice}
                </Text>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="border-t border-foreground/20 my-2" />
          
          {/* Action Buttons */}
          <div className={`flex items-center ${viewMode === 'compact' ? 'gap-1' : 'gap-1.5'}`}>
            <LikeButton 
              entityId={bookId}
              entityType="book"
              entityTitle={title}
              entitySubtitle={author}
              size={viewMode === 'compact' ? 'sm' : 'md'}
              iconColor="#3A3A3A"
            />
            
            <ReadingListButton
              bookId={bookId}
              bookTitle={title}
              bookAuthor={author}
              bookCover={cover}
              size={viewMode === 'compact' ? 'sm' : 'md'}
              iconColor="#3A3A3A"
            />
            
            {/* Affiliate Buttons - dynamisch aus DB */}
            {book?.isbn && affiliates.length > 0 && (
              <div className={`flex items-center ${viewMode === 'compact' ? 'gap-1' : 'gap-1.5'} transition-opacity duration-200`}>
                {affiliates.filter(aff => aff.show_in_carousel).map((aff) => (
                  <Button
                    key={aff.id}
                    variant="ghost"
                    size="icon"
                    className={`${viewMode === 'compact' ? 'h-8 w-8 md:h-9 md:w-9' : 'h-10 w-10 md:h-11 md:w-11'} shadow-none`}
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
                      className={viewMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'}
                      loading="lazy"
                    />
                  </Button>
                ))}
              </div>
            )}
            
            {/* Arrow Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={`${viewMode === 'compact' ? 'h-8 w-8 md:h-9 md:w-9' : 'h-10 w-10 md:h-11 md:w-11'} ml-auto shadow-none text-foreground`}
              onClick={() => book ? safeNav(getBookUrl(book)) : safeNav(`/book/${bookId}`)}
            >
              <ArrowRight className={viewMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} style={{ strokeWidth: 1.5 }} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});