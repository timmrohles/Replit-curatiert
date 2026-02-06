import { useState, useEffect } from 'react';
import { Check, X, Tag, Trash2, Plus } from 'lucide-react';
import { getAllONIXTags, getBooks, ONIXTag, Book } from '../../utils/api';
import { toast } from 'sonner@2.0.3';

const API_BASE_URL = '/api';

/**
 * Bulk Tag Editor
 * 
 * Allows admins to:
 * - Select multiple books at once
 * - Add tags to selected books
 * - Remove tags from selected books
 * - Replace all tags on selected books
 */
export function BulkTagEditor() {
  const [books, setBooks] = useState<Book[]>([]);
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState<string[]>([]);
  const [operation, setOperation] = useState<'add' | 'remove' | 'replace'>('add');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [booksData, tagsData] = await Promise.all([
        getBooks(),
        getAllONIXTags()
      ]);
      setBooks(booksData);
      setOnixTags(tagsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fehler beim Laden der Daten');
      setLoading(false);
    }
  };

  const toggleBook = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagsToAdd(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const selectAllBooks = () => {
    if (selectedBooks.length === filteredBooks.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(filteredBooks.map(b => b.id));
    }
  };

  const applyBulkOperation = async () => {
    if (selectedBooks.length === 0) {
      toast.error('Bitte wähle mindestens ein Buch aus');
      return;
    }

    if (selectedTagsToAdd.length === 0) {
      toast.error('Bitte wähle mindestens einen Tag aus');
      return;
    }

    setApplying(true);

    try {
      // Update each book
      const updates = selectedBooks.map(async (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        let newTagIds: string[] = [];

        switch (operation) {
          case 'add':
            // Add new tags (avoid duplicates)
            newTagIds = [...new Set([...(book.onixTagIds || []), ...selectedTagsToAdd])];
            break;
          case 'remove':
            // Remove selected tags
            newTagIds = (book.onixTagIds || []).filter(id => !selectedTagsToAdd.includes(id));
            break;
          case 'replace':
            // Replace all tags
            newTagIds = selectedTagsToAdd;
            break;
        }

        // ✅ MIGRATED: Use canonical /api/books/:id endpoint
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...book,
            onixTagIds: newTagIds
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update book ${book.title}`);
        }

        return response.json();
      });

      await Promise.all(updates);

      toast.success(`${selectedBooks.length} ${selectedBooks.length === 1 ? 'Buch' : 'Bücher'} erfolgreich aktualisiert`);
      
      // Reload data
      await loadData();
      
      // Reset selection
      setSelectedBooks([]);
      setSelectedTagsToAdd([]);
      
    } catch (error) {
      console.error('Error applying bulk operation:', error);
      toast.error('Fehler beim Aktualisieren der Bücher');
    } finally {
      setApplying(false);
    }
  };

  // Filter books by search
  const filteredBooks = books.filter(book => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  // Filter tags by search
  const filteredTags = onixTags.filter(tag => {
    if (!tagSearchQuery) return tag.visible;
    const query = tagSearchQuery.toLowerCase();
    return (
      tag.visible &&
      (tag.displayName.toLowerCase().includes(query) ||
      tag.type.toLowerCase().includes(query))
    );
  });

  // Get tags that are common to all selected books
  const getCommonTags = (): string[] => {
    if (selectedBooks.length === 0) return [];
    
    const allTagIds = selectedBooks.map(bookId => {
      const book = books.find(b => b.id === bookId);
      return book?.onixTagIds || [];
    });
    
    if (allTagIds.length === 0) return [];
    
    // Find tags present in ALL selected books
    return allTagIds[0].filter(tagId => 
      allTagIds.every(tags => tags.includes(tagId))
    );
  };

  const commonTags = getCommonTags();

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: '#3A3A3A' }}>Lädt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 
          style={{ 
            fontFamily: 'Fjalla One', 
            fontSize: '2rem', 
            color: '#3A3A3A',
            marginBottom: '0.5rem'
          }}
        >
          Bulk Tag Editor
        </h2>
        <p style={{ color: '#666666' }}>
          Mehrere Bücher auswählen und Tags hinzufügen, entfernen oder ersetzen
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(112, 193, 179, 0.1)', border: '2px solid rgba(112, 193, 179, 0.3)' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'Fjalla One', color: '#70c1b3' }}>
            {selectedBooks.length}
          </div>
          <div style={{ color: '#666666', fontSize: '0.875rem' }}>Ausgewählte Bücher</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(242, 95, 92, 0.1)', border: '2px solid rgba(242, 95, 92, 0.3)' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'Fjalla One', color: '#f25f5c' }}>
            {selectedTagsToAdd.length}
          </div>
          <div style={{ color: '#666666', fontSize: '0.875rem' }}>Ausgewählte Tags</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 224, 102, 0.1)', border: '2px solid rgba(255, 224, 102, 0.3)' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'Fjalla One', color: '#ffe066' }}>
            {commonTags.length}
          </div>
          <div style={{ color: '#666666', fontSize: '0.875rem' }}>Gemeinsame Tags</div>
        </div>
      </div>

      {/* Operation Selector */}
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#3A3A3A', fontWeight: 600 }}>
          Aktion auswählen
        </label>
        <div className="flex gap-2">
          {[
            { value: 'add', label: 'Tags hinzufügen', icon: Plus, color: '#70c1b3' },
            { value: 'remove', label: 'Tags entfernen', icon: Trash2, color: '#f25f5c' },
            { value: 'replace', label: 'Tags ersetzen', icon: Tag, color: '#ffe066' }
          ].map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setOperation(value as any)}
              className="flex-1 px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: operation === value ? color : 'rgba(255, 255, 255, 0.95)',
                color: operation === value ? '#FFFFFF' : '#3A3A3A',
                border: `2px solid ${operation === value ? color : 'rgba(0, 0, 0, 0.1)'}`,
                fontWeight: operation === value ? 600 : 400
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A' }}>
              Bücher auswählen
            </h3>
            <button
              onClick={selectAllBooks}
              className="px-3 py-1 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: selectedBooks.length === filteredBooks.length ? '#70c1b3' : 'rgba(255, 255, 255, 0.95)',
                color: selectedBooks.length === filteredBooks.length ? '#FFFFFF' : '#3A3A3A',
                border: '2px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              {selectedBooks.length === filteredBooks.length ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          </div>

          <input
            type="text"
            placeholder="Bücher durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg mb-4 focus:outline-none"
            style={{ border: '2px solid rgba(0, 0, 0, 0.1)' }}
          />

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {filteredBooks.map(book => {
              const isSelected = selectedBooks.includes(book.id);
              const bookTagCount = book.onixTagIds?.length || 0;
              
              return (
                <label
                  key={book.id}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:shadow-md"
                  style={{
                    backgroundColor: isSelected ? 'rgba(112, 193, 179, 0.1)' : 'rgba(255, 255, 255, 0.95)',
                    border: `2px solid ${isSelected ? '#70c1b3' : 'rgba(0, 0, 0, 0.1)'}`
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleBook(book.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: '0.25rem' }}>
                      {book.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666666' }}>
                      {book.author}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999999', marginTop: '0.25rem' }}>
                      {bookTagCount} {bookTagCount === 1 ? 'Tag' : 'Tags'}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Tag Selection */}
        <div>
          <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A', marginBottom: '1rem' }}>
            Tags auswählen
          </h3>

          <input
            type="text"
            placeholder="Tags durchsuchen..."
            value={tagSearchQuery}
            onChange={(e) => setTagSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg mb-4 focus:outline-none"
            style={{ border: '2px solid rgba(0, 0, 0, 0.1)' }}
          />

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {filteredTags.map(tag => {
              const isSelected = selectedTagsToAdd.includes(tag.id);
              const isCommon = commonTags.includes(tag.id);
              
              return (
                <label
                  key={tag.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:shadow-md"
                  style={{
                    backgroundColor: isSelected 
                      ? 'rgba(242, 95, 92, 0.1)' 
                      : isCommon 
                      ? 'rgba(255, 224, 102, 0.1)' 
                      : 'rgba(255, 255, 255, 0.95)',
                    border: `2px solid ${isSelected ? '#f25f5c' : isCommon ? '#ffe066' : 'rgba(0, 0, 0, 0.1)'}`
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTag(tag.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: '0.25rem' }}>
                      {tag.displayName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666666' }}>
                      {tag.type} • {tag.visibilityLevel}
                    </div>
                  </div>
                  {isCommon && (
                    <span 
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ backgroundColor: '#ffe066', color: '#3A3A3A', fontWeight: 600 }}
                    >
                      Gemeinsam
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
        <div>
          <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: '0.25rem' }}>
            Vorschau
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666666' }}>
            {operation === 'add' && `${selectedTagsToAdd.length} ${selectedTagsToAdd.length === 1 ? 'Tag' : 'Tags'} zu ${selectedBooks.length} ${selectedBooks.length === 1 ? 'Buch' : 'Büchern'} hinzufügen`}
            {operation === 'remove' && `${selectedTagsToAdd.length} ${selectedTagsToAdd.length === 1 ? 'Tag' : 'Tags'} von ${selectedBooks.length} ${selectedBooks.length === 1 ? 'Buch' : 'Büchern'} entfernen`}
            {operation === 'replace' && `Alle Tags von ${selectedBooks.length} ${selectedBooks.length === 1 ? 'Buch' : 'Büchern'} durch ${selectedTagsToAdd.length} ${selectedTagsToAdd.length === 1 ? 'Tag' : 'Tags'} ersetzen`}
          </div>
        </div>
        <button
          onClick={applyBulkOperation}
          disabled={applying || selectedBooks.length === 0 || selectedTagsToAdd.length === 0}
          className="px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: '#70c1b3',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '1rem'
          }}
        >
          {applying ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Wird angewendet...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Änderungen anwenden
            </>
          )}
        </button>
      </div>
    </div>
  );
}