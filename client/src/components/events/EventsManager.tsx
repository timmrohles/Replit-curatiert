import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar, MapPin, Clock, Globe, Rss } from 'lucide-react';
interface Event {
  id: string;
  storefrontSlug: string;
  title: string;
  description: string;
  type: string;
  location: string;
  date: string;
  time: string;
  image: string;
  isOnline: boolean;
  registrationUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface EventsManagerProps {
  storefrontSlug: string;
}

export function EventsManager({ storefrontSlug }: EventsManagerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [rssUrl, setRssUrl] = useState('');
  const [showRssImport, setShowRssImport] = useState(false);
  const [importingRss, setImportingRss] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Lesung',
    location: '',
    date: '',
    time: '',
    image: '',
    isOnline: false,
    registrationUrl: ''
  });

  const eventTypes = ['Lesung', 'Podcast Live', 'Panel', 'Livestream', 'Buchveröffentlichung', 'Interview', 'Workshop'];

  useEffect(() => {
    loadEvents();
  }, [storefrontSlug]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/events/${storefrontSlug}`,
        {
          headers: {
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load events');

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingEvent
        ? `/api/events/${editingEvent.id}`
        : `/api/events`;

      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          storefrontSlug,
        }),
      });

      if (!response.ok) throw new Error('Failed to save event');

      // Reset form and reload events
      setFormData({
        title: '',
        description: '',
        type: 'Lesung',
        location: '',
        date: '',
        time: '',
        image: '',
        isOnline: false,
        registrationUrl: ''
      });
      setIsCreating(false);
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Fehler beim Speichern der Veranstaltung');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Möchten Sie diese Veranstaltung wirklich löschen?')) return;

    try {
      const response = await fetch(
        `/api/events/${storefrontSlug}/${eventId}`,
        {
          method: 'DELETE',
          headers: {
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete event');

      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Fehler beim Löschen der Veranstaltung');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      type: event.type,
      location: event.location,
      date: event.date,
      time: event.time,
      image: event.image,
      isOnline: event.isOnline,
      registrationUrl: event.registrationUrl
    });
    setIsCreating(true);
  };

  const handleImportRss = async () => {
    if (!rssUrl) {
      alert('Bitte geben Sie eine RSS-Feed URL ein');
      return;
    }

    try {
      setImportingRss(true);
      const response = await fetch(
        `/api/events/import-rss`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storefrontSlug,
            rssUrl,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to import RSS feed');

      const data = await response.json();
      alert(`${data.imported} Veranstaltungen erfolgreich importiert`);
      setRssUrl('');
      setShowRssImport(false);
      loadEvents();
    } catch (error) {
      console.error('Error importing RSS:', error);
      alert('Fehler beim Importieren des RSS-Feeds');
    } finally {
      setImportingRss(false);
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      type: 'Lesung',
      location: '',
      date: '',
      time: '',
      image: '',
      isOnline: false,
      registrationUrl: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Lädt Veranstaltungen...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 
          className="text-[#3A3A3A]"
          style={{ fontFamily: 'Fjalla One', fontSize: '2rem' }}
        >
          VERANSTALTUNGEN VERWALTEN
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRssImport(!showRssImport)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#A0CEC8] text-[#3A3A3A] rounded-lg hover:bg-[#A0CEC8]/10 transition-colors"
          >
            <Rss size={18} />
            RSS Import
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#5a9690] text-white rounded-lg hover:bg-[#4a8680] transition-colors"
          >
            <Plus size={18} />
            Neue Veranstaltung
          </button>
        </div>
      </div>

      {/* RSS Import Section */}
      {showRssImport && (
        <div className="mb-6 p-6 bg-white rounded-lg border-2 border-[#A0CEC8]">
          <h3 className="text-lg mb-4 text-foreground" style={{ fontFamily: 'Fjalla One' }}>
            RSS-FEED IMPORTIEREN
          </h3>
          <p className="text-sm text-[#3A3A3A]/70 mb-4">
            Geben Sie die URL eines RSS-Feeds ein, um Veranstaltungen automatisch zu importieren.
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              placeholder="https://example.com/events.rss"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
            />
            <button
              onClick={handleImportRss}
              disabled={importingRss}
              className="px-6 py-2 bg-[#5a9690] text-white rounded-lg hover:bg-[#4a8680] transition-colors disabled:bg-gray-400"
            >
              {importingRss ? 'Importiere...' : 'Importieren'}
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 
            className="text-xl mb-6 text-foreground" 
            style={{ fontFamily: 'Fjalla One' }}
          >
            {editingEvent ? 'VERANSTALTUNG BEARBEITEN' : 'NEUE VERANSTALTUNG'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-[#3A3A3A]">Titel *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                placeholder="z.B. Lesung mit Autorenname"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#3A3A3A]">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                placeholder="Beschreibung der Veranstaltung..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-[#3A3A3A]">Art der Veranstaltung *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#3A3A3A]">Datum *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-[#3A3A3A]">Uhrzeit</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#3A3A3A]">Ort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                  placeholder="z.B. Buchhandlung XYZ, Berlin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#3A3A3A]">Bild URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                placeholder="https://example.com/event-image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#3A3A3A]">Registrierungs-URL</label>
              <input
                type="url"
                value={formData.registrationUrl}
                onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0CEC8]"
                placeholder="https://example.com/anmeldung"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOnline"
                checked={formData.isOnline}
                onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                className="w-4 h-4 text-[#5a9690] border-gray-300 rounded focus:ring-[#A0CEC8]"
              />
              <label htmlFor="isOnline" className="text-sm text-[#3A3A3A]">
                Online-Veranstaltung
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#5a9690] text-white rounded-lg hover:bg-[#4a8680] transition-colors"
              >
                {editingEvent ? 'Aktualisieren' : 'Erstellen'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 bg-gray-200 text-[#3A3A3A] rounded-lg hover:bg-gray-300 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">Noch keine Veranstaltungen erstellt</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 bg-[#5a9690] text-white rounded-lg hover:bg-[#4a8680] transition-colors"
            >
              Erste Veranstaltung erstellen
            </button>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 
                      className="text-lg text-[#3A3A3A]" 
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      {event.title}
                    </h3>
                    <span className="px-3 py-1 bg-[#A0CEC8]/20 text-[#3A3A3A] text-xs rounded-full">
                      {event.type}
                    </span>
                    {event.isOnline && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                        <Globe size={12} />
                        Online
                      </span>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-[#3A3A3A]/70 mb-3">{event.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-[#3A3A3A]/70">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(event.date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        {event.time}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 text-[#5a9690] hover:bg-[#A0CEC8]/10 rounded-lg transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}