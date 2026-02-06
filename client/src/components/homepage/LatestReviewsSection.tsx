import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Share2, ShoppingCart, ArrowRight, Heart, ChevronDown } from 'lucide-react';
import { LikeButton } from '../favorites/LikeButton';
import { Button } from '../ui/button';
import { useState } from 'react';
import { useFavorites } from '../favorites/FavoritesContext';

interface Review {
  id: string;
  bookCover: string;
  bookTitle: string;
  bookAuthor: string;
  bookPublisher?: string;
  bookYear?: string;
  bookAvailability?: string;
  bookPrice?: string;
  bookBand?: string;
  bookIsbn?: string;
  curatorAvatar: string;
  curatorName: string;
  curatorFocus: string;
  reviewTitle: string;
  reviewText: string;
}

export function LatestReviewsSection() {
  const [expandedReviews, setExpandedReviews] = useState<{[key: string]: boolean}>({});
  const { isFavorite, toggleFavorite } = useFavorites();

  const toggleExpanded = (id: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Mock data - neueste Rezensionen
  const reviews: Review[] = [
    {
      id: '1',
      bookCover: 'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
      bookTitle: 'Kairos',
      bookAuthor: 'Jenny Erpenbeck',
      bookPublisher: 'Suhrkamp',
      bookYear: '2024',
      bookAvailability: 'lieferbar',
      bookPrice: '24,00 €',
      bookBand: '1',
      bookIsbn: '9783518467567',
      curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      curatorName: 'Sophie Müller',
      curatorFocus: 'Deutsche Literatur',
      reviewTitle: 'Ein Meisterwerk über Zeit und Macht',
      reviewText: 'Jenny Erpenbeck erzählt in „Kairos" eine intensive Liebesgeschichte vor dem Hintergrund der untergehenden DDR. Die Beziehung zwischen der jungen Katharina und dem deutlich älteren Hans ist von Anfang an von Machtgefällen geprägt. Erpenbeck gelingt es meisterhaft, die private Geschichte mit der politischen Zeitenwende zu verweben. Die Sprache ist präzise und poetisch zugleich, jeder Satz sitzt. Besonders beeindruckend ist, wie die Autorin die Mechanismen von Abhängigkeit und Manipulation sichtbar macht, ohne je belehrend zu wirken. Ein Roman über die Vergänglichkeit von Liebe und politischen Systemen, über die Macht der Zeit und die Zeit der Macht. Erpenbeck zeigt einmal mehr, warum sie zu den wichtigsten deutschsprachigen Autorinnen der Gegenwart gehört. Ein absolut lesenswertes Buch, das noch lange nachhallt und zum Nachdenken über Beziehungen, Freiheit und historische Verantwortung anregt.'
    },
    {
      id: '2',
      bookCover: 'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
      bookTitle: 'Eine Frage der Chemie',
      bookAuthor: 'Bonnie Garmus',
      bookPublisher: 'Piper',
      bookYear: '2023',
      bookAvailability: 'lieferbar',
      bookPrice: '22,00 €',
      bookIsbn: '9783492071925',
      curatorAvatar: 'https://images.unsplash.com/photo-1531299983330-093763e1d963?w=200',
      curatorName: 'Maurice Ökonomius',
      curatorFocus: 'Wirtschaft & Politik',
      reviewTitle: 'Feministisch, witzig und klug',
      reviewText: 'Eine brillante Chemikerin in den 1960ern kämpft gegen Sexismus und gesellschaftliche Normen. Elizabeth Zott ist eine außergewöhnliche Protagonistin: klug, eigensinnig und ihrer Zeit weit voraus. Witzig, intelligent und inspirierend – ein Roman über Wissenschaft, Selbstbestimmung und den Kampf gegen patriarchale Strukturen. Bonnie Garmus hat mit diesem Debütroman einen internationalen Bestseller geschaffen, der unterhält und gleichzeitig wichtige Fragen stellt.'
    },
    {
      id: '3',
      bookCover: 'https://i.ibb.co/6Ry6xCTH/Griechischstunden.jpg',
      bookTitle: 'Griechischstunden',
      bookAuthor: 'Han Kang',
      bookPublisher: 'Aufbau',
      bookYear: '2024',
      bookAvailability: 'lieferbar',
      bookPrice: '23,00 €',
      bookIsbn: '9783351041489',
      curatorAvatar: 'https://images.unsplash.com/photo-1677901766272-8c9d7b49f07c?w=200',
      curatorName: 'Anna Schmidt',
      curatorFocus: 'Feminismus & Gesellschaft',
      reviewTitle: 'Poetische Sprachreflexion',
      reviewText: 'Die Nobelpreisträgerin Han Kang erzählt von einer Frau, die ihre Sprache verliert und im Altgriechischen nach Heilung sucht. Ein zutiefst poetischer Roman über Trauma, Schweigen und die heilende Kraft der Sprache. Poetisch, berührend und philosophisch – Han Kang beweist erneut ihre außergewöhnliche literarische Kraft.'
    },
    {
      id: '4',
      bookCover: 'https://i.ibb.co/jZfXqRKs/Intermezzo.jpg',
      bookTitle: 'Intermezzo',
      bookAuthor: 'Sally Rooney',
      bookPublisher: 'Luchterhand',
      bookYear: '2024',
      bookAvailability: 'lieferbar',
      bookPrice: '26,00 €',
      bookIsbn: '9783630877198',
      curatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      curatorName: 'Dr. Thomas Berg',
      curatorFocus: 'Geschichte & Philosophie',
      reviewTitle: 'Emotionale Tiefe und Präzision',
      reviewText: 'Sally Rooney erforscht die komplexen Beziehungen zweier Brüder nach dem Tod ihres Vaters. Ein Roman über Trauer, Liebe und die Suche nach Verbindung in der modernen Welt. Rooneys charakteristische präzise Beobachtungsgabe macht auch diesen Roman zu einem intensiven Leseerlebnis.'
    }
  ];

  const mainReview = reviews[0];
  const secondaryReviews = reviews.slice(1, 5);

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Fjalla One' }}>
            Neueste Rezensionen
          </h2>
          <p className="text-lg text-gray-600">
            Handverlesene Buchempfehlungen unserer Kurator*innen
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review) => {
            const isExpanded = expandedReviews[review.id] || false;
            const displayText = isExpanded 
              ? review.reviewText 
              : truncateText(review.reviewText, 200);

            return (
              <div 
                key={review.id} 
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                {/* Book Cover & Curator */}
                <div className="relative">
                  <img 
                    src={review.bookCover} 
                    alt={review.bookTitle}
                    className="w-full h-64 object-cover"
                  />
                  {/* Curator Badge */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg flex items-center gap-3">
                    <img 
                      src={review.curatorAvatar} 
                      alt={review.curatorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-sm">{review.curatorName}</div>
                      <div className="text-xs text-gray-500">{review.curatorFocus}</div>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-6">
                  {/* Book Info */}
                  <div className="mb-4">
                    <h3 className="font-bold text-xl mb-1">{review.bookTitle}</h3>
                    <p className="text-gray-600 text-sm">{review.bookAuthor}</p>
                    {review.bookPublisher && review.bookYear && (
                      <p className="text-gray-500 text-xs mt-1">
                        {review.bookPublisher}, {review.bookYear}
                      </p>
                    )}
                    {review.bookPrice && (
                      <p className="text-lg font-semibold mt-2" style={{ color: '#f25f5c' }}>
                        {review.bookPrice}
                      </p>
                    )}
                  </div>

                  {/* Review Title & Text */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg mb-2">{review.reviewTitle}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {displayText}
                    </p>
                    {review.reviewText.length > 200 && (
                      <button
                        onClick={() => toggleExpanded(review.id)}
                        className="text-sm font-semibold mt-2 flex items-center gap-1 hover:underline"
                        style={{ color: '#f25f5c' }}
                      >
                        {isExpanded ? 'Weniger anzeigen' : 'Mehr lesen'}
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <LikeButton 
                      bookId={review.id}
                      isLiked={isFavorite(review.id)}
                      onToggle={() => toggleFavorite(review.id)}
                      size="sm"
                    />
                    <button 
                      className="flex-1 py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      In den Warenkorb
                    </button>
                    <button 
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button 
            className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold flex items-center gap-2 mx-auto"
          >
            Alle Rezensionen anzeigen
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}