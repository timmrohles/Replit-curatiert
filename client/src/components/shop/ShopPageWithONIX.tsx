import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Grid3x3, List } from 'lucide-react';
import { BookCard } from '../book/BookCard';
import { ONIXTagFilter } from '../tags/ONIXTagFilter';
import { Breadcrumb } from '../layout/Breadcrumb';
import { getAllBooks, Book } from '../../utils/api';

/**
 * Modern Shop Page with ONIX Tag Filters
 * Displays all books with advanced filtering by ONIX tags
 */
export function ShopPageWithONIX() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load books
  useEffect(() => {
    getAllBooks().then(data => {
      setBooks(data);
      setLoading(false);
    });
  }, []);

  // Filter books
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.publisher?.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query)
      );
    }

    // ONIX Tag filter
    if (selectedTagIds.length > 0) {
      filtered = filtered.filter(book =>
        book.onixTagIds?.some(tagId => selectedTagIds.includes(tagId))
      );
    }

    return filtered;
  }, [books, searchQuery, selectedTagIds]);

  // Sort books by newest first
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredBooks]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Bücher' }
          ]}
        />

        {/* Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-4xl mb-2" style={{ 
            fontFamily: 'Fjalla One', 
            color: '#3A3A3A',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
          }}>
            Alle Bücher
          </h1>
          <p style={{ color: '#3A3A3A' }}>
            {loading ? 'Lädt...' : `${sortedBooks.length} Bücher gefunden`}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#666666' }} />
            <input
              type="text"
              placeholder="Titel, Autor, Verlag, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              style={{ borderColor: '#E5E7EB' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4" style={{ color: '#666666' }} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: showFilters ? '#f25f5c' : '#FFFFFF',
              color: showFilters ? '#FFFFFF' : '#3A3A3A',
              border: showFilters ? 'none' : '1px solid #E5E7EB'
            }}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filter {selectedTagIds.length > 0 && `(${selectedTagIds.length})`}
          </button>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: viewMode === 'grid' ? '#f25f5c' : '#FFFFFF',
                color: viewMode === 'grid' ? '#FFFFFF' : '#3A3A3A',
                border: '1px solid #E5E7EB'
              }}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: viewMode === 'list' ? '#f25f5c' : '#FFFFFF',
                color: viewMode === 'list' ? '#FFFFFF' : '#3A3A3A',
                border: '1px solid #E5E7EB'
              }}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl p-4 sticky top-4">
                <h3 className="text-lg mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  Filter nach Tags
                </h3>
                <ONIXTagFilter
                  selectedTagIds={selectedTagIds}
                  onTagsChange={setSelectedTagIds}
                  visibilityFilter="all"
                  showOnlyVisible={true}
                />
              </div>
            </div>
          )}

          {/* Books Grid */}
          <div className={showFilters ? 'md:col-span-3' : 'md:col-span-4'}>
            {loading ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p style={{ color: '#666666' }}>Lädt Bücher...</p>
              </div>
            ) : sortedBooks.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p style={{ color: '#666666' }}>Keine Bücher gefunden.</p>
                {(searchQuery || selectedTagIds.length > 0) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTagIds([]);
                    }}
                    className="mt-4 px-4 py-2 rounded-lg"
                    style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {sortedBooks.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
