import { useState, useEffect, useCallback } from 'react';
import {
  Store, Save, Eye, GripVertical, ExternalLink,
  Instagram, Twitter, Youtube, MapPin, BookOpen, AlertTriangle, User,
  ImageIcon, Search, X, Loader2
} from 'lucide-react';
import { Text } from '../../components/ui/typography';
import { useAuth } from '../../hooks/use-auth';

const API_BASE = '/api';
const CURATOR_STORAGE_KEY = 'coratiert-curator-id';

interface SocialLinks {
  website: string;
  instagram: string;
  twitter: string;
  youtube: string;
  tiktok: string;
}

interface BookstoreProfile {
  userId: string;
  displayName: string;
  slug: string;
  tagline: string;
  description: string;
  socialLinks: SocialLinks;
  address: string;
  heroImageUrl: string;
  isPhysicalStore: boolean;
  isPublished: boolean;
}

interface Curation {
  id: number;
  title: string;
  description: string | null;
  tags: string[];
  is_published: boolean;
}

interface BookstoreSection {
  id: number;
  curationId: number;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ProfileCheck {
  hasName: boolean;
  hasEmail: boolean;
  hasFocus: boolean;
  hasBio: boolean;
  isComplete: boolean;
  missing: string[];
}

export function UserBookstore() {
  const { user: authUser } = useAuth();
  const USER_ID = authUser?.id || 'demo-user-123';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [profileCheck, setProfileCheck] = useState<ProfileCheck>({
    hasName: false, hasEmail: false, hasFocus: false, hasBio: false,
    isComplete: false, missing: [],
  });

  const [profile, setProfile] = useState<BookstoreProfile>({
    userId: USER_ID,
    displayName: '',
    slug: '',
    tagline: '',
    description: '',
    socialLinks: { website: '', instagram: '', twitter: '', youtube: '', tiktok: '' },
    address: '',
    heroImageUrl: '',
    isPhysicalStore: false,
    isPublished: false,
  });

  const [curations, setCurations] = useState<Curation[]>([]);
  const [linkedSections, setLinkedSections] = useState<BookstoreSection[]>([]);
  const [curationsLoading, setCurationsLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [heroSearch, setHeroSearch] = useState('');
  const [heroSearchResults, setHeroSearchResults] = useState<any[]>([]);
  const [heroSearching, setHeroSearching] = useState(false);
  const [heroManualUrl, setHeroManualUrl] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bookstore/profile?userId=${encodeURIComponent(USER_ID)}`);
      const data = await res.json();
      if (data.ok && data.data) {
        const d = data.data;
        setProfile({
          userId: USER_ID,
          displayName: d.displayName || d.display_name || '',
          slug: d.slug || '',
          tagline: d.tagline || '',
          description: d.description || '',
          socialLinks: {
            website: d.socialLinks?.website || d.social_links?.website || '',
            instagram: d.socialLinks?.instagram || d.social_links?.instagram || '',
            twitter: d.socialLinks?.twitter || d.social_links?.twitter || '',
            youtube: d.socialLinks?.youtube || d.social_links?.youtube || '',
            tiktok: d.socialLinks?.tiktok || d.social_links?.tiktok || '',
          },
          address: d.address || '',
          heroImageUrl: d.heroImageUrl || d.hero_image_url || '',
          isPhysicalStore: d.isPhysicalStore ?? d.is_physical_store ?? false,
          isPublished: d.isPublished ?? d.is_published ?? false,
        });
        if (d.slug) {
          setSlugManuallyEdited(true);
          setSavedSlug(d.slug);
        }
      }
    } catch {
      console.error('Failed to load bookstore profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurations = useCallback(async () => {
    try {
      setCurationsLoading(true);
      const [curRes, secRes] = await Promise.all([
        fetch(`${API_BASE}/user-curations?userId=${encodeURIComponent(USER_ID)}`),
        fetch(`${API_BASE}/bookstore/sections?userId=${encodeURIComponent(USER_ID)}`),
      ]);
      const curData = await curRes.json();
      const secData = await secRes.json();
      if (curData.ok) setCurations(curData.data || []);
      if (secData.ok) {
        setLinkedSections(
          (secData.data || []).map((s: any) => ({
            id: s.id,
            curationId: s.curationId ?? s.curation_id,
          }))
        );
      }
    } catch {
      console.error('Failed to load curations');
    } finally {
      setCurationsLoading(false);
    }
  }, []);

  const checkProfileCompleteness = useCallback(async () => {
    const missing: string[] = [];
    let hasName = false, hasEmail = false, hasFocus = false, hasBio = false;
    try {
      const curatorId = localStorage.getItem(CURATOR_STORAGE_KEY);
      if (curatorId) {
        const res = await fetch(`${API_BASE}/user/curator-profile/${curatorId}`);
        const json = await res.json();
        if (json.ok && json.data) {
          const d = json.data;
          const name = (d.name || '').trim();
          const nameParts = name.split(' ').filter((p: string) => p.length > 0);
          hasName = nameParts.length >= 2;
          hasEmail = !!(d.email && d.email.trim().length > 0);
          hasFocus = !!(d.focus && d.focus.trim().length > 0);
          hasBio = !!(d.bio && d.bio.trim().length > 0);
        }
      }
    } catch {}
    if (!hasName) missing.push('Vor- und Nachname');
    if (!hasEmail) missing.push('E-Mail-Adresse');
    if (!hasFocus) missing.push('Kurator*in Fokus / Thema');
    if (!hasBio) missing.push('Kurator*in Biografie');
    setProfileCheck({
      hasName, hasEmail, hasFocus, hasBio,
      isComplete: missing.length === 0,
      missing,
    });
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchCurations();
    checkProfileCompleteness();
  }, [fetchProfile, fetchCurations, checkProfileCompleteness]);

  const handleDisplayNameChange = (value: string) => {
    setProfile(prev => ({
      ...prev,
      displayName: value,
      slug: slugManuallyEdited ? prev.slug : generateSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setProfile(prev => ({ ...prev, slug: generateSlug(value) }));
  };

  const searchHeroImages = async () => {
    if (!heroSearch.trim()) return;
    setHeroSearching(true);
    try {
      const res = await fetch(`${API_BASE}/unsplash/search?query=${encodeURIComponent(heroSearch)}`);
      const data = await res.json();
      if (data.success) setHeroSearchResults(data.data || []);
    } catch {
      setHeroSearchResults([]);
    } finally {
      setHeroSearching(false);
    }
  };

  const selectHeroImage = (url: string) => {
    setProfile(prev => ({ ...prev, heroImageUrl: url }));
    setHeroSearchResults([]);
    setHeroSearch('');
  };

  const applyManualHeroUrl = () => {
    if (heroManualUrl.trim()) {
      setProfile(prev => ({ ...prev, heroImageUrl: heroManualUrl.trim() }));
      setHeroManualUrl('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`${API_BASE}/bookstore/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.ok) {
        const returnedSlug = data.data?.slug || profile.slug;
        if (returnedSlug) setSavedSlug(returnedSlug);
        setSaveMessage({ type: 'success', text: 'Bookstore-Profil gespeichert!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Fehler beim Speichern' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Verbindungsfehler beim Speichern' });
    } finally {
      setSaving(false);
    }
  };

  const isCurationLinked = (curationId: number) => linkedSections.some(s => s.curationId === curationId);

  const toggleCurationLink = async (curation: Curation) => {
    const existing = linkedSections.find(s => s.curationId === curation.id);
    if (existing) {
      try {
        await fetch(`${API_BASE}/bookstore/sections/${existing.id}`, { method: 'DELETE' });
        setLinkedSections(prev => prev.filter(s => s.id !== existing.id));
      } catch {
        console.error('Failed to unlink curation');
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/bookstore/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: USER_ID, curationId: curation.id }),
        });
        const data = await res.json();
        if (data.ok && data.data) {
          setLinkedSections(prev => [
            ...prev,
            { id: data.data.id, curationId: curation.id },
          ]);
        }
      } catch {
        console.error('Failed to link curation');
      }
    }
  };

  const linkedCurations = linkedSections
    .map(s => {
      const cur = curations.find(c => c.id === s.curationId);
      return cur ? { ...cur, linkId: s.id } : null;
    })
    .filter(Boolean) as (Curation & { linkId: number })[];

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newSections = [...linkedSections];
    const [moved] = newSections.splice(dragIndex, 1);
    newSections.splice(index, 0, moved);
    setLinkedSections(newSections);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    try {
      await fetch(`${API_BASE}/bookstore/sections/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds: linkedSections.map(s => s.id) }),
      });
    } catch {
      console.error('Failed to reorder sections');
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
          data-testid="heading-bookstore"
        >
          Mein Bookstore
        </h1>
        <p className="text-sm text-center" style={{ color: '#6B7280' }}>
          Richte deinen persönlichen Bookstore ein
        </p>
      </div>

      {saveMessage && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: saveMessage.type === 'success' ? '#D1FAE5' : '#FEF2F2',
            color: saveMessage.type === 'success' ? '#065F46' : '#991B1B',
          }}
          data-testid="text-save-message"
        >
          {saveMessage.text}
        </div>
      )}

      {!profileCheck.isComplete && (
        <div
          className="p-4 rounded-lg flex items-start gap-3"
          style={{ backgroundColor: '#FFF7ED', border: '1px solid #FDBA74' }}
          data-testid="warning-profile-incomplete"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#EA580C' }} />
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#9A3412' }}>
              Profil unvollständig
            </p>
            <p className="text-sm mb-2" style={{ color: '#C2410C' }}>
              Dein Bookstore kann erst veröffentlicht werden, wenn du dein Profil vollständig ausgefüllt hast. Bitte ergänze folgende Angaben im Tab "Profil":
            </p>
            <ul className="text-sm list-disc pl-5 space-y-0.5" style={{ color: '#C2410C' }}>
              {profileCheck.missing.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>Status:</span>
          <label
            className={`relative inline-flex items-center ${profileCheck.isComplete ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
            data-testid="toggle-published"
          >
            <input
              type="checkbox"
              checked={profile.isPublished}
              onChange={e => {
                if (!profileCheck.isComplete && e.target.checked) return;
                setProfile(prev => ({ ...prev, isPublished: e.target.checked }));
              }}
              disabled={!profileCheck.isComplete && !profile.isPublished}
              className="sr-only peer"
              data-testid="input-published"
            />
            <div
              className="w-11 h-6 rounded-full peer-focus:ring-2 peer-focus:ring-offset-1 transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
              style={{ backgroundColor: profile.isPublished ? '#247ba0' : '#D1D5DB' }}
            />
            <span className="ml-2 text-sm font-medium" style={{ color: profile.isPublished ? '#247ba0' : '#6B7280' }}>
              {profile.isPublished ? 'Veröffentlicht' : 'Entwurf'}
            </span>
          </label>
        </div>
        {savedSlug ? (
          <a
            href={`/${savedSlug}`}
            data-testid="button-open-bookstore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: '#247ba0', color: '#ffffff' }}
          >
            <ExternalLink className="w-4 h-4" />
            Bookstore öffnen
          </a>
        ) : profile.slug ? (
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            Speichere zuerst, um die Vorschau zu sehen
          </span>
        ) : null}
      </div>

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          <Store className="w-5 h-5 inline-block mr-2 -mt-0.5" style={{ color: '#247ba0' }} />
          Profil-Einstellungen
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
              URL-Slug
            </label>
            <input
              id="slug"
              type="text"
              value={profile.slug}
              readOnly
              className="w-full p-3 rounded-lg border transition-colors"
              style={{ borderColor: '#E5E7EB', color: '#6B7280', backgroundColor: '#F9FAFB' }}
              placeholder="wird vom Kurator:in-Namen abgeleitet"
              data-testid="input-slug"
            />
            {profile.slug && (
              <p className="mt-1 text-xs" style={{ color: '#6B7280' }} data-testid="text-url-preview">
                coratiert.de/{profile.slug}
              </p>
            )}
            <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>
              Der URL-Slug wird automatisch vom Kurator:in-Namen abgeleitet.
            </p>
          </div>

          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Anzeigename, Fokus/Thema, Biografie und Social-Media-Kanäle werden aus deinem Profil übernommen und können dort bearbeitet werden.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
              <ImageIcon className="w-4 h-4 inline-block mr-1.5 -mt-0.5" style={{ color: '#247ba0' }} />
              Hintergrundbild
            </label>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
              Wähle ein Hintergrundbild für deinen Bookstore-Header. Das Bild wird über die gesamte Breite angezeigt.
            </p>

            {profile.heroImageUrl && (
              <div className="relative mb-3 rounded-lg overflow-hidden" style={{ height: '140px' }}>
                <img
                  src={profile.heroImageUrl}
                  alt="Hintergrundbild-Vorschau"
                  className="w-full h-full object-cover"
                  data-testid="img-hero-preview"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                <button
                  type="button"
                  onClick={() => setProfile(prev => ({ ...prev, heroImageUrl: '' }))}
                  className="absolute top-2 right-2 p-1 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFFFFF' }}
                  data-testid="button-remove-hero"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-3 text-xs text-white font-medium" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  Aktuelle Vorschau
                </span>
              </div>
            )}

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchHeroImages()}
                className="flex-1 p-2.5 rounded-lg border text-sm"
                style={{ borderColor: '#E5E7EB', color: '#3A3A3A' }}
                placeholder="Unsplash-Bilder suchen..."
                data-testid="input-hero-search"
              />
              <button
                type="button"
                onClick={searchHeroImages}
                disabled={heroSearching}
                className="px-3 py-2.5 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: '#247ba0' }}
                data-testid="button-hero-search"
              >
                {heroSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            {heroSearchResults.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto rounded-lg border p-2" style={{ borderColor: '#E5E7EB' }}>
                {heroSearchResults.map((img: any) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => selectHeroImage(img.url)}
                    className="relative aspect-video rounded-md overflow-hidden border-2 transition-colors"
                    style={{ borderColor: 'transparent' }}
                    data-testid={`hero-img-${img.id}`}
                  >
                    <img
                      src={img.thumb}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                    {img.author && (
                      <span className="absolute bottom-0 left-0 right-0 text-[10px] text-white px-1 py-0.5 truncate" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        {img.author}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={heroManualUrl}
                onChange={e => setHeroManualUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyManualHeroUrl()}
                className="flex-1 p-2.5 rounded-lg border text-sm"
                style={{ borderColor: '#E5E7EB', color: '#3A3A3A' }}
                placeholder="Oder Bild-URL direkt eingeben..."
                data-testid="input-hero-manual-url"
              />
              <button
                type="button"
                onClick={applyManualHeroUrl}
                disabled={!heroManualUrl.trim()}
                className="px-3 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: '#E5E7EB', color: heroManualUrl.trim() ? '#247ba0' : '#9CA3AF' }}
                data-testid="button-hero-apply-url"
              >
                Übernehmen
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer" data-testid="toggle-physical-store">
              <input
                type="checkbox"
                checked={profile.isPhysicalStore}
                onChange={e => setProfile(prev => ({ ...prev, isPhysicalStore: e.target.checked, address: e.target.checked ? prev.address : '' }))}
                className="sr-only peer"
                data-testid="input-physical-store"
              />
              <div
                className="relative w-11 h-6 rounded-full peer-focus:ring-2 peer-focus:ring-offset-1 transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
                style={{ backgroundColor: profile.isPhysicalStore ? '#247ba0' : '#D1D5DB' }}
              />
              <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
                <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" style={{ color: '#247ba0' }} />
                Physische Buchhandlung
              </span>
            </label>
          </div>

          {profile.isPhysicalStore && (
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                Adresse
              </label>
              <input
                id="address"
                type="text"
                value={profile.address}
                onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-3 rounded-lg border transition-colors"
                style={{ borderColor: '#E5E7EB', color: '#3A3A3A' }}
                placeholder="Straße, PLZ Ort"
                data-testid="input-address"
              />
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="button-save-profile"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 text-white"
              style={{ backgroundColor: saving ? '#93C5FD' : '#247ba0' }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#FFFFFF40', borderTopColor: '#FFFFFF' }} />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Speichern
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          <BookOpen className="w-5 h-5 inline-block mr-2 -mt-0.5" style={{ color: '#247ba0' }} />
          Kurationen im Bookstore
        </h2>
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          Wähle aus, welche deiner Kurationen in deinem Bookstore angezeigt werden sollen.
        </p>

        {curationsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#247ba0' }} />
          </div>
        ) : curations.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Du hast noch keine Kurationen erstellt.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {curations.map(curation => {
              const linked = isCurationLinked(curation.id);
              return (
                <div
                  key={curation.id}
                  className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
                  style={{
                    borderColor: linked ? '#247ba0' : '#E5E7EB',
                    backgroundColor: linked ? '#F0F9FF' : '#FFFFFF',
                  }}
                  data-testid={`curation-link-${curation.id}`}
                >
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={linked}
                      onChange={() => toggleCurationLink(curation)}
                      className="sr-only peer"
                      data-testid={`toggle-curation-${curation.id}`}
                    />
                    <div
                      className="w-9 h-5 rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                      style={{ backgroundColor: linked ? '#247ba0' : '#D1D5DB' }}
                    />
                  </label>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>{curation.title}</span>
                    {curation.description && (
                      <p className="text-xs truncate" style={{ color: '#6B7280' }}>{curation.description}</p>
                    )}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={curation.is_published
                      ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                      : { backgroundColor: '#FEF3C7', color: '#92400E' }
                    }
                  >
                    {curation.is_published ? 'Veröffentlicht' : 'Entwurf'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {linkedCurations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3" style={{ color: '#3A3A3A' }}>
              Reihenfolge im Bookstore (per Drag & Drop ändern)
            </h3>
            <div className="space-y-1">
              {linkedCurations.map((curation, index) => (
                <div
                  key={curation.linkId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: dragIndex === index ? '#F0F9FF' : '#FFFFFF',
                  }}
                  data-testid={`sortable-curation-${curation.id}`}
                >
                  <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <span className="text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}>
                    {index + 1}
                  </span>
                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: '#3A3A3A' }}>{curation.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}