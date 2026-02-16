import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, X, Search, GripVertical, BookOpen } from 'lucide-react';

const API_BASE = '/api';
const USER_ID = 'demo-user-123';

interface Curation {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface BookResult {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  isbn13: string | null;
}

interface CurationBook extends BookResult {
  curation_id: number;
  book_id: number;
  display_order: number;
}

export function UserCurations() {
  const [curations, setCurations] = useState<Curation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCuration, setEditingCuration] = useState<Curation | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<BookResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<BookResult[]>([]);
  const [saving, setSaving] = useState(false);

  const [bookCounts, setBookCounts] = useState<Record<number, number>>({});

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchCurations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/user-curations?userId=${encodeURIComponent(USER_ID)}`);
      const data = await res.json();
      if (data.ok) {
        setCurations(data.data || []);
        const counts: Record<number, number> = {};
        for (const c of (data.data || [])) {
          try {
            const bRes = await fetch(`${API_BASE}/user-curations/${c.id}/books`);
            const bData = await bRes.json();
            counts[c.id] = bData.ok ? (bData.data?.length || 0) : 0;
          } catch {
            counts[c.id] = 0;
          }
        }
        setBookCounts(counts);
      } else {
        setError(data.error || 'Fehler beim Laden');
      }
    } catch (err) {
      setError('Netzwerkfehler beim Laden der Kurationen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurations();
  }, [fetchCurations]);

  const searchBooks = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setBookSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await fetch(`${API_BASE}/books/search?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      if (data.ok) {
        setBookSearchResults(data.data || []);
      }
    } catch {
      setBookSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBooks(bookSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [bookSearchQuery, searchBooks]);

  const openCreateModal = () => {
    setEditingCuration(null);
    setFormTitle('');
    setFormDescription('');
    setFormTags([]);
    setTagInput('');
    setSelectedBooks([]);
    setBookSearchQuery('');
    setBookSearchResults([]);
    setShowModal(true);
  };

  const openEditModal = async (curation: Curation) => {
    setEditingCuration(curation);
    setFormTitle(curation.title);
    setFormDescription(curation.description || '');
    setFormTags(Array.isArray(curation.tags) ? curation.tags : []);
    setTagInput('');
    setBookSearchQuery('');
    setBookSearchResults([]);

    try {
      const res = await fetch(`${API_BASE}/user-curations/${curation.id}/books`);
      const data = await res.json();
      if (data.ok && data.data) {
        setSelectedBooks(data.data.map((b: any) => ({
          id: b.book_id || b.id,
          title: b.title || '',
          author: b.author || '',
          cover_url: b.cover_url || null,
          isbn13: b.isbn13 || null,
        })));
      } else {
        setSelectedBooks([]);
      }
    } catch {
      setSelectedBooks([]);
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCuration(null);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter(t => t !== tag));
  };

  const addBook = (book: BookResult) => {
    if (!selectedBooks.some(b => b.id === book.id)) {
      setSelectedBooks([...selectedBooks, book]);
    }
  };

  const removeBook = (bookId: number) => {
    setSelectedBooks(selectedBooks.filter(b => b.id !== bookId));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newBooks = [...selectedBooks];
    const [moved] = newBooks.splice(dragIndex, 1);
    newBooks.splice(index, 0, moved);
    setSelectedBooks(newBooks);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const saveCuration = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);

    try {
      let curationId: number;

      if (editingCuration) {
        const res = await fetch(`${API_BASE}/user-curations/${editingCuration.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            tags: formTags,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        curationId = editingCuration.id;

        const existingRes = await fetch(`${API_BASE}/user-curations/${curationId}/books`);
        const existingData = await existingRes.json();
        const existingBookIds = (existingData.ok && existingData.data)
          ? existingData.data.map((b: any) => b.book_id || b.id)
          : [];

        for (const oldId of existingBookIds) {
          if (!selectedBooks.some(b => b.id === oldId)) {
            await fetch(`${API_BASE}/user-curations/${curationId}/books/${oldId}`, { method: 'DELETE' });
          }
        }

        for (const book of selectedBooks) {
          if (!existingBookIds.includes(book.id)) {
            await fetch(`${API_BASE}/user-curations/${curationId}/books`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookId: book.id }),
            });
          }
        }
      } else {
        const res = await fetch(`${API_BASE}/user-curations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: USER_ID,
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            tags: formTags,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        curationId = data.data.id;

        for (const book of selectedBooks) {
          await fetch(`${API_BASE}/user-curations/${curationId}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: book.id }),
          });
        }
      }

      if (selectedBooks.length > 0) {
        await fetch(`${API_BASE}/user-curations/${curationId}/books/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookIds: selectedBooks.map(b => b.id) }),
        });
      }

      closeModal();
      fetchCurations();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const deleteCuration = async (id: number) => {
    if (!confirm('Möchtest du diese Kuration wirklich löschen?')) return;
    try {
      const res = await fetch(`${API_BASE}/user-curations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        fetchCurations();
      } else {
        setError(data.error || 'Fehler beim Löschen');
      }
    } catch {
      setError('Netzwerkfehler beim Löschen');
    }
  };

  const togglePublished = async (curation: Curation) => {
    try {
      const res = await fetch(`${API_BASE}/user-curations/${curation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !curation.is_published }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchCurations();
      }
    } catch {
      setError('Fehler beim Aktualisieren');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#247ba0' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl mb-2 text-center" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Meine Kurationen
        </h1>
        <p className="text-xs md:text-sm mb-4" style={{ color: '#6B7280' }}>
          Erstelle thematische Buchsammlungen für deinen Bookstore
        </p>
        <button
          onClick={openCreateModal}
          data-testid="button-new-curation"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
          style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
        >
          <Plus className="w-5 h-5" />
          Neue Kuration
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Schließen</button>
        </div>
      )}

      {curations.length === 0 ? (
        <div className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
          <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Keine Kurationen
          </h3>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
            Erstelle deine erste thematische Buchsammlung
          </p>
          <button
            onClick={openCreateModal}
            data-testid="button-empty-new-curation"
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: '#247ba0' }}
          >
            Erste Kuration erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {curations.map((curation) => (
            <div
              key={curation.id}
              data-testid={`card-curation-${curation.id}`}
              className="p-4 md:p-6 transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                      {curation.title}
                    </h2>
                    <button
                      onClick={() => togglePublished(curation)}
                      data-testid={`button-toggle-publish-${curation.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer"
                      style={curation.is_published
                        ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                        : { backgroundColor: '#FEF3C7', color: '#92400E' }
                      }
                    >
                      {curation.is_published ? 'Veröffentlicht' : 'Entwurf'}
                    </button>
                  </div>

                  {curation.description && (
                    <p className="text-xs md:text-sm mb-2" style={{ color: '#6B7280' }}>
                      {curation.description}
                    </p>
                  )}

                  {Array.isArray(curation.tags) && curation.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {curation.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {bookCounts[curation.id] ?? 0} Bücher
                    </span>
                    <span>
                      Erstellt: {new Date(curation.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => openEditModal(curation)}
                    data-testid={`button-edit-curation-${curation.id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="md:hidden">Bearbeiten</span>
                  </button>
                  <button
                    onClick={() => deleteCuration(curation.id)}
                    data-testid={`button-delete-curation-${curation.id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden">Löschen</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingCuration ? 'Kuration bearbeiten' : 'Neue Kuration'}
              </h2>
              <button
                onClick={closeModal}
                data-testid="button-close-modal"
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Titel *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  data-testid="input-curation-title"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Feministische Klassiker 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Begründungstext
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  data-testid="input-curation-description"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Warum diese Auswahl? Was verbindet die Bücher?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    data-testid="input-curation-tag"
                    className="flex-1 px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Tag eingeben und Enter drücken"
                  />
                  <button
                    onClick={addTag}
                    data-testid="button-add-tag"
                    className="px-3 py-2 rounded-lg text-sm text-white"
                    style={{ backgroundColor: '#247ba0' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          data-testid={`button-remove-tag-${idx}`}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Bücher suchen & hinzufügen
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={e => setBookSearchQuery(e.target.value)}
                    data-testid="input-book-search"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Buchtitel, Autor oder ISBN suchen..."
                  />
                </div>

                {searchLoading && (
                  <div className="text-xs py-2" style={{ color: '#6B7280' }}>Suche...</div>
                )}

                {bookSearchResults.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto mb-3" style={{ borderColor: '#E5E7EB' }}>
                    {bookSearchResults
                      .filter(b => !selectedBooks.some(s => s.id === b.id))
                      .slice(0, 10)
                      .map(book => (
                        <button
                          key={book.id}
                          onClick={() => addBook(book)}
                          data-testid={`button-add-book-${book.id}`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                          style={{ borderColor: '#F3F4F6' }}
                        >
                          {book.cover_url ? (
                            <img src={book.cover_url} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-12 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                              <BookOpen className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate" style={{ color: '#3A3A3A' }}>{book.title}</div>
                            <div className="text-xs truncate" style={{ color: '#6B7280' }}>{book.author}</div>
                          </div>
                          <Plus className="w-4 h-4 flex-shrink-0" style={{ color: '#247ba0' }} />
                        </button>
                      ))}
                  </div>
                )}

                {selectedBooks.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>
                      Ausgewählt ({selectedBooks.length})
                    </div>
                    <div className="space-y-1">
                      {selectedBooks.map((book, index) => (
                        <div
                          key={book.id}
                          data-testid={`selected-book-${book.id}`}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={e => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                          style={{
                            borderColor: '#E5E7EB',
                            backgroundColor: dragIndex === index ? '#F0F9FF' : '#FFFFFF',
                          }}
                        >
                          <GripVertical className="w-4 h-4 flex-shrink-0 cursor-grab" style={{ color: '#9CA3AF' }} />
                          {book.cover_url ? (
                            <img src={book.cover_url} alt="" className="w-6 h-9 object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-9 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                              <BookOpen className="w-3 h-3" style={{ color: '#9CA3AF' }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate" style={{ color: '#3A3A3A' }}>{book.title}</div>
                            <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>{book.author}</div>
                          </div>
                          <button
                            onClick={() => removeBook(book.id)}
                            data-testid={`button-remove-book-${book.id}`}
                            className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  data-testid="button-cancel"
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveCuration}
                  disabled={!formTitle.trim() || saving}
                  data-testid="button-save-curation"
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                >
                  {saving ? 'Speichern...' : (editingCuration ? 'Aktualisieren' : 'Erstellen')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}