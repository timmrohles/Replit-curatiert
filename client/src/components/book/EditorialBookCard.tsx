import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Tags, ArrowRight, Quote, ChevronDown, Award, Gem } from 'lucide-react';

import { Button } from '../ui/button';
import { Heading, Text } from '../ui/typography';
import { getBookUrl } from '../../utils/bookUrlHelper';
import { ReadingListButton } from '../reading-list/ReadingListButton';
import { getAllONIXTags, ONIXTag } from '../../utils/api';
import { ONIX_TAG_COLORS, ONIX_TAG_ICONS } from '../../utils/tag-colors';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { LikeButton } from '../favorites/LikeButton';
import { useTextOverflow } from '../../hooks/useTextOverflow';

function LaurelWreathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21c1-3 1.5-6 1-9" />
      <path d="M19 21c-1-3-1.5-6-1-9" />
      <path d="M4.5 16c-1.5-1-2.5-3-2.5-5 1.5.5 3 1.5 4 3" />
      <path d="M19.5 16c1.5-1 2.5-3 2.5-5-1.5.5-3 1.5-4 3" />
      <path d="M4 11c-1.5-1.5-2-4-1.5-6.5 1.5 1 3 2.5 3.5 4.5" />
      <path d="M20 11c1.5-1.5 2-4 1.5-6.5-1.5 1-3 2.5-3.5 4.5" />
      <path d="M7 5C6 3 5.5 1 6 0c1.5 1 2.5 2.5 3 4.5" />
      <path d="M17 5c1-2 1.5-4 1-5-1.5 1-2.5 2.5-3 4.5" />
      <path d="M12 22V18" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const OUTCOME_LABELS: Record<string, string> = {
  winner: 'Gewinner',
  shortlist: 'Shortlist',
  longlist: 'Longlist',
  nominee: 'Nominiert',
  finalist: 'Finalist',
  special: 'Sonderpreis',
};

function EnrichmentBadge({ 
  type, 
  label, 
  icon, 
  bgColor, 
  textColor,
  tooltipContent 
}: { 
  type: string;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  tooltipContent?: React.ReactNode;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={badgeRef}
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
    >
      <div 
        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full shadow-sm cursor-default select-none transition-transform hover:scale-105"
        style={{ backgroundColor: bgColor, color: textColor }}
        data-testid={`badge-${type}`}
      >
        {icon}
        <span>{label}</span>
      </div>
      {showTooltip && tooltipContent && (
        <div 
          className="absolute top-full left-0 mt-1.5 z-[200] min-w-[200px] max-w-[280px] bg-card border border-border rounded-lg shadow-lg p-3 text-left"
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
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);
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
                  className="book-card-icon-button w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
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
                  className="book-card-icon-button w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
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
            
            {/* Enrichment Badges - top left corner */}
            {((book.award_count && book.award_count > 0) || (book.nomination_count && book.nomination_count > 0) || book.is_hidden_gem || book.is_indie) && (
              <div className="absolute top-2 left-2 flex flex-col gap-1.5" style={{ zIndex: 52 }}>
                {book.award_count !== undefined && book.award_count > 0 && (
                  <EnrichmentBadge
                    type="award"
                    label="AUSGEZEICHNET"
                    icon={<LaurelWreathIcon className="w-3.5 h-3.5" />}
                    bgColor="var(--badge-award-bg)"
                    textColor="var(--badge-award-text)"
                    tooltipContent={
                      book.award_details && book.award_details.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-2">Auszeichnungen</p>
                          <ul className="space-y-1.5">
                            {book.award_details.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <LaurelWreathIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--badge-award-text)]" />
                                <span className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{OUTCOME_LABELS[d.outcome] || d.outcome}</span>
                                  {' '}{d.name}{d.year ? ` ${d.year}` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : undefined
                    }
                  />
                )}
                {book.is_hidden_gem && (
                  <EnrichmentBadge
                    type="hidden-gem"
                    label="HIDDEN GEM"
                    icon={<Gem className="w-3 h-3" />}
                    bgColor="var(--badge-media-bg)"
                    textColor="var(--badge-media-text)"
                    tooltipContent={
                      book.award_details && book.award_details.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-2">Nominierungen</p>
                          <ul className="space-y-1.5">
                            {book.award_details.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <Gem className="w-3 h-3 mt-0.5 flex-shrink-0 text-[var(--badge-media-text)]" />
                                <span className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{OUTCOME_LABELS[d.outcome] || d.outcome}</span>
                                  {' '}{d.name}{d.year ? ` ${d.year}` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : undefined
                    }
                  />
                )}
                {book.is_indie && (
                  <EnrichmentBadge
                    type="indie"
                    label={book.indie_type === 'selfpublisher' ? 'SELFPUBLISHER' : 'INDIE'}
                    icon={<span className="text-[10px]">◆</span>}
                    bgColor="var(--badge-status-active-bg)"
                    textColor="var(--badge-status-active-text)"
                  />
                )}
              </div>
            )}

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
            
            {/* Reviews/Kommentare Overlay */}
            {showInfoOverlay && book.reviews && (
              <div className="book-card-overlay absolute inset-0 p-4 flex flex-col gap-3 overflow-y-auto">
                <h5 className="font-headline text-base normal-case">
                  Kommentare
                </h5>
                
                <Text 
                  as="div" 
                  variant="small" 
                  className="!normal-case !tracking-normal leading-relaxed whitespace-pre-line"
                >
                  {book.reviews}
                </Text>
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
            bookId={`book-${book.id}`}
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