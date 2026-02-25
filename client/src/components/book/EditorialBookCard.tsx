import React, { useState, useEffect, useMemo } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Tags, ArrowRight, ChevronDown, Award } from 'lucide-react';
import { BookEnrichmentBadges } from './BookEnrichmentBadges';

import { Button } from '../ui/button';
import { Heading, Text } from '../ui/typography';
import { getBookUrl } from '../../utils/bookUrlHelper';
import { ReadingListButton } from '../reading-list/ReadingListButton';
import { getAllONIXTags, ONIXTag } from '../../utils/api';
import { ONIX_TAG_COLORS, ONIX_TAG_ICONS } from '../../utils/tag-colors';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { LikeButton } from '../favorites/LikeButton';
import { useTextOverflow } from '../../hooks/useTextOverflow';


function EnrichmentBadge({ 
  type, 
  icon, 
  tooltipContent,
  onClick,
}: { 
  type: string;
  icon: React.ReactNode;
  tooltipContent?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button 
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 text-white"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        data-testid={`badge-${type}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) {
            onClick(e);
          } else {
            setShowTooltip(!showTooltip);
          }
        }}
      >
        {icon}
      </button>
      {showTooltip && tooltipContent && (
        <div 
          className="absolute top-0 right-full mr-2 z-[200] min-w-[200px] max-w-[280px] bg-card border border-border rounded-lg shadow-lg p-3 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

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
  reviews?: string;
  is_indie?: boolean;
  indie_type?: string | null;
  is_hidden_gem?: boolean;
  award_count?: number;
  nomination_count?: number;
  award_details?: Array<{ name: string; year?: number; outcome: string }>;
}

interface EditorialBookCardProps {
  book: EditorialBookCardData;
  onBookClick?: (bookId: string, isbn?: string) => void;
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


export function EditorialBookCard({ book, onBookClick }: EditorialBookCardProps) {
  const navigate = useSafeNavigate();
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [showAwardsOverlay, setShowAwardsOverlay] = useState(false);
  const [isKlappentextExpanded, setIsKlappentextExpanded] = useState(false);
  const [affiliates, setAffiliates] = useState<ActiveAffiliate[]>([]);
  const { textRef: klappentextRef, isOverflowing: isKlappentextOverflowing } = useTextOverflow<HTMLParagraphElement>();

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
    <div className="group relative h-full" onClick={() => { onBookClick?.(book.id, book.isbn); navigate(getBookUrl(book)); }}>
      <div className="pl-2 pb-2 pt-1 pr-1 md:pl-3 md:pb-3 md:pt-2 md:pr-2 relative flex flex-col h-full">
        {/* Buchcover Container */}
        <div className="relative">
          {/* Cover */}
          <div 
            className="book-card-cover aspect-[2/3] bg-muted relative overflow-hidden cursor-pointer"
          >
            <ImageWithFallback
              src={book.coverImage}
              alt={`Buchcover: ${book.title} von ${book.author}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            
            {/* All icons - vertical column, right side */}
            <div className="absolute top-2 right-2 flex flex-col gap-2" style={{ zIndex: 150 }}>
              <BookEnrichmentBadges book={book} />
              {awardTags.length > 0 && (
                <EnrichmentBadge
                  type="onix-awards"
                  icon={<Award className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAwardsOverlay(!showAwardsOverlay);
                  }}
                />
              )}
            </div>

            {/* Match Badge */}
            {book.matchPercentage !== undefined && book.matchPercentage > 0 && (
              <div 
                className="absolute bottom-3 left-3 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-full shadow-lg backdrop-blur-sm font-headline"
                style={{ 
                  backgroundColor: book.matchPercentage >= 75 ? 'var(--match-high-bg)' : book.matchPercentage >= 50 ? 'var(--match-medium-bg)' : 'var(--match-low-bg)',
                  color: book.matchPercentage >= 50 ? 'var(--match-high-text)' : 'var(--match-low-text)',
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
              <div className="book-card-overlay absolute inset-0 p-4 flex flex-col gap-3 overflow-y-auto">
                <h5 className="font-headline text-base normal-case">
                  Auszeichnungen
                </h5>
                
                <div className="flex flex-wrap gap-2">
                  {awardTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs"
                      style={{
                        backgroundColor: 'var(--badge-curator-bg)',
                        color: 'var(--badge-curator-text)',
                        border: '1px solid var(--badge-curator-border)'
                      }}
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
                        iconColor="var(--badge-curator-text)"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Titel & Autor UNTER dem Cover */}
        <div className="flex flex-col gap-0.5 mt-3">
          <p className="book-card-title">
            {book.title}
          </p>
          
          <p className="book-card-author">
            {book.author}
          </p>
        </div>

        {/* Klappentext */}
        <div className="flex-1 flex flex-col mt-2">
          {displayDescription ? (
            <>
              <div className={`flex-1 ${isKlappentextExpanded ? '' : 'overflow-hidden'}`}>
                <p 
                  ref={klappentextRef}
                  className={`book-card-klappentext ${isKlappentextExpanded ? '' : 'line-clamp-[8]'}`}
                >
                  {displayDescription}
                </p>
              </div>
              {(isKlappentextOverflowing || isKlappentextExpanded) && (
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
              )}
            </>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* Trennlinie über Action-Icons */}
        <div className="book-card-divider w-full border-t mt-3 mb-1" />

        {/* Action Bar */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <LikeButton 
            entityId={`book-${book.id}`}
            entityType="book"
            entityTitle={book.title}
            entitySubtitle={book.author}
            size="md" 
            iconColor="var(--color-foreground)"
          />

          <ReadingListButton
            bookId={String(book.id)}
            bookTitle={book.title}
            bookAuthor={book.author}
            bookCover={book.coverImage}
            size="md"
            iconColor="var(--color-foreground)"
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