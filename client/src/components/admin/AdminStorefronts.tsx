import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Search, X, ExternalLink, ChevronDown, ChevronUp, BookOpen, Store } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiClient';

interface Curator {
  id: string;
  name: string;
  slug: string;
}

interface Storefront {
  id: string;
  curator_id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo_url: string;
  hero_image_url: string;
  color_scheme: Record<string, any>;
  social_media: Record<string, any>;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  curator_name?: string;
  book_series?: BookSeries[];
}

interface BookSeries {
  id: string;
  title: string;
  description: string;
  reason: string;
  occasion: string;
  type: string;
  display_order: number;
  books: SeriesBook[];
}

interface SeriesBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  isbn13: string;
}

interface SearchResult {
  id: number;
  title: string;
  isbn13: string;
  cover_url: string;
  author?: string;
}

const getAdminHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
  return {'Content-Type': 'application/json',
  };
};

export function AdminStorefronts() {
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [curators, setCurators] = useState<Curator[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStorefront, setEditingStorefront] = useState<Partial<Storefront> | null>(null);
  const [detailStorefront, setDetailStorefront] = useState<Storefront | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingSeries, setEditingSeries] = useState<Partial<BookSeries> | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<SearchResult[]>([]);
  const [bookSearchLoading, setBookSearchLoading] = useState(false);
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());

  const loadStorefronts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/storefronts`, {
            credentials: 'include',
        headers: getAdminHeaders(),
      });
      const data = await response.json();
      if (data.ok && data.data) {
        setStorefronts(data.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Storefronts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCurators = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/curators`, { credentials: 'include' });
      const data = await response.json();
      if (data.ok && data.data) {
        setCurators(
          data.data.map((c: any) => ({
            id: String(c.id),
            name: c.name || '',
            slug: c.slug || '',
          }))
        );
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kuratoren:', error);
    }
  }, []);

  useEffect(() => {
    loadStorefronts();
    loadCurators();
  }, [loadStorefronts, loadCurators]);

  const loadStorefrontDetail = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/storefronts/${id}`, {
            credentials: 'include',
        headers: getAdminHeaders(),
      });
      const data = await response.json();
      if (data.ok && data.data) {
        setDetailStorefront(data.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Storefront-Details:', error);
    }
  };

  const saveStorefront = async () => {
    if (!editingStorefront || !editingStorefront.name?.trim()) {
      alert('Bitte Name angeben');
      return;
    }
    if (!editingStorefront.curator_id) {
      alert('Bitte Kurator:in auswählen');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/storefronts`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({
          id: editingStorefront.id || undefined,
          curator_id: Number(editingStorefront.curator_id),
          name: editingStorefront.name.trim(),
          tagline: editingStorefront.tagline || '',
          description: editingStorefront.description || '',
          logo_url: editingStorefront.logo_url || '',
          hero_image_url: editingStorefront.hero_image_url || '',
          color_scheme: editingStorefront.color_scheme || {},
          social_media: editingStorefront.social_media || {},
          is_published: editingStorefront.is_published ?? false,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setEditingStorefront(null);
        loadStorefronts();
        if (detailStorefront && editingStorefront.id) {
          loadStorefrontDetail(editingStorefront.id);
        }
      } else {
        alert(data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern');
    }
  };

  const deleteStorefront = async (id: string) => {
    if (!confirm('Bookstore wirklich löschen?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/storefronts/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAdminHeaders(),
      });
      const data = await response.json();
      if (data.ok) {
        loadStorefronts();
        if (detailStorefront?.id === id) {
          setDetailStorefront(null);
        }
      } else {
        alert(data.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const saveSeries = async (storefrontId: string) => {
    if (!editingSeries || !editingSeries.title?.trim()) {
      alert('Bitte Titel angeben');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/storefronts/${storefrontId}/series`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({
          id: editingSeries.id || undefined,
          title: editingSeries.title.trim(),
          description: editingSeries.description || '',
          reason: editingSeries.reason || '',
          occasion: editingSeries.occasion || '',
          type: editingSeries.type || 'static',
          display_order: editingSeries.display_order ?? 0,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setEditingSeries(null);
        loadStorefrontDetail(storefrontId);
      } else {
        alert(data.error || 'Fehler beim Speichern der Serie');
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Serie:', error);
    }
  };

  const deleteSeries = async (storefrontId: string, seriesId: string) => {
    if (!confirm('Buchserie wirklich löschen?')) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/storefronts/${storefrontId}/series/${seriesId}`,
        {
          credentials: 'include',
      );
      const data = await response.json();
      if (data.ok) {
        loadStorefrontDetail(storefrontId);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Serie:', error);
    }
  };

  const searchBooks = async (query: string) => {
    if (!query || query.length < 2) {
      setBookSearchResults([]);
      return;
    }
    setBookSearchLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/books/search?q=${encodeURIComponent(query)}&limit=10`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (data.ok && data.data) {
        setBookSearchResults(data.data);
      } else if (Array.isArray(data)) {
        setBookSearchResults(data);
      }
    } catch (error) {
      console.error('Fehler bei der Buchsuche:', error);
    } finally {
      setBookSearchLoading(false);
    }
  };

  const addBookToSeries = async (storefrontId: string, seriesId: string, bookId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/storefronts/${storefrontId}/series/${seriesId}/books`,
        {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
          body: JSON.stringify({ book_id: bookId, display_order: 0 }),
        }
      );
      const data = await response.json();
      if (data.ok) {
        loadStorefrontDetail(storefrontId);
        setBookSearchQuery('');
        setBookSearchResults([]);
      } else {
        alert(data.error || 'Fehler beim Hinzufügen');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Buches:', error);
    }
  };

  const removeBookFromSeries = async (storefrontId: string, seriesId: string, bookId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/storefronts/${storefrontId}/series/${seriesId}/books/${bookId}`,
        {
          credentials: 'include',
      );
      const data = await response.json();
      if (data.ok) {
        loadStorefrontDetail(storefrontId);
      }
    } catch (error) {
      console.error('Fehler beim Entfernen des Buches:', error);
    }
  };

  const toggleExpanded = (seriesId: string) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else {
        next.add(seriesId);
      }
      return next;
    });
  };

  const filteredStorefronts = storefronts.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.curator_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (detailStorefront) {
    return (
      <div>
        <button
          data-testid="button-back-to-list"
          onClick={() => setDetailStorefront(null)}
          className="mb-4 px-3 py-1.5 rounded text-sm flex items-center gap-1"
          style={{ color: '#247ba0' }}
        >
          &larr; Zurück zur Liste
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              {detailStorefront.name}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#666666' }}>
              Kurator:in: {detailStorefront.curator_name || '–'} &middot;{' '}
              {detailStorefront.is_published ? (
                <span style={{ color: '#22C55E' }}>Veröffentlicht</span>
              ) : (
                <span style={{ color: '#F59E0B' }}>Entwurf</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {detailStorefront.slug && (
              <a
                data-testid="link-preview-storefront"
                href={`/storefront/${detailStorefront.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm border"
                style={{ borderColor: '#E5E7EB', color: '#247ba0' }}
              >
                <ExternalLink className="w-4 h-4" />
                Vorschau
              </a>
            )}
            <button
              data-testid="button-edit-storefront"
              onClick={() => setEditingStorefront({ ...detailStorefront })}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            >
              <Edit2 className="w-4 h-4" />
              Bearbeiten
            </button>
          </div>
        </div>

        {detailStorefront.tagline && (
          <p className="mb-2 text-sm" style={{ color: '#666666' }}>
            {detailStorefront.tagline}
          </p>
        )}
        {detailStorefront.description && (
          <p className="mb-6 text-sm" style={{ color: '#666666' }}>
            {detailStorefront.description}
          </p>
        )}

        <div className="border-t pt-6" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#3A3A3A' }}>
              Buchserien ({detailStorefront.book_series?.length || 0})
            </h3>
            <button
              data-testid="button-add-series"
              onClick={() =>
                setEditingSeries({
                  title: '',
                  description: '',
                  reason: '',
                  occasion: '',
                  type: 'static',
                  display_order: (detailStorefront.book_series?.length || 0),
                })
              }
              className="px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
              style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
            >
              <Plus className="w-4 h-4" />
              Neue Serie
            </button>
          </div>

          {editingSeries && (
            <div className="border rounded-lg p-4 mb-4" style={{ borderColor: '#247ba0', backgroundColor: '#F0F9FF' }}>
              <h4 className="font-bold mb-3" style={{ color: '#3A3A3A' }}>
                {editingSeries.id ? 'Serie bearbeiten' : 'Neue Buchserie'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#666666' }}>Titel *</label>
                  <input
                    data-testid="input-series-title"
                    type="text"
                    value={editingSeries.title || ''}
                    onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. Meine Lieblingsbücher"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#666666' }}>Typ</label>
                  <select
                    data-testid="select-series-type"
                    value={editingSeries.type || 'static'}
                    onChange={(e) => setEditingSeries({ ...editingSeries, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <option value="static">Statisch</option>
                    <option value="dynamic">Dynamisch</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1" style={{ color: '#666666' }}>Beschreibung</label>
                <textarea
                  data-testid="input-series-description"
                  value={editingSeries.description || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                  rows={2}
                  placeholder="Beschreibung der Buchserie..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#666666' }}>Anlass</label>
                  <input
                    data-testid="input-series-occasion"
                    type="text"
                    value={editingSeries.occasion || ''}
                    onChange={(e) => setEditingSeries({ ...editingSeries, occasion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. Weihnachten, Geburtstag"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#666666' }}>Begründung</label>
                  <input
                    data-testid="input-series-reason"
                    type="text"
                    value={editingSeries.reason || ''}
                    onChange={(e) => setEditingSeries({ ...editingSeries, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Warum diese Bücher?"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1" style={{ color: '#666666' }}>Anzeigereihenfolge</label>
                <input
                  data-testid="input-series-display-order"
                  type="number"
                  value={editingSeries.display_order ?? 0}
                  onChange={(e) => setEditingSeries({ ...editingSeries, display_order: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  data-testid="button-save-series"
                  onClick={() => saveSeries(detailStorefront.id)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                >
                  Speichern
                </button>
                <button
                  data-testid="button-cancel-series"
                  onClick={() => setEditingSeries(null)}
                  className="px-4 py-2 rounded-lg text-sm border"
                  style={{ borderColor: '#E5E7EB', color: '#666666' }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {(!detailStorefront.book_series || detailStorefront.book_series.length === 0) && !editingSeries && (
            <div className="text-center py-8 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F7F4EF' }}>
              <BookOpen className="w-10 h-10 mx-auto mb-2" style={{ color: '#666666' }} />
              <p style={{ color: '#666666' }}>Noch keine Buchserien vorhanden</p>
            </div>
          )}

          {detailStorefront.book_series?.map((series) => (
            <div
              key={series.id}
              className="border rounded-lg mb-3 overflow-hidden"
              style={{ borderColor: '#E5E7EB' }}
              data-testid={`series-item-${series.id}`}
            >
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                style={{ backgroundColor: '#FAFAFA' }}
                onClick={() => toggleExpanded(series.id)}
              >
                <div className="flex items-center gap-2">
                  {expandedSeries.has(series.id) ? (
                    <ChevronUp className="w-4 h-4" style={{ color: '#666666' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: '#666666' }} />
                  )}
                  <span className="font-medium" style={{ color: '#3A3A3A' }}>
                    {series.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#E5E7EB', color: '#666666' }}>
                    {series.type === 'dynamic' ? 'Dynamisch' : 'Statisch'}
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {series.books?.length || 0} Bücher
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    data-testid={`button-edit-series-${series.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSeries({ ...series });
                    }}
                    className="p-1.5 rounded"
                    style={{ color: '#247ba0' }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`button-delete-series-${series.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSeries(detailStorefront.id, series.id);
                    }}
                    className="p-1.5 rounded"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedSeries.has(series.id) && (
                <div className="px-4 py-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  {series.description && (
                    <p className="text-sm mb-3" style={{ color: '#666666' }}>
                      {series.description}
                    </p>
                  )}

                  {series.books && series.books.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>
                        Bücher in dieser Serie:
                      </p>
                      <div className="space-y-2">
                        {series.books.map((book) => (
                          <div
                            key={book.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg"
                            style={{ backgroundColor: '#F7F4EF' }}
                            data-testid={`series-book-${book.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {book.cover_url && (
                                <img
                                  src={book.cover_url}
                                  alt={book.title}
                                  className="w-8 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
                                  {book.title}
                                </p>
                                <p className="text-xs" style={{ color: '#666666' }}>
                                  {book.author || '–'}{book.isbn13 ? ` · ${book.isbn13}` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              data-testid={`button-remove-book-${book.id}`}
                              onClick={() =>
                                removeBookFromSeries(detailStorefront.id, series.id, book.id)
                              }
                              className="p-1 rounded"
                              style={{ color: '#EF4444' }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>
                      Buch hinzufügen (ISBN oder Titel suchen):
                    </p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                      <input
                        data-testid={`input-book-search-${series.id}`}
                        type="text"
                        placeholder="ISBN oder Titel eingeben..."
                        value={activeSeriesId === series.id ? bookSearchQuery : ''}
                        onFocus={() => setActiveSeriesId(series.id)}
                        onChange={(e) => {
                          setActiveSeriesId(series.id);
                          setBookSearchQuery(e.target.value);
                          searchBooks(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                      />
                    </div>
                    {activeSeriesId === series.id && bookSearchQuery.length >= 2 && (
                      <div className="mt-1 border rounded-lg max-h-48 overflow-y-auto" style={{ borderColor: '#E5E7EB' }}>
                        {bookSearchLoading ? (
                          <div className="p-3 text-center text-sm" style={{ color: '#666666' }}>
                            Suche...
                          </div>
                        ) : bookSearchResults.length === 0 ? (
                          <div className="p-3 text-center text-sm" style={{ color: '#666666' }}>
                            Keine Ergebnisse
                          </div>
                        ) : (
                          bookSearchResults.map((result) => {
                            const alreadyAdded = series.books?.some(
                              (b) => String(b.id) === String(result.id)
                            );
                            return (
                              <div
                                key={result.id}
                                className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 cursor-pointer"
                                style={{
                                  borderColor: '#F3F4F6',
                                  backgroundColor: alreadyAdded ? '#F0FDF4' : undefined,
                                }}
                                onClick={() => {
                                  if (!alreadyAdded) {
                                    addBookToSeries(detailStorefront.id, series.id, result.id);
                                  }
                                }}
                                data-testid={`search-result-${result.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  {result.cover_url && (
                                    <img
                                      src={result.cover_url}
                                      alt={result.title}
                                      className="w-6 h-9 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm" style={{ color: '#3A3A3A' }}>
                                      {result.title}
                                    </p>
                                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                      {result.isbn13 || ''}
                                    </p>
                                  </div>
                                </div>
                                {alreadyAdded ? (
                                  <span className="text-xs" style={{ color: '#22C55E' }}>
                                    Hinzugefügt
                                  </span>
                                ) : (
                                  <Plus className="w-4 h-4" style={{ color: '#247ba0' }} />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Bookstores ({storefronts.length})
          </h2>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>
            Verwalte Kurator:innen-Bookstores und Buchserien
          </p>
        </div>
        <button
          data-testid="button-new-storefront"
          onClick={() =>
            setEditingStorefront({
              name: '',
              tagline: '',
              description: '',
              curator_id: '',
              logo_url: '',
              hero_image_url: '',
              color_scheme: {},
              social_media: {},
              is_published: false,
            })
          }
          className="px-4 py-2 rounded-lg flex items-center gap-2"
          style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
        >
          <Plus className="w-4 h-4" />
          Neuer Bookstore
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            data-testid="input-search-storefronts"
            type="text"
            placeholder="Bookstores durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>
      </div>

      {editingStorefront && (
        <div className="border rounded-lg p-6 mb-6" style={{ borderColor: '#247ba0', backgroundColor: '#F0F9FF' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#3A3A3A' }}>
            {editingStorefront.id ? 'Bookstore bearbeiten' : 'Neuer Bookstore'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: '#666666' }}>Name *</label>
              <input
                data-testid="input-storefront-name"
                type="text"
                value={editingStorefront.name || ''}
                onChange={(e) => setEditingStorefront({ ...editingStorefront, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E5E7EB' }}
                placeholder="Name des Bookstore"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#666666' }}>Kurator:in *</label>
              <select
                data-testid="select-storefront-curator"
                value={editingStorefront.curator_id || ''}
                onChange={(e) =>
                  setEditingStorefront({ ...editingStorefront, curator_id: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="">Kurator:in auswählen...</option>
                {curators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1" style={{ color: '#666666' }}>Tagline</label>
            <input
              data-testid="input-storefront-tagline"
              type="text"
              value={editingStorefront.tagline || ''}
              onChange={(e) => setEditingStorefront({ ...editingStorefront, tagline: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: '#E5E7EB' }}
              placeholder="Kurzer Slogan"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1" style={{ color: '#666666' }}>Beschreibung</label>
            <textarea
              data-testid="input-storefront-description"
              value={editingStorefront.description || ''}
              onChange={(e) =>
                setEditingStorefront({ ...editingStorefront, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: '#E5E7EB' }}
              rows={3}
              placeholder="Beschreibung des Bookstore..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: '#666666' }}>Logo URL</label>
              <input
                data-testid="input-storefront-logo"
                type="text"
                value={editingStorefront.logo_url || ''}
                onChange={(e) =>
                  setEditingStorefront({ ...editingStorefront, logo_url: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E5E7EB' }}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#666666' }}>Hero-Bild URL</label>
              <input
                data-testid="input-storefront-hero"
                type="text"
                value={editingStorefront.hero_image_url || ''}
                onChange={(e) =>
                  setEditingStorefront({ ...editingStorefront, hero_image_url: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E5E7EB' }}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                data-testid="input-storefront-published"
                type="checkbox"
                checked={editingStorefront.is_published ?? false}
                onChange={(e) =>
                  setEditingStorefront({ ...editingStorefront, is_published: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm" style={{ color: '#3A3A3A' }}>
                Veröffentlicht
              </span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              data-testid="button-save-storefront"
              onClick={saveStorefront}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            >
              Speichern
            </button>
            <button
              data-testid="button-cancel-storefront"
              onClick={() => setEditingStorefront(null)}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: '#E5E7EB', color: '#666666' }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8" style={{ color: '#666666' }}>
          Lade Bookstores...
        </div>
      ) : filteredStorefronts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F7F4EF' }}>
          <Store className="w-12 h-12 mx-auto mb-3" style={{ color: '#666666' }} />
          <p style={{ color: '#666666' }}>
            {searchTerm ? 'Keine Bookstores gefunden' : 'Noch keine Bookstores vorhanden'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStorefronts.map((storefront) => (
            <div
              key={storefront.id}
              className="border rounded-lg p-4 flex items-center justify-between"
              style={{ borderColor: '#E5E7EB' }}
              data-testid={`storefront-item-${storefront.id}`}
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => loadStorefrontDetail(storefront.id)}
              >
                <div className="flex items-center gap-3">
                  {storefront.logo_url && (
                    <img
                      src={storefront.logo_url}
                      alt={storefront.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium" style={{ color: '#3A3A3A' }}>
                      {storefront.name}
                    </p>
                    <p className="text-sm" style={{ color: '#666666' }}>
                      Kurator:in: {storefront.curator_name || '–'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: storefront.is_published ? '#DCFCE7' : '#FEF3C7',
                    color: storefront.is_published ? '#166534' : '#92400E',
                  }}
                  data-testid={`status-storefront-${storefront.id}`}
                >
                  {storefront.is_published ? 'Veröffentlicht' : 'Entwurf'}
                </span>
                {storefront.slug && (
                  <a
                    href={`/storefront/${storefront.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded"
                    style={{ color: '#247ba0' }}
                    data-testid={`link-storefront-${storefront.id}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  data-testid={`button-edit-${storefront.id}`}
                  onClick={() => setEditingStorefront({ ...storefront })}
                  className="p-1.5 rounded"
                  style={{ color: '#247ba0' }}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  data-testid={`button-delete-${storefront.id}`}
                  onClick={() => deleteStorefront(storefront.id)}
                  className="p-1.5 rounded"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
