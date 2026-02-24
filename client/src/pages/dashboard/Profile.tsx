import { useState, useRef, useEffect, useCallback } from 'react';
import { Save, Mail, Phone, AlertTriangle, Star, MessageSquare, Heart, BookOpen, Plus, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Text } from '../../components/ui/typography';
import { LikeButton } from '../../components/favorites/LikeButton';
import { useAuth } from '../../hooks/use-auth';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';

const TAG_COLORS = [
  'var(--vibrant-coral, #f25f5c)',
  'var(--color-saffron, #e8a838)',
  'var(--color-teal, #70c1b3)',
  'var(--color-cerulean, #247ba0)',
  '#8b5cf6',
  '#ec4899',
];

interface GenreSuggestion {
  id: string;
  name: string;
  displayName?: string;
}

function GenrePickerDropdown({
  onAdd,
  existingGenres,
}: {
  onAdd: (genre: string) => void;
  existingGenres: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GenreSuggestion[]>([]);
  const [popularItems, setPopularItems] = useState<GenreSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popularLoaded, setPopularLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !popularLoaded) {
      (async () => {
        try {
          const res = await fetch('/api/onix-tags?scope=book&tag_type=topic&visible=true&limit=12');
          if (res.ok) {
            const data = await res.json();
            const items = (data.data || []).map((t: any) => ({
              id: String(t.id),
              name: t.displayName || t.name || '',
            }));
            setPopularItems(items.filter((i: GenreSuggestion) => !existingGenres.includes(i.name)).slice(0, 8));
          }
        } catch { /* ignore */ }
        setPopularLoaded(true);
      })();
    }
  }, [isOpen, popularLoaded, existingGenres]);

  const searchItems = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/onix-tags?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        const items = (data.data || []).map((t: any) => ({
          id: String(t.id),
          name: t.displayName || t.name || '',
        }));
        setSuggestions(items.filter((i: GenreSuggestion) => !existingGenres.includes(i.name)));
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [existingGenres]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchItems(value), 300);
  }, [searchItems]);

  const handleSelect = useCallback((item: GenreSuggestion) => {
    onAdd(item.name);
    setPopularItems((prev) => prev.filter((p) => p.id !== item.id));
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  }, [onAdd]);

  const showPopular = isOpen && query.length < 2 && !isSearching && popularItems.length > 0;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full inline-flex items-center justify-center border-2 border-dashed transition-colors"
        style={{ borderColor: '#9CA3AF', color: '#9CA3AF' }}
        data-testid="button-add-genre"
      >
        <Plus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-72 rounded-lg shadow-xl border z-50"
          style={{ backgroundColor: 'var(--color-beige, #faf6f1)', borderColor: '#E5E7EB' }}
        >
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Genre oder Thema suchen..."
                className="w-full pl-8 pr-3 py-2 rounded-md border text-sm"
                style={{ borderColor: '#E5E7EB', backgroundColor: 'white' }}
                data-testid="input-search-genre"
              />
            </div>
          </div>
          {showPopular && (
            <div className="px-3 pt-1 pb-1.5">
              <div className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>
                Beliebt bei anderen Nutzer:innen
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors border"
                    style={{ color: '#1F2937', borderColor: '#D1D5DB', backgroundColor: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#247ba0'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#247ba0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#1F2937'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                    data-testid={`popular-genre-${item.id}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isSearching && (
            <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>Suche...</div>
          )}
          {!isSearching && suggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                  style={{ color: '#1F2937' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  data-testid={`suggestion-genre-${item.id}`}
                >
                  <div className="truncate font-medium">{item.name}</div>
                </button>
              ))}
            </div>
          )}
          {!isSearching && query.length >= 2 && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>Keine Ergebnisse gefunden</div>
          )}
        </div>
      )}
    </div>
  );
}

const CURATOR_STORAGE_KEY = 'coratiert-curator-id';

export function DashboardProfile() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const userId = authUser?.id || 'demo-user-123';
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [curatorId, setCuratorId] = useState<string | null>(() => localStorage.getItem(CURATOR_STORAGE_KEY));
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'de',
    country: 'DE'
  });

  const [preferredGenres, setPreferredGenres] = useState<string[]>(['Belletristik', 'Sachbuch', 'Politik']);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      if (!curatorId) { setLoading(false); return; }
      const resp = await fetch(`/api/user/curator-profile/${curatorId}`);
      const json = await resp.json();
      if (json.ok && json.data) {
        const d = json.data;
        const nameParts = (d.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        setProfile(prev => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: d.email || prev.email
        }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [curatorId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const resp = await fetch('/api/user/curator-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curatorId: curatorId || undefined,
          userId,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          email: profile.email,
        })
      });
      const json = await resp.json();
      if (json.ok) {
        if (json.data?.id && !curatorId) {
          const newId = String(json.data.id);
          setCuratorId(newId);
          localStorage.setItem(CURATOR_STORAGE_KEY, newId);
        }
        setSaveMessage({ type: 'success', text: 'Daten erfolgreich gespeichert!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: json.error || 'Fehler beim Speichern' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Verbindungsfehler beim Speichern' });
    } finally {
      setSaving(false);
    }
  };

  const toggleGenre = (genre: string) => {
    if (preferredGenres.includes(genre)) {
      setPreferredGenres(preferredGenres.filter(g => g !== genre));
    } else {
      setPreferredGenres([...preferredGenres, genre]);
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
      <DashboardPageHeader
        title={t('dashboardPages.profileTitle', 'Meine Daten')}
        description={t('dashboardPages.profileDesc', 'Verwalte deine persönlichen Daten und Einstellungen.')}
      />

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>
          Persönliche Informationen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Vorname</label>
            <input id="firstName" type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-firstname"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }} />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Nachname</label>
            <input id="lastName" type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-lastname"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>E-Mail</label>
            <div className="relative">
              <input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 pl-10 rounded-lg border transition-colors" data-testid="input-email"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }} />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Telefon</label>
            <div className="relative">
              <input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2 pl-10 rounded-lg border transition-colors" data-testid="input-phone"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }} />
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>
          Sprache & Region
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Sprache</label>
            <select id="language" value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="select-language"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }}>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Land</label>
            <select id="country" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="select-country"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }}>
              <option value="DE">Deutschland</option>
              <option value="AT">Österreich</option>
              <option value="CH">Schweiz</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>
          Lieblingsgenres
        </h2>
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          Wähle deine bevorzugten Genres aus, um personalisierte Empfehlungen zu erhalten.
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          {preferredGenres.map((genre, i) => (
            <div role="group" key={genre}
              className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg select-none cursor-pointer transition-all duration-200 hover-elevate"
              style={{ backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }}
              data-testid={`tag-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}>
              <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">{genre}</Text>
              <LikeButton entityId={`genre-${genre.toLowerCase().replace(/\s+/g, '-')}`} entityType="tag" entityTitle={genre} variant="minimal" size="sm" iconColor="#ffffff" backgroundColor={TAG_COLORS[i % TAG_COLORS.length]} />
              <button onClick={() => toggleGenre(genre)} className="p-0.5 rounded-full transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                data-testid={`button-remove-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <GenrePickerDropdown onAdd={(genre) => { if (!preferredGenres.includes(genre)) { setPreferredGenres([...preferredGenres, genre]); } }} existingGenres={preferredGenres} />
        </div>
        <p className="text-xs mt-4" style={{ color: '#9CA3AF' }}>
          {preferredGenres.length} Genre{preferredGenres.length !== 1 ? 's' : ''} ausgewählt
        </p>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>Passwort ändern</h2>
          <button onClick={() => setShowPasswordSection(!showPasswordSection)} data-testid="button-toggle-password"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: showPasswordSection ? '#F3F4F6' : '#247ba0', color: showPasswordSection ? '#1F2937' : '#FFFFFF' }}>
            {showPasswordSection ? 'Abbrechen' : 'Passwort ändern'}
          </button>
        </div>
        {showPasswordSection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Aktuelles Passwort</label>
              <input id="currentPassword" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-current-password"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }} />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Neues Passwort</label>
              <input id="newPassword" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-new-password"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Passwort bestätigen</label>
              <input id="confirmPassword" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-confirm-password"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }} />
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahlen</p>
            </div>
          </div>
        )}
        {!showPasswordSection && (
          <p className="text-sm" style={{ color: '#6B7280' }}>Klicke auf "Passwort ändern", um dein Passwort zu aktualisieren.</p>
        )}
      </div>

      <div className="rounded-lg p-4 md:p-6 shadow-sm border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} />
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#991B1B' }}>Gefahrenbereich</h2>
        </div>
        <div className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#991B1B' }}>Account deaktivieren</div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>Dein Account wird vorübergehend deaktiviert und kann später wiederhergestellt werden</div>
              </div>
              <button data-testid="button-deactivate-account" className="px-4 py-2 rounded-lg text-xs md:text-sm border whitespace-nowrap" style={{ borderColor: '#EF4444', color: '#EF4444' }}>Deaktivieren</button>
            </div>
          </div>
          <div className="p-3 md:p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#991B1B' }}>Account löschen</div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>Alle deine Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.</div>
              </div>
              <button data-testid="button-delete-account" className="px-4 py-2 rounded-lg text-xs md:text-sm text-white whitespace-nowrap" style={{ backgroundColor: '#EF4444' }}
                onClick={() => { if (confirm('Möchtest du deinen Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) { alert('Account-Löschung würde hier ausgeführt werden'); } }}>
                Löschen
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <p className="text-xs" style={{ color: '#1E40AF' }}>
            <strong>Deine Rechte:</strong> Nach DSGVO hast du das Recht auf Auskunft, Berichtigung und Löschung deiner Daten.
            Weitere Informationen findest du in unserer{' '}
            <a href="/datenschutz" className="underline hover:no-underline" data-testid="link-datenschutz">Datenschutzerklärung</a>.
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className="rounded-lg p-4 text-sm" style={{
          backgroundColor: saveMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          color: saveMessage.type === 'success' ? '#166534' : '#991B1B',
          border: `1px solid ${saveMessage.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`
        }} data-testid="text-save-message">
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button onClick={handleSave} disabled={saving} data-testid="button-save-profile"
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: saving ? '#9CA3AF' : '#247ba0', color: '#FFFFFF' }}>
          {saving ? (
            <><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#FFFFFF40', borderTopColor: '#FFFFFF' }} />Wird gespeichert...</>
          ) : (
            <><Save className="w-5 h-5" />Änderungen speichern</>
          )}
        </button>
      </div>
    </div>
  );
}
