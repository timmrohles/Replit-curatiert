import { useState, useEffect, useCallback } from 'react';
import {
  Rss, Plus, RefreshCw, Trash2, Eye, EyeOff, Check, ChevronDown, ChevronUp,
  Loader2, Lock, Star, Radio, Globe, Youtube, X
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

const API_BASE = '/api';

interface ContentSource {
  id: number;
  user_id: string;
  source_type: string;
  title: string | null;
  feed_url: string;
  website_url: string | null;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  sync_frequency: string;
  created_at: string;
}

interface ContentEpisode {
  id: number;
  title: string;
  episode_number: string | null;
  description: string | null;
  content_url: string | null;
  audio_url: string | null;
  published_at: string | null;
  is_processed: boolean;
  processing_status: string;
  books: ExtractedBook[];
}

interface ExtractedBook {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  sentiment: string;
  recommendation_strength: number;
  host_quote: string | null;
  context_note: string | null;
  extraction_confidence: number;
  is_verified: boolean;
  is_visible: boolean;
}

interface SourceStats {
  episodeCount: number;
  bookCount: number;
}

function getSentimentColor(sentiment: string): { bg: string; text: string; label: string } {
  switch (sentiment) {
    case 'very_positive':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Sehr positiv' };
    case 'positive':
      return { bg: '#ECFCCB', text: '#3F6212', label: 'Positiv' };
    case 'neutral':
      return { bg: '#F3F4F6', text: '#374151', label: 'Neutral' };
    case 'negative':
      return { bg: '#FED7AA', text: '#9A3412', label: 'Negativ' };
    case 'critical':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Kritisch' };
    default:
      return { bg: '#F3F4F6', text: '#374151', label: sentiment };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–';
  try {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '–';
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Nie';
  try {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'Nie';
  }
}

function getStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'completed':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Verarbeitet' };
    case 'processing':
      return { bg: '#DBEAFE', text: '#1E40AF', label: 'In Bearbeitung' };
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Ausstehend' };
    case 'failed':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Fehlgeschlagen' };
    default:
      return { bg: '#F3F4F6', text: '#374151', label: status };
  }
}

function RenderStars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          style={{
            color: i <= count ? '#F59E0B' : '#D1D5DB',
            fill: i <= count ? '#F59E0B' : 'none',
          }}
        />
      ))}
    </span>
  );
}

export function ContentSourcesManager() {
  const { user: authUser } = useAuth();
  const USER_ID = authUser?.id || 'demo-user-123';
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newSourceType, setNewSourceType] = useState('podcast');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSource, setExpandedSource] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Record<number, ContentEpisode[]>>({});
  const [episodesLoading, setEpisodesLoading] = useState<Record<number, boolean>>({});
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [sourceStats, setSourceStats] = useState<Record<number, SourceStats>>({});

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/content-sources`, {
        headers: { 'x-user-id': USER_ID },
      });
      const json = await res.json();
      if (json.ok || json.data || Array.isArray(json)) {
        const data = json.data || json;
        setSources(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error('Failed to load content sources');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSourceStats = useCallback(async (sourceId: number) => {
    try {
      const res = await fetch(`${API_BASE}/content-sources/${sourceId}/episodes`, {
        headers: { 'x-user-id': USER_ID },
      });
      const json = await res.json();
      const eps: ContentEpisode[] = json.data || json || [];
      const bookCount = eps.reduce((sum, ep) => sum + (ep.books?.length || 0), 0);
      setSourceStats(prev => ({
        ...prev,
        [sourceId]: { episodeCount: eps.length, bookCount },
      }));
    } catch {
      setSourceStats(prev => ({
        ...prev,
        [sourceId]: { episodeCount: 0, bookCount: 0 },
      }));
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    sources.forEach(s => {
      if (!sourceStats[s.id]) {
        fetchSourceStats(s.id);
      }
    });
  }, [sources, fetchSourceStats, sourceStats]);

  const handleAddSource = async () => {
    if (!newFeedUrl.trim()) return;
    setAddingSource(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/content-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
        body: JSON.stringify({ feedUrl: newFeedUrl.trim(), sourceType: newSourceType }),
      });
      const json = await res.json();
      if (res.ok || json.ok) {
        setMessage({ type: 'success', text: 'Content-Quelle erfolgreich hinzugefügt!' });
        setNewFeedUrl('');
        setShowAddForm(false);
        await fetchSources();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: json.error || 'Fehler beim Hinzufügen' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Verbindungsfehler beim Hinzufügen' });
    } finally {
      setAddingSource(false);
    }
  };

  const handleSync = async (sourceId: number) => {
    setSyncingIds(prev => new Set(prev).add(sourceId));
    try {
      const res = await fetch(`${API_BASE}/content-sources/${sourceId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
      });
      const json = await res.json();
      if (res.ok || json.ok) {
        setMessage({ type: 'success', text: 'Synchronisierung gestartet!' });
        await fetchSources();
        await fetchSourceStats(sourceId);
        if (expandedSource === sourceId) {
          await fetchEpisodes(sourceId);
        }
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: json.error || 'Fehler bei der Synchronisierung' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Verbindungsfehler bei der Synchronisierung' });
    } finally {
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }
  };

  const handleDelete = async (sourceId: number) => {
    try {
      const res = await fetch(`${API_BASE}/content-sources/${sourceId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': USER_ID },
      });
      const json = await res.json();
      if (res.ok || json.ok) {
        setMessage({ type: 'success', text: 'Content-Quelle gelöscht!' });
        setSources(prev => prev.filter(s => s.id !== sourceId));
        if (expandedSource === sourceId) setExpandedSource(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: json.error || 'Fehler beim Löschen' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Verbindungsfehler beim Löschen' });
    }
  };

  const handleToggleActive = async (source: ContentSource) => {
    try {
      const res = await fetch(`${API_BASE}/content-sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
        body: JSON.stringify({ isActive: !source.is_active }),
      });
      const json = await res.json();
      if (res.ok || json.ok) {
        setSources(prev => prev.map(s => s.id === source.id ? { ...s, is_active: !s.is_active } : s));
      }
    } catch {
      setMessage({ type: 'error', text: 'Fehler beim Aktualisieren' });
    }
  };

  const fetchEpisodes = async (sourceId: number) => {
    setEpisodesLoading(prev => ({ ...prev, [sourceId]: true }));
    try {
      const res = await fetch(`${API_BASE}/content-sources/${sourceId}/episodes`, {
        headers: { 'x-user-id': USER_ID },
      });
      const json = await res.json();
      const data = json.data || json || [];
      setEpisodes(prev => ({ ...prev, [sourceId]: Array.isArray(data) ? data : [] }));
    } catch {
      setEpisodes(prev => ({ ...prev, [sourceId]: [] }));
    } finally {
      setEpisodesLoading(prev => ({ ...prev, [sourceId]: false }));
    }
  };

  const toggleSourceExpand = (sourceId: number) => {
    if (expandedSource === sourceId) {
      setExpandedSource(null);
    } else {
      setExpandedSource(sourceId);
      if (!episodes[sourceId]) {
        fetchEpisodes(sourceId);
      }
    }
  };

  const handleToggleBookVisibility = async (bookId: number, currentVisible: boolean, sourceId: number) => {
    try {
      await fetch(`${API_BASE}/extracted-books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
        body: JSON.stringify({ isVisible: !currentVisible }),
      });
      setEpisodes(prev => {
        const eps = prev[sourceId] || [];
        return {
          ...prev,
          [sourceId]: eps.map(ep => ({
            ...ep,
            books: ep.books.map(b => b.id === bookId ? { ...b, is_visible: !currentVisible } : b),
          })),
        };
      });
    } catch {
      setMessage({ type: 'error', text: 'Fehler beim Aktualisieren der Sichtbarkeit' });
    }
  };

  const handleVerifyBook = async (bookId: number, sourceId: number) => {
    try {
      await fetch(`${API_BASE}/extracted-books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
        body: JSON.stringify({ isVerified: true }),
      });
      setEpisodes(prev => {
        const eps = prev[sourceId] || [];
        return {
          ...prev,
          [sourceId]: eps.map(ep => ({
            ...ep,
            books: ep.books.map(b => b.id === bookId ? { ...b, is_verified: true } : b),
          })),
        };
      });
    } catch {
      setMessage({ type: 'error', text: 'Fehler beim Verifizieren' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#247ba0' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl md:text-3xl mb-2 text-center"
          style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
          data-testid="heading-content-sources"
        >
          <div className="flex items-center justify-center gap-3">
            <Rss className="w-7 h-7" style={{ color: '#247ba0' }} />
            Content-Quellen
          </div>
        </h1>
        <p className="text-sm text-center" style={{ color: '#6B7280' }}>
          Verwalte Podcast-Feeds und extrahiere automatisch Buchempfehlungen aus Shownotes
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: '#247ba0', color: '#ffffff' }}
          data-testid="button-add-source"
        >
          <Plus className="w-4 h-4" />
          Neue Quelle hinzufügen
        </button>
      </div>

      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
          }}
          data-testid="text-source-message"
        >
          {message.text}
        </div>
      )}

      {showAddForm && (
        <div className="rounded-lg border p-6" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: '#3A3A3A' }}>
              Neue Content-Quelle
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded"
              data-testid="button-close-add-form"
            >
              <X className="w-5 h-5" style={{ color: '#9CA3AF' }} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                Quellentyp
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setNewSourceType('podcast')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: newSourceType === 'podcast' ? '#247ba0' : '#E5E7EB',
                    backgroundColor: newSourceType === 'podcast' ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                  }}
                  data-testid="button-type-podcast"
                >
                  <Radio className="w-6 h-6" style={{ color: newSourceType === 'podcast' ? '#247ba0' : '#6B7280' }} />
                  <span className="text-sm font-medium" style={{ color: newSourceType === 'podcast' ? '#247ba0' : '#3A3A3A' }}>
                    Podcast
                  </span>
                </button>
                <button
                  disabled
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 opacity-50 cursor-not-allowed"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                  data-testid="button-type-youtube"
                >
                  <Youtube className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                  <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>YouTube</span>
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
                    <Lock className="w-3 h-3" /> Bald verfügbar
                  </span>
                </button>
                <button
                  disabled
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 opacity-50 cursor-not-allowed"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                  data-testid="button-type-website"
                >
                  <Globe className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                  <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Website</span>
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
                    <Lock className="w-3 h-3" /> Bald verfügbar
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Feed-URL *
              </label>
              <input
                type="url"
                value={newFeedUrl}
                onChange={e => setNewFeedUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSource()}
                placeholder="https://example.com/podcast/feed.xml"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }}
                data-testid="input-feed-url"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddSource}
                disabled={addingSource || !newFeedUrl.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#247ba0', color: '#ffffff' }}
                data-testid="button-submit-source"
              >
                {addingSource ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {sources.length === 0 ? (
        <div className="text-center py-12">
          <Rss className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Noch keine Content-Quellen hinzugefügt. Füge einen Podcast-Feed hinzu, um Buchempfehlungen zu extrahieren.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map(source => {
            const isExpanded = expandedSource === source.id;
            const isSyncing = syncingIds.has(source.id);
            const stats = sourceStats[source.id];

            return (
              <div
                key={source.id}
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
                data-testid={`card-source-${source.id}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {source.image_url && (
                      <img
                        src={source.image_url}
                        alt={source.title || 'Podcast'}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        data-testid={`img-source-${source.id}`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3
                          className="text-base font-semibold truncate"
                          style={{ color: '#3A3A3A' }}
                          data-testid={`text-source-title-${source.id}`}
                        >
                          {source.title || source.feed_url}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)', color: '#247ba0' }}
                          data-testid={`badge-source-type-${source.id}`}
                        >
                          {source.source_type === 'podcast' ? 'Podcast' : source.source_type}
                        </span>
                        {!source.is_active && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}
                          >
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate mb-2" style={{ color: '#9CA3AF' }} data-testid={`text-feed-url-${source.id}`}>
                        {source.feed_url}
                      </p>
                      <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: '#6B7280' }}>
                        <span data-testid={`text-episode-count-${source.id}`}>
                          {stats ? `${stats.episodeCount} Episoden` : '…'}
                        </span>
                        <span data-testid={`text-book-count-${source.id}`}>
                          {stats ? `${stats.bookCount} Bücher` : '…'}
                        </span>
                        <span data-testid={`text-last-synced-${source.id}`}>
                          Letzte Sync: {formatDateTime(source.last_synced_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSync(source.id)}
                        disabled={isSyncing}
                        className="p-2 rounded-lg border transition-colors disabled:opacity-50"
                        style={{ borderColor: '#E5E7EB' }}
                        title="Synchronisieren"
                        data-testid={`button-sync-${source.id}`}
                      >
                        {isSyncing ? (
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#247ba0' }} />
                        ) : (
                          <RefreshCw className="w-4 h-4" style={{ color: '#247ba0' }} />
                        )}
                      </button>
                      <label
                        className="relative inline-flex items-center cursor-pointer"
                        title={source.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        data-testid={`toggle-active-${source.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={source.is_active}
                          onChange={() => handleToggleActive(source)}
                          className="sr-only peer"
                          data-testid={`input-active-${source.id}`}
                        />
                        <div
                          className="w-9 h-5 rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                          style={{ backgroundColor: source.is_active ? '#247ba0' : '#D1D5DB' }}
                        />
                      </label>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="p-2 rounded-lg border transition-colors"
                        style={{ borderColor: '#E5E7EB' }}
                        title="Löschen"
                        data-testid={`button-delete-${source.id}`}
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                      </button>
                      <button
                        onClick={() => toggleSourceExpand(source.id)}
                        className="p-2 rounded-lg border transition-colors"
                        style={{ borderColor: '#E5E7EB' }}
                        data-testid={`button-expand-${source.id}`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" style={{ color: '#6B7280' }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 pb-4" style={{ borderColor: '#E5E7EB' }}>
                    <h4 className="text-sm font-semibold mt-4 mb-3" style={{ color: '#3A3A3A' }}>
                      Episoden & extrahierte Bücher
                    </h4>
                    {episodesLoading[source.id] ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#247ba0' }} />
                      </div>
                    ) : (episodes[source.id] || []).length === 0 ? (
                      <p className="text-sm py-4 text-center" style={{ color: '#9CA3AF' }}>
                        Keine Episoden gefunden. Starte eine Synchronisierung.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {(episodes[source.id] || []).map(episode => {
                          const statusBadge = getStatusBadge(episode.processing_status);
                          return (
                            <div
                              key={episode.id}
                              className="rounded-lg border p-4"
                              style={{ borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' }}
                              data-testid={`card-episode-${episode.id}`}
                            >
                              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                                <div className="flex-1 min-w-0">
                                  <h5
                                    className="text-sm font-medium"
                                    style={{ color: '#3A3A3A' }}
                                    data-testid={`text-episode-title-${episode.id}`}
                                  >
                                    {episode.episode_number && (
                                      <span style={{ color: '#247ba0' }}>#{episode.episode_number} </span>
                                    )}
                                    {episode.title}
                                  </h5>
                                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                                    {formatDate(episode.published_at)}
                                  </p>
                                </div>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                                  data-testid={`badge-status-${episode.id}`}
                                >
                                  {statusBadge.label}
                                </span>
                              </div>

                              {episode.books && episode.books.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {episode.books.map(book => {
                                    const sentimentStyle = getSentimentColor(book.sentiment);
                                    return (
                                      <div
                                        key={book.id}
                                        className="rounded-lg border p-3"
                                        style={{
                                          borderColor: '#E5E7EB',
                                          backgroundColor: '#FFFFFF',
                                          opacity: book.is_visible ? 1 : 0.6,
                                        }}
                                        data-testid={`card-book-${book.id}`}
                                      >
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                              <span
                                                className="text-sm font-semibold"
                                                style={{ color: '#3A3A3A' }}
                                                data-testid={`text-book-title-${book.id}`}
                                              >
                                                {book.title}
                                              </span>
                                              {book.is_verified && (
                                                <span
                                                  className="text-xs px-1.5 py-0.5 rounded-full"
                                                  style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                                                >
                                                  Verifiziert
                                                </span>
                                              )}
                                            </div>
                                            {book.author && (
                                              <p className="text-xs mb-1" style={{ color: '#6B7280' }} data-testid={`text-book-author-${book.id}`}>
                                                von {book.author}
                                              </p>
                                            )}
                                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                              <span
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: sentimentStyle.bg, color: sentimentStyle.text }}
                                                data-testid={`badge-sentiment-${book.id}`}
                                              >
                                                {sentimentStyle.label}
                                              </span>
                                              <span data-testid={`stars-${book.id}`}>
                                                <RenderStars count={book.recommendation_strength} />
                                              </span>
                                              <span className="text-xs" style={{ color: '#9CA3AF' }} data-testid={`text-confidence-${book.id}`}>
                                                {Math.round(book.extraction_confidence * 100)}% Konfidenz
                                              </span>
                                            </div>
                                            {book.host_quote && (
                                              <p
                                                className="text-xs italic mb-1"
                                                style={{ color: '#6B7280' }}
                                                data-testid={`text-quote-${book.id}`}
                                              >
                                                „{book.host_quote}"
                                              </p>
                                            )}
                                            {book.context_note && (
                                              <p
                                                className="text-xs"
                                                style={{ color: '#9CA3AF' }}
                                                data-testid={`text-context-${book.id}`}
                                              >
                                                {book.context_note}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                              onClick={() => handleToggleBookVisibility(book.id, book.is_visible, source.id)}
                                              className="p-1.5 rounded border transition-colors"
                                              style={{ borderColor: '#E5E7EB' }}
                                              title={book.is_visible ? 'Ausblenden' : 'Einblenden'}
                                              data-testid={`button-visibility-${book.id}`}
                                            >
                                              {book.is_visible ? (
                                                <Eye className="w-3.5 h-3.5" style={{ color: '#247ba0' }} />
                                              ) : (
                                                <EyeOff className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                                              )}
                                            </button>
                                            {!book.is_verified && (
                                              <button
                                                onClick={() => handleVerifyBook(book.id, source.id)}
                                                className="p-1.5 rounded border transition-colors"
                                                style={{ borderColor: '#E5E7EB' }}
                                                title="Verifizieren"
                                                data-testid={`button-verify-${book.id}`}
                                              >
                                                <Check className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        className="rounded-lg border p-6 opacity-60"
        style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
        data-testid="banner-phase2"
      >
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-5 h-5" style={{ color: '#9CA3AF' }} />
          <h3 className="text-base font-semibold" style={{ color: '#6B7280' }}>
            Speech-to-Text Analyse (Premium)
          </h3>
        </div>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Automatische Transkription und Buchextraktion aus Audio-Inhalten
        </p>
        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
          Bald verfügbar für Premium-Mitglieder
        </p>
      </div>
    </div>
  );
}
