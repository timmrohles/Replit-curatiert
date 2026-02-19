import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Trash2, Eye, EyeOff, Search, ExternalLink, RefreshCw, Loader, AlertCircle } from 'lucide-react';

interface AdminEvent {
  id: number;
  title: string;
  event_type: string;
  user_id: string | null;
  event_date: string;
  event_end_date: string | null;
  location_name: string | null;
  location_address: string | null;
  description: string | null;
  max_participants: number | null;
  participant_count: number;
  is_published: boolean;
  created_at: string;
  event_page_url: string | null;
}

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Alle Typen' },
  { value: 'lesung', label: 'Lesung' },
  { value: 'buchclub', label: 'Buchclub' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'signierstunde', label: 'Signierstunde' },
  { value: 'messe', label: 'Messe' },
  { value: 'vortrag', label: 'Vortrag' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Alle Status' },
  { value: 'published', label: 'Veröffentlicht' },
  { value: 'draft', label: 'Entwurf' },
];

export function AdminEventsTab() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const getToken = () => localStorage.getItem('admin_token') || localStorage.getItem('admin_neon_token');

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Authentifizierung erforderlich');
        return;
      }

      const response = await fetch('/api/admin/events', {
        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data.data || data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden der Events';
      setError(message);
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const togglePublished = async (eventId: number, currentStatus: boolean) => {
    setActionLoading(eventId);
    try {
      const token = getToken();
      if (!token) {
        setError('Authentifizierung erforderlich');
        return;
      }

      const response = await fetch(`/api/admin/events/${eventId}/toggle-publish`, {
        method: 'PUT',
        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }

      setEvents(events.map(e =>
        e.id === eventId ? { ...e, is_published: !currentStatus } : e
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren';
      setError(message);
      await loadEvents();
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Möchtest du dieses Event wirklich löschen?')) return;

    setActionLoading(eventId);
    try {
      const token = getToken();
      if (!token) {
        setError('Authentifizierung erforderlich');
        return;
      }

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }

      setEvents(events.filter(e => e.id !== eventId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Löschen';
      setError(message);
      await loadEvents();
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeLabel = (type: string) => {
    const found = EVENT_TYPE_OPTIONS.find(o => o.value === type);
    return found ? found.label : type;
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || event.event_type === filterType;
    const matchesStatus = !filterStatus ||
      (filterStatus === 'published' && event.is_published) ||
      (filterStatus === 'draft' && !event.is_published);
    return matchesSearch && matchesType && matchesStatus;
  });

  const publishedCount = events.filter(e => e.is_published).length;
  const draftCount = events.filter(e => !e.is_published).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Events verwalten
        </h2>
        <button
          onClick={loadEvents}
          disabled={loading}
          className="px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            color: '#3A3A3A',
            border: '1px solid rgba(255, 193, 7, 0.5)',
          }}
          data-testid="button-refresh-events"
        >
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-start gap-3"
          style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
          data-testid="alert-error"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Fehler</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Nach Titel suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#3A3A3A',
              outline: 'none',
            }}
            data-testid="input-search-events"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            color: '#3A3A3A',
            outline: 'none',
          }}
          data-testid="select-filter-type"
        >
          {EVENT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            color: '#3A3A3A',
            outline: 'none',
          }}
          data-testid="select-filter-status"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin" style={{ color: '#FFC107' }} />
          <span className="ml-3" style={{ color: '#666666' }}>
            Lade Events...
          </span>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm" style={{ color: '#666666' }}>
            {events.length === 0 ? (
              <p>Keine Events vorhanden</p>
            ) : (
              <p>
                {filteredEvents.length} von {events.length} Event{events.length !== 1 ? 's' : ''}
                {' · '}
                {publishedCount} veröffentlicht
                {' · '}
                {draftCount} Entwürfe
              </p>
            )}
          </div>

          {filteredEvents.length > 0 && (
            <div className="overflow-x-auto border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Titel
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Typ
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Organisator
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Datum
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Ort
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Teilnehmer
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, index) => (
                    <tr
                      key={event.id}
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      }}
                      data-testid={`row-event-${event.id}`}
                    >
                      <td className="px-4 py-3 font-medium max-w-[200px]" style={{ color: '#3A3A3A' }}>
                        <span className="block truncate" title={event.title}>{event.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }}
                        >
                          {getEventTypeLabel(event.event_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#666666' }}>
                        {event.user_id ? event.user_id.substring(0, 12) + '...' : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#666666' }}>
                        {formatDate(event.event_date)}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[150px]" style={{ color: '#666666' }}>
                        <span className="block truncate" title={event.location_name || ''}>
                          {event.location_name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#3A3A3A' }}>
                        {event.participant_count}
                        {event.max_participants ? ` / ${event.max_participants}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            event.is_published
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-orange-100 text-orange-800 border border-orange-300'
                          }`}
                          data-testid={`status-event-${event.id}`}
                        >
                          {event.is_published ? 'Veröffentlicht' : 'Entwurf'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePublished(event.id, event.is_published)}
                            disabled={actionLoading === event.id}
                            className="px-3 py-1 rounded transition-colors text-xs font-medium inline-flex items-center gap-1"
                            style={{
                              backgroundColor: actionLoading === event.id ? '#E5E7EB' : '#247ba0',
                              color: actionLoading === event.id ? '#9CA3AF' : '#FFFFFF',
                            }}
                            title={event.is_published ? 'Als Entwurf setzen' : 'Veröffentlichen'}
                            data-testid={`button-toggle-publish-${event.id}`}
                          >
                            {actionLoading === event.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : event.is_published ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            {event.is_published ? 'Verbergen' : 'Publish'}
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={actionLoading === event.id}
                            className="px-3 py-1 rounded transition-colors text-xs font-medium inline-flex items-center gap-1"
                            style={{
                              backgroundColor: actionLoading === event.id ? '#E5E7EB' : '#EF4444',
                              color: actionLoading === event.id ? '#9CA3AF' : '#FFFFFF',
                            }}
                            data-testid={`button-delete-event-${event.id}`}
                          >
                            {actionLoading === event.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredEvents.length === 0 && events.length > 0 && (
            <div className="text-center py-8" style={{ color: '#9CA3AF' }}>
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Keine Events gefunden für die aktuelle Filterung</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminEventsTab;
