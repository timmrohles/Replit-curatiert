import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from './homepage/SectionHeader';
import { Heading } from './ui/typography';

interface MediaBook {
  id: number;
  cover: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  price: string;
}

interface MediaCardProps {
  embedUrl: string;
  books: MediaBook[];
  carouselRef: React.RefObject<HTMLDivElement>;
  scrollLeft: number;
  onScroll: (direction: 'left' | 'right') => void;
  podcastTitle: string;
  episodeNumber: string;
  episodeDate: string;
}

function MediaCard({ embedUrl, books, carouselRef, scrollLeft, onScroll, podcastTitle, episodeNumber, episodeDate }: MediaCardProps) {
  return (
    <div>
      {/* Podcast Metadaten - ÜBER dem iframe */}
      <div className="mb-4 space-y-2">
        <h3 className="text-white text-xl font-semibold">{podcastTitle}</h3>
        <div className="flex items-center gap-2 text-sm text-white opacity-80">
          <span>Folge {episodeNumber}</span>
          <span>•</span>
          <span>{episodeDate}</span>
        </div>
        <a 
          href="#" 
          className="inline-block text-sm text-[#247ba0] hover:text-[#ffe066] hover:underline transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Navigation zur Themenseite sobald verfügbar
          }}
        >
          Zur Themenseite →
        </a>
      </div>
      
      <div className="mb-6">
        <iframe 
          data-testid="embed-iframe" 
          style={{ borderRadius: '12px' }}
          src={embedUrl}
          width="100%" 
          height="352" 
          frameBorder="0" 
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy"
          title="Podcast Embed"
        />
      </div>
      
      {/* Besprochene Bücher */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Heading as="h4" variant="h4" className="text-white text-sm">
            Besprochene Bücher
          </Heading>
          <div className="flex gap-2">
            {scrollLeft > 0 && (
              <button 
                onClick={() => onScroll('left')}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Vorherige Bücher"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <button 
              onClick={() => onScroll('right')}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Nächste Bücher"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div 
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map((book) => (
            <div key={book.id} className="group cursor-pointer flex-shrink-0 w-40 sm:w-48">
              <img 
                src={book.cover} 
                alt={`Buchcover: ${book.title}`}
                className="w-full aspect-[2/3] rounded mb-3"
                style={{
                  boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)',
                  objectFit: 'contain'
                }}
              />
              <div className="space-y-1">
                <h5 className="text-sm text-white group-hover:text-[#247ba0] transition-colors line-clamp-2">
                  {book.title}
                </h5>
                <p className="text-xs text-white opacity-70">{book.author}</p>
                {book.publisher && book.year && (
                  <p className="text-xs text-white opacity-70">{book.publisher}, {book.year}</p>
                )}
                <p className="text-sm text-white">{book.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GenreCategoriesSection() {
  const mediaBooks1Ref = useRef<HTMLDivElement>(null);
  const mediaBooks2Ref = useRef<HTMLDivElement>(null);
  const mediaBooks3Ref = useRef<HTMLDivElement>(null);

  const [mediaBooks1ScrollLeft, setMediaBooks1ScrollLeft] = useState(0);
  const [mediaBooks2ScrollLeft, setMediaBooks2ScrollLeft] = useState(0);
  const [mediaBooks3ScrollLeft, setMediaBooks3ScrollLeft] = useState(0);

  // Scroll handler
  const scrollMediaBooksCarousel = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Track scroll positions
  useEffect(() => {
    const handleMediaBooks1Scroll = () => {
      if (mediaBooks1Ref.current) {
        setMediaBooks1ScrollLeft(mediaBooks1Ref.current.scrollLeft);
      }
    };
    const handleMediaBooks2Scroll = () => {
      if (mediaBooks2Ref.current) {
        setMediaBooks2ScrollLeft(mediaBooks2Ref.current.scrollLeft);
      }
    };
    const handleMediaBooks3Scroll = () => {
      if (mediaBooks3Ref.current) {
        setMediaBooks3ScrollLeft(mediaBooks3Ref.current.scrollLeft);
      }
    };

    const mediaBooks1 = mediaBooks1Ref.current;
    const mediaBooks2 = mediaBooks2Ref.current;
    const mediaBooks3 = mediaBooks3Ref.current;

    if (mediaBooks1) {
      mediaBooks1.addEventListener('scroll', handleMediaBooks1Scroll);
    }
    if (mediaBooks2) {
      mediaBooks2.addEventListener('scroll', handleMediaBooks2Scroll);
    }
    if (mediaBooks3) {
      mediaBooks3.addEventListener('scroll', handleMediaBooks3Scroll);
    }

    return () => {
      if (mediaBooks1) {
        mediaBooks1.removeEventListener('scroll', handleMediaBooks1Scroll);
      }
      if (mediaBooks2) {
        mediaBooks2.removeEventListener('scroll', handleMediaBooks2Scroll);
      }
      if (mediaBooks3) {
        mediaBooks3.removeEventListener('scroll', handleMediaBooks3Scroll);
      }
    };
  }, []);

  // Books data
  const newBooks = [
    {
      id: 1,
      cover: 'https://i.ibb.co/q3d4RtzF/lichtungen.jpg',
      title: 'Lichtungen',
      author: 'Iris Wolff',
      publisher: 'Klett-Cotta',
      year: '2024',
      price: '24,00 €',
    },
    {
      id: 2,
      cover: 'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
      title: 'Kairos',
      author: 'Jenny Erpenbeck',
      publisher: 'Penguin',
      year: '2024',
      price: '24,00 €',
    },
    {
      id: 3,
      cover: 'https://i.ibb.co/fzztP0nY/die-mitternachtsbibliothek.jpg',
      title: 'Die Mitternachtsbibliothek',
      author: 'Matt Haig',
      publisher: 'Droemer',
      year: '2021',
      price: '12,00 €',
    },
    {
      id: 4,
      cover: 'https://i.ibb.co/yBkXZ74g/Klara-und-die-Sonne.jpg',
      title: 'Klara und die Sonne',
      author: 'Kazuo Ishiguro',
      publisher: 'Blessing',
      year: '2021',
      price: '24,00 €',
    },
    {
      id: 5,
      cover: 'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
      title: 'Eine Frage der Chemie',
      author: 'Bonnie Garmus',
      publisher: 'Piper',
      year: '2023',
      price: '24,00 €',
    },
    {
      id: 6,
      cover: 'https://i.ibb.co/jkqmyj9n/Der-Gesang-der-Flusskrebse.jpg',
      title: 'Der Gesang der Flusskrebse',
      author: 'Delia Owens',
      publisher: 'hanserblau',
      year: '2019',
      price: '12,00 €',
    },
  ];

  return (
    <section className="pt-0 pb-8 bg-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader 
          title="Medien & Buch"
          subtitle="Podcasts und YouTube-Episoden mit passenden Buchempfehlungen"
          backgroundColor="#2a2a2a"
        />
        
        {/* Kompakte Grid-Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Media Card 1 */}
          <MediaCard
            embedUrl="https://open.spotify.com/embed/show/0dyJdydMz1i9We0sDfpBwi?utm_source=generator"
            books={newBooks.slice(0, 6)}
            carouselRef={mediaBooks1Ref}
            scrollLeft={mediaBooks1ScrollLeft}
            onScroll={direction => scrollMediaBooksCarousel(mediaBooks1Ref, direction)}
            podcastTitle="Buchclub"
            episodeNumber="1"
            episodeDate="2024-01-15"
          />

          {/* Media Card 2 */}
          <MediaCard
            embedUrl="https://open.spotify.com/embed/show/1wZEFFvEnvPiQ5xDbLazUs?utm_source=generator"
            books={[
              {
                id: 1,
                cover: "https://i.ibb.co/GvrS3cwJ/geordnete-verh-ltnisse-von-lana-lux.jpg",
                title: "Geordnete Verhältnisse",
                author: "Lana Lux",
                publisher: "",
                year: "",
                price: ""
              },
              {
                id: 2,
                cover: "https://i.ibb.co/q3WbDPc3/1000-letzte-dates.jpg",
                title: "1000 letzte Dates",
                author: "Anna Dushime",
                publisher: "",
                year: "",
                price: ""
              }
            ]}
            carouselRef={mediaBooks2Ref}
            scrollLeft={mediaBooks2ScrollLeft}
            onScroll={direction => scrollMediaBooksCarousel(mediaBooks2Ref, direction)}
            podcastTitle="Buchclub"
            episodeNumber="2"
            episodeDate="2024-02-15"
          />

          {/* Media Card 3 */}
          <MediaCard
            embedUrl="https://open.spotify.com/embed/show/3y2v9YFuNnHOSMeK1QDxA5?utm_source=generator"
            books={[
              {
                id: 1,
                cover: "https://i.ibb.co/Z1SY1gCB/schmidt.jpg",
                title: "Tagebücher der Jahre 1957-62",
                author: "Arno Schmidt",
                publisher: "Suhrkamp",
                year: "1997",
                price: "34,00 €"
              }
            ]}
            carouselRef={mediaBooks3Ref}
            scrollLeft={mediaBooks3ScrollLeft}
            onScroll={direction => scrollMediaBooksCarousel(mediaBooks3Ref, direction)}
            podcastTitle="Buchclub"
            episodeNumber="3"
            episodeDate="2024-03-15"
          />
        </div>
      </div>
    </section>
  );
}