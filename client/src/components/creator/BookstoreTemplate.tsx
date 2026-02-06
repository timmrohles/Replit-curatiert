import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../utils/routing';
import { Button } from './ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface BookData {
  id: string | number;
  title: string;
  author: string;
  subtitle?: string;
  publisher: string;
  year: string;
  price: string;
  cover: string;
  isbn?: string;
  description?: string;
}

// Mock data - in production this would come from your database
const booksDatabase: Record<string, BookData> = {
  '1': {
    id: 1,
    title: 'Mythbusting Modern Monetary Theory',
    author: 'Maurice Ökonomius',
    subtitle: 'Eine kritische Auseinandersetzung mit gängigen Missverständnissen',
    publisher: 'Campus Verlag',
    year: '2023',
    price: '29,90 €',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    isbn: '9783593513621',
    description: 'Eine fundierte Analyse der modernen Geldtheorie und ihrer praktischen Implikationen für die Wirtschaftspolitik.'
  },
  '2': {
    id: 2,
    title: 'Geld für die Welt',
    author: 'Maurice Ökonomius',
    subtitle: 'Warum wir eine neue Wirtschaftspolitik brauchen',
    publisher: 'Ullstein',
    year: '2021',
    price: '24,00 €',
    cover: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400',
    isbn: '9783550201523',
    description: 'Ein Plädoyer für eine zukunftsorientierte Wirtschaftspolitik, die soziale Gerechtigkeit und ökologische Nachhaltigkeit vereint.'
  },
  '3': {
    id: 3,
    title: 'Die Staatsfinanzierung',
    author: 'Maurice Ökonomius',
    subtitle: 'Grundlagen moderner Geldpolitik verstehen',
    publisher: 'Beck Verlag',
    year: '2020',
    price: '26,50 €',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    isbn: '9783406756841',
    description: 'Eine verständliche Einführung in die komplexen Mechanismen moderner Staatsfinanzierung und Geldpolitik.'
  }
};

export function BookstoreTemplate() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useSafeNavigate();

  const book = bookId ? booksDatabase[bookId] : null;

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Buch nicht gefunden</h1>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[var(--charcoal)] text-white py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:text-white/80 p-0 h-auto"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Book Cover */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-sm">
              <div 
                className="aspect-[2/3] rounded-lg overflow-hidden"
                style={{ 
                  boxShadow: '8px 8px 24px rgba(0, 0, 0, 0.3)',
                  border: '1px solid #e5e5e5'
                }}
              >
                <ImageWithFallback
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right: Book Info & Purchase Options */}
          <div className="flex flex-col">
            <div className="mb-8">
              <h1 
                className="text-3xl md:text-4xl mb-2 text-foreground"
                style={{ fontFamily: 'Fjalla One' }}
              >
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-lg text-gray-600 mb-4">{book.subtitle}</p>
              )}
              <p className="text-xl font-semibold text-foreground mb-2">{book.author}</p>
              <p className="text-sm text-gray-600">
                {book.publisher}, {book.year}
              </p>
            </div>

            {book.description && (
              <div className="mb-8">
                <h2 
                  className="text-xl mb-3 text-foreground"
                  style={{ fontFamily: 'Fjalla One' }}
                >
                  Über das Buch
                </h2>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Price */}
            <div className="mb-8">
              <div className="inline-block px-6 py-3 bg-[var(--cerulean)] text-white rounded-lg">
                <span className="text-sm">ab</span>
                <span className="text-2xl font-bold ml-2">{book.price}</span>
              </div>
            </div>

            {/* Purchase Options */}
            <div className="space-y-4">
              <h2 
                className="text-xl mb-4 text-foreground"
                style={{ fontFamily: 'Fjalla One' }}
              >
                Kaufoptionen
              </h2>

              {/* bücher.de */}
              {book.isbn && (
                <a
                  href={`https://www.buecher.de/go/?isbn=${book.isbn}&partner=coratiert`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-[var(--cerulean)] transition-all group"
                >
                  <img 
                    src="https://www.google.com/s2/favicons?domain=buecher.de&sz=64"
                    alt="bücher.de"
                    className="w-8 h-8"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">bücher.de</p>
                    <p className="text-sm text-gray-600">Versandkostenfrei ab 15€</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[var(--cerulean)] transition-colors" />
                </a>
              )}

              {/* genialokal */}
              {book.isbn && (
                <a
                  href={`https://www.genialokal.de/produkt/${book.isbn}/?partnerId=coratiert-genial`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-[var(--cerulean)] transition-all group"
                >
                  <img 
                    src="https://www.google.com/s2/favicons?domain=genialokal.de&sz=64"
                    alt="genialokal"
                    className="w-8 h-8"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">genialokal</p>
                    <p className="text-sm text-gray-600">Lokale Buchhandlungen unterstützen</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[var(--cerulean)] transition-colors" />
                </a>
              )}

              {/* Publisher */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Weitere Informationen beim Verlag:</p>
                <a
                  href={`https://www.${book.publisher.toLowerCase().replace(' ', '')}.de`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[var(--cerulean)] hover:underline"
                >
                  {book.publisher}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}