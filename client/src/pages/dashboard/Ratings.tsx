import { useState } from 'react';
import { Star, Plus, Edit, Trash2, Filter, X, Book, TrendingUp } from 'lucide-react';

type RatingStatus = 'draft' | 'published';

interface BookRating {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover?: string;
  rating: number;
  review?: string;
  status: RatingStatus;
  createdAt: string;
  publishedAt?: string;
}

export function DashboardRatings() {
  const [ratings, setRatings] = useState<BookRating[]>([
    {
      id: '1',
      bookTitle: 'Die Jahre',
      bookAuthor: 'Annie Ernaux',
      rating: 5,
      review: 'Ein beeindruckendes Werk über die Vergänglichkeit der Zeit und das kollektive Gedächtnis.',
      status: 'published',
      createdAt: '2025-01-10',
      publishedAt: '2025-01-10'
    },
    {
      id: '2',
      bookTitle: 'Convenience Store Woman',
      bookAuthor: 'Sayaka Murata',
      rating: 4,
      review: 'Faszinierende Geschichte über Konformität und Individualität.',
      status: 'published',
      createdAt: '2025-01-15',
      publishedAt: '2025-01-15'
    },
    {
      id: '3',
      bookTitle: 'Der Zauberberg',
      bookAuthor: 'Thomas Mann',
      rating: 5,
      status: 'draft',
      createdAt: '2025-01-20'
    }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | RatingStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRating, setEditingRating] = useState<BookRating | null>(null);

  const filteredRatings = ratings.filter(r => 
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const publishRating = (id: string) => {
    setRatings(ratings.map(r => 
      r.id === id ? { ...r, status: 'published', publishedAt: new Date().toISOString() } : r
    ));
  };

  const unpublishRating = (id: string) => {
    setRatings(ratings.map(r => 
      r.id === id ? { ...r, status: 'draft', publishedAt: undefined } : r
    ));
  };

  const deleteRating = (id: string) => {
    if (confirm('Möchtest du diese Bewertung wirklich löschen?')) {
      setRatings(ratings.filter(r => r.id !== id));
    }
  };

  const getStatusBadge = (status: RatingStatus) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
          ✓ Veröffentlicht
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
          📝 Entwurf
      </span>
    );
  };

  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Meine Bewertungen
          </h1>
          <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
            Verwalte deine Buchbewertungen und Rezensionen
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
          style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
        >
          <Plus className="w-5 h-5" />
          Buch bewerten
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {ratings.length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Gesamt</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#10B981' }}>
            {ratings.filter(r => r.status === 'published').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Veröffentlicht</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#F59E0B' }}>
            {ratings.filter(r => r.status === 'draft').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Entwürfe</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-1 text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#F59E0B' }}>
            <Star className="w-6 h-6 md:w-7 md:h-7 fill-current" />
            {avgRating}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Ø Bewertung</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
        <button
          onClick={() => setStatusFilter('all')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'all' ? '#247ba0' : '#F3F4F6',
            color: statusFilter === 'all' ? '#FFFFFF' : '#3A3A3A'
          }}
        >
          Alle ({ratings.length})
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'published' ? '#10B981' : '#F3F4F6',
            color: statusFilter === 'published' ? '#FFFFFF' : '#3A3A3A'
          }}
        >
          Veröffentlicht ({ratings.filter(r => r.status === 'published').length})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'draft' ? '#F59E0B' : '#F3F4F6',
            color: statusFilter === 'draft' ? '#FFFFFF' : '#3A3A3A'
          }}
        >
          Entwürfe ({ratings.filter(r => r.status === 'draft').length})
        </button>
      </div>

      {/* Ratings List */}
      <div className="space-y-3">
        {filteredRatings.length === 0 ? (
          <div className="rounded-lg p-12 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <Book className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Bewertungen
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              {statusFilter === 'all' ? 'Bewerte dein erstes Buch' : `Keine ${statusFilter === 'published' ? 'veröffentlichten' : 'Entwurf-'}Bewertungen`}
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg text-sm text-white"
                style={{ backgroundColor: '#247ba0' }}
              >
                Buch bewerten
              </button>
            )}
          </div>
        ) : (
          filteredRatings.map((rating) => (
            <div 
              key={rating.id}
              className="rounded-lg p-4 md:p-6 border hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                          {rating.bookTitle}
                        </h3>
                        {getStatusBadge(rating.status)}
                      </div>
                      <p className="text-xs md:text-sm mb-2" style={{ color: '#6B7280' }}>
                        von {rating.bookAuthor}
                      </p>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className="w-4 h-4"
                            style={{ 
                              color: '#F59E0B',
                              fill: i < rating.rating ? '#F59E0B' : 'none'
                            }}
                          />
                        ))}
                        <span className="ml-2 text-sm" style={{ color: '#3A3A3A' }}>
                          {rating.rating}.0
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {rating.review && (
                    <p className="text-xs md:text-sm mb-3 italic" style={{ color: '#3A3A3A' }}>
                      "{rating.review}"
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                    <span>Erstellt: {new Date(rating.createdAt).toLocaleDateString('de-DE')}</span>
                    {rating.publishedAt && (
                      <span>Veröffentlicht: {new Date(rating.publishedAt).toLocaleDateString('de-DE')}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => setEditingRating(rating)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="md:hidden">Bearbeiten</span>
                  </button>
                  
                  {rating.status === 'draft' ? (
                    <button
                      onClick={() => publishRating(rating.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                      title="Veröffentlichen"
                    >
                      ✓ <span className="md:hidden">Veröffentlichen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => unpublishRating(rating.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
                      title="Zurücknehmen"
                    >
                      📝 <span className="md:hidden">Zurücknehmen</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteRating(rating.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden">Löschen</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingRating ? 'Bewertung bearbeiten' : 'Buch bewerten'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRating(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Buchtitel
                </label>
                <input
                  type="text"
                  defaultValue={editingRating?.bookTitle}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Die Jahre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Autor/in
                </label>
                <input
                  type="text"
                  defaultValue={editingRating?.bookAuthor}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Annie Ernaux"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Bewertung
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className="text-3xl transition-all hover:scale-110"
                      style={{ color: '#F59E0B' }}
                    >
                      <Star className="w-10 h-10 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Rezension (optional)
                </label>
                <textarea
                  defaultValue={editingRating?.review}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Schreibe deine Meinung zum Buch..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRating(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRating(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
                >
                  Als Entwurf speichern
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRating(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                >
                  Veröffentlichen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
