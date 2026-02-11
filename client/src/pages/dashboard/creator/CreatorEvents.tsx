import { useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Eye, EyeOff, Filter, X, MapPin, Users, Clock } from 'lucide-react';

type EventStatus = 'draft' | 'published';
type EventType = 'online' | 'offline';

interface Event {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  status: EventStatus;
  createdAt: string;
  publishedAt?: string;
}

export function CreatorEvents() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Buchvorstellung: Die Jahre',
      type: 'offline',
      date: '2025-02-15',
      time: '19:00',
      location: 'Literaturhaus München',
      description: 'Eine intensive Diskussion über Annie Ernaux\' Meisterwerk',
      maxParticipants: 50,
      currentParticipants: 23,
      status: 'published',
      createdAt: '2025-01-10',
      publishedAt: '2025-01-12'
    },
    {
      id: '2',
      title: 'Online Book Club: Feministische Literatur',
      type: 'online',
      date: '2025-02-20',
      time: '20:00',
      location: 'Zoom Meeting',
      description: 'Monatliches Treffen für feministische Bücher',
      maxParticipants: 100,
      currentParticipants: 67,
      status: 'published',
      createdAt: '2025-01-15',
      publishedAt: '2025-01-16'
    },
    {
      id: '3',
      title: 'Lesung: Neue Kurzgeschichten',
      type: 'offline',
      date: '2025-03-01',
      time: '18:30',
      location: 'Café Luitpold, Berlin',
      description: 'Premiere meiner neuen Kurzgeschichtensammlung',
      maxParticipants: 30,
      currentParticipants: 0,
      status: 'draft',
      createdAt: '2025-01-22'
    }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const filteredEvents = events.filter(e => {
    const statusMatch = statusFilter === 'all' || e.status === statusFilter;
    const typeMatch = typeFilter === 'all' || e.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const publishEvent = (id: string) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, status: 'published', publishedAt: new Date().toISOString() } : e
    ));
  };

  const unpublishEvent = (id: string) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, status: 'draft', publishedAt: undefined } : e
    ));
  };

  const deleteEvent = (id: string) => {
    if (confirm('Möchtest du dieses Event wirklich löschen?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
          <Eye className="w-3 h-3" />
          Veröffentlicht
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
        <EyeOff className="w-3 h-3" />
        Entwurf
      </span>
    );
  };

  const getTypeBadge = (type: EventType) => {
    if (type === 'online') {
      return (
        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
          Online
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FCE7F3', color: '#9F1239' }}>
        Vor Ort
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Meine Events
          </h1>
          <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
            Verwalte deine Lesungen, Buchvorstellungen und Community-Events
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
          style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
        >
          <Plus className="w-5 h-5" />
          Neues Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {events.length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Gesamt</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#10B981' }}>
            {events.filter(e => e.status === 'published').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Veröffentlicht</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#F59E0B' }}>
            {events.filter(e => e.status === 'draft').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Entwürfe</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}>
            {events.reduce((sum, e) => sum + e.currentParticipants, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Teilnehmer</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#6B7280' }}>Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'all' ? '#247ba0' : '#F3F4F6',
              color: statusFilter === 'all' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Alle ({events.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'published' ? '#10B981' : '#F3F4F6',
              color: statusFilter === 'published' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Veröffentlicht ({events.filter(e => e.status === 'published').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'draft' ? '#F59E0B' : '#F3F4F6',
              color: statusFilter === 'draft' ? '#92400e' : '#3A3A3A'
            }}
          >
            Entwürfe ({events.filter(e => e.status === 'draft').length})
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#6B7280' }}>Typ:</span>
          <button
            onClick={() => setTypeFilter('all')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: typeFilter === 'all' ? '#247ba0' : '#F3F4F6',
              color: typeFilter === 'all' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Alle
          </button>
          <button
            onClick={() => setTypeFilter('online')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: typeFilter === 'online' ? '#247ba0' : '#F3F4F6',
              color: typeFilter === 'online' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Online
          </button>
          <button
            onClick={() => setTypeFilter('offline')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: typeFilter === 'offline' ? '#247ba0' : '#F3F4F6',
              color: typeFilter === 'offline' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Vor Ort
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="rounded-lg p-12 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Events
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Erstelle dein erstes Event
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: '#247ba0' }}
            >
              Event erstellen
            </button>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div 
              key={event.id}
              className="rounded-lg p-4 md:p-6 border hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                      {event.title}
                    </h3>
                    {getStatusBadge(event.status)}
                    {getTypeBadge(event.type)}
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                      <Clock className="w-4 h-4" />
                      {event.time} Uhr
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    {event.status === 'published' && (
                      <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                        <Users className="w-4 h-4" />
                        {event.currentParticipants} / {event.maxParticipants} Teilnehmer
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs md:text-sm mb-3" style={{ color: '#3A3A3A' }}>
                    {event.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                    <span>Erstellt: {new Date(event.createdAt).toLocaleDateString('de-DE')}</span>
                    {event.publishedAt && (
                      <span>Veröffentlicht: {new Date(event.publishedAt).toLocaleDateString('de-DE')}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="md:hidden">Bearbeiten</span>
                  </button>
                  
                  {event.status === 'draft' ? (
                    <button
                      onClick={() => publishEvent(event.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                      title="Veröffentlichen"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="md:hidden">Veröffentlichen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => unpublishEvent(event.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                      title="Zurücknehmen"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span className="md:hidden">Zurücknehmen</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden">Löschen</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingEvent ? 'Event bearbeiten' : 'Neues Event'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingEvent(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Event-Titel
                </label>
                <input
                  type="text"
                  defaultValue={editingEvent?.title}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Buchvorstellung: Die Jahre"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                    Datum
                  </label>
                  <input
                    type="date"
                    defaultValue={editingEvent?.date}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    defaultValue={editingEvent?.time}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Event-Typ
                </label>
                <select
                  defaultValue={editingEvent?.type || 'online'}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="online">Online</option>
                  <option value="offline">Vor Ort</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Ort / Link
                </label>
                <input
                  type="text"
                  defaultValue={editingEvent?.location}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Literaturhaus München oder Zoom-Link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Max. Teilnehmer
                </label>
                <input
                  type="number"
                  defaultValue={editingEvent?.maxParticipants || 50}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Beschreibung
                </label>
                <textarea
                  defaultValue={editingEvent?.description}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Beschreibe dein Event..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                >
                  Als Entwurf speichern
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                >
                  Veröffentlichen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
