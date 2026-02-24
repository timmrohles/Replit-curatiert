import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, MapPin, Video, Users, Clock, Plus, X, Edit2, Trash2, ExternalLink, Download, ChevronDown, ChevronUp, Globe, Lock, BookOpen, Send, XCircle, CalendarClock, MessageSquare, UserMinus, AlertTriangle, Search, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '../../components/ui/typography';
import { useAuth } from '../../hooks/use-auth';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState';

const API_BASE = '/api';

const EVENT_TYPES = [
  { value: 'lesung', label: 'Lesung' },
  { value: 'buchclub', label: 'Buchclub-Treffen' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'signierstunde', label: 'Signierstunde' },
  { value: 'diskussion', label: 'Podiumsdiskussion' },
  { value: 'messe', label: 'Messe / Festival' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const GERMAN_WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const GERMAN_MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function getWeekdayOrdinal(date: Date): string {
  const day = date.getDate();
  const weekOfMonth = Math.ceil(day / 7);
  const ordinals = ['ersten', 'zweiten', 'dritten', 'vierten', 'fünften'];
  return ordinals[weekOfMonth - 1] || `${weekOfMonth}.`;
}

function getRecurrenceOptions(dateStr: string) {
  if (!dateStr) return [];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return [];
  const weekday = GERMAN_WEEKDAYS[d.getDay()];
  const ordinal = getWeekdayOrdinal(d);
  const dayNum = d.getDate();
  const month = GERMAN_MONTHS[d.getMonth()];
  return [
    { value: '', label: 'Einmalig' },
    { value: 'weekly', label: `Wöchentlich am ${weekday}` },
    { value: 'monthly', label: `Monatlich am ${ordinal} ${weekday}` },
    { value: 'yearly', label: `Jährlich am ${dayNum}. ${month}` },
    { value: 'weekdays', label: 'Jeden Montag bis Freitag' },
  ];
}

function getRecurrenceLabel(rule: string | null, dateStr?: string): string {
  if (!rule) return '';
  if (dateStr) {
    const options = getRecurrenceOptions(dateStr);
    const found = options.find(o => o.value === rule);
    if (found) return found.label;
  }
  const fallback: Record<string, string> = {
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    weekdays: 'Mo\u2013Fr',
    biweekly: 'Alle 2 Wochen',
  };
  return fallback[rule] || rule;
}

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
}

interface UserEvent {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  event_type: string;
  location_type: string;
  location_name: string | null;
  location_address: string | null;
  event_date: string;
  event_end_date: string | null;
  background_image_url: string | null;
  video_link: string | null;
  video_link_public: boolean;
  entry_fee: number;
  entry_fee_currency: string;
  max_participants: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  event_page_url: string | null;
  is_published: boolean;
  participant_count: string;
  created_at: string;
}

interface Participant {
  id: number;
  event_id: number;
  user_id: string;
  user_display_name: string;
  status: string;
  booked_at: string;
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function getEventTypeLabel(type: string): string {
  return EVENT_TYPES.find(t => t.value === type)?.label || type;
}

export function UserEvents() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const USER_ID = authUser?.id || 'demo-user-123';
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<UserEvent | null>(null);
  const [expandedParticipants, setExpandedParticipants] = useState<Record<number, boolean>>({});
  const [participants, setParticipants] = useState<Record<number, Participant[]>>({});
  const [saving, setSaving] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEventType, setFormEventType] = useState('lesung');
  const [formLocationType, setFormLocationType] = useState('vor_ort');
  const [formLocationName, setFormLocationName] = useState('');
  const [formLocationAddress, setFormLocationAddress] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formVideoLink, setFormVideoLink] = useState('');
  const [formVideoLinkPublic, setFormVideoLinkPublic] = useState(false);
  const [formEntryFee, setFormEntryFee] = useState('0');
  const [formMaxParticipants, setFormMaxParticipants] = useState('');
  const [formRecurrenceRule, setFormRecurrenceRule] = useState('');
  const [formEventPageUrl, setFormEventPageUrl] = useState('');
  const [formBackgroundImageUrl, setFormBackgroundImageUrl] = useState('');
  const [unsplashSearch, setUnsplashSearch] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<UnsplashImage[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);

  const recurrenceOptions = useMemo(() => getRecurrenceOptions(formDate), [formDate]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/user-events?userId=${encodeURIComponent(USER_ID)}`);
      const data = await res.json();
      if (data.ok) {
        setEvents(data.data || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormEventType('lesung');
    setFormLocationType('vor_ort');
    setFormLocationName('');
    setFormLocationAddress('');
    setFormDate('');
    setFormEndDate('');
    setFormVideoLink('');
    setFormVideoLinkPublic(false);
    setFormEntryFee('0');
    setFormMaxParticipants('');
    setFormRecurrenceRule('');
    setFormEventPageUrl('');
    setFormBackgroundImageUrl('');
    setUnsplashSearch('');
    setUnsplashResults([]);
    setEditingEvent(null);
  };

  const openEditForm = (event: UserEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormEventType(event.event_type);
    setFormLocationType(event.location_type);
    setFormLocationName(event.location_name || '');
    setFormLocationAddress(event.location_address || '');
    setFormDate(event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '');
    setFormEndDate(event.event_end_date ? new Date(event.event_end_date).toISOString().slice(0, 16) : '');
    setFormVideoLink(event.video_link || '');
    setFormVideoLinkPublic(event.video_link_public);
    setFormEntryFee(String(event.entry_fee || 0));
    setFormMaxParticipants(event.max_participants ? String(event.max_participants) : '');
    setFormRecurrenceRule(event.recurrence_rule || '');
    setFormEventPageUrl(event.event_page_url || '');
    setFormBackgroundImageUrl(event.background_image_url || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formDate) return;
    setSaving(true);
    try {
      const body: any = {
        userId: USER_ID,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        event_type: formEventType,
        location_type: formLocationType,
        location_name: formLocationName.trim() || null,
        location_address: formLocationType === 'vor_ort' ? (formLocationAddress.trim() || null) : null,
        event_date: new Date(formDate).toISOString(),
        event_end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
        video_link: formVideoLink.trim() || null,
        video_link_public: formVideoLinkPublic,
        entry_fee: parseFloat(formEntryFee) || 0,
        max_participants: formMaxParticipants ? parseInt(formMaxParticipants) : null,
        is_recurring: !!formRecurrenceRule,
        recurrence_rule: formRecurrenceRule || null,
        background_image_url: formBackgroundImageUrl.trim() || null,
        event_page_url: formEventPageUrl.trim() || null,
      };

      const url = editingEvent ? `${API_BASE}/user-events/${editingEvent.id}` : `${API_BASE}/user-events`;
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchEvents();
        setShowForm(false);
        resetForm();
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE}/user-events/${id}`, { method: 'DELETE' });
      await fetchEvents();
    } catch { /* ignore */ }
  };

  const searchUnsplashImages = async () => {
    if (!unsplashSearch.trim()) return;
    setSearchingUnsplash(true);
    try {
      const res = await fetch(`${API_BASE}/unsplash/search?query=${encodeURIComponent(unsplashSearch)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUnsplashResults(data.data);
      }
    } catch { /* ignore */ }
    finally { setSearchingUnsplash(false); }
  };

  const togglePublished = async (event: UserEvent) => {
    try {
      await fetch(`${API_BASE}/user-events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !event.is_published }),
      });
      await fetchEvents();
    } catch { /* ignore */ }
  };

  const loadParticipants = async (eventId: number) => {
    try {
      const res = await fetch(`${API_BASE}/user-events/${eventId}/participants`);
      const data = await res.json();
      if (data.ok) {
        setParticipants(prev => ({ ...prev, [eventId]: data.data || [] }));
      }
    } catch { /* ignore */ }
  };

  const toggleParticipants = (eventId: number) => {
    const isExpanded = expandedParticipants[eventId];
    setExpandedParticipants(prev => ({ ...prev, [eventId]: !isExpanded }));
    if (!isExpanded && !participants[eventId]) {
      loadParticipants(eventId);
    }
  };

  const removeParticipant = async (eventId: number, participantId: number) => {
    try {
      const res = await fetch(`${API_BASE}/user-events/${eventId}/participants/${participantId}?userId=${USER_ID}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        await loadParticipants(eventId);
        await fetchEvents();
      }
    } catch { /* ignore */ }
  };

  const sendMessage = async (eventId: number, message: string) => {
    try {
      const res = await fetch(`${API_BASE}/user-events/${eventId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, message }),
      });
      return await res.json();
    } catch { return { ok: false }; }
  };

  const cancelEvent = async (eventId: number, reason: string) => {
    try {
      const res = await fetch(`${API_BASE}/user-events/${eventId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, reason }),
      });
      const data = await res.json();
      if (data.ok) await fetchEvents();
      return data;
    } catch { return { ok: false }; }
  };

  const rescheduleEvent = async (eventId: number, newDate: string, newEndDate: string | null, message: string) => {
    try {
      const res = await fetch(`${API_BASE}/user-events/${eventId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, new_event_date: newDate, new_event_end_date: newEndDate, message }),
      });
      const data = await res.json();
      if (data.ok) await fetchEvents();
      return data;
    } catch { return { ok: false }; }
  };

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="w-full max-w-4xl mx-auto">
      <DashboardPageHeader
        title={t('dashboardPages.eventsTitle', 'Veranstaltungen')}
        description={t('dashboardPages.eventsDesc', 'Erstelle und verwalte Lesungen, Buchklubs und andere Events.')}
        action={{
          label: t('dashboardPages.newEvent', 'Neue Veranstaltung'),
          onClick: () => { resetForm(); setShowForm(true); },
          icon: Plus,
        }}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <div
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
            data-testid="event-form-modal"
          >
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3" variant="h4" className="text-foreground !normal-case">
                {editingEvent ? 'Event bearbeiten' : 'Neues Event erstellen'}
              </Heading>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100" data-testid="button-close-event-form">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Titel *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Lesung: Neue Deutsche Literatur"
                  data-testid="input-event-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Art des Events</label>
                <select
                  value={formEventType}
                  onChange={e => setFormEventType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }}
                  data-testid="select-event-type"
                >
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Beschreibung</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Beschreibe dein Event..."
                  data-testid="input-event-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Datum & Uhrzeit *</label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    data-testid="input-event-date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Ende (optional)</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    data-testid="input-event-end-date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Ort</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setFormLocationType('vor_ort')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      backgroundColor: formLocationType === 'vor_ort' ? '#247ba0' : 'transparent',
                      color: formLocationType === 'vor_ort' ? '#fff' : '#3A3A3A',
                      borderColor: formLocationType === 'vor_ort' ? '#247ba0' : '#D1D5DB',
                    }}
                    data-testid="button-location-vor-ort"
                  >
                    <MapPin className="w-3 h-3 inline mr-1" /> Vor Ort
                  </button>
                  <button
                    onClick={() => setFormLocationType('digital')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      backgroundColor: formLocationType === 'digital' ? '#247ba0' : 'transparent',
                      color: formLocationType === 'digital' ? '#fff' : '#3A3A3A',
                      borderColor: formLocationType === 'digital' ? '#247ba0' : '#D1D5DB',
                    }}
                    data-testid="button-location-digital"
                  >
                    <Video className="w-3 h-3 inline mr-1" /> Digital
                  </button>
                  <button
                    onClick={() => setFormLocationType('hybrid')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      backgroundColor: formLocationType === 'hybrid' ? '#247ba0' : 'transparent',
                      color: formLocationType === 'hybrid' ? '#fff' : '#3A3A3A',
                      borderColor: formLocationType === 'hybrid' ? '#247ba0' : '#D1D5DB',
                    }}
                    data-testid="button-location-hybrid"
                  >
                    Hybrid
                  </button>
                </div>
                {(formLocationType === 'vor_ort' || formLocationType === 'hybrid') && (
                  <>
                    <input
                      type="text"
                      value={formLocationName}
                      onChange={e => setFormLocationName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
                      style={{ borderColor: '#E5E7EB' }}
                      placeholder="Name des Ortes (z.B. Buchhandlung am Markt)"
                      data-testid="input-location-name"
                    />
                    <input
                      type="text"
                      value={formLocationAddress}
                      onChange={e => setFormLocationAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: '#E5E7EB' }}
                      placeholder="Adresse"
                      data-testid="input-location-address"
                    />
                  </>
                )}
              </div>

              {(formLocationType === 'digital' || formLocationType === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Video-/Konferenz-Link</label>
                  <input
                    type="url"
                    value={formVideoLink}
                    onChange={e => setFormVideoLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="https://zoom.us/j/..."
                    data-testid="input-video-link"
                  />
                  <label className="flex items-center gap-2 mt-2 text-sm" style={{ color: '#6B7280' }}>
                    <input
                      type="checkbox"
                      checked={formVideoLinkPublic}
                      onChange={e => setFormVideoLinkPublic(e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-video-public"
                    />
                    Link öffentlich sichtbar (sonst nur für Teilnehmer:innen)
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Link zur Veranstaltungsseite</label>
                <input
                  type="url"
                  value={formEventPageUrl}
                  onChange={e => setFormEventPageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="https://www.beispiel.de/mein-event"
                  data-testid="input-event-page-url"
                />
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Externe Seite mit weiteren Infos oder Ticketverkauf</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Eintritt inkl. Steuern und Gebühren (EUR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formEntryFee}
                    onChange={e => setFormEntryFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="0 = kostenlos"
                    data-testid="input-entry-fee"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Max. Teilnehmer</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxParticipants}
                    onChange={e => setFormMaxParticipants(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Unbegrenzt"
                    data-testid="input-max-participants"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Wiederholung</label>
                <select
                  value={formRecurrenceRule}
                  onChange={e => setFormRecurrenceRule(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }}
                  disabled={!formDate}
                  data-testid="select-recurrence"
                >
                  {recurrenceOptions.length > 0 ? (
                    recurrenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                  ) : (
                    <option value="">Bitte zuerst Datum wählen</option>
                  )}
                </select>
                {!formDate && (
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Wähle zuerst ein Datum, um Wiederholungsoptionen zu sehen</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3A3A3A' }}>Hintergrundbild</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={unsplashSearch}
                    onChange={e => setUnsplashSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchUnsplashImages();
                      }
                    }}
                    placeholder="Unsplash durchsuchen..."
                    className="flex-1 px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    data-testid="input-event-unsplash-search"
                  />
                  <button
                    type="button"
                    onClick={searchUnsplashImages}
                    disabled={searchingUnsplash || !unsplashSearch.trim()}
                    className="px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: '#247ba0' }}
                    data-testid="button-event-unsplash-search"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {searchingUnsplash ? 'Suche...' : 'Suchen'}
                  </button>
                </div>
                {unsplashResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto p-2 border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
                    {unsplashResults.map(img => (
                      <div
                        key={img.id}
                        onClick={() => { setFormBackgroundImageUrl(img.url); setUnsplashResults([]); setUnsplashSearch(''); }}
                        className="cursor-pointer rounded overflow-hidden hover:ring-2 transition-all"
                        style={{ '--tw-ring-color': '#247ba0' } as any}
                        data-testid={`unsplash-event-${img.id}`}
                      >
                        <img src={img.thumb} alt={img.alt} className="w-full h-16 object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {formBackgroundImageUrl && (
                  <div className="relative mb-2">
                    <img
                      src={formBackgroundImageUrl}
                      alt="Hintergrundbild"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormBackgroundImageUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white shadow-lg"
                      data-testid="button-remove-event-bg"
                    >
                      <X className="w-4 h-4" style={{ color: '#374151' }} />
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={formBackgroundImageUrl}
                  onChange={e => setFormBackgroundImageUrl(e.target.value)}
                  placeholder="Oder Bild-URL direkt eingeben"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                  data-testid="input-event-bg-url"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                data-testid="button-cancel-event"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim() || !formDate}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: '#247ba0' }}
                data-testid="button-save-event"
              >
                {saving ? 'Speichere...' : editingEvent ? 'Speichern' : 'Event erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#247ba0' }} />
        </div>
      ) : events.length === 0 ? (
        <DashboardEmptyState
          icon={Calendar}
          title={t('dashboardPages.emptyEventsTitle', 'Noch keine Veranstaltungen')}
          description={t('dashboardPages.emptyEventsDesc', 'Erstelle Lesungen, Buchklubs oder andere Events und lade deine Community ein.')}
          action={{
            label: t('dashboardPages.emptyEventsAction', 'Erste Veranstaltung erstellen'),
            onClick: () => setShowForm(true),
          }}
        />
      ) : (
        <div className="space-y-8">
          {upcomingEvents.length > 0 && (
            <div>
              <Heading as="h3" variant="h5" className="text-foreground !normal-case mb-4">
                Kommende Veranstaltungen ({upcomingEvents.length})
              </Heading>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={() => openEditForm(event)}
                    onDelete={() => handleDelete(event.id)}
                    onTogglePublished={() => togglePublished(event)}
                    onToggleParticipants={() => toggleParticipants(event.id)}
                    isParticipantsExpanded={expandedParticipants[event.id] || false}
                    participants={participants[event.id] || []}
                    onRemoveParticipant={(pId) => removeParticipant(event.id, pId)}
                    onSendMessage={(msg) => sendMessage(event.id, msg)}
                    onCancelEvent={(reason) => cancelEvent(event.id, reason)}
                    onRescheduleEvent={(newDate, newEndDate, msg) => rescheduleEvent(event.id, newDate, newEndDate, msg)}
                  />
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <Heading as="h3" variant="h5" className="text-foreground !normal-case mb-4" style={{ color: '#9CA3AF' }}>
                Vergangene Veranstaltungen ({pastEvents.length})
              </Heading>
              <div className="space-y-3 opacity-60">
                {pastEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={() => openEditForm(event)}
                    onDelete={() => handleDelete(event.id)}
                    onTogglePublished={() => togglePublished(event)}
                    onToggleParticipants={() => toggleParticipants(event.id)}
                    isParticipantsExpanded={expandedParticipants[event.id] || false}
                    participants={participants[event.id] || []}
                    onRemoveParticipant={(pId) => removeParticipant(event.id, pId)}
                    onSendMessage={(msg) => sendMessage(event.id, msg)}
                    onCancelEvent={(reason) => cancelEvent(event.id, reason)}
                    onRescheduleEvent={(newDate, newEndDate, msg) => rescheduleEvent(event.id, newDate, newEndDate, msg)}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleParticipants,
  isParticipantsExpanded,
  participants,
  onRemoveParticipant,
  onSendMessage,
  onCancelEvent,
  onRescheduleEvent,
  isPast,
}: {
  event: UserEvent;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleParticipants: () => void;
  isParticipantsExpanded: boolean;
  participants: Participant[];
  onRemoveParticipant: (participantId: number) => void;
  onSendMessage: (message: string) => Promise<any>;
  onCancelEvent: (reason: string) => Promise<any>;
  onRescheduleEvent: (newDate: string, newEndDate: string | null, message: string) => Promise<any>;
  isPast?: boolean;
}) {
  const participantCount = parseInt(event.participant_count) || 0;
  const isFull = event.max_participants ? participantCount >= event.max_participants : false;

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleEndDate, setRescheduleEndDate] = useState('');
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const [removingParticipant, setRemovingParticipant] = useState<number | null>(null);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setMessageSending(true);
    const result = await onSendMessage(messageText.trim());
    setMessageSending(false);
    if (result.ok) {
      setMessageSuccess(`Nachricht an ${result.sentCount} Teilnehmer:innen gesendet.`);
      setMessageText('');
      setTimeout(() => { setMessageSuccess(null); setShowMessageForm(false); }, 3000);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    const result = await onCancelEvent(cancelReason.trim());
    setCancelling(false);
    if (result.ok) {
      setCancelReason('');
      setShowCancelForm(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) return;
    setRescheduling(true);
    const result = await onRescheduleEvent(
      new Date(rescheduleDate).toISOString(),
      rescheduleEndDate ? new Date(rescheduleEndDate).toISOString() : null,
      rescheduleMessage.trim()
    );
    setRescheduling(false);
    if (result.ok) {
      setRescheduleDate('');
      setRescheduleEndDate('');
      setRescheduleMessage('');
      setShowRescheduleForm(false);
    }
  };

  const handleRemoveParticipant = async (pId: number) => {
    setRemovingParticipant(pId);
    await onRemoveParticipant(pId);
    setRemovingParticipant(null);
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
      data-testid={`event-card-${event.id}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)', color: '#247ba0' }}
              >
                {getEventTypeLabel(event.event_type)}
              </span>
              {event.is_recurring && event.recurrence_rule && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(109, 40, 217, 0.1)', color: '#6D28D9' }}>
                  {getRecurrenceLabel(event.recurrence_rule, event.event_date)}
                </span>
              )}
              {!event.is_published && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  Entwurf
                </span>
              )}
              {parseFloat(String(event.entry_fee)) > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(232, 168, 56, 0.15)', color: '#c48a1a' }}>
                  {parseFloat(String(event.entry_fee)).toFixed(2).replace('.', ',')} {event.entry_fee_currency} inkl. Steuern und Gebühren
                </span>
              )}
              {parseFloat(String(event.entry_fee)) === 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                  Kostenlos
                </span>
              )}
            </div>

            <Heading as="h4" variant="h5" className="text-foreground !normal-case mb-1">
              {event.title}
            </Heading>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
                <Calendar className="w-3.5 h-3.5" />
                {formatEventDate(event.event_date)}
              </div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
                <Clock className="w-3.5 h-3.5" />
                {formatEventTime(event.event_date)}
                {event.event_end_date && ` – ${formatEventTime(event.event_end_date)}`}
              </div>
              {event.location_type !== 'digital' && event.location_name && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location_name}
                </div>
              )}
              {(event.location_type === 'digital' || event.location_type === 'hybrid') && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
                  <Video className="w-3.5 h-3.5" />
                  {event.location_type === 'digital' ? 'Digital' : 'Hybrid'}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
                <Users className="w-3.5 h-3.5" />
                {participantCount}{event.max_participants ? `/${event.max_participants}` : ''} Teilnehmer
                {isFull && <span style={{ color: '#EF4444' }}>(ausgebucht)</span>}
              </div>
            </div>

            {event.description && (
              <Text as="p" variant="small" className="mt-2 line-clamp-2" style={{ color: '#6B7280' }}>
                {event.description}
              </Text>
            )}

            {event.event_page_url && (
              <a
                href={event.event_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium transition-colors"
                style={{ color: '#247ba0' }}
                data-testid={`event-page-link-${event.id}`}
              >
                <ExternalLink className="w-3 h-3" />
                Veranstaltungsseite
              </a>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onTogglePublished} className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title={event.is_published ? 'Veröffentlicht' : 'Entwurf'} data-testid={`toggle-publish-${event.id}`}>
              {event.is_published ? <Globe className="w-4 h-4" style={{ color: '#247ba0' }} /> : <Lock className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
            </button>
            <a href={`/api/user-events/${event.id}/ics`} download className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="Kalender-Export" data-testid={`download-ics-${event.id}`}>
              <Download className="w-4 h-4" style={{ color: '#6B7280' }} />
            </a>
            {!isPast && (
              <button onClick={onEdit} className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="Bearbeiten" data-testid={`edit-event-${event.id}`}>
                <Edit2 className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
            )}
            <button onClick={onDelete} className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="Löschen" data-testid={`delete-event-${event.id}`}>
              <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
            </button>
          </div>
        </div>

        {!isPast && (
          <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid #F3F4F6' }}>
            {participantCount > 0 && (
              <button
                onClick={() => { setShowMessageForm(!showMessageForm); setShowCancelForm(false); setShowRescheduleForm(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{ backgroundColor: showMessageForm ? '#247ba0' : 'rgba(36,123,160,0.1)', color: showMessageForm ? '#fff' : '#247ba0' }}
                data-testid={`button-message-participants-${event.id}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Nachricht senden
              </button>
            )}
            <button
              onClick={() => { setShowRescheduleForm(!showRescheduleForm); setShowCancelForm(false); setShowMessageForm(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ backgroundColor: showRescheduleForm ? '#d97706' : 'rgba(217,119,6,0.1)', color: showRescheduleForm ? '#fff' : '#d97706' }}
              data-testid={`button-reschedule-${event.id}`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Verschieben
            </button>
            <button
              onClick={() => { setShowCancelForm(!showCancelForm); setShowRescheduleForm(false); setShowMessageForm(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ backgroundColor: showCancelForm ? '#EF4444' : 'rgba(239,68,68,0.1)', color: showCancelForm ? '#fff' : '#EF4444' }}
              data-testid={`button-cancel-event-${event.id}`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Absagen
            </button>
          </div>
        )}

        {showMessageForm && (
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <Text as="p" variant="small" className="font-semibold mb-2" style={{ color: '#0369A1' }}>
              Nachricht an alle Teilnehmer:innen ({participantCount})
            </Text>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
              style={{ borderColor: '#BAE6FD', resize: 'vertical' }}
              placeholder="Schreibe eine Nachricht an alle Teilnehmer:innen..."
              data-testid={`textarea-message-${event.id}`}
            />
            {messageSuccess && (
              <Text as="p" variant="xs" className="mb-2 font-medium" style={{ color: '#059669' }}>{messageSuccess}</Text>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowMessageForm(false); setMessageText(''); setMessageSuccess(null); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ color: '#6B7280' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSendMessage}
                disabled={messageSending || !messageText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#247ba0' }}
                data-testid={`button-send-message-${event.id}`}
              >
                <Send className="w-3 h-3" />
                {messageSending ? 'Sende...' : 'Senden'}
              </button>
            </div>
          </div>
        )}

        {showRescheduleForm && (
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <Text as="p" variant="small" className="font-semibold mb-2" style={{ color: '#92400E' }}>
              Veranstaltung verschieben
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#92400E' }}>Neuer Termin *</label>
                <input
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm"
                  style={{ borderColor: '#FDE68A' }}
                  data-testid={`input-reschedule-date-${event.id}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#92400E' }}>Neues Ende (optional)</label>
                <input
                  type="datetime-local"
                  value={rescheduleEndDate}
                  onChange={e => setRescheduleEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm"
                  style={{ borderColor: '#FDE68A' }}
                  data-testid={`input-reschedule-end-date-${event.id}`}
                />
              </div>
            </div>
            <textarea
              value={rescheduleMessage}
              onChange={e => setRescheduleMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
              style={{ borderColor: '#FDE68A', resize: 'vertical' }}
              placeholder="Optionale Nachricht an alle Teilnehmer:innen..."
              data-testid={`textarea-reschedule-message-${event.id}`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRescheduleForm(false); setRescheduleDate(''); setRescheduleEndDate(''); setRescheduleMessage(''); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ color: '#6B7280' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleReschedule}
                disabled={rescheduling || !rescheduleDate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#d97706' }}
                data-testid={`button-confirm-reschedule-${event.id}`}
              >
                <CalendarClock className="w-3 h-3" />
                {rescheduling ? 'Verschiebe...' : 'Verschieben & benachrichtigen'}
              </button>
            </div>
          </div>
        )}

        {showCancelForm && (
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
              <div>
                <Text as="p" variant="small" className="font-semibold" style={{ color: '#991B1B' }}>
                  Veranstaltung absagen
                </Text>
                <Text as="p" variant="xs" style={{ color: '#B91C1C' }}>
                  Alle {participantCount} Teilnehmer:innen werden benachrichtigt und aus der Liste entfernt.
                </Text>
              </div>
            </div>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
              style={{ borderColor: '#FECACA', resize: 'vertical' }}
              placeholder="Grund für die Absage (optional)..."
              data-testid={`textarea-cancel-reason-${event.id}`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCancelForm(false); setCancelReason(''); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ color: '#6B7280' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#EF4444' }}
                data-testid={`button-confirm-cancel-${event.id}`}
              >
                <XCircle className="w-3 h-3" />
                {cancelling ? 'Sage ab...' : 'Endgültig absagen'}
              </button>
            </div>
          </div>
        )}

        {participantCount > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
          <button
            onClick={onToggleParticipants}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#247ba0' }}
            data-testid={`toggle-participants-${event.id}`}
          >
            <Users className="w-3.5 h-3.5" />
            {participantCount} Teilnehmer:innen {isParticipantsExpanded ? 'ausblenden' : 'anzeigen'}
            {isParticipantsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isParticipantsExpanded && (
            <div className="mt-2 space-y-1">
              {participants.length === 0 ? (
                <Text as="p" variant="xs" style={{ color: '#9CA3AF' }}>Lade Teilnehmer...</Text>
              ) : (
                participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-md gap-2" style={{ backgroundColor: '#F9FAFB' }}>
                    <div className="flex-1 min-w-0">
                      <Text as="span" variant="small" className="font-medium" style={{ color: '#3A3A3A' }}>
                        {p.user_display_name || p.user_id}
                      </Text>
                      <Text as="span" variant="xs" className="ml-2" style={{ color: '#9CA3AF' }}>
                        angemeldet am {new Date(p.booked_at).toLocaleDateString('de-DE')}
                      </Text>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(p.id)}
                      disabled={removingParticipant === p.id}
                      className="p-1 rounded-md transition-colors hover:bg-red-50 flex-shrink-0"
                      title="Teilnehmer:in entfernen"
                      data-testid={`button-remove-participant-${p.id}`}
                    >
                      {removingParticipant === p.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserMinus className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
