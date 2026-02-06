/**
 * ==================================================================
 * BULK TAGGING TOOL
 * ==================================================================
 * 
 * Massen-Tool zum Zuweisen von Tags an Bücher basierend auf:
 * - Autor
 * - Verlag (Publisher)
 * - Format (Hardcover, eBook, etc.)
 * - Sprache
 * - Erscheinungsjahr
 * - Titel (Stichwort)
 * - ISBN-Muster
 * 
 * Workflow:
 * 1. Filter setzen
 * 2. Preview anzeigen (Anzahl der gefundenen Bücher)
 * 3. Tag(s) auswählen
 * 4. Bulk Assign ausführen
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { Search, Tag as TagIcon, Check, AlertCircle, X, Filter, BookOpen } from 'lucide-react';
interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type: 'topic' | 'genre' | 'keyword' | 'award' | 'region' | 'period' | 'series';
  source: 'onix' | 'awin' | 'manual';
  color: string;
  onix_scheme_id?: number;
  onix_code?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  isbn13?: string;
  format?: string;
  publication_year?: number;
  language?: string;
}

interface BulkTaggingProps {
  onClose: () => void;
}

export function BulkTagging({ onClose }: BulkTaggingProps) {
  const API_BASE = '/api';

  const getHeaders = () => ({
    'X-Admin-Token': localStorage.getItem('admin_token') || '',
    'Content-Type': 'application/json'
  });

  // State
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Filters
  const [authorFilter, setAuthorFilter] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [isbnFilter, setIsbnFilter] = useState('');
  
  // Preview
  const [previewBooks, setPreviewBooks] = useState<Book[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load tags on mount
  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const response = await fetch(`${API_BASE}/tags`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setTags(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }

  // Preview books based on filters
  async function previewMatches() {
    if (!hasAnyFilter()) {
      setError('Bitte mindestens einen Filter setzen');
      return;
    }

    setLoadingPreview(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (authorFilter) params.append('author', authorFilter);
      if (publisherFilter) params.append('publisher', publisherFilter);
      if (formatFilter) params.append('format', formatFilter);
      if (titleFilter) params.append('title', titleFilter);
      if (isbnFilter) params.append('isbn', isbnFilter);
      
      // Limit to first 50 for preview
      params.append('limit', '50');
      
      const response = await fetch(`${API_BASE}/books/search?${params}`, {
        headers: getHeaders()
      });
      
      const result = await response.json();
      
      if (result.success) {
        const books = result.data || [];
        
        // Apply additional filters that might not be in the search endpoint
        let filteredBooks = books;
        
        if (languageFilter) {
          filteredBooks = filteredBooks.filter((b: Book) => 
            b.language?.toLowerCase().includes(languageFilter.toLowerCase())
          );
        }
        
        if (yearFilter) {
          const year = parseInt(yearFilter);
          filteredBooks = filteredBooks.filter((b: Book) => 
            b.publication_year === year
          );
        }
        
        setPreviewBooks(filteredBooks.slice(0, 20)); // Show first 20
        setTotalMatches(result.count || filteredBooks.length);
      } else {
        setError(result.error || 'Preview fehlgeschlagen');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingPreview(false);
    }
  }

  // Execute bulk tagging
  async function executeBulkTagging() {
    if (selectedTagIds.length === 0) {
      setError('Bitte mindestens einen Tag auswählen');
      return;
    }

    if (!hasAnyFilter()) {
      setError('Bitte mindestens einen Filter setzen');
      return;
    }

    if (!confirm(`${selectedTagIds.length} Tag(s) an ~${totalMatches} Bücher zuweisen?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get ALL matching book IDs (not just preview)
      const params = new URLSearchParams();
      if (authorFilter) params.append('author', authorFilter);
      if (publisherFilter) params.append('publisher', publisherFilter);
      if (formatFilter) params.append('format', formatFilter);
      if (titleFilter) params.append('title', titleFilter);
      if (isbnFilter) params.append('isbn', isbnFilter);
      params.append('limit', '200'); // Max 200 for now

      const response = await fetch(`${API_BASE}/books/search?${params}`, {
        headers: getHeaders()
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Suche fehlgeschlagen');
      }

      let books = result.data || [];
      
      // Apply language/year filters
      if (languageFilter) {
        books = books.filter((b: Book) => 
          b.language?.toLowerCase().includes(languageFilter.toLowerCase())
        );
      }
      if (yearFilter) {
        const year = parseInt(yearFilter);
        books = books.filter((b: Book) => b.publication_year === year);
      }

      const bookIds = books.map((b: Book) => b.id);

      if (bookIds.length === 0) {
        setError('Keine Bücher gefunden');
        return;
      }

      // Assign tags to all books
      let totalAssigned = 0;
      const errors = [];

      for (const tagId of selectedTagIds) {
        try {
          const assignResponse = await fetch(`${API_BASE}/tags/${tagId}/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              book_ids: bookIds,
              source: 'bulk'
            })
          });

          const assignResult = await assignResponse.json();
          
          if (assignResult.success) {
            totalAssigned += assignResult.data?.assigned_count || 0;
          } else {
            errors.push(`Tag ${tagId}: ${assignResult.error}`);
          }
        } catch (err) {
          errors.push(`Tag ${tagId}: ${err}`);
        }
      }

      if (errors.length > 0) {
        setError(`Teilweise erfolgreich. Fehler: ${errors.join(', ')}`);
      } else {
        setSuccess(`✅ Erfolgreich! ${totalAssigned} Zuweisungen erstellt (${selectedTagIds.length} Tags × ${bookIds.length} Bücher)`);
      }

      // Reset filters and preview
      setTimeout(() => {
        resetFilters();
      }, 3000);

    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function hasAnyFilter() {
    return !!(authorFilter || publisherFilter || formatFilter || languageFilter || yearFilter || titleFilter || isbnFilter);
  }

  function resetFilters() {
    setAuthorFilter('');
    setPublisherFilter('');
    setFormatFilter('');
    setLanguageFilter('');
    setYearFilter('');
    setTitleFilter('');
    setIsbnFilter('');
    setPreviewBooks([]);
    setTotalMatches(0);
    setSelectedTagIds([]);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Filter className="w-6 h-6" />
              Bulk Tagging
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Filter setzen → Preview → Tags zuweisen
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Success</p>
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <button onClick={() => setSuccess(null)} className="p-1 hover:bg-green-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Filters */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
              Filter setzen
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Autor</label>
                <input
                  type="text"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  placeholder="z.B. Kafka"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Verlag</label>
                <input
                  type="text"
                  value={publisherFilter}
                  onChange={(e) => setPublisherFilter(e.target.value)}
                  placeholder="z.B. Suhrkamp"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Alle Formate</option>
                  <option value="hardcover">Hardcover</option>
                  <option value="paperback">Paperback</option>
                  <option value="ebook">eBook</option>
                  <option value="epub">EPUB</option>
                  <option value="pdf">PDF</option>
                  <option value="audiobook">Audiobook</option>
                  <option value="kindle">Kindle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sprache</label>
                <input
                  type="text"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  placeholder="z.B. de, en"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Erscheinungsjahr</label>
                <input
                  type="number"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  placeholder="z.B. 2024"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titel (Stichwort)</label>
                <input
                  type="text"
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  placeholder="z.B. Das"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ISBN-Muster</label>
                <input
                  type="text"
                  value={isbnFilter}
                  onChange={(e) => setIsbnFilter(e.target.value)}
                  placeholder="z.B. 978-3"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={previewMatches}
                disabled={!hasAnyFilter() || loadingPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {loadingPreview ? 'Lädt...' : 'Preview laden'}
              </button>
              
              <button
                onClick={resetFilters}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>

          {/* Step 2: Preview */}
          {totalMatches > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
                Preview: {totalMatches} Bücher gefunden
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {previewBooks.slice(0, 10).map((book) => (
                  <div key={book.id} className="p-3 bg-gray-50 rounded flex items-start gap-3">
                    <BookOpen className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{book.title}</div>
                      <div className="text-sm text-gray-600">
                        {book.author} {book.publisher && `• ${book.publisher}`}
                      </div>
                      {book.isbn13 && (
                        <div className="text-xs text-gray-500">ISBN: {book.isbn13}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalMatches > 10 && (
                <p className="text-sm text-gray-500 mt-3">
                  ... und {totalMatches - 10} weitere Bücher
                </p>
              )}
            </div>
          )}

          {/* Step 3: Select Tags */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">3</span>
              Tags auswählen ({selectedTagIds.length} ausgewählt)
            </h3>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTagIds([...selectedTagIds, tag.id]);
                      } else {
                        setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                  {tag.onix_code && (
                    <span className="text-xs text-gray-500">({tag.onix_code})</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Step 4: Execute */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">4</span>
              Ausführen
            </h3>

            <div className="flex items-center gap-4">
              <button
                onClick={executeBulkTagging}
                disabled={loading || selectedTagIds.length === 0 || totalMatches === 0}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                <TagIcon className="w-5 h-5" />
                {loading ? 'Wird zugewiesen...' : `${selectedTagIds.length} Tag(s) an ~${totalMatches} Bücher zuweisen`}
              </button>

              <div className="text-sm text-gray-600">
                {selectedTagIds.length > 0 && totalMatches > 0 && (
                  <span>
                    ≈ {selectedTagIds.length * totalMatches} Zuweisungen
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}