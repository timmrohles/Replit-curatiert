import { useState, useEffect, useCallback } from 'react';
import { Search, AlertTriangle, RefreshCw, BookOpen, Link2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiClient';
import { toast } from 'sonner';

interface UnmatchedBook {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  sentiment: string;
  recommendation_strength: number;
  extraction_confidence: number;
  cover_url: string | null;
  created_at: string;
  episode_title: string;
  episode_date: string | null;
  source_title: string;
  source_type: string;
  owner_name: string | null;
  owner_slug: string | null;
}

export function AdminUnmatchedBooks() {
  const [books, setBooks] = useState<UnmatchedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [matching, setMatching] = useState(false);

  const adminToken = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || '';

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/unmatched-books`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.ok) {
        setBooks(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load unmatched books:', err);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const runBatchMatch = async () => {
    setMatching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/batch-match-books`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Matching abgeschlossen: ${data.matched} gematched, ${data.unmatched} ohne Match`);
        loadBooks();
      } else {
        toast.error('Matching fehlgeschlagen: ' + (data.error || 'Unbekannter Fehler'));
      }
    } catch (err) {
      toast.error('Matching fehlgeschlagen');
    } finally {
      setMatching(false);
    }
  };

  const filtered = books.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) ||
           b.author.toLowerCase().includes(q) ||
           (b.source_title || '').toLowerCase().includes(q) ||
           (b.episode_title || '').toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="p-8 text-center" style={{ color: '#666' }}>Lädt nicht-gematchte Bücher...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Nicht-gematchte Bücher ({books.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runBatchMatch}
            disabled={matching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: matching ? '#ccc' : '#247ba0',
              color: '#fff',
              opacity: matching ? 0.7 : 1
            }}
            data-testid="button-batch-match"
          >
            <RefreshCw className={`w-4 h-4 ${matching ? 'animate-spin' : ''}`} />
            {matching ? 'Matching läuft...' : 'Erneut matchen'}
          </button>
        </div>
      </div>

      <p className="text-sm mb-4" style={{ color: '#666' }}>
        Diese Bücher wurden aus Podcast-Episoden extrahiert, konnten aber keinem Eintrag in der Bücher-Datenbank zugeordnet werden.
        Mögliche Gründe: Titel/Autor weichen ab, oder das Buch fehlt in der Datenbank.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suche nach Titel, Autor, Quelle..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          style={{ borderColor: '#ddd', color: '#3A3A3A' }}
          data-testid="input-search-unmatched"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-lg" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
          <BookOpen className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Alle Bücher sind gematched!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th className="text-left px-3 py-2 font-medium" style={{ color: '#6b7280' }}>Titel</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: '#6b7280' }}>Autor</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: '#6b7280' }}>Quelle</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: '#6b7280' }}>Episode</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: '#6b7280' }}>Konfidenz</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => (
                <tr key={book.id} className="border-t hover-elevate" style={{ borderColor: '#f3f4f6' }}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {book.cover_url && book.cover_url !== '' ? (
                        <img src={book.cover_url} alt="" className="w-8 h-12 object-cover rounded-sm flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-12 rounded-sm flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                          <BookOpen className="w-4 h-4" style={{ color: '#9ca3af' }} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium" style={{ color: '#3A3A3A' }} data-testid={`text-unmatched-title-${book.id}`}>{book.title}</div>
                        {book.isbn && <div className="text-xs" style={{ color: '#9ca3af' }}>ISBN: {book.isbn}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2" style={{ color: '#6b7280' }} data-testid={`text-unmatched-author-${book.id}`}>{book.author}</td>
                  <td className="px-3 py-2">
                    <div className="text-xs" style={{ color: '#6b7280' }}>
                      {book.source_title || book.source_type}
                      {book.owner_name && (
                        <span className="ml-1" style={{ color: '#9ca3af' }}>({book.owner_name})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs truncate max-w-[200px]" style={{ color: '#6b7280' }} title={book.episode_title}>
                      {book.episode_title}
                    </div>
                    {book.episode_date && (
                      <div className="text-xs" style={{ color: '#9ca3af' }}>
                        {new Date(book.episode_date).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: book.extraction_confidence >= 0.8 ? '#dcfce7' : book.extraction_confidence >= 0.5 ? '#fef9c3' : '#fee2e2',
                          color: book.extraction_confidence >= 0.8 ? '#166534' : book.extraction_confidence >= 0.5 ? '#854d0e' : '#991b1b'
                        }}
                      >
                        {Math.round(book.extraction_confidence * 100)}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
