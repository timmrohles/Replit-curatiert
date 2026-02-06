import { useState } from 'react';
import { Plus, Edit2, Trash2, Star, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { ReviewWizard } from '../../components/review-wizard/ReviewWizard';

// Mock data
const mockReviews = [
  {
    id: '1',
    bookCover: 'https://i.ibb.co/chrm0Tbt/die-jahre.jpg',
    bookTitle: 'Die Jahre',
    bookAuthor: 'Annie Ernaux',
    type: 'Ausführlich',
    date: '2024-12-01',
    rating: 5,
    marketingConsent: true,
    hasExternalLink: true,
    externalUrl: 'https://meinblog.de/die-jahre-rezension',
    excerpt: 'Ein beeindruckendes Werk über Zeit, Erinnerung und gesellschaftlichen Wandel...'
  },
  {
    id: '2',
    bookCover: 'https://i.ibb.co/j9ZTgZRX/steppenwolf.jpg',
    bookTitle: 'Steppenwolf',
    bookAuthor: 'Hermann Hesse',
    type: 'Kurz',
    date: '2024-11-15',
    rating: 4,
    marketingConsent: false,
    hasExternalLink: false,
    excerpt: 'Zeitloser Klassiker über Identität und Gesellschaft.'
  },
  {
    id: '3',
    bookCover: 'https://i.ibb.co/JFxmY34b/empusion.jpg',
    bookTitle: 'Empusion',
    bookAuthor: 'Olga Tokarczuk',
    type: 'Ausführlich',
    date: '2024-10-28',
    rating: 5,
    marketingConsent: true,
    hasExternalLink: false,
    excerpt: 'Tokarczuks mystischer Roman verbindet Geschichte, Philosophie und Grusel...'
  }
];

export function DashboardReviews() {
  const [showWizard, setShowWizard] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);

  if (showWizard) {
    return (
      <ReviewWizard
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
          // Refresh reviews list
        }}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Rezensionen
        </h1>
        <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
          {mockReviews.length} Rezension{mockReviews.length !== 1 ? 'en' : ''} verfasst
        </p>
      </div>

      {/* Action Card */}
      <div className="rounded-lg p-4 md:p-6 shadow-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div>
          <h2 className="text-lg md:text-xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Neue Rezension schreiben
          </h2>
          <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
            Teile deine Meinung zu einem Buch
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md touch-manipulation"
          style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
        >
          <Plus className="w-5 h-5" />
          <span>Neue Rezension</span>
        </button>
      </div>

      {/* Reviews List */}
      {mockReviews.length === 0 ? (
        <div className="rounded-lg p-12 shadow-sm border text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
              <Star className="w-8 h-8" style={{ color: '#247ba0' }} />
            </div>
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Noch keine Rezensionen
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              Teile deine Meinung zu Büchern, die du gelesen hast.
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="px-6 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            >
              Erste Rezension schreiben
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {mockReviews.map((review) => (
            <div key={review.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="flex gap-4">
                {/* Book Cover */}
                <img 
                  src={review.bookCover} 
                  alt={review.bookTitle}
                  className="w-20 h-28 md:w-24 md:h-32 object-cover rounded flex-shrink-0"
                />

                {/* Review Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 truncate" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                        {review.bookTitle}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                        {review.bookAuthor}
                      </p>
                    </div>
                    
                    {/* Actions - Desktop */}
                    <div className="hidden md:flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setEditingReview(review.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: '#F3F4F6' }}
                        title="Bearbeiten"
                      >
                        <Edit2 className="w-4 h-4" style={{ color: '#247ba0' }} />
                      </button>
                      <button
                        onClick={() => {/* Delete review */}}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: '#F3F4F6' }}
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#f25f5c' }} />
                      </button>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="w-4 h-4" 
                          fill={i < review.rating ? '#ffe066' : 'none'}
                          style={{ color: i < review.rating ? '#ffe066' : '#D1D5DB' }}
                        />
                      ))}
                    </div>
                    <span className="text-sm" style={{ color: '#6B7280' }}>
                      {review.rating}/5
                    </span>
                  </div>

                  {/* Type and Date */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: review.type === 'Ausführlich' ? '#EEF2FF' : '#FEF3C7', color: review.type === 'Ausführlich' ? '#247ba0' : '#F59E0B' }}
                    >
                      {review.type}
                    </span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {new Date(review.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Excerpt */}
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#3A3A3A' }}>
                    {review.excerpt}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Marketing Consent */}
                    <div className="flex items-center gap-1">
                      {review.marketingConsent ? (
                        <>
                          <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
                          <span style={{ color: '#10B981' }}>Marketingfreigabe</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" style={{ color: '#6B7280' }} />
                          <span style={{ color: '#6B7280' }}>Keine Marketingfreigabe</span>
                        </>
                      )}
                    </div>

                    {/* External Link */}
                    {review.hasExternalLink && (
                      <a
                        href={review.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 transition-colors hover:underline"
                        style={{ color: '#247ba0' }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Externer Link
                      </a>
                    )}
                  </div>

                  {/* Actions - Mobile */}
                  <div className="md:hidden flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <button
                      onClick={() => setEditingReview(review.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                      style={{ backgroundColor: '#F3F4F6', color: '#247ba0' }}
                    >
                      <Edit2 className="w-4 h-4" />
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {/* Delete review */}}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                      style={{ backgroundColor: '#F3F4F6', color: '#f25f5c' }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}