import { memo, useState, useRef, useEffect } from 'react';
import { ShoppingCart, Heart, User, Menu, X, ChevronDown, BadgeCheck } from 'lucide-react';
import { CoRatiertLogo } from '../common/CoRatiertLogo';
import { useSafeNavigate } from '../../utils/routing';
import { useFavorites } from '../favorites/FavoritesContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { LikeButton } from '../favorites/LikeButton';
import { Heading, Text } from '../ui/typography';
import { Globe } from 'lucide-react';

interface CreatorHeaderProps {
  avatar: string;
  name: string;
  focus: string;
  occasion: string;
  curationReason: string;
  showSocials?: boolean;
  bio?: string;
  websiteUrl?: string;
  isAmbassador?: boolean;
  isVerified?: boolean;
  textColor?: string;
  iconColor?: string;
  sectionBackgroundColor?: string;
  category?: string;
  categories?: string[];
  tags?: string[];
  isLCP?: boolean;
}

export const CreatorHeader = memo(function CreatorHeader({
  avatar,
  name,
  focus,
  occasion,
  curationReason,
  showSocials = false,
  bio,
  websiteUrl,
  isAmbassador = false,
  isVerified = false,
  textColor = 'white',
  iconColor = 'white',
  sectionBackgroundColor = 'transparent',
  category,
  categories,
  tags,
  isLCP = false,
}: CreatorHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLElement>(null);
  const characterLimit = 330;
  const shouldTruncate = curationReason && curationReason.length > characterLimit;
  
  const { isFavorite, toggleFavorite } = useFavorites();

  // Check if text is actually truncated (overflowing)
  useEffect(() => {
    if (textRef.current && shouldTruncate && !isExpanded) {
      const { scrollHeight, clientHeight } = textRef.current;
      setIsTruncated(scrollHeight > clientHeight);
    }
  }, [curationReason, shouldTruncate, isExpanded]);

  // Generate a unique ID from the creator's name
  const creatorId = name.toLowerCase().replace(/\s+/g, '-').replace(/[äöüß]/g, (char) => {
    const map: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
    return map[char] || char;
  });

  // Bestimme die Farblogik basierend auf dem Hintergrund
  const isTransparent = sectionBackgroundColor === 'transparent';
  
  // Check if this is an ad/publisher section
  const isAdSection = focus.includes('ANZEIGE');

  const navigate = useSafeNavigate();

  return (
    <div className="w-full text-base leading-normal text-left select-none" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => { const target = e.target as HTMLElement; if (!target.closest('[data-selectable]')) { e.preventDefault(); } }}>
      
      <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-blue ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <ImageWithFallback
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
              islcp={isLCP}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 self-center">
          <div className="flex items-center gap-2 w-fit">
            <div 
              className={`kuratorname flex items-center gap-1.5 ${
                isAdSection ? 'text-white' : 'text-cerulean'
              }`}
            >
              {name.toLowerCase().startsWith('coratiert') ? (
                <>
                  <CoRatiertLogo size="md" />
                  <span className={isAdSection ? 'text-white' : 'text-cerulean'}>
                    {name.replace(/^coratiert\s*/i, '')}
                  </span>
                </>
              ) : (
                name
              )}
              {isVerified && (
                <BadgeCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#247ba0' }} />
              )}
            </div>
            
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

          {/* Focus & Website - kompakt */}
          <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
            <Text 
              as="span"
              variant="xs" 
              className={`!text-[0.7rem] !tracking-wide ${isAdSection ? 'text-white' : 'text-foreground/70'}`}
            >
              {focus.includes('ANZEIGE') ? (
                <>
                  {focus.split('ANZEIGE')[0]}
                  <span className="text-coral font-semibold">ANZEIGE</span>
                  {focus.split('ANZEIGE')[1]}
                </>
              ) : (
                focus
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
          
          {bio && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              {/* Text nur anzeigen, wenn showMoreInfo = true */}
              {showMoreInfo && (
                <Text 
                  as="div"
                  variant="xs"
                  className={`font-normal leading-relaxed ${isAdSection ? 'text-white' : 'text-foreground'}`}
                >
                  {bio}
                </Text>
              )}
              
              {/* "Mehr Info" Link immer anzeigen */}
              <button
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="flex items-center gap-1 mt-1 text-cerulean hover:opacity-80 transition-colors"
              >
                <Text as="span" variant="xs" className="text-cerulean !text-[0.7rem] !normal-case !tracking-normal !font-normal">
                  {showMoreInfo ? 'Weniger' : 'Mehr Info'}
                </Text>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showMoreInfo ? 'rotate-180' : ''}`} />
              </button>
              
              {showMoreInfo && (
                <div className={`mt-2 pt-2 border-t ${
                  isTransparent ? 'border-charcoal/20' : 'border-white/20'
                }`}></div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full mt-4 md:mt-6 isolate">
        <Heading 
          as="h3"
          variant="h3"
          className="mb-4"
          style={{ color: '#6B7280' }}
        >
          {occasion.replace('und und', '&')}
        </Heading>
      </div>

      {/* Tags and Category Section - ISOLATED from other sections */}
      {(category || categories || (tags && tags.length > 0)) && (
        <div className="w-full mt-4 mb-4 isolate select-none" onMouseDown={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2 flex-wrap items-start">
            {/* Author Badge - Saffron */}
            <button 
              type="button"
              className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg select-none"
              style={{ backgroundColor: 'var(--color-saffron)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                {name}
              </Text>
              <LikeButton 
                entityId={creatorId}
                entityType="creator"
                entityTitle={name}
                variant="minimal"
                size="sm"
                iconColor="#ffffff"
                backgroundColor="var(--color-saffron)"
              />
            </button>

            {/* Single Category Button - Coral */}
            {!categories && category && (
              <button 
                type="button"
                className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral cursor-pointer hover:scale-105 transition-all duration-200 select-none"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/categories/${category.toLowerCase().replace(/\s+/g, '-')}`); }}
              >
                <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                  {category}
                </Text>
                <LikeButton 
                  entityId={`category-${category.toLowerCase()}`}
                  entityType="category"
                  entityTitle={category}
                  variant="minimal"
                  size="sm"
                  iconColor="#ffffff"
                  backgroundColor="var(--vibrant-coral)"
                />
              </button>
            )}
            
            {/* Multiple Categories Buttons - Coral */}
            {categories && categories.map((cat) => (
              <button 
                type="button"
                key={cat}
                className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral cursor-pointer hover:scale-105 transition-all duration-200 select-none"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/categories/${cat.toLowerCase().replace(/\s+/g, '-')}`); }}
              >
                <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                  {cat}
                </Text>
                <LikeButton 
                  entityId={`category-${cat.toLowerCase()}`}
                  entityType="category"
                  entityTitle={cat}
                  variant="minimal"
                  size="sm"
                  iconColor="#ffffff"
                  backgroundColor="var(--vibrant-coral)"
                />
              </button>
            ))}
            
            {/* Tag Buttons - Coral */}
            {tags && tags.slice(0, 2).map((tag) => (
              <button 
                type="button"
                key={tag}
                className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral cursor-pointer hover:scale-105 transition-all duration-200 select-none"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/tags/${tag.toLowerCase().replace(/\s+/g, '-')}/`); }}
              >
                <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                  {tag}
                </Text>
                <LikeButton 
                  entityId={`tag-${tag.toLowerCase()}`}
                  entityType="tag"
                  entityTitle={tag}
                  variant="minimal"
                  size="sm"
                  iconColor="#ffffff"
                  backgroundColor="var(--vibrant-coral)"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {curationReason && (
        <div className="w-full mt-4 select-text isolate" data-selectable="true" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <Text 
            as="div"
            variant="base"
            style={
              shouldTruncate && !isExpanded
                ? {
                    maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                  }
                : undefined
            }
            className={`leading-relaxed ${
              shouldTruncate && !isExpanded ? 'line-clamp-3' : ''
            } ${isAdSection ? 'text-white' : 'text-foreground'}`}
            ref={textRef}
          >
            {curationReason}
          </Text>
          {shouldTruncate && isTruncated && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-2 text-cerulean hover:opacity-80 transition-colors"
            >
              <Text as="span" variant="xs" className="text-cerulean !text-[0.7rem] !normal-case !tracking-normal !font-normal">
                {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
              </Text>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});