/**
 * ==================================================================
 * ADMIN BOOKS - GOVERNANCE-KONFORM
 * ==================================================================
 * 
 * Features:
 * - Import vs. Editorial Trennung
 * - ONIX-Felder Feature-Flagged
 * - Soft Delete UI
 * - Tag Origin-Tracking
 * 
 * UI-Policy:
 * - Import-Felder sind READ-ONLY
 * - Editorial-Felder sind editierbar
 * - ONIX-Felder nur sichtbar wenn Feature-Flag aktiv
 * 
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Archive, Book, X, Save, Upload, 
  ExternalLink, Lock, PencilIcon, AlertCircle, Tag as TagIcon,
  Sparkles, Database
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiClient';
import { toast } from 'sonner';
import { FEATURE_FLAGS } from '../../utils/featureFlags';
import { getErrorMessage, logError } from '../../utils/errorHelpers';

// ==================================================================
// TYPES
// ==================================================================

interface Book {
  id: string;
  isbn13: string;
  
  // Source & Import Tracking
  source?: 'manual' | 'awin' | 'onix' | 'bulk_import';
  last_import_at?: string;
  
  // AWIN Import-Felder (read-only)
  import_title?: string;
  import_subtitle?: string;
  import_author?: string;
  import_publisher?: string;
  import_cover_url?: string;
  import_price?: number;
  import_affiliate_url?: string;
  import_availability?: string;
  
  // ONIX Import-Felder (read-only, feature-flagged)
  onix_title?: string;
  onix_subtitle?: string;
  onix_contributors?: Record<string, unknown>;
  onix_subjects?: Record<string, unknown>;
  onix_description?: string;
  
  // Editorial Override-Felder
  override_title?: string;
  override_subtitle?: string;
  override_description?: string;
  override_cover_url?: string;
  featured?: boolean;
  featured_order?: number;
  internal_notes?: string;
  seo_title?: string;
  seo_description?: string;

  // Legacy-Felder (deprecated)
  title?: string;
  author?: string;
  publisher?: string;
  cover_url?: string;
  price?: number;
  description?: string;
  publication_year?: number;
  language?: string;
  pages?: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

interface BookEditorial {
  book_id?: string;
  
  // Overrides (optional)
  override_title?: string;
  override_subtitle?: string;
  override_description?: string;
  override_cover_url?: string;
  
  // Editorial-Only
  featured?: boolean;
  featured_order?: number;
  internal_notes?: string;
  seo_title?: string;
  seo_description?: string;
  
  // Audit
  edited_by?: string;
  edited_at?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type?: string;
  source?: string;
  color?: string;
  visible?: boolean;
}

interface BookTag {
  book_id: string;
  tag_id: string;
  origin: 'manual' | 'import_awin' | 'import_onix' | 'derived_onix' | 'import_editorial';
}

// ==================================================================
// COMPONENT
// ==================================================================

export function AdminBooksNeon() {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'isbn' | 'title' | 'author' | 'publisher'>('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 25;
  
  // State
  const [loading, setLoading] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingEditorial, setEditingEditorial] = useState<BookEditorial | null>(null);
  const [savingBook, setSavingBook] = useState(false);
  
  // Tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ tag_id: string; origin: string }[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ 
    total: 0, 
    manual: 0, 
    awin: 0, 
    onix: 0,
    withEditorial: 0 
  });

  // ==================================================================
  // LOAD DATA
  // ==================================================================
  
  useEffect(() => {
    loadTags();
    loadStats();
    loadRecentBooks();
  }, []);

  const loadTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags`, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      if (!response.ok) {
        console.warn('Failed to load tags:', response.status);
        return; // Don't throw, just return
      }
      const data = await response.json();
      // Defensive: handle multiple response formats
      const tags = Array.isArray(data) ? data : (data.data || data.tags || []);
      setAvailableTags(Array.isArray(tags) ? tags : []);
    } catch (error) {
      console.error('Error loading tags:', error);
      // Don't show toast - tags are optional
      setAvailableTags([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/books?limit=10000`, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      if (!response.ok) {
        console.warn('Failed to load stats:', response.status);
        return;
      }
      const data = await response.json();
      const books = data.data || data.books || [];
      
      // Count by source
      const manual = books.filter((b: Book) => b.source === 'manual').length;
      const awin = books.filter((b: Book) => b.source === 'awin').length;
      const onix = books.filter((b: Book) => b.source === 'onix').length;
      
      // Count books with editorial data (checking if they have any editorial fields)
      const withEditorial = books.filter((b: Book) => {
        return b.override_title || b.override_subtitle || b.override_description || 
               b.override_cover_url || b.featured || b.internal_notes || 
               b.seo_title || b.seo_description;
      }).length;
      
      setStats({
        total: books.length,
        manual,
        awin,
        onix,
        withEditorial
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/books?limit=25`, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      if (!response.ok) throw new Error('Failed to load books');
      const data = await response.json();
      setBooks(data.data || data.books || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error loading books:', error);
      toast.error('Fehler beim Laden der Bücher');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      // For now, just load all books and filter client-side
      // TODO: Add search endpoint to backend
      const response = await fetch(`${API_BASE_URL}/books?limit=100`, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      let results = data.data || data.books || [];
      
      // Client-side filter
      if (searchQuery) {
        results = results.filter((book: Book) => {
          const query = searchQuery.toLowerCase();
          if (searchField === 'isbn') return book.isbn13?.toLowerCase().includes(query);
          if (searchField === 'title') return book.title?.toLowerCase().includes(query);
          if (searchField === 'author') return book.author?.toLowerCase().includes(query);
          if (searchField === 'publisher') return book.publisher?.toLowerCase().includes(query);
          return (
            book.isbn13?.toLowerCase().includes(query) ||
            book.title?.toLowerCase().includes(query) ||
            book.author?.toLowerCase().includes(query) ||
            book.publisher?.toLowerCase().includes(query)
          );
        });
      }
      
      setBooks(results);
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Error searching books:', error);
      toast.error('Fehler bei der Suche');
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================
  // EDIT BOOK
  // ==================================================================
  
  const handleEditBook = async (book: Book) => {
    setEditingBook(book);
    
    // Load editorial data
    try {
      const response = await fetch(`${API_BASE_URL}/books/${book.id}/editorial`, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEditingEditorial(data.editorial || {});
      } else {
        setEditingEditorial({});
      }
    } catch (error) {
      console.error('Error loading editorial data:', error);
      setEditingEditorial({});
    }
    
    // Load tags with origin
    try {
      const response = await fetch(`${API_BASE_URL}/books/${book.id}/tags`, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error loading book tags:', error);
      setSelectedTags([]);
    }
  };

  const handleSaveBook = async () => {
    if (!editingBook || !editingEditorial) return;
    
    setSavingBook(true);
    
    try {
      const adminToken = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      if (!adminToken) {
        toast.error('Nicht autorisiert');
        return;
      }
      
      // Save editorial data
      const response = await fetch(`${API_BASE_URL}/books/${editingBook.id}/editorial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(editingEditorial),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Speichern');
      }
      
      // Save tags (only manual tags)
      const manualTags = selectedTags.filter(t => t.origin === 'manual');
      await fetch(`${API_BASE_URL}/books/${editingBook.id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({ tags: manualTags }),
      });
      
      toast.success('Änderungen gespeichert');
      setEditingBook(null);
      setEditingEditorial(null);
      loadRecentBooks();
      loadStats();
      
    } catch (error: unknown) {
      logError('Error saving book', error);
      toast.error(getErrorMessage(error, 'Fehler beim Speichern'));
    } finally {
      setSavingBook(false);
    }
  };

  // ==================================================================
  // TAG MANAGEMENT
  // ==================================================================
  
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.tag_id === tagId && t.origin === 'manual');
      
      if (exists) {
        // Remove
        return prev.filter(t => !(t.tag_id === tagId && t.origin === 'manual'));
      } else {
        // Add
        return [...prev, { tag_id: tagId, origin: 'manual' }];
      }
    });
  };

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  // ==================================================================
  // DISPLAY HELPERS
  // ==================================================================
  
  const getDisplayTitle = (book: Book, editorial?: BookEditorial | null) => {
    return editorial?.override_title 
      || book.onix_title 
      || book.import_title 
      || book.title 
      || 'Unbekannter Titel';
  };

  const getDisplayAuthor = (book: Book) => {
    return book.import_author || book.author || '—';
  };

  const getSourceBadge = (source?: string) => {
    if (!source || source === 'manual') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Manual</span>;
    }
    if (source === 'awin') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">AWIN</span>;
    }
    if (source === 'onix') {
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">ONIX</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{source}</span>;
  };

  const getTagOriginBadge = (origin: string) => {
    switch (origin) {
      case 'manual':
        return <span data-testid="badge-tag-manual"><PencilIcon className="w-3 h-3 text-gray-600" /></span>;
      case 'import_awin':
        return <span data-testid="badge-tag-awin"><Lock className="w-3 h-3 text-blue-600" /></span>;
      case 'import_onix':
        return <span data-testid="badge-tag-onix"><Database className="w-3 h-3 text-purple-600" /></span>;
      case 'derived_onix':
        return <span data-testid="badge-tag-derived"><Sparkles className="w-3 h-3 text-purple-400" /></span>;
      default:
        return null;
    }
  };

  // ==================================================================
  // PAGINATION
  // ==================================================================
  
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  // ==================================================================
  // RENDER
  // ==================================================================
  
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            📚 Bücher
          </h2>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            {stats.total} Bücher gesamt · 
            {stats.manual > 0 && ` ${stats.manual} manuell`} · 
            {stats.awin > 0 && ` ${stats.awin} AWIN`} · 
            {stats.onix > 0 && ` ${stats.onix} ONIX`} · 
            {stats.withEditorial} mit Editorial-Daten
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBook({ id: '', isbn13: '', source: 'manual' });
            setEditingEditorial({});
            setSelectedTags([]);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded"
          style={{ backgroundColor: '#f25f5c', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Neues Buch (manuell)
        </button>
      </div>

      {/* Feature-Flag Info */}
      {FEATURE_FLAGS.book_editorial_overrides && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Import/Editorial-Modus aktiv</p>
              <p className="text-blue-700 mt-1">
                Import-Felder sind read-only. Änderungen nur über Editorial-Overrides möglich.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value as any)}
          className="px-3 py-2 border rounded"
          style={{ borderColor: '#E0E0E0' }}
        >
          <option value="all">Alle Felder</option>
          <option value="isbn">ISBN</option>
          <option value="title">Titel</option>
          <option value="author">Autor</option>
          <option value="publisher">Verlag</option>
        </select>
        
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Suche nach ISBN, Titel, Autor..."
            className="w-full pl-10 pr-4 py-2 border rounded"
            style={{ borderColor: '#E0E0E0' }}
          />
        </div>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 rounded"
          style={{ backgroundColor: '#247ba0', color: 'white' }}
        >
          {loading ? 'Suche...' : 'Suchen'}
        </button>
      </div>

      {/* Books List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4" style={{ color: '#666' }}>Lade Bücher...</p>
        </div>
      ) : currentBooks.length > 0 ? (
        <div className="space-y-3">
          {currentBooks.map((book) => (
            <div
              key={book.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              style={{ borderColor: '#E0E0E0' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {/* Cover */}
                  <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    {(book.import_cover_url || book.cover_url) ? (
                      <img 
                        src={book.import_cover_url || book.cover_url} 
                        alt="" 
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Book className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold" style={{ color: '#3A3A3A' }}>
                        {getDisplayTitle(book)}
                      </h3>
                      {getSourceBadge(book.source)}
                    </div>
                    <p className="text-sm" style={{ color: '#666' }}>
                      {getDisplayAuthor(book)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#999' }}>
                      ISBN: {book.isbn13}
                    </p>
                    
                    {/* Import Info */}
                    {(book.source === 'awin' || book.source === 'onix') && book.last_import_at && (
                      <p className="text-xs mt-1 text-blue-600">
                        Letzter Import: {new Date(book.last_import_at).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditBook(book)}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" style={{ color: '#247ba0' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched ? (
        <div className="text-center py-12">
          <Book className="w-12 h-12 mx-auto mb-4" style={{ color: '#CCC' }} />
          <p style={{ color: '#999' }}>Keine Bücher gefunden</p>
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
            style={{ borderColor: '#E0E0E0' }}
          >
            Zurück
          </button>
          <span className="px-4 py-2">
            Seite {currentPage} von {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
            style={{ borderColor: '#E0E0E0' }}
          >
            Weiter
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingBook && editingEditorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingBook.id ? 'Buch bearbeiten' : 'Neues Buch'}
              </h3>
              <button onClick={() => setEditingBook(null)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* ISBN (immer editierbar bei neuen Büchern) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>
                  ISBN-13 *
                </label>
                <input
                  type="text"
                  value={editingBook.isbn13}
                  onChange={(e) => setEditingBook({ ...editingBook, isbn13: e.target.value })}
                  disabled={!!editingBook.id}
                  placeholder="9783000000000"
                  className="w-full px-3 py-2 border rounded disabled:bg-gray-100"
                  style={{ borderColor: '#E0E0E0' }}
                />
              </div>

              {/* AWIN Import-Felder (Read-Only) */}
              {(editingBook.source === 'awin' || editingBook.import_title) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#3A3A3A' }}>
                    <Lock className="w-4 h-4 text-blue-600" />
                    AWIN-Daten (Read-Only)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">AWIN-Titel</label>
                      <input 
                        value={editingBook.import_title || '—'} 
                        disabled 
                        className="w-full bg-gray-50 px-3 py-2 rounded border text-sm"
                        style={{ borderColor: '#E0E0E0' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">AWIN-Autor</label>
                      <input 
                        value={editingBook.import_author || '—'} 
                        disabled 
                        className="w-full bg-gray-50 px-3 py-2 rounded border text-sm"
                        style={{ borderColor: '#E0E0E0' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">AWIN-Verlag</label>
                      <input 
                        value={editingBook.import_publisher || '—'} 
                        disabled 
                        className="w-full bg-gray-50 px-3 py-2 rounded border text-sm"
                        style={{ borderColor: '#E0E0E0' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">AWIN-Preis</label>
                      <input 
                        value={editingBook.import_price ? `€${editingBook.import_price.toFixed(2)}` : '—'} 
                        disabled 
                        className="w-full bg-gray-50 px-3 py-2 rounded border text-sm"
                        style={{ borderColor: '#E0E0E0' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ONIX Import-Felder (Read-Only, Feature-Flagged) */}
              {FEATURE_FLAGS.onix_enabled && (editingBook.source === 'onix' || editingBook.onix_title) && (
                <div className="border-t pt-4 bg-purple-50 p-4 rounded">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-purple-900">
                    <Database className="w-4 h-4 text-purple-600" />
                    ONIX-Daten (Read-Only)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-purple-700 mb-1">ONIX-Titel</label>
                      <input 
                        value={editingBook.onix_title || '—'} 
                        disabled 
                        className="w-full bg-purple-100 px-3 py-2 rounded border border-purple-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-purple-700 mb-1">ONIX-Untertitel</label>
                      <input 
                        value={editingBook.onix_subtitle || '—'} 
                        disabled 
                        className="w-full bg-purple-100 px-3 py-2 rounded border border-purple-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ONIX Disabled Info */}
              {!FEATURE_FLAGS.onix_enabled && editingBook.source !== 'manual' && (
                <div className="border-t pt-4 bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    ONIX-Daten werden in Phase 2 aktiviert.
                  </p>
                </div>
              )}

              {/* Editorial Overrides (Editierbar) */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#3A3A3A' }}>
                  <PencilIcon className="w-4 h-4 text-green-600" />
                  Redaktionelle Overrides (Optional)
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Alternativer Titel
                      <span className="text-xs text-gray-400 ml-2">(Falls besser als Import-Titel)</span>
                    </label>
                    <input 
                      value={editingEditorial.override_title || ''} 
                      onChange={(e) => setEditingEditorial({ ...editingEditorial, override_title: e.target.value })}
                      className="w-full px-3 py-2 rounded border"
                      style={{ borderColor: '#E0E0E0' }}
                      placeholder={editingBook.import_title || editingBook.onix_title || ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Eigene Beschreibung
                    </label>
                    <textarea 
                      value={editingEditorial.override_description || ''} 
                      onChange={(e) => setEditingEditorial({ ...editingEditorial, override_description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 rounded border"
                      style={{ borderColor: '#E0E0E0' }}
                      placeholder="Redaktionelle Beschreibung..."
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={editingEditorial.featured || false}
                      onChange={(e) => setEditingEditorial({ ...editingEditorial, featured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-gray-700">Featured (Homepage-Highlight)</label>
                  </div>
                  
                  {editingEditorial.featured && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Featured-Reihenfolge</label>
                      <input 
                        type="number"
                        value={editingEditorial.featured_order || 0} 
                        onChange={(e) => setEditingEditorial({ ...editingEditorial, featured_order: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded border"
                        style={{ borderColor: '#E0E0E0' }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Interne Notizen</label>
                    <textarea 
                      value={editingEditorial.internal_notes || ''} 
                      onChange={(e) => setEditingEditorial({ ...editingEditorial, internal_notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded border"
                      style={{ borderColor: '#E0E0E0' }}
                      placeholder="Nur für Admin sichtbar..."
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3" style={{ color: '#3A3A3A' }}>
                  Tags
                </h4>
                
                {/* Selected Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((st) => {
                    const tag = availableTags.find(t => t.id === st.tag_id);
                    if (!tag) return null;
                    
                    const canRemove = st.origin === 'manual';
                    
                    return (
                      <span
                        key={`${st.tag_id}-${st.origin}`}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded text-sm"
                        style={{ 
                          backgroundColor: canRemove ? '#f0f0f0' : '#e3f2fd',
                          color: '#3A3A3A'
                        }}
                      >
                        {getTagOriginBadge(st.origin)}
                        {tag.name}
                        {canRemove && (
                          <button
                            onClick={() => toggleTag(st.tag_id)}
                            className="hover:bg-gray-300 rounded p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                
                {/* Tag Search */}
                <div className="relative mb-3">
                  <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder="Tag suchen..."
                    className="w-full pl-10 pr-4 py-2 border rounded"
                    style={{ borderColor: '#E0E0E0' }}
                  />
                </div>
                
                {/* Available Tags */}
                <div className="max-h-48 overflow-y-auto border rounded p-2" style={{ borderColor: '#E0E0E0' }}>
                  <div className="space-y-1">
                    {filteredTags.map((tag) => {
                      const isSelected = selectedTags.some(st => st.tag_id === tag.id && st.origin === 'manual');
                      
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center justify-between"
                        >
                          <span className="text-sm">{tag.name}</span>
                          {isSelected && <span className="text-green-600">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditingBook(null)}
                  className="px-6 py-2 border rounded"
                  style={{ borderColor: '#E0E0E0' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveBook}
                  disabled={savingBook}
                  className="px-6 py-2 rounded flex items-center gap-2"
                  style={{ backgroundColor: '#f25f5c', color: 'white' }}
                >
                  <Save className="w-4 h-4" />
                  {savingBook ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}