import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Save, BookOpen, Mail, Phone, AlertTriangle, Star, MessageSquare, Heart, Image as ImageIcon, ExternalLink, Globe, Instagram, Podcast, Check, Plus, Search, X, ChevronDown, ChevronUp, Banknote, Shield, CreditCard, FileText, BarChart3 } from 'lucide-react';
import { SiYoutube, SiTiktok } from 'react-icons/si';
import { LikeButton } from '../../components/favorites/LikeButton';
import { Text } from '../../components/ui/typography';

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
                    style={{ color: '#3A3A3A', borderColor: '#D1D5DB', backgroundColor: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#247ba0'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#247ba0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#3A3A3A'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                    data-testid={`popular-genre-${item.id}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isSearching && (
            <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>
              Suche...
            </div>
          )}
          {!isSearching && suggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                  style={{ color: '#3A3A3A' }}
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
            <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>
              Keine Ergebnisse gefunden
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CURATOR_STORAGE_KEY = 'coratiert-curator-id';

export function DashboardProfile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [curatorId, setCuratorId] = useState<string | null>(() => localStorage.getItem(CURATOR_STORAGE_KEY));
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const quickStats = [
    { label: 'Bewertungen', value: '0', icon: Star },
    { label: 'Rezensionen', value: '0', icon: MessageSquare },
    { label: 'Favoriten', value: '0', icon: Heart },
    { label: 'Leseliste', value: '0', icon: BookOpen },
  ];

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'de',
    country: 'DE'
  });

  const [curatorProfile, setCuratorProfile] = useState({
    publicName: '',
    focus: '',
    bio: '',
    avatarUrl: '',
    socials: {
      instagram: '',
      youtube: '',
      tiktok: '',
      podcast: '',
      website: ''
    }
  });

  const [preferredGenres, setPreferredGenres] = useState<string[]>(['Belletristik', 'Sachbuch', 'Politik']);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showAffiliateSection, setShowAffiliateSection] = useState(false);
  const [affiliateExpanded, setAffiliateExpanded] = useState<Record<string, boolean>>({});
  const [affiliateSaving, setAffiliateSaving] = useState(false);
  const [affiliateMessage, setAffiliateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [affiliate, setAffiliate] = useState({
    firstName: '', lastName: '', artistName: '', birthDate: '',
    nationality: '', street: '', city: '', postalCode: '', country: 'DE',
    email: '', phone: '',
    taxStatus: '' as '' | 'kleinunternehmer' | 'umsatzsteuerpflichtig',
    taxNumber: '', taxId: '', vatId: '', taxCountry: 'DE', taxSelfResponsible: false,
    accountHolder: '', iban: '', bic: '', payoutCountry: 'DE', currency: 'EUR', minPayoutAccepted: false,
    acceptCreatorContract: false, acceptRevenueShare: false,
    acceptAdDisclosure: false, acceptNoThirdPartyRights: false,
    acceptTracking: false,
  });
  const [affiliateLoaded, setAffiliateLoaded] = useState(false);
  const [bookstoreSlug, setBookstoreSlug] = useState<string | null>(null);
  const [visibleTabs, setVisibleTabs] = useState({
    kurationen: true,
    rezensionen: true,
    bewertungen: true,
    veranstaltungen: true,
    buchclub: false,
  });

  const availableGenres = [
    'Belletristik',
    'Sachbuch',
    'Politik & Gesellschaft',
    'Queere Literatur',
    'Fantasy & Science Fiction',
    'Kinder & Jugend',
    'Lyrik',
    'Biografien',
    'Geschichte',
    'Philosophie'
  ];

  const loadCuratorProfile = useCallback(async () => {
    try {
      if (!curatorId) {
        setLoading(false);
        return;
      }
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
        setCuratorProfile({
          publicName: d.name || '',
          focus: d.focus || '',
          bio: d.bio || '',
          avatarUrl: d.avatar || '',
          socials: {
            instagram: d.socialMedia?.instagram || '',
            youtube: d.socialMedia?.youtube || '',
            tiktok: d.socialMedia?.tiktok || '',
            podcast: d.socialMedia?.podcast || '',
            website: d.socialMedia?.website || ''
          }
        });
        if (d.slug) {
          setBookstoreSlug(d.slug);
        }
        if (d.visible_tabs && typeof d.visible_tabs === 'object') {
          setVisibleTabs(prev => ({ ...prev, ...d.visible_tabs }));
        }
      }
    } catch (err) {
      console.error('Failed to load curator profile:', err);
    } finally {
      setLoading(false);
    }
  }, [curatorId]);

  useEffect(() => {
    loadCuratorProfile();
  }, [loadCuratorProfile]);

  useEffect(() => {
    if (showAffiliateSection && !affiliateLoaded) {
      (async () => {
        try {
          const res = await fetch('/api/affiliate-creator-profile?userId=demo-user-123');
          const json = await res.json();
          if (json.ok && json.data) {
            const d = json.data;
            setAffiliate({
              firstName: d.first_name || '', lastName: d.last_name || '',
              artistName: d.artist_name || '', birthDate: d.birth_date ? d.birth_date.substring(0, 10) : '',
              nationality: d.nationality || '', street: d.street || '',
              city: d.city || '', postalCode: d.postal_code || '',
              country: d.country || 'DE', email: d.email || '', phone: d.phone || '',
              taxStatus: d.tax_status || '', taxNumber: d.tax_number || '',
              taxId: d.tax_id || '', vatId: d.vat_id || '',
              taxCountry: d.tax_country || 'DE', taxSelfResponsible: d.tax_self_responsible || false,
              accountHolder: d.account_holder || '', iban: d.iban || '',
              bic: d.bic || '', payoutCountry: d.payout_country || 'DE',
              currency: d.currency || 'EUR', minPayoutAccepted: d.min_payout_accepted || false,
              acceptCreatorContract: d.accept_creator_contract || false,
              acceptRevenueShare: d.accept_revenue_share || false,
              acceptAdDisclosure: d.accept_ad_disclosure || false,
              acceptNoThirdPartyRights: d.accept_no_third_party_rights || false,
              acceptTracking: d.accept_tracking || false,
            });
          }
        } catch {}
        setAffiliateLoaded(true);
      })();
    }
  }, [showAffiliateSection, affiliateLoaded]);

  const handleAffiliateSave = async () => {
    setAffiliateSaving(true);
    setAffiliateMessage(null);
    try {
      const res = await fetch('/api/affiliate-creator-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user-123', ...affiliate }),
      });
      const json = await res.json();
      if (json.ok) {
        setAffiliateMessage({ type: 'success', text: 'Affiliate-Daten erfolgreich gespeichert!' });
        setTimeout(() => setAffiliateMessage(null), 3000);
      } else {
        setAffiliateMessage({ type: 'error', text: json.error || 'Fehler beim Speichern' });
      }
    } catch {
      setAffiliateMessage({ type: 'error', text: 'Verbindungsfehler beim Speichern' });
    } finally {
      setAffiliateSaving(false);
    }
  };

  const toggleAffiliateSection = (key: string) => {
    setAffiliateExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || 'Benutzername';

  const computeProgress = (): number => {
    let filled = 0;
    const total = 7;
    if (profile.firstName) filled++;
    if (profile.lastName) filled++;
    if (profile.email) filled++;
    if (curatorProfile.avatarUrl) filled++;
    if (curatorProfile.focus) filled++;
    if (curatorProfile.bio) filled++;
    const hasSocial = Object.values(curatorProfile.socials).some(v => v.trim().length > 0);
    if (hasSocial) filled++;
    return Math.round((filled / total) * 100);
  };

  const progress = computeProgress();

  const roles = curatorProfile.focus ? ['Kurator:in'] : ['Leser:in'];

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.ok && data.data?.url) {
        setCuratorProfile(prev => ({ ...prev, avatarUrl: data.data.url }));
      }
    } catch {
      console.error('Avatar upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const publicName = curatorProfile.publicName.trim() || `${profile.firstName} ${profile.lastName}`.trim();
      const resp = await fetch('/api/user/curator-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curatorId: curatorId || undefined,
          userId: 'demo-user-123',
          name: publicName,
          email: profile.email,
          bio: curatorProfile.bio,
          focus: curatorProfile.focus,
          avatar_url: curatorProfile.avatarUrl,
          socials: curatorProfile.socials,
          visible_tabs: visibleTabs
        })
      });
      const json = await resp.json();
      if (json.ok) {
        if (json.data?.id && !curatorId) {
          const newId = String(json.data.id);
          setCuratorId(newId);
          localStorage.setItem(CURATOR_STORAGE_KEY, newId);
        }
        if (json.data?.slug) {
          setBookstoreSlug(json.data.slug);
        }
        setSaveMessage({ type: 'success', text: 'Profil erfolgreich gespeichert!' });
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
      <div>
        <h1 className="text-2xl md:text-3xl mb-2 text-center" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Meine Daten
        </h1>
        <p className="text-sm text-center" style={{ color: '#6B7280' }}>
          Verwalte deine persönlichen Informationen und Einstellungen
        </p>
      </div>

      <section
        className="p-5 md:p-6"
        data-testid="hero-profile-card"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          {/* Left Column: Avatar + Name/Focus + Social */}
          <div className="flex items-center gap-5 md:gap-6">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden ring-2 ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]" style={{ '--tw-ring-color': '#247ba0' } as React.CSSProperties}>
                {curatorProfile.avatarUrl ? (
                  <img
                    src={curatorProfile.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    data-testid="avatar-user-image"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)' }}
                    data-testid="avatar-user"
                  >
                    <span className="text-4xl md:text-5xl" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}>
                      {displayName.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2
                className="text-xl md:text-2xl mb-1"
                style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}
                data-testid="text-username"
              >
                {curatorProfile.publicName || displayName}
              </h2>
              {curatorProfile.focus && (
                <p className="text-sm font-semibold mb-1" style={{ color: '#6B7280' }} data-testid="text-curator-focus">
                  {curatorProfile.focus}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                {roles.map((role, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-0.5 rounded-full text-xs text-white"
                    style={{ backgroundColor: '#247ba0' }}
                    data-testid={`badge-role-${index}`}
                  >
                    {role}
                  </span>
                ))}
              </div>
              {/* Social Icons */}
              {(curatorProfile.socials.website || curatorProfile.socials.instagram || curatorProfile.socials.youtube || curatorProfile.socials.tiktok || curatorProfile.socials.podcast) && (
                <div className="flex items-center gap-3 flex-wrap mt-2" data-testid="social-links-preview">
                  {curatorProfile.socials.website && (
                    <span className="text-gray-400"><Globe className="w-5 h-5" /></span>
                  )}
                  {curatorProfile.socials.instagram && (
                    <span className="text-gray-400"><Instagram className="w-5 h-5" /></span>
                  )}
                  {curatorProfile.socials.youtube && (
                    <span className="text-gray-400"><SiYoutube className="w-5 h-5" /></span>
                  )}
                  {curatorProfile.socials.tiktok && (
                    <span className="text-gray-400"><SiTiktok className="w-5 h-5" /></span>
                  )}
                  {curatorProfile.socials.podcast && (
                    <span className="text-gray-400"><Podcast className="w-5 h-5" /></span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bio */}
          <div className="flex flex-col">
            {curatorProfile.bio && (
              <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }} data-testid="text-curator-bio-preview">
                {curatorProfile.bio}
              </p>
            )}
          </div>
        </div>

        {bookstoreSlug && (
          <div className="mt-4 pt-4 border-t flex justify-center" style={{ borderColor: '#E5E7EB' }}>
            <a
              href={`/${bookstoreSlug}`}
              data-testid="button-open-profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: '#247ba0', color: '#ffffff' }}
            >
              <ExternalLink className="w-4 h-4" />
              Öffentliches Profil ansehen
            </a>
          </div>
        )}
      </section>

      {/* Tab Visibility Settings */}
      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Sichtbare Tabs im öffentlichen Profil
        </h2>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
          Wähle aus, welche Tabs auf deinem öffentlichen Profil angezeigt werden sollen.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {([
            { key: 'kurationen', label: 'Kurationen' },
            { key: 'rezensionen', label: 'Rezensionen' },
            { key: 'bewertungen', label: 'Bewertungen' },
            { key: 'veranstaltungen', label: 'Veranstaltungen' },
            { key: 'buchclub', label: 'Buchclub' },
          ] as const).map((tab) => (
            <label
              key={tab.key}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
              style={{
                borderColor: visibleTabs[tab.key] ? '#247ba0' : '#D1D5DB',
                backgroundColor: visibleTabs[tab.key] ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
              }}
              data-testid={`checkbox-tab-${tab.key}`}
              onClick={() => setVisibleTabs(prev => ({ ...prev, [tab.key]: !prev[tab.key] }))}
            >
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor: visibleTabs[tab.key] ? '#247ba0' : '#D1D5DB',
                  backgroundColor: visibleTabs[tab.key] ? '#247ba0' : 'transparent',
                }}
              >
                {visibleTabs[tab.key] && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm" style={{ color: '#3A3A3A' }}>{tab.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div 
        className="p-6"
      >
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Persönliche Informationen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="firstName" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Vorname
            </label>
            <input
              id="firstName"
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              data-testid="input-firstname"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="lastName" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Nachname
            </label>
            <input
              id="lastName"
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              data-testid="input-lastname"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              E-Mail
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 pl-10 rounded-lg border transition-colors"
                data-testid="input-email"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            </div>
          </div>

          <div>
            <label 
              htmlFor="phone" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Telefon
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2 pl-10 rounded-lg border transition-colors"
                data-testid="input-phone"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            </div>
          </div>
        </div>
      </div>

      <div 
        className="p-6"
      >
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Kurator:in-Profil
        </h2>

        <div className="space-y-4">
          <div>
            <label 
              htmlFor="publicName" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Öffentlicher Kurator:in-Name *
            </label>
            <input
              id="publicName"
              type="text"
              value={curatorProfile.publicName}
              onChange={(e) => setCuratorProfile({ ...curatorProfile, publicName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              data-testid="input-public-name"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
              placeholder="z.B. dein Name, Geschäftsname oder Künstlername"
            />
            <div className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Unter diesem Namen erscheint dein Kurator:in-Profil öffentlich auf coratiert.de. Kann sich von deinem persönlichen Namen unterscheiden.
            </div>
          </div>

          <div>
            <label 
              htmlFor="focus" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Fokus / Thema
            </label>
            <input
              id="focus"
              type="text"
              value={curatorProfile.focus}
              onChange={(e) => setCuratorProfile({ ...curatorProfile, focus: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              data-testid="input-focus"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
              placeholder="z.B. Krimis & Thriller, Fantasy, Klassiker"
            />
          </div>

          <div>
            <label 
              htmlFor="bio" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Biografie
            </label>
            <textarea
              id="bio"
              value={curatorProfile.bio}
              onChange={(e) => {
                const words = countWords(e.target.value);
                if (words <= 100 || e.target.value.length < curatorProfile.bio.length) {
                  setCuratorProfile({ ...curatorProfile, bio: e.target.value });
                }
              }}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              data-testid="input-bio"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: countWords(curatorProfile.bio) >= 90 ? '#f25f5c' : '#D1D5DB',
                color: '#3A3A3A'
              }}
              placeholder="Kurze Beschreibung (max. 100 Wörter)..."
            />
            <div className="flex justify-end mt-1">
              <span
                className="text-xs"
                style={{ color: countWords(curatorProfile.bio) > 100 ? '#f25f5c' : '#9CA3AF' }}
                data-testid="text-bio-wordcount"
              >
                {countWords(curatorProfile.bio)} / 100 Wörter
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
              Avatar
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {curatorProfile.avatarUrl ? (
                  <img
                    src={curatorProfile.avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2"
                    style={{ borderColor: '#E5E7EB' }}
                    data-testid="img-avatar-preview"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed"
                    style={{ borderColor: '#9CA3AF', backgroundColor: '#F9FAFB' }}
                  >
                    <User className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  data-testid="input-avatar-file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="button-upload-avatar"
                  className="w-full px-4 py-2 border rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                  style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#D1D5DB', borderTopColor: '#247ba0' }} />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Bild hochladen
                    </>
                  )}
                </button>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>
                  JPG, PNG, WebP oder GIF (max. 5 MB)
                </div>
                <input
                  type="text"
                  value={curatorProfile.avatarUrl}
                  onChange={(e) => setCuratorProfile({ ...curatorProfile, avatarUrl: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  data-testid="input-avatar-url"
                  style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                  placeholder="oder URL eingeben: https://..."
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#3A3A3A' }}>
              Social Media Präsenzen
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                  Instagram
                </label>
                <input
                  type="text"
                  value={curatorProfile.socials.instagram}
                  onChange={(e) => setCuratorProfile({
                    ...curatorProfile,
                    socials: { ...curatorProfile.socials, instagram: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  data-testid="input-social-instagram"
                  style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                  placeholder="@username oder https://instagram.com/username"
                />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                  YouTube
                </label>
                <input
                  type="text"
                  value={curatorProfile.socials.youtube}
                  onChange={(e) => setCuratorProfile({
                    ...curatorProfile,
                    socials: { ...curatorProfile.socials, youtube: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  data-testid="input-social-youtube"
                  style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                  placeholder="@channel oder https://youtube.com/@channel"
                />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                  TikTok
                </label>
                <input
                  type="text"
                  value={curatorProfile.socials.tiktok}
                  onChange={(e) => setCuratorProfile({
                    ...curatorProfile,
                    socials: { ...curatorProfile.socials, tiktok: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  data-testid="input-social-tiktok"
                  style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                  placeholder="@username oder https://tiktok.com/@username"
                />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                  Podcast
                </label>
                <input
                  type="text"
                  value={curatorProfile.socials.podcast}
                  onChange={(e) => setCuratorProfile({
                    ...curatorProfile,
                    socials: { ...curatorProfile.socials, podcast: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  data-testid="input-social-podcast"
                  style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                  placeholder="Podcast Name oder URL"
                />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                  Website
                </label>
                <input
                  type="text"
                  value={curatorProfile.socials.website}
                  onChange={(e) => setCuratorProfile({
                    ...curatorProfile,
                    socials: { ...curatorProfile.socials, website: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  data-testid="input-social-website"
                  style={{ borderColor: '#D1D5DB', color: '#3A3A3A' }}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="p-6"
      >
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Sprache & Region
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="language" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Sprache
            </label>
            <select
              id="language"
              value={profile.language}
              onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              data-testid="select-language"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="country" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Land
            </label>
            <select
              id="country"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              data-testid="select-country"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            >
              <option value="DE">Deutschland</option>
              <option value="AT">Österreich</option>
              <option value="CH">Schweiz</option>
            </select>
          </div>
        </div>
      </div>

      <div 
        className="p-6"
      >
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Lieblingsgenres
        </h2>

        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          Wähle deine bevorzugten Genres aus, um personalisierte Empfehlungen zu erhalten.
        </p>

        <div className="flex gap-2 flex-wrap items-center">
          {preferredGenres.map((genre, i) => (
            <div
              role="group"
              key={genre}
              className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg select-none cursor-pointer transition-all duration-200 hover-elevate"
              style={{ backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }}
              data-testid={`tag-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                {genre}
              </Text>
              <LikeButton
                entityId={`genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                entityType="tag"
                entityTitle={genre}
                variant="minimal"
                size="sm"
                iconColor="#ffffff"
                backgroundColor={TAG_COLORS[i % TAG_COLORS.length]}
              />
              <button
                onClick={() => toggleGenre(genre)}
                className="p-0.5 rounded-full transition-colors"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                data-testid={`button-remove-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <GenrePickerDropdown
            onAdd={(genre) => {
              if (!preferredGenres.includes(genre)) {
                setPreferredGenres([...preferredGenres, genre]);
              }
            }}
            existingGenres={preferredGenres}
          />
        </div>

        <p className="text-xs mt-4" style={{ color: '#9CA3AF' }}>
          {preferredGenres.length} Genre{preferredGenres.length !== 1 ? 's' : ''} ausgewählt
        </p>
      </div>

      <div 
        className="p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Passwort ändern
          </h2>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            data-testid="button-toggle-password"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: showPasswordSection ? '#F3F4F6' : '#247ba0',
              color: showPasswordSection ? '#3A3A3A' : '#FFFFFF'
            }}
          >
            {showPasswordSection ? 'Abbrechen' : 'Passwort ändern'}
          </button>
        </div>

        {showPasswordSection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="currentPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#3A3A3A' }}
              >
                Aktuelles Passwort
              </label>
              <input
                id="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                data-testid="input-current-password"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="newPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#3A3A3A' }}
              >
                Neues Passwort
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                data-testid="input-new-password"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#3A3A3A' }}
              >
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                data-testid="input-confirm-password"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahlen
              </p>
            </div>
          </div>
        )}

        {!showPasswordSection && (
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Klicke auf "Passwort ändern", um dein Passwort zu aktualisieren.
          </p>
        )}
      </div>

      {/* Affiliate-Programm Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)' }}>
              <Banknote className="w-5 h-5" style={{ color: '#247ba0' }} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                Geld verdienen mit Empfehlungen
              </h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>Affiliate-Programm</p>
            </div>
          </div>
          <button
            onClick={() => setShowAffiliateSection(!showAffiliateSection)}
            data-testid="button-toggle-affiliate"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: showAffiliateSection ? '#F3F4F6' : '#247ba0',
              color: showAffiliateSection ? '#3A3A3A' : '#FFFFFF'
            }}
          >
            {showAffiliateSection ? 'Einklappen' : 'Einrichten'}
          </button>
        </div>

        {!showAffiliateSection && (
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Registriere dich fuer unser Affiliate-Programm und verdiene Geld mit deinen Buchempfehlungen. Klicke auf "Einrichten", um loszulegen.
          </p>
        )}

        {showAffiliateSection && (
          <div className="space-y-3 mt-4">
            {/* 1. Account & Identitaet */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => toggleAffiliateSection('identity')}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ backgroundColor: affiliateExpanded.identity ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
                data-testid="toggle-affiliate-identity"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" style={{ color: '#247ba0' }} />
                  <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Account & Identitaet</span>
                </div>
                {affiliateExpanded.identity ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
              </button>
              {affiliateExpanded.identity && (
                <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                    Zur eindeutigen Identifikation als Vertragspartner und fuer steuerliche Zwecke.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Vorname *</label>
                      <input type="text" value={affiliate.firstName} onChange={(e) => setAffiliate({ ...affiliate, firstName: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-firstname" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Nachname *</label>
                      <input type="text" value={affiliate.lastName} onChange={(e) => setAffiliate({ ...affiliate, lastName: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-lastname" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Kuenstler-/Profilname</label>
                      <input type="text" value={affiliate.artistName} onChange={(e) => setAffiliate({ ...affiliate, artistName: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-artistname" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Geburtsdatum *</label>
                      <input type="date" value={affiliate.birthDate} onChange={(e) => setAffiliate({ ...affiliate, birthDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-birthdate" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Staatsangehoerigkeit *</label>
                      <input type="text" value={affiliate.nationality} onChange={(e) => setAffiliate({ ...affiliate, nationality: e.target.value })} placeholder="z.B. deutsch" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-nationality" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Land *</label>
                      <select value={affiliate.country} onChange={(e) => setAffiliate({ ...affiliate, country: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-country">
                        <option value="DE">Deutschland</option>
                        <option value="AT">Oesterreich</option>
                        <option value="CH">Schweiz</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Strasse und Hausnummer *</label>
                      <input type="text" value={affiliate.street} onChange={(e) => setAffiliate({ ...affiliate, street: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-street" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>PLZ *</label>
                      <input type="text" value={affiliate.postalCode} onChange={(e) => setAffiliate({ ...affiliate, postalCode: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-postalcode" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Stadt *</label>
                      <input type="text" value={affiliate.city} onChange={(e) => setAffiliate({ ...affiliate, city: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-city" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>E-Mail *</label>
                      <input type="email" value={affiliate.email} onChange={(e) => setAffiliate({ ...affiliate, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-email" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Telefonnummer</label>
                      <input type="tel" value={affiliate.phone} onChange={(e) => setAffiliate({ ...affiliate, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-phone" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Steuerliche Angaben */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => toggleAffiliateSection('tax')}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ backgroundColor: affiliateExpanded.tax ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
                data-testid="toggle-affiliate-tax"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" style={{ color: '#247ba0' }} />
                  <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Steuerliche Angaben</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>Wichtig</span>
                </div>
                {affiliateExpanded.tax ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
              </button>
              {affiliateExpanded.tax && (
                <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                    Steuerliche Informationen sind fuer die korrekte Abrechnung erforderlich.
                  </p>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>Umsatzsteuer-Status *</label>
                    <label
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        borderColor: affiliate.taxStatus === 'kleinunternehmer' ? '#247ba0' : '#D1D5DB',
                        backgroundColor: affiliate.taxStatus === 'kleinunternehmer' ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                      }}
                      data-testid="radio-kleinunternehmer"
                      onClick={() => setAffiliate({ ...affiliate, taxStatus: 'kleinunternehmer' })}
                    >
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: affiliate.taxStatus === 'kleinunternehmer' ? '#247ba0' : '#D1D5DB' }}>
                        {affiliate.taxStatus === 'kleinunternehmer' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#247ba0' }} />}
                      </div>
                      <div>
                        <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>Ich bin Kleinunternehmer (§19 UStG)</span>
                        <p className="text-xs" style={{ color: '#6B7280' }}>Keine Umsatzsteuer auf Rechnungen</p>
                      </div>
                    </label>
                    <label
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        borderColor: affiliate.taxStatus === 'umsatzsteuerpflichtig' ? '#247ba0' : '#D1D5DB',
                        backgroundColor: affiliate.taxStatus === 'umsatzsteuerpflichtig' ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                      }}
                      data-testid="radio-umsatzsteuerpflichtig"
                      onClick={() => setAffiliate({ ...affiliate, taxStatus: 'umsatzsteuerpflichtig' })}
                    >
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: affiliate.taxStatus === 'umsatzsteuerpflichtig' ? '#247ba0' : '#D1D5DB' }}>
                        {affiliate.taxStatus === 'umsatzsteuerpflichtig' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#247ba0' }} />}
                      </div>
                      <div>
                        <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>Ich bin umsatzsteuerpflichtig</span>
                        <p className="text-xs" style={{ color: '#6B7280' }}>Umsatzsteuer wird ausgewiesen</p>
                      </div>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Steuernummer</label>
                      <input type="text" value={affiliate.taxNumber} onChange={(e) => setAffiliate({ ...affiliate, taxNumber: e.target.value })} placeholder="z.B. 12/345/67890" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-taxnumber" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Steuer-ID</label>
                      <input type="text" value={affiliate.taxId} onChange={(e) => setAffiliate({ ...affiliate, taxId: e.target.value })} placeholder="z.B. 12 345 678 901" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-taxid" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>USt-IdNr. (falls vorhanden)</label>
                      <input type="text" value={affiliate.vatId} onChange={(e) => setAffiliate({ ...affiliate, vatId: e.target.value })} placeholder="z.B. DE123456789" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-vatid" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Steuerland</label>
                      <select value={affiliate.taxCountry} onChange={(e) => setAffiliate({ ...affiliate, taxCountry: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-taxcountry">
                        <option value="DE">Deutschland</option>
                        <option value="AT">Oesterreich</option>
                        <option value="CH">Schweiz</option>
                      </select>
                    </div>
                  </div>
                  <label
                    className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer mt-3"
                    style={{
                      borderColor: affiliate.taxSelfResponsible ? '#247ba0' : '#D1D5DB',
                      backgroundColor: affiliate.taxSelfResponsible ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                    }}
                    data-testid="checkbox-aff-tax-responsible"
                    onClick={() => setAffiliate({ ...affiliate, taxSelfResponsible: !affiliate.taxSelfResponsible })}
                  >
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate.taxSelfResponsible ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate.taxSelfResponsible ? '#247ba0' : 'transparent' }}>
                      {affiliate.taxSelfResponsible && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: '#3A3A3A' }}>Ich bestaetige, dass ich fuer meine steuerlichen Verpflichtungen selbst verantwortlich bin. *</span>
                  </label>
                </div>
              )}
            </div>

            {/* 3. Auszahlungsdaten */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => toggleAffiliateSection('payout')}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ backgroundColor: affiliateExpanded.payout ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
                data-testid="toggle-affiliate-payout"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4" style={{ color: '#247ba0' }} />
                  <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Auszahlungsdaten</span>
                </div>
                {affiliateExpanded.payout ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
              </button>
              {affiliateExpanded.payout && (
                <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                    Bankverbindung fuer die Auszahlung deiner Affiliate-Provisionen.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Kontoinhaber *</label>
                      <input type="text" value={affiliate.accountHolder} onChange={(e) => setAffiliate({ ...affiliate, accountHolder: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-accountholder" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>IBAN *</label>
                      <input type="text" value={affiliate.iban} onChange={(e) => setAffiliate({ ...affiliate, iban: e.target.value })} placeholder="DE89 3704 0044 0532 0130 00" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-iban" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>BIC</label>
                      <input type="text" value={affiliate.bic} onChange={(e) => setAffiliate({ ...affiliate, bic: e.target.value })} placeholder="COBADEFFXXX" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-bic" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Auszahlungsland</label>
                      <select value={affiliate.payoutCountry} onChange={(e) => setAffiliate({ ...affiliate, payoutCountry: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-payoutcountry">
                        <option value="DE">Deutschland</option>
                        <option value="AT">Oesterreich</option>
                        <option value="CH">Schweiz</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Waehrung</label>
                      <select value={affiliate.currency} onChange={(e) => setAffiliate({ ...affiliate, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-currency">
                        <option value="EUR">EUR</option>
                        <option value="CHF">CHF</option>
                      </select>
                    </div>
                  </div>
                  <label
                    className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer"
                    style={{
                      borderColor: affiliate.minPayoutAccepted ? '#247ba0' : '#D1D5DB',
                      backgroundColor: affiliate.minPayoutAccepted ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                    }}
                    data-testid="checkbox-aff-minpayout"
                    onClick={() => setAffiliate({ ...affiliate, minPayoutAccepted: !affiliate.minPayoutAccepted })}
                  >
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate.minPayoutAccepted ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate.minPayoutAccepted ? '#247ba0' : 'transparent' }}>
                      {affiliate.minPayoutAccepted && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: '#3A3A3A' }}>Ich akzeptiere den Mindest-Auszahlungsbetrag von 50,00 EUR</span>
                  </label>
                </div>
              )}
            </div>

            {/* 4. Profil-Daten Hinweis */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" style={{ color: '#247ba0' }} />
                  <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Profil-Daten</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#166534' }}>Bereits ausgefuellt</span>
              </div>
              <div className="px-4 pb-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                  Deine Profil-Daten (Profilname, Kurzbeschreibung, Themenschwerpunkte, Social-Links, Profilbild) werden aus deinem Bookstore-Profil uebernommen. Du kannst sie oben in deinen Profileinstellungen aendern.
                </p>
              </div>
            </div>

            {/* 5. Vertrags- & Rechtliches */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => toggleAffiliateSection('legal')}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ backgroundColor: affiliateExpanded.legal ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
                data-testid="toggle-affiliate-legal"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4" style={{ color: '#247ba0' }} />
                  <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Vertrags- & Rechtliches</span>
                </div>
                {affiliateExpanded.legal ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
              </button>
              {affiliateExpanded.legal && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                    Bitte bestaetige die folgenden Vereinbarungen, um am Affiliate-Programm teilzunehmen.
                  </p>
                  {([
                    { key: 'acceptCreatorContract' as const, label: 'Ich akzeptiere den Creator-Vertrag *' },
                    { key: 'acceptRevenueShare' as const, label: 'Ich akzeptiere die Revenue-Share-Regelung *' },
                    { key: 'acceptAdDisclosure' as const, label: 'Ich verpflichte mich zur Kennzeichnung von Werbung *' },
                    { key: 'acceptNoThirdPartyRights' as const, label: 'Ich bestaetige, keine Rechte Dritter zu verletzen *' },
                  ]).map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        borderColor: affiliate[item.key] ? '#247ba0' : '#D1D5DB',
                        backgroundColor: affiliate[item.key] ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                      }}
                      data-testid={`checkbox-aff-${item.key}`}
                      onClick={() => setAffiliate({ ...affiliate, [item.key]: !affiliate[item.key] })}
                    >
                      <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate[item.key] ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate[item.key] ? '#247ba0' : 'transparent' }}>
                        {affiliate[item.key] && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm" style={{ color: '#3A3A3A' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Tracking-Zustimmung */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => toggleAffiliateSection('tracking')}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ backgroundColor: affiliateExpanded.tracking ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
                data-testid="toggle-affiliate-tracking"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4" style={{ color: '#247ba0' }} />
                  <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Tracking-Zustimmung</span>
                </div>
                {affiliateExpanded.tracking ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
              </button>
              {affiliateExpanded.tracking && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                    Fuer die Zuordnung deiner Provisionen ist die Erfassung von Klick- und Umsatzdaten erforderlich.
                  </p>
                  <label
                    className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor: affiliate.acceptTracking ? '#247ba0' : '#D1D5DB',
                      backgroundColor: affiliate.acceptTracking ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                    }}
                    data-testid="checkbox-aff-tracking"
                    onClick={() => setAffiliate({ ...affiliate, acceptTracking: !affiliate.acceptTracking })}
                  >
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate.acceptTracking ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate.acceptTracking ? '#247ba0' : 'transparent' }}>
                      {affiliate.acceptTracking && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: '#3A3A3A' }}>Ich stimme der Erfassung von Klick- und Umsatzdaten zu. *</span>
                  </label>
                </div>
              )}
            </div>

            {affiliateMessage && (
              <div
                className="rounded-lg p-3 text-sm"
                style={{
                  backgroundColor: affiliateMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  color: affiliateMessage.type === 'success' ? '#166534' : '#991B1B',
                  border: `1px solid ${affiliateMessage.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`
                }}
                data-testid="text-affiliate-message"
              >
                {affiliateMessage.text}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleAffiliateSave}
                disabled={affiliateSaving}
                data-testid="button-save-affiliate"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: affiliateSaving ? '#9CA3AF' : '#247ba0',
                  color: '#FFFFFF'
                }}
              >
                {affiliateSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#FFFFFF40', borderTopColor: '#FFFFFF' }} />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Affiliate-Daten speichern
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg p-4 md:p-6 shadow-sm border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} />
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#991B1B' }}>
            Gefahrenbereich
          </h2>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#991B1B' }}>
                  Account deaktivieren
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  Dein Account wird vorübergehend deaktiviert und kann später wiederhergestellt werden
                </div>
              </div>
              <button
                data-testid="button-deactivate-account"
                className="px-4 py-2 rounded-lg text-xs md:text-sm border whitespace-nowrap"
                style={{ borderColor: '#EF4444', color: '#EF4444' }}
              >
                Deaktivieren
              </button>
            </div>
          </div>

          <div className="p-3 md:p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#991B1B' }}>
                  Account löschen
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  Alle deine Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                </div>
              </div>
              <button
                data-testid="button-delete-account"
                className="px-4 py-2 rounded-lg text-xs md:text-sm text-white whitespace-nowrap"
                style={{ backgroundColor: '#EF4444' }}
                onClick={() => {
                  if (confirm('Möchtest du deinen Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
                    alert('Account-Löschung würde hier ausgeführt werden');
                  }
                }}
              >
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
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            backgroundColor: saveMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            color: saveMessage.type === 'success' ? '#166534' : '#991B1B',
            border: `1px solid ${saveMessage.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`
          }}
          data-testid="text-save-message"
        >
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="button-save-profile"
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
          style={{
            backgroundColor: saving ? '#9CA3AF' : '#247ba0',
            color: '#FFFFFF'
          }}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#FFFFFF40', borderTopColor: '#FFFFFF' }} />
              Wird gespeichert...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Änderungen speichern
            </>
          )}
        </button>
      </div>
    </div>
  );
}
