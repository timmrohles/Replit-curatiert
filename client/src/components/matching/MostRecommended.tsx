import { useRef, useState, useCallback } from 'react';
import { BookCard } from '../book/BookCard';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  price: string;
  publisher?: string;
  year?: string;
  stats?: {
    lists?: number;
    saves?: number;
    reviews?: number;
  };
}

interface MostRecommendedProps {
  books?: Book[];
  onViewAll?: () => void;
}

const defaultBooks: Book[] = [
  {
    id: '1',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    title: 'Die Wände der Zeit',
    author: 'Sarah Mitchell',
    publisher: 'Suhrkamp',
    year: '2024',
    price: '24,00 €',
    stats: { lists: 42, saves: 328, reviews: 87 }
  },
  {
    id: '2',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    title: 'Zwischen den Welten',
    author: 'Alex Chen',
    publisher: 'Hanser',
    year: '2024',
    price: '22,00 €',
    stats: { lists: 38, saves: 291, reviews: 64 }
  },
  {
    id: '3',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
    title: 'Stimmen der Stille',
    author: 'Nina Hoffmann',
    publisher: 'Fischer',
    year: '2024',
    price: '20,00 €',
    stats: { lists: 35, saves: 267, reviews: 52 }
  },
  {
    id: '4',
    cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
    title: 'Das Echo der Nacht',
    author: 'Marcus Weber',
    publisher: 'Rowohlt',
    year: '2024',
    price: '26,00 €',
    stats: { lists: 33, saves: 245, reviews: 48 }
  },
  {
    id: '5',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400',
    title: 'Leuchttürme am Horizont',
    author: 'Julia Schmidt',
    publisher: 'Kiepenheuer & Witsch',
    year: '2024',
    price: '23,00 €',
    stats: { lists: 31, saves: 223, reviews: 41 }
  },
  {
    id: '6',
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    title: 'Morgen wird alles anders',
    author: 'Lisa Bauer',
    publisher: 'Ullstein',
    year: '2024',
    price: '21,00 €',
    stats: { lists: 29, saves: 198, reviews: 36 }
  },
  {
    id: '7',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    title: 'Die Flüsternden',
    author: 'Thomas Klein',
    publisher: 'Piper',
    year: '2024',
    price: '25,00 €',
    stats: { lists: 27, saves: 176, reviews: 32 }
  },
  {
    id: '8',
    cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    title: 'Im Schatten des Lichts',
    author: 'Anna Müller',
    publisher: 'Droemer',
    year: '2024',
    price: '22,50 €',
    stats: { lists: 25, saves: 154, reviews: 28 }
  },
  {
    id: '9',
    cover: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
    title: 'Der letzte Sommer',
    author: 'Felix Wagner',
    publisher: 'DuMont',
    year: '2024',
    price: '24,50 €',
    stats: { lists: 23, saves: 142, reviews: 25 }
  },
  {
    id: '10',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    title: 'Endlose Tage',
    author: 'Sophie Berg',
    publisher: 'Penguin',
    year: '2024',
    price: '23,50 €',
    stats: { lists: 21, saves: 128, reviews: 22 }
  },
];

export function MostRecommended({ books = defaultBooks, onViewAll }: MostRecommendedProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 
            className="mb-3"
            style={{
              fontFamily: 'Fjalla One',
              fontSize: '2.5rem',
              color: '#3A3A3A',
              lineHeight: '1.2'
            }}
          >
            Die meistempfohlenen Bücher auf coratiert
          </h2>
          <p 
            className="max-w-2xl mx-auto"
            style={{
              fontSize: '1.125rem',
              color: '#3A3A3A',
              lineHeight: '1.6'
            }}
          >
            Eine übergeordnete Auswahl aus allen Kurationen, Rezensionen und Nutzerinteraktionen.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative -mx-4 md:-mx-8 mb-8">
          {/* Left Arrow */}
          {/* Desktop Left Button */}
          {canScrollLeft && books.length >= 6 && (
            <button
              onClick={() => scroll('left')}
              className="carousel-nav-arrow carousel-nav-arrow-left hidden md:block"
              aria-label="Vorherige Bücher"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" className="dark:stroke-white" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {/* Mobile Left Button */}
          {canScrollLeft && books.length >= 3 && (
            <button
              onClick={() => scroll('left')}
              className="carousel-nav-arrow carousel-nav-arrow-left md:hidden"
              aria-label="Vorherige Bücher"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" className="dark:stroke-white" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {/* Desktop Right Button */}
          {canScrollRight && books.length >= 6 && (
            <button
              onClick={() => scroll('right')}
              className="carousel-nav-arrow carousel-nav-arrow-right hidden md:block"
              aria-label="Nächste Bücher"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" className="dark:stroke-white" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {/* Mobile Right Button */}
          {canScrollRight && books.length >= 3 && (
            <button
              onClick={() => scroll('right')}
              className="carousel-nav-arrow carousel-nav-arrow-right md:hidden"
              aria-label="Nächste Bücher"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" className="dark:stroke-white" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Scroll Container */}
          <div 
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="overflow-x-auto pb-4 pl-4 md:pl-8 scrollbar-hide scroll-smooth overscroll-x-contain"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-3">
              {books.map((book, index) => (
                <div key={book.id} className="flex-shrink-0 w-44 md:w-60">
                  {/* Ranking Badge */}
                  <div 
                    className="mb-2 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: index < 3 ? '#ffe066' : '#F5F5F0',
                      color: '#3A3A3A',
                    }}
                  >
                    <span className="mr-1">#</span>
                    <span>{index + 1}</span>
                  </div>

                  <BookCard
                    cover={book.cover}
                    title={book.title}
                    author={book.author}
                    price={book.price}
                    publisher={book.publisher}
                    year={book.year}
                    cardBackgroundColor="white"
                    textColor="#3A3A3A"
                    iconColor="#3A3A3A"
                  />

                  {/* Stats */}
                  {book.stats && (
                    <div className="mt-2 flex gap-3 text-xs px-2" style={{ color: '#3A3A3A' }}>
                      {book.stats.lists !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <span>{book.stats.lists}</span>
                        </div>
                      )}
                      {book.stats.saves !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>{book.stats.saves}</span>
                        </div>
                      )}
                      {book.stats.reviews !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span>{book.stats.reviews}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={onViewAll}
            className="px-8 py-6 text-base transition-all duration-300 hover:bg-teal bg-blue text-white"
          >
            Alle meistempfohlenen Bücher ansehen
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Regel-Dokumentation */}
        <div 
          className="mt-12 p-6 rounded-lg border-l-4 max-w-4xl mx-auto"
          style={{
            backgroundColor: '#F5F5F0',
            borderLeftColor: '#70c1b3',
          }}
        >
          <h3 
            className="mb-3"
            style={{
              fontFamily: 'Fjalla One',
              fontSize: '1.25rem',
              color: '#3A3A3A',
            }}
          >
            📋 Logik-Regeln: "Die meistempfohlenen Bücher"
          </h3>
          <div className="space-y-3 text-sm" style={{ color: '#3A3A3A', lineHeight: '1.6' }}>
            <div>
              <strong>Meta-Score-Berechnung:</strong>
              <ul className="list-disc ml-5 mt-1">
                <li><strong>MetaScore:</strong> 50% Listenvorkommen + 20% Saves + 15% Rezensionen + 10% Käufe + 5% CTR</li>
                <li>Listen sind der Kern der Plattform → stark gewichtet</li>
              </ul>
            </div>
            <div>
              <strong>Cluster- und Bias-Regel (gegen Überrepräsentation):</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Max. 2 Bücher pro Genre-Cluster in den Top 20</li>
                <li>Max. 1 Buch pro Autor</li>
                <li>Keine Serien-Dominanz (nur Band 1 erlaubt)</li>
                <li>Keine Übergewichtung einzelner Kurator:innen (keine Top-Listen-Hegemonie)</li>
              </ul>
            </div>
            <div>
              <strong>Aktualitäts-Gleichgewicht:</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>40% Neu (0–12 Monate)</li>
                <li>60% Backlist</li>
                <li>Mischung aus Vertrauen UND frischer Inspiration</li>
              </ul>
            </div>
            <div>
              <strong>Kuratorischer Feinschliff (optional):</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Redakteur:in kann Bücher sperren (Blacklist: problematische Inhalte)</li>
                <li>Redakteur:in kann Bücher bevorzugen (Whitelist: z.B. Preisgewinner:innen)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}