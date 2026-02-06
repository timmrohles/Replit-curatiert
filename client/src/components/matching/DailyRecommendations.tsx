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
  badge?: 'curator' | 'popular' | 'discussed';
}

interface DailyRecommendationsProps {
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
    badge: 'curator'
  },
  {
    id: '2',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    title: 'Zwischen den Welten',
    author: 'Alex Chen',
    publisher: 'Hanser',
    year: '2024',
    price: '22,00 €',
    badge: 'popular'
  },
  {
    id: '3',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
    title: 'Stimmen der Stille',
    author: 'Nina Hoffmann',
    publisher: 'Fischer',
    year: '2024',
    price: '20,00 €',
    badge: 'discussed'
  },
  {
    id: '4',
    cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
    title: 'Das Echo der Nacht',
    author: 'Marcus Weber',
    publisher: 'Rowohlt',
    year: '2024',
    price: '26,00 €',
    badge: 'curator'
  },
  {
    id: '5',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400',
    title: 'Leuchttürme am Horizont',
    author: 'Julia Schmidt',
    publisher: 'Kiepenheuer & Witsch',
    year: '2024',
    price: '23,00 €',
    badge: 'popular'
  },
];

const getBadgeLabel = (badge?: 'curator' | 'popular' | 'discussed') => {
  switch (badge) {
    case 'curator':
      return 'Empfohlen von Kurator:innen';
    case 'popular':
      return 'Besonders beliebt';
    case 'discussed':
      return 'Stark diskutiert';
    default:
      return null;
  }
};

const getBadgeColor = (badge?: 'curator' | 'popular' | 'discussed') => {
  switch (badge) {
    case 'curator':
      return '#247ba0'; // Cerulean
    case 'popular':
      return '#f25f5c'; // Vibrant Coral
    case 'discussed':
      return '#ffe066'; // Royal Gold
    default:
      return '#3A3A3A';
  }
};

export function DailyRecommendations({ books = defaultBooks, onViewAll }: DailyRecommendationsProps) {
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
            Top-Empfehlungen des Tages
          </h2>
          <p 
            className="max-w-2xl mx-auto"
            style={{
              fontSize: '1.125rem',
              color: '#3A3A3A',
              lineHeight: '1.6'
            }}
          >
            Eine kompakte Auswahl herausragender Bücher der Plattform – täglich aktualisiert.
          </p>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
          {books.map((book) => (
            <div key={book.id} className="relative">
              {/* Badge */}
              {book.badge && (
                <div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-xs whitespace-nowrap shadow-md"
                  style={{
                    backgroundColor: getBadgeColor(book.badge),
                    color: book.badge === 'discussed' ? '#3A3A3A' : '#FFFFFF',
                  }}
                >
                  {getBadgeLabel(book.badge)}
                </div>
              )}
              
              <div className="pt-4">
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
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={onViewAll}
            className="px-8 py-6 text-base transition-all duration-300 hover:bg-teal bg-blue text-white"
          >
            Alle Empfehlungen ansehen
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Regel-Dokumentation */}
        <div 
          className="mt-12 p-6 rounded-lg border-l-4 max-w-4xl mx-auto"
          style={{
            backgroundColor: '#F5F5F0',
            borderLeftColor: '#f25f5c',
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
            📋 Logik-Regeln: "Top-Empfehlungen des Tages"
          </h3>
          <div className="space-y-3 text-sm" style={{ color: '#3A3A3A', lineHeight: '1.6' }}>
            <div>
              <strong>Auswahlkriterien (algorithmisch):</strong>
              <ul className="list-disc ml-5 mt-1">
                <li><strong>Score-Berechnung:</strong> 30% Saves + 25% Listenvorkommen + 20% Rezensionen + 15% CTR + 10% Käufe</li>
                <li>Saves und CTR werden stark zukunftsweisend gewichtet (Discovery-Indikatoren)</li>
              </ul>
            </div>
            <div>
              <strong>Qualitätsfilter:</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Ausschluss wenn: weniger als 3 Bewertungen</li>
                <li>Ausschluss wenn: durchschnittliche Bewertung &lt; 3.5</li>
                <li>Ausschluss wenn: saisonale Unpassung (z.B. Weihnachtsbuch im Mai)</li>
                <li>Ausschluss wenn: Dislikes &gt; Threshold</li>
              </ul>
            </div>
            <div>
              <strong>Kategoriale Vielfalt (erzwungen):</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Mind. 1 Belletristik</li>
                <li>Mind. 1 Sachbuch</li>
                <li>Mind. 1 diversitätsbezogener Titel (queer, feministisch, migrantische Perspektive)</li>
                <li>Mind. 1 "Rufer" (Titel, der gerade viel Gespräch erzeugt)</li>
              </ul>
            </div>
            <div>
              <strong>Kuratorischer Tages-Override:</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>1 Redakteur:in oder Super-Kurator kann 1 Titel/Tag highlighten</li>
                <li>Dieser wird automatisch oben platziert und erhält Badge "Empfehlung des Tages"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}