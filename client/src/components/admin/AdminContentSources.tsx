import { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const API_BASE = '/api';

interface AdminContentSource {
  id: number;
  user_id: string;
  source_type: string;
  title: string;
  feed_url: string;
  image_url: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  display_name: string;
  slug: string;
  episode_count: number;
  book_count: number;
}

interface AdminStats {
  total_sources: number;
  total_episodes: number;
  total_books: number;
  active_sources: number;
}

interface SortConfig {
  key: keyof AdminContentSource;
  direction: 'asc' | 'desc';
}

function getAdminToken(): string {
  return localStorage.getItem('admin_session_token') || '';
}

function getAdminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-admin-token': getAdminToken(),
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–';
  try {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '–';
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Nie';
  try {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '–';
  }
}

function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '…';
}

function getSourceTypeColor(sourceType: string): { bg: string; text: string; label: string } {
  switch (sourceType.toLowerCase()) {
    case 'podcast':
      return { bg: '#DBEAFE', text: '#1E40AF', label: 'Podcast' };
    case 'youtube':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'YouTube' };
    case 'website':
      return { bg: '#F3E8FF', text: '#6B21A8', label: 'Website' };
    default:
      return { bg: '#F3F4F6', text: '#374151', label: sourceType };
  }
}

export function AdminContentSources() {
  const [sources, setSources] = useState<AdminContentSource[]>([]);
  const [filteredSources, setFilteredSources] = useState<AdminContentSource[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchContentSources();
  }, []);

  // Update filtered sources when sources, search query, or sort config changes
  useEffect(() => {
    let results = [...sources];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (source) =>
          source.display_name.toLowerCase().includes(query) ||
          source.title.toLowerCase().includes(query) ||
          source.slug.toLowerCase().includes(query) ||
          source.feed_url.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue as string);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number') {
        const comparison = (aValue as number) - (bValue as number);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle date strings
      if (typeof aValue === 'string' && typeof bValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(aValue) && /^\d{4}-\d{2}-\d{2}/.test(bValue as string)) {
        const comparison = new Date(aValue).getTime() - new Date(bValue as string).getTime();
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    setFilteredSources(results);
  }, [sources, searchQuery, sortConfig]);

  async function fetchContentSources() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/content-sources`, {
        headers: getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to load content sources');
      }

      const data = Array.isArray(result.data) ? result.data : [];
      setSources(data);

      // Calculate stats from the data
      const totalEpisodes = data.reduce((sum: number, s: AdminContentSource) => sum + s.episode_count, 0);
      const totalBooks = data.reduce((sum: number, s: AdminContentSource) => sum + s.book_count, 0);
      const activeSources = data.filter((s: AdminContentSource) => s.is_active).length;

      setStats({
        total_sources: data.length,
        total_episodes: totalEpisodes,
        total_books: totalBooks,
        active_sources: activeSources,
      });
    } catch (err) {
      console.error('Error loading content sources:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (key: keyof AdminContentSource) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortHeader = ({ column, label }: { column: keyof AdminContentSource; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-75 transition-opacity"
      style={{ color: '#3A3A3A' }}
      data-testid={`button-sort-${column}`}
    >
      {label}
      {sortConfig.key === column && (
        sortConfig.direction === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
          data-testid="heading-admin-content-sources"
        >
          Content-Quellen Verwaltung
        </h2>
        <p style={{ color: '#6B7280' }}>
          Übersicht aller Content-Quellen von allen Benutzern
        </p>
      </div>

      {error && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
          data-testid="text-error"
        >
          Fehler beim Laden: {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#F3F4F6' }}
            data-testid="card-stat-total-sources"
          >
            <div className="text-xs mb-1" style={{ color: '#6B7280' }}>
              Quellen
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: '#247ba0' }}
              data-testid="text-stat-total-sources"
            >
              {stats.total_sources}
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#F3F4F6' }}
            data-testid="card-stat-active-sources"
          >
            <div className="text-xs mb-1" style={{ color: '#6B7280' }}>
              Aktive
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: '#247ba0' }}
              data-testid="text-stat-active-sources"
            >
              {stats.active_sources}
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#F3F4F6' }}
            data-testid="card-stat-total-episodes"
          >
            <div className="text-xs mb-1" style={{ color: '#6B7280' }}>
              Episoden
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: '#247ba0' }}
              data-testid="text-stat-total-episodes"
            >
              {stats.total_episodes}
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#F3F4F6' }}
            data-testid="card-stat-total-books"
          >
            <div className="text-xs mb-1" style={{ color: '#6B7280' }}>
              Bücher
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: '#247ba0' }}
              data-testid="text-stat-total-books"
            >
              {stats.total_books}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: '#9CA3AF' }}
          />
          <input
            type="text"
            placeholder="Nach Benutzer, Quelle oder Feed-URL suchen…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }}
            data-testid="input-search-sources"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#247ba0' }} />
        </div>
      ) : filteredSources.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
          data-testid="text-no-sources"
        >
          {searchQuery ? 'Keine Quellen gefunden.' : 'Noch keine Content-Quellen vorhanden.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#E5E7EB' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th className="px-4 py-3 text-left">
                  <SortHeader column="display_name" label="Benutzer" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader column="title" label="Quelle" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader column="feed_url" label="Feed-URL" />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader column="episode_count" label="Episoden" />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader column="book_count" label="Bücher" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader column="is_active" label="Status" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader column="last_synced_at" label="Letzte Sync" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader column="created_at" label="Erstellt am" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((source, index) => {
                const sourceTypeStyle = getSourceTypeColor(source.source_type);
                return (
                  <tr
                    key={source.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                    data-testid={`row-source-${source.id}`}
                  >
                    {/* Benutzer */}
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: '#3A3A3A' }} data-testid={`text-user-name-${source.id}`}>
                        {source.display_name}
                      </div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }} data-testid={`text-user-slug-${source.id}`}>
                        {source.slug}
                      </div>
                    </td>

                    {/* Quelle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: '#3A3A3A' }} data-testid={`text-source-title-${source.id}`}>
                            {source.title}
                          </div>
                          <span
                            className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                            style={{ backgroundColor: sourceTypeStyle.bg, color: sourceTypeStyle.text }}
                            data-testid={`badge-source-type-${source.id}`}
                          >
                            {sourceTypeStyle.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Feed-URL */}
                    <td className="px-4 py-3">
                      <a
                        href={source.feed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline"
                        style={{ color: '#247ba0' }}
                        title={source.feed_url}
                        data-testid={`link-feed-url-${source.id}`}
                      >
                        {truncateUrl(source.feed_url)}
                      </a>
                    </td>

                    {/* Episoden */}
                    <td className="px-4 py-3 text-right" style={{ color: '#3A3A3A' }} data-testid={`text-episode-count-${source.id}`}>
                      {source.episode_count}
                    </td>

                    {/* Bücher */}
                    <td className="px-4 py-3 text-right" style={{ color: '#3A3A3A' }} data-testid={`text-book-count-${source.id}`}>
                      {source.book_count}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: source.is_active ? '#D1FAE5' : '#FEF2F2',
                          color: source.is_active ? '#065F46' : '#991B1B',
                        }}
                        data-testid={`badge-status-${source.id}`}
                      >
                        {source.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>

                    {/* Letzte Sync */}
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }} data-testid={`text-last-synced-${source.id}`}>
                      {formatDateTime(source.last_synced_at)}
                    </td>

                    {/* Erstellt am */}
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }} data-testid={`text-created-at-${source.id}`}>
                      {formatDate(source.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && filteredSources.length > 0 && (
        <div className="text-xs text-center" style={{ color: '#6B7280' }} data-testid="text-summary">
          Zeige {filteredSources.length} von {sources.length} Quellen
        </div>
      )}
    </div>
  );
}
