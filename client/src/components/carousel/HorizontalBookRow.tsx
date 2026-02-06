import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Share2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSafeNavigate } from '../utils/routing';
import { CoRatiertLogo } from '../common/CoRatiertLogo';
import { OptimizedImage } from '../common/OptimizedImage';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { LikeButton } from '../favorites/LikeButton';
import { SerieBadgeComponent } from '../common/SerieBadge';
import { useFavorites } from '../favorites/FavoritesContext';
import { useCart } from '../shop/CartContext';
import { getBookUrl } from '../utils/bookUrlHelper';

interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  price: string;
  availability?: string;
  bookBand?: string;
  isbn?: string;
  category?: string;
  tags?: string[];
  onixTags?: Array<{
    id: string;
    name: string;
    type?: string;
    visibilityLevel?: string;
  }>; // ONIX Tags including Serie
  review: {
    curatorAvatar: string;
    curatorName: string;
    curatorFocus: string;
    reviewTitle?: string;
    reviewText?: string;
  };
}

interface HorizontalBookRowProps {
  books: Book[];
  title?: string;
  description?: string;
}

export function HorizontalBookRow({ books, title, description }: HorizontalBookRowProps) {
  const navigate = useSafeNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareBookTitle, setShareBookTitle] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const currentRef = scrollContainerRef.current;
    if (currentRef) {
      const handleScroll = () => {
        const { scrollLeft, clientWidth, scrollWidth } = currentRef;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
      };

      currentRef.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check

      return () => {
        currentRef.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const checkScrollButtons = () => {
    const currentRef = scrollContainerRef.current;
    if (currentRef) {
      const { scrollLeft, clientWidth, scrollWidth } = currentRef;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const scrollLeft = () => {
    const currentRef = scrollContainerRef.current;
    if (currentRef) {
      const step = 200;
      currentRef.scrollLeft -= step;
    }
  };

  const scrollRight = () => {
    const currentRef = scrollContainerRef.current;
    if (currentRef) {
      const step = 200;
      currentRef.scrollLeft += step;
    }
  };

  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem, removeItem, isInCart } = useCart();

  return (
    <div className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h2
                style={{
                  fontFamily: 'Fjalla One',
                  fontSize: '2rem',
                  color: 'var(--color-white)',
                  marginBottom: '0.5rem'
                }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                style={{
                  color: 'var(--charcoal)',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Left Arrow - Desktop */}
          {canScrollLeft && books.length >= 6 && (
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full transition-all duration-300 ${
                !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'
              } hover:scale-110 shadow-md`}
              style={{ 
                width: '48px', 
                height: '48px', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'var(--carousel-button-bg)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'var(--carousel-button-border)'
              }}
            >
              <ChevronLeft style={{ color: 'var(--carousel-button-icon)' }} className="w-6 h-6" />
            </button>
          )}

          {/* Right Arrow - Desktop */}
          {canScrollRight && books.length >= 6 && (
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full transition-all duration-300 ${
                !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'
              } hover:scale-110 shadow-md`}
              style={{ 
                width: '48px', 
                height: '48px', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'var(--carousel-button-bg)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'var(--carousel-button-border)'
              }}
            >
              <ChevronRight style={{ color: 'var(--carousel-button-icon)' }} className="w-6 h-6" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="flex gap-4 md:gap-6 overflow-x-auto px-4 md:px-0 pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {books.map((book) => (
              <div
                key={book.id}
                className="flex-shrink-0 w-[calc(100vw-2rem)] md:w-[280px] snap-start cursor-pointer"
                onClick={() => navigate(getBookUrl(book))}
              >
                {/* Curator Info */}
                <div className="mb-2 md:mb-3">
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full ring-2 shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden" style={{ borderColor: 'var(--cerulean)' }}>
                        <OptimizedImage
                          src={book.review.curatorAvatar}
                          alt={book.review.curatorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <p className="text-xs md:text-base font-semibold truncate flex items-center gap-1.5 text-foreground">
                          {book.review.curatorName.toLowerCase().startsWith('coratiert') ? (
                            <>
                              <CoRatiertLogo size="sm" />
                              <span>{book.review.curatorName.replace(/^coratiert\s*/i, '')}</span>
                            </>
                          ) : (
                            book.review.curatorName
                          )}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite({
                              id: `curator-${book.review.curatorName}`,
                              type: 'creator',
                              title: book.review.curatorName,
                              subtitle: book.review.curatorFocus,
                              image: book.review.curatorAvatar,
                            });
                          }}
                          className="flex-shrink-0 transition-transform hover:scale-110"
                          title={isFavorite(`curator-${book.review.curatorName}`) ? 'Nicht mehr folgen' : 'Folgen'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 md:w-4 md:h-4`}
                            style={{ 
                              strokeWidth: 1.5,
                              fill: isFavorite(`curator-${book.review.curatorName}`) ? 'var(--cerulean)' : 'none',
                              color: 'var(--cerulean)'
                            }}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] md:text-sm font-semibold truncate text-foreground" style={{ opacity: 0.8 }}>
                        {book.review.curatorFocus}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                {(book.review.reviewTitle || book.review.reviewText) && (
                  <div className="mb-2 md:mb-4">
                    <div className="p-2 md:p-3 rounded aspect-[4/3] md:aspect-[3/4] overflow-hidden flex flex-col" style={{ backgroundColor: 'transparent' }}>
                      {book.review.reviewTitle && (
                        <h4
                          className="mb-1 md:mb-2 flex-shrink-0 line-clamp-2"
                          style={{
                            fontFamily: 'Fjalla One',
                            color: 'var(--charcoal)',
                            fontSize: '13px',
                            lineHeight: '1.3'
                          }}
                        >
                          {book.review.reviewTitle}
                        </h4>
                      )}
                      {book.review.reviewText && (
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <p
                            className={`text-[11px] md:text-sm ${expandedReviews.has(book.id) ? '' : 'line-clamp-3 md:line-clamp-6'}`}
                            style={{
                              color: 'var(--charcoal)',
                              lineHeight: '1.4'
                            }}
                          >
                            {book.review.reviewText}
                          </p>
                          {book.review.reviewText.length > 150 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newExpanded = new Set(expandedReviews);
                                if (expandedReviews.has(book.id)) {
                                  newExpanded.delete(book.id);
                                } else {
                                  newExpanded.add(book.id);
                                }
                                setExpandedReviews(newExpanded);
                              }}
                              className="mt-1 md:mt-2 text-[10px] md:text-sm underline hover:no-underline transition-all flex-shrink-0"
                              style={{
                                color: 'var(--cerulean)',
                                fontFamily: 'inherit'
                              }}
                            >
                              {expandedReviews.has(book.id) ? 'Weniger' : 'Mehr'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Book Cover */}
                <div className="pl-1.5 md:pl-2 pb-1.5 md:pb-2 pt-1 pr-1 group relative mb-2 md:mb-3">
                  {/* 🏆 Serie Badge - PROMINENT */}
                  {book.onixTags && (
                    <div className="mb-2 flex justify-start">
                      <SerieBadgeComponent 
                        onixTags={book.onixTags} 
                        context="cover"
                      />
                    </div>
                  )}
                  
                  <div className="aspect-[2/3] bg-transparent rounded-[1px] relative" style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)', border: '1px solid #e5e5e5' }}>
                    <div className="absolute inset-0 overflow-hidden rounded-[1px]">
                      <OptimizedImage
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full rounded-[1px]"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                    
                    {/* Category and Tags */}
                    {(book.category || (book.tags && book.tags.length > 0)) && (
                      <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2 right-1.5 md:right-2 flex flex-wrap gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 50 }}>
                        {book.category && (
                          <div className="px-1.5 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-xs rounded-full shadow-lg" style={{ 
                            backgroundColor: 'var(--vibrant-coral)',
                            color: 'var(--color-white)'
                          }}>
                            {book.category}
                          </div>
                        )}
                        {book.tags && book.tags.slice(0, 1).map((tag) => (
                          <div 
                            key={tag}
                            className="px-1.5 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-xs rounded-full shadow-lg" 
                            style={{ 
                              backgroundColor: 'var(--vibrant-coral)',
                              color: 'var(--color-white)'
                            }}
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Info */}
                <div className="px-1 md:px-2">
                  <h3 className="mb-0.5 md:mb-1 line-clamp-2 leading-tight text-sm md:text-base text-foreground">
                    {book.title}
                  </h3>
                  <p className="text-[10px] md:text-xs mb-1 md:mb-2 line-clamp-1 font-semibold text-foreground">
                    {book.author}
                  </p>
                  <p className="text-[9px] md:text-xs mb-0.5 md:mb-1 text-foreground" style={{ opacity: 0.7 }}>
                    {book.publisher}, {book.year}
                  </p>
                  {book.bookBand && (
                    <p className="text-[9px] md:text-xs mb-0.5 md:mb-1 text-left" style={{ color: '#247ba0', fontFamily: 'Fjalla One', fontWeight: 'normal' }}>
                      Band {book.bookBand}
                    </p>
                  )}
                  <p className="text-sm md:text-base mb-1 md:mb-2 text-right font-semibold text-foreground">
                    ab {book.price}
                  </p>

                  {/* Icon Row */}
                  <div className="flex items-center gap-1 md:gap-1.5 pt-2 md:pt-3 border-t border-foreground">
                    <LikeButton 
                      entityId={`book-${book.id}`}
                      entityType="book"
                      entityTitle={book.title}
                      entitySubtitle={book.author}
                      entityImage={book.cover}
                      variant="minimal"
                      size="md"
                      iconColor="var(--charcoal)"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 md:h-8 md:w-8 shadow-none text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareBookTitle(book.title);
                        setShareDialogOpen(true);
                      }}
                    >
                      <Share2 className="w-3 h-3 md:w-4 md:h-4" style={{ strokeWidth: 1.5 }} />
                    </Button>
                    {/* bücher.de Affiliate Button with Favicon */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 md:h-8 md:w-8 shadow-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        const affiliatePartnerId = 'coratiert';
                        const isbn = book.isbn || '';
                        if (isbn) {
                          const affiliateUrl = `https://www.buecher.de/go/?isbn=${isbn}&partner=${affiliatePartnerId}`;
                          window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      title="Bei bücher.de kaufen"
                    >
                      <img 
                        src="https://www.google.com/s2/favicons?domain=buecher.de&sz=64"
                        alt="bücher.de"
                        className="w-3 h-3 md:w-4 md:h-4"
                        loading="lazy"
                      />
                    </Button>
                    {/* geniallokal Affiliate Button with Favicon */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 md:h-8 md:w-8 shadow-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        const genialokalPartnerId = 'coratiert-genial';
                        const isbn = book.isbn || '';
                        if (isbn) {
                          const affiliateUrl = `https://www.genialokal.de/produkt/${isbn}/?partnerId=${genialokalPartnerId}`;
                          window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      title="Bei geniallokal kaufen"
                    >
                      <img 
                        src="https://www.google.com/s2/favicons?domain=genialokal.de&sz=64"
                        alt="genialokal"
                        className="w-3 h-3 md:w-4 md:h-4"
                        loading="lazy"
                      />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 md:h-8 md:w-8 transition-colors shadow-none hidden text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isInCart(book.id)) {
                          removeItem(book.id);
                        } else {
                          addItem({
                            id: book.id,
                            title: book.title,
                            author: book.author,
                            cover: book.cover,
                            price: book.price,
                            publisher: book.publisher,
                            year: book.year
                          });
                        }
                      }}
                    >
                      <Heart className="w-3 h-3 md:w-4 md:h-4" style={{ strokeWidth: 1.5 }} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 md:h-8 md:w-8 ml-auto shadow-none text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(getBookUrl(book));
                      }}
                    >
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4" style={{ strokeWidth: 1.5 }} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>"{shareBookTitle}" teilen</DialogTitle>
            <DialogDescription>
              Teile diese Buchempfehlung mit deinen Freund:innen
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShareDialogOpen(false);
              }}
              style={{ backgroundColor: 'var(--cerulean)', color: 'var(--color-white)' }}
            >
              Link kopieren
            </Button>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Abbrechen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}