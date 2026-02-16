import React, { useState, useEffect, useMemo } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Tags, ArrowRight, Quote, ChevronDown, Award } from 'lucide-react';
import { useTheme } from '../../utils/ThemeContext';
import { Button } from '../ui/button';
import { Heading, Text } from '../ui/typography';
import { getBookUrl } from '../../utils/bookUrlHelper';
import { ReadingListButton } from '../reading-list/ReadingListButton';
import { getAllONIXTags, ONIXTag } from '../../utils/api';
import { ONIX_TAG_COLORS, ONIX_TAG_ICONS } from '../../utils/tag-colors';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { LikeButton } from '../favorites/LikeButton';

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

export interface EditorialBookCardData {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  isbn?: string;
  shortDescription?: string;
  klappentext?: string;
  onixTagIds?: string[];
  matchPercentage?: number;
  reviews?: string; // Kommentare/Pressestimmen als String
}

interface EditorialBookCardProps {
  book: EditorialBookCardData;
}

/**
 * Editorial Book Card - Minimalistisches Design für kuratierte Sections
 * 
 * Layout:
 * - Titel & Autor ÜBER dem Cover ("TITEL von AUTOR")
 * - Buchcover mit Icons (Tags, Info)
 * - Strich unter Cover
 * - Klappentext UNTER dem Cover
 * - KEINE Preise, kein Verlag, keine Reihe
 */


export function EditorialBookCard({ book }: EditorialBookCardProps) {
  const navigate = useSafeNavigate();
  const { resolvedTheme } = useTheme();
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [showAwardsOverlay, setShowAwardsOverlay] = useState(false);
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);
  const [isKlappentextExpanded, setIsKlappentextExpanded] = useState(false);
  const [affiliates, setAffiliates] = useState<ActiveAffiliate[]>([]);

  useEffect(() => {
    getAllONIXTags()
      .then(setOnixTags)
      .catch(error => {
        console.error('Error loading ONIX tags in EditorialBookCard:', error);
        setOnixTags([]);
      });
    fetchActiveAffiliates().then(setAffiliates);
  }, []);

  // Get ONIX tags for this book
  const bookONIXTags = useMemo(() => {
    if (!onixTags.length || !book.onixTagIds?.length) return [];
    
    return onixTags.filter(tag => 
      book.onixTagIds?.includes(tag.id) && tag.visible
    );
  }, [onixTags, book.onixTagIds]);

  const awardTags = useMemo(() =>
    bookONIXTags.filter(tag => ['Auszeichnung', 'Medienecho', 'Status'].includes(tag.type)),
    [bookONIXTags]
  );

  // Separate hover vs always-visible badges
  const hoverTags = useMemo(() => 
    bookONIXTags.filter(tag => tag.visibilityLevel === 'hover'),
    [bookONIXTags]
  );

  const alwaysVisibleBadges = useMemo(() => 
    bookONIXTags.filter(tag => tag.visibilityLevel === 'prominent'),
    [bookONIXTags]
  );

  const displayDescription = book.shortDescription || book.klappentext || '';

  return (
    <div className="group relative" onClick={() => navigate(getBookUrl(book))}>
      <div className="pl-2 pb-2 pt-1 pr-1 md:pl-3 md:pb-3 md:pt-2 md:pr-2 relative">
        {/* Buchcover Container */}
        <div className="relative">
          {/* Cover */}
          <div 
            className="aspect-[2/3] bg-muted rounded-[1px] relative overflow-hidden cursor-pointer" 
            style={{ 
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-book-cover)'
            }}
          >
            {/* Interactive Icons - oben rechts INNERHALB des Covers */}
            <div className="absolute top-3 right-3 flex flex-col gap-2" style={{ zIndex: 150 }}>
              {/* Pressestimmen Button */}
              {book.reviews && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoOverlay(!showInfoOverlay);
                    setShowAwardsOverlay(false);
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                  style={{ 
                    backgroundColor: '#247ba0',
                    color: '#FFFFFF'
                  }}
                  title="Pressestimmen anzeigen"
                  data-testid="button-pressestimmen"
                >
                  <Quote className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
              
              {/* Auszeichnungen Icon */}
              {awardTags.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAwardsOverlay(!showAwardsOverlay);
                    setShowInfoOverlay(false);
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                  style={{ 
                    backgroundColor: '#247ba0',
                    color: '#FFFFFF'
                  }}
                  title="Auszeichnungen anzeigen"
                  data-testid="button-awards"
                >
                  <Award className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
            </div>

            <ImageWithFallback
              src={book.coverImage}
              alt={`Buchcover: ${book.title} von ${book.author}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            
            {/* Match Badge */}
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
              <div className="absolute inset-0 p-4 flex flex-col gap-3 overflow-y-auto bg-white">
                <h5 className="text-[#2a2a2a] font-headline text-base normal-case">
                  Auszeichnungen
                </h5>
                
                <div className="flex flex-wrap gap-2">
                  {awardTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="bg-[#247ba0]/10 text-[#247ba0] border border-[#247ba0]/20 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs"
                    >
                      <span>{tag.displayName}</span>
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
            
            {/* Reviews/Kommentare Overlay */}
            {showInfoOverlay && book.reviews && (
              <div className="absolute inset-0 p-4 flex flex-col gap-3 overflow-y-auto bg-white">
                <h5 className="text-[#2a2a2a] font-headline text-base normal-case">
                  Kommentare
                </h5>
                
                <Text 
                  as="div" 
                  variant="small" 
                  className="text-[#2a2a2a] !normal-case !tracking-normal leading-relaxed whitespace-pre-line"
                >
                  {book.reviews}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Titel & Autor UNTER dem Cover */}
        <div className="flex flex-col gap-0.5 mt-3">
          <Heading 
            as="p" 
            variant="h4" 
            className="text-foreground line-clamp-2 normal-case"
            style={{ minHeight: '2.8em', lineHeight: '1.4em' }}
          >
            {book.title}
          </Heading>
          
          <Text 
            as="p" 
            variant="small" 
            className="text-gray-500 normal-case font-bold tracking-normal line-clamp-1"
          >
            {book.author}
          </Text>
        </div>

        {/* Klappentext */}
        {displayDescription && (
          <>
            <div className={`${isKlappentextExpanded ? 'mt-2' : 'h-[5.5rem] md:h-[6rem] overflow-hidden mt-2'}`}>
              <Text 
                as="p" 
                variant="small" 
                className={`!text-[0.8rem] md:!text-[0.85rem] leading-relaxed ${isKlappentextExpanded ? '' : 'line-clamp-5 md:line-clamp-4'}`}
                style={{ 
                  color: 'var(--color-foreground-muted)'
                }}
              >
                {displayDescription}
              </Text>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsKlappentextExpanded(!isKlappentextExpanded);
              }}
              className="flex items-center gap-1 mt-2 text-cerulean hover:opacity-80 transition-colors"
            >
              <Text as="span" variant="small" className="text-cerulean !normal-case !tracking-normal !font-normal">
                {isKlappentextExpanded ? 'Weniger lesen' : 'Mehr lesen'}
              </Text>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isKlappentextExpanded ? 'rotate-180' : ''}`} />
            </button>
          </>
        )}

        {/* Trennlinie über Action-Icons */}
        <div 
          className="w-full h-[1px] mt-3 mb-1"
          style={{ backgroundColor: 'var(--color-charcoal, #2a2a2a)', opacity: 0.15 }}
        />

        {/* Action Bar */}
        <div className="flex items-center gap-1.5 pt-0.5">
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
            onClick={(e) => {
              e.stopPropagation();
              navigate(getBookUrl(book));
            }}
            title="Buchdetails ansehen"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}