import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Save, Globe, Instagram, Podcast, Check, Plus, Search, X, GripVertical, ChevronUp, ChevronDown, Image as ImageIcon, MapPin, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SiYoutube, SiTiktok } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../hooks/use-auth';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';

const CURATOR_STORAGE_KEY = 'coratiert-curator-id';

export function PublicProfile() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const userId = authUser?.id || 'demo-user-123';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [curatorId, setCuratorId] = useState<string | null>(() => localStorage.getItem(CURATOR_STORAGE_KEY));
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
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

  const [bookstoreSlug, setBookstoreSlug] = useState<string | null>(null);
  const DEFAULT_TAB_ORDER = ['kurationen', 'buchbesprechung', 'rezensionen', 'bewertungen', 'veranstaltungen', 'buchclub', 'leseliste'];
  const [visibleTabs, setVisibleTabs] = useState({
    kurationen: true,
    buchbesprechung: true,
    rezensionen: true,
    bewertungen: true,
    veranstaltungen: true,
    buchclub: false,
    leseliste: false,
  });
  const [tabOrder, setTabOrder] = useState<string[]>(DEFAULT_TAB_ORDER);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const [bookstoreProfile, setBookstoreProfile] = useState({
    heroImageUrl: '',
    isPhysicalStore: false,
    address: '',
    isPublished: false,
  });
  const [heroSearch, setHeroSearch] = useState('');
  const [heroSearchResults, setHeroSearchResults] = useState<any[]>([]);
  const [heroSearching, setHeroSearching] = useState(false);
  const [heroManualUrl, setHeroManualUrl] = useState('');
  const [showHideModal, setShowHideModal] = useState(false);

  const searchHeroImages = async () => {
    if (!heroSearch.trim()) return;
    setHeroSearching(true);
    try {
      const res = await fetch(`/api/unsplash/search?query=${encodeURIComponent(heroSearch)}`);
      const data = await res.json();
      if (data.success) setHeroSearchResults(data.data || []);
    } catch {
      setHeroSearchResults([]);
    } finally {
      setHeroSearching(false);
    }
  };

  const selectHeroImage = (url: string) => {
    setBookstoreProfile(prev => ({ ...prev, heroImageUrl: url }));
    setHeroSearchResults([]);
    setHeroSearch('');
  };

  const applyManualHeroUrl = () => {
    if (heroManualUrl.trim()) {
      setBookstoreProfile(prev => ({ ...prev, heroImageUrl: heroManualUrl.trim() }));
      setHeroManualUrl('');
    }
  };

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
          const { _order, ...tabFlags } = d.visible_tabs;
          setVisibleTabs(prev => ({ ...prev, ...tabFlags }));
          if (Array.isArray(_order) && _order.length > 0) {
            const allKeys = DEFAULT_TAB_ORDER;
            const validOrder = _order.filter((k: string) => allKeys.includes(k));
            const missing = allKeys.filter(k => !validOrder.includes(k));
            setTabOrder([...validOrder, ...missing]);
          }
        }
      }

      const bsRes = await fetch(`/api/bookstore/profile?userId=${encodeURIComponent(userId)}`);
      const bsJson = await bsRes.json();
      if (bsJson.ok && bsJson.data) {
        const bs = bsJson.data;
        setBookstoreProfile({
          heroImageUrl: bs.heroImageUrl || bs.hero_image_url || '',
          isPhysicalStore: bs.isPhysicalStore ?? bs.is_physical_store ?? false,
          address: bs.address || '',
          isPublished: bs.isPublished ?? bs.is_published ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to load curator profile:', err);
    } finally {
      setLoading(false);
    }
  }, [curatorId, userId]);

  useEffect(() => {
    loadCuratorProfile();
  }, [loadCuratorProfile]);

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || 'Benutzername';
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

  const handleSave = async (overrides?: { isPublished?: boolean }) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const publicName = curatorProfile.publicName.trim() || `${profile.firstName} ${profile.lastName}`.trim();
      const resp = await fetch('/api/user/curator-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curatorId: curatorId || undefined,
          userId,
          name: publicName,
          email: profile.email,
          bio: curatorProfile.bio,
          focus: curatorProfile.focus,
          avatar_url: curatorProfile.avatarUrl,
          socials: curatorProfile.socials,
          visible_tabs: { ...visibleTabs, _order: tabOrder }
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

        const publishState = overrides?.isPublished ?? bookstoreProfile.isPublished;
        await fetch('/api/bookstore/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            displayName: publicName,
            slug: json.data?.slug || bookstoreSlug || '',
            tagline: '',
            description: '',
            socialLinks: curatorProfile.socials,
            heroImageUrl: bookstoreProfile.heroImageUrl,
            isPhysicalStore: bookstoreProfile.isPhysicalStore,
            address: bookstoreProfile.address,
            isPublished: publishState,
          }),
        });

        const msg = overrides?.isPublished === true
          ? 'Profil veröffentlicht!'
          : overrides?.isPublished === false
            ? 'Profil verborgen.'
            : 'Öffentliches Profil erfolgreich gespeichert!';
        setSaveMessage({ type: 'success', text: msg });
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
        title={t('dashboardPages.publicProfileTitle', 'Öffentliches Profil')}
        description={t('dashboardPages.publicProfileDesc', 'So sehen andere dein Profil auf der Plattform.')}
      />

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>
          Kurator:in-Profil
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="publicName" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>
              Öffentlicher Kurator:in-Name *
            </label>
            <input
              id="publicName" type="text" value={curatorProfile.publicName}
              onChange={(e) => setCuratorProfile({ ...curatorProfile, publicName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-public-name"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }}
              placeholder="z.B. dein Name, Geschäftsname oder Künstlername"
            />
            <div className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Unter diesem Namen erscheint dein Kurator:in-Profil öffentlich auf coratiert.de. Kann sich von deinem persönlichen Namen unterscheiden.
            </div>
          </div>

          <div>
            <label htmlFor="focus" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Fokus / Thema</label>
            <input
              id="focus" type="text" value={curatorProfile.focus}
              onChange={(e) => setCuratorProfile({ ...curatorProfile, focus: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-focus"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }}
              placeholder="z.B. Krimis & Thriller, Fantasy, Klassiker"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Biografie</label>
            <textarea
              id="bio" value={curatorProfile.bio}
              onChange={(e) => { const words = countWords(e.target.value); if (words <= 100 || e.target.value.length < curatorProfile.bio.length) { setCuratorProfile({ ...curatorProfile, bio: e.target.value }); } }}
              rows={4} className="w-full px-4 py-2 rounded-lg border transition-colors" data-testid="input-bio"
              style={{ backgroundColor: '#FFFFFF', borderColor: countWords(curatorProfile.bio) >= 90 ? '#f25f5c' : '#D1D5DB', color: '#1F2937' }}
              placeholder="Kurze Beschreibung (max. 100 Wörter)..."
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs" style={{ color: countWords(curatorProfile.bio) > 100 ? '#f25f5c' : '#9CA3AF' }} data-testid="text-bio-wordcount">
                {countWords(curatorProfile.bio)} / 100 Wörter
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>Avatar</label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {curatorProfile.avatarUrl ? (
                  <img src={curatorProfile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: '#E5E7EB' }} data-testid="img-avatar-preview" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed" style={{ borderColor: '#9CA3AF', backgroundColor: '#F9FAFB' }}>
                    <User className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" data-testid="input-avatar-file"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarUpload(file); e.target.value = ''; }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} data-testid="button-upload-avatar"
                  className="w-full px-4 py-2 border rounded-lg flex items-center justify-center gap-2 text-sm transition-colors" style={{ borderColor: '#D1D5DB', color: '#1F2937' }}>
                  {uploading ? (
                    <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#D1D5DB', borderTopColor: '#247ba0' }} />Wird hochgeladen...</>
                  ) : (
                    <><ImageIcon className="w-4 h-4" />Bild hochladen</>
                  )}
                </button>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>JPG, PNG, WebP oder GIF (max. 5 MB)</div>
                <input type="text" value={curatorProfile.avatarUrl} onChange={(e) => setCuratorProfile({ ...curatorProfile, avatarUrl: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm" data-testid="input-avatar-url" style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="oder URL eingeben: https://..." />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#1F2937' }}>Social Media Präsenzen</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>Instagram</label>
                <input type="text" value={curatorProfile.socials.instagram} onChange={(e) => setCuratorProfile({ ...curatorProfile, socials: { ...curatorProfile.socials, instagram: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-social-instagram" style={{ borderColor: '#D1D5DB', color: '#1F2937' }} placeholder="@username oder https://instagram.com/username" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>YouTube</label>
                <input type="text" value={curatorProfile.socials.youtube} onChange={(e) => setCuratorProfile({ ...curatorProfile, socials: { ...curatorProfile.socials, youtube: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-social-youtube" style={{ borderColor: '#D1D5DB', color: '#1F2937' }} placeholder="@channel oder https://youtube.com/@channel" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>TikTok</label>
                <input type="text" value={curatorProfile.socials.tiktok} onChange={(e) => setCuratorProfile({ ...curatorProfile, socials: { ...curatorProfile.socials, tiktok: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-social-tiktok" style={{ borderColor: '#D1D5DB', color: '#1F2937' }} placeholder="@username oder https://tiktok.com/@username" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>Podcast</label>
                <input type="text" value={curatorProfile.socials.podcast} onChange={(e) => setCuratorProfile({ ...curatorProfile, socials: { ...curatorProfile.socials, podcast: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-social-podcast" style={{ borderColor: '#D1D5DB', color: '#1F2937' }} placeholder="Podcast Name oder URL" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>Website</label>
                <input type="text" value={curatorProfile.socials.website} onChange={(e) => setCuratorProfile({ ...curatorProfile, socials: { ...curatorProfile.socials, website: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-social-website" style={{ borderColor: '#D1D5DB', color: '#1F2937' }} placeholder="https://example.com" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>
              <ImageIcon className="w-4 h-4 inline-block mr-1.5 -mt-0.5" style={{ color: '#247ba0' }} />
              Hintergrundbild
            </label>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
              Wähle ein Hintergrundbild für deinen Bookstore-Header. Das Bild wird über die gesamte Breite angezeigt.
            </p>

            {bookstoreProfile.heroImageUrl && (
              <div className="relative mb-3 rounded-lg overflow-hidden" style={{ height: '140px' }}>
                <img
                  src={bookstoreProfile.heroImageUrl}
                  alt="Hintergrundbild-Vorschau"
                  className="w-full h-full object-cover"
                  data-testid="img-hero-preview"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                <button
                  type="button"
                  onClick={() => setBookstoreProfile(prev => ({ ...prev, heroImageUrl: '' }))}
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
                style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto rounded-lg border p-2" style={{ borderColor: '#D1D5DB' }}>
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
                style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                placeholder="Oder Bild-URL direkt eingeben..."
                data-testid="input-hero-manual-url"
              />
              <button
                type="button"
                onClick={applyManualHeroUrl}
                disabled={!heroManualUrl.trim()}
                className="px-3 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: '#D1D5DB', color: heroManualUrl.trim() ? '#247ba0' : '#9CA3AF' }}
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
                checked={bookstoreProfile.isPhysicalStore}
                onChange={e => setBookstoreProfile(prev => ({ ...prev, isPhysicalStore: e.target.checked, address: e.target.checked ? prev.address : '' }))}
                className="sr-only peer"
                data-testid="input-physical-store"
              />
              <div
                className="relative w-11 h-6 rounded-full peer-focus:ring-2 peer-focus:ring-offset-1 transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
                style={{ backgroundColor: bookstoreProfile.isPhysicalStore ? '#247ba0' : '#D1D5DB' }}
              />
              <span className="text-sm font-medium" style={{ color: '#1F2937' }}>
                <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" style={{ color: '#247ba0' }} />
                Physische Buchhandlung
              </span>
            </label>
          </div>

          {bookstoreProfile.isPhysicalStore && (
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2" style={{ color: '#1F2937' }}>
                Adresse
              </label>
              <input
                id="address"
                type="text"
                value={bookstoreProfile.address}
                onChange={e => setBookstoreProfile(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                placeholder="Straße, PLZ Ort"
                data-testid="input-address"
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-3" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>
          Sichtbare Tabs im öffentlichen Profil
        </h2>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
          Wähle aus, welche Tabs angezeigt werden sollen. Verschiebe sie per Drag & Drop oder mit den Pfeilen, um die Reihenfolge zu ändern.
        </p>
        <div className="flex flex-col gap-2 max-w-lg">
          {(() => {
            const TAB_LABELS: Record<string, string> = {
              kurationen: 'Kurationen',
              buchbesprechung: 'Shownotes',
              rezensionen: 'Rezensionen',
              bewertungen: 'Bewertungen',
              veranstaltungen: 'Veranstaltungen',
              buchclub: 'Buchclub',
              leseliste: 'Leseliste',
            };
            const moveTab = (fromIdx: number, toIdx: number) => {
              setTabOrder(prev => {
                const next = [...prev];
                const [item] = next.splice(fromIdx, 1);
                next.splice(toIdx, 0, item);
                return next;
              });
            };
            return tabOrder.map((key, idx) => (
              <div
                key={key}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors select-none"
                style={{
                  borderColor: (visibleTabs as any)[key] ? '#247ba0' : '#D1D5DB',
                  backgroundColor: dragIdx === idx ? 'rgba(36, 123, 160, 0.12)' : (visibleTabs as any)[key] ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => { if (dragIdx !== null && dragIdx !== idx) moveTab(dragIdx, idx); setDragIdx(null); }}
                data-testid={`tab-order-item-${key}`}
              >
                <span draggable onDragStart={() => setDragIdx(idx)} onDragEnd={() => setDragIdx(null)} className="cursor-grab active:cursor-grabbing flex-shrink-0" data-testid={`drag-handle-${key}`}>
                  <GripVertical className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                </span>
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                  style={{ borderColor: (visibleTabs as any)[key] ? '#247ba0' : '#D1D5DB', backgroundColor: (visibleTabs as any)[key] ? '#247ba0' : 'transparent' }}
                  onClick={(e) => { e.stopPropagation(); setVisibleTabs(prev => ({ ...prev, [key]: !(prev as any)[key] })); }}
                  data-testid={`checkbox-tab-${key}`}
                >
                  {(visibleTabs as any)[key] && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm flex-1" style={{ color: '#1F2937' }}>{TAB_LABELS[key] || key}</span>
                <span className="text-xs text-muted-foreground mr-1">{idx + 1}</span>
                <Button variant="ghost" size="icon" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveTab(idx, idx - 1); }} data-testid={`button-tab-up-${key}`}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={idx === tabOrder.length - 1} onClick={(e) => { e.stopPropagation(); moveTab(idx, idx + 1); }} data-testid={`button-tab-down-${key}`}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            ));
          })()}
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg md:text-xl mb-3" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>
          Vorschau
        </h2>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
          So sieht dein öffentliches Profil für andere aus.
        </p>
        <section className="rounded-xl overflow-hidden relative" data-testid="hero-profile-card">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundColor: bookstoreProfile.heroImageUrl ? undefined : '#1a1a2e',
              backgroundImage: bookstoreProfile.heroImageUrl ? `url(${bookstoreProfile.heroImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            data-testid="preview-hero-bg"
          />
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: bookstoreProfile.heroImageUrl
                ? 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.75) 100%)'
                : 'linear-gradient(180deg, rgba(26,26,46,0.85) 0%, rgba(26,26,46,0.95) 100%)',
            }}
          />

          <div className="relative z-10 py-10 md:py-14 px-5 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="flex items-center gap-5 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-transparent shadow-[0_4px_20px_rgba(0,0,0,0.3)]" style={{ '--tw-ring-color': '#247ba0' } as React.CSSProperties}>
                    {curatorProfile.avatarUrl ? (
                      <img src={curatorProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" data-testid="avatar-user-image" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} data-testid="avatar-user">
                        <span className="text-5xl md:text-6xl text-white" style={{ fontFamily: 'Fjalla One' }}>
                          {displayName.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl mb-1 text-white" style={{ fontFamily: 'Fjalla One', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }} data-testid="text-username">
                    {curatorProfile.publicName || displayName}
                  </h2>
                  {curatorProfile.focus && (
                    <p className="text-base font-semibold text-white/80" data-testid="text-curator-focus">{curatorProfile.focus}</p>
                  )}
                  {bookstoreProfile.isPhysicalStore && bookstoreProfile.address && (
                    <div className="flex items-center gap-2 text-white/70 mt-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-base">{bookstoreProfile.address}</span>
                    </div>
                  )}
                  {(curatorProfile.socials.website || curatorProfile.socials.instagram || curatorProfile.socials.youtube || curatorProfile.socials.tiktok || curatorProfile.socials.podcast) && (
                    <div className="flex items-center gap-3 flex-wrap mt-3" data-testid="social-links-preview">
                      {curatorProfile.socials.website && <span className="text-white/70"><Globe className="w-6 h-6" /></span>}
                      {curatorProfile.socials.instagram && <span className="text-white/70"><Instagram className="w-6 h-6" /></span>}
                      {curatorProfile.socials.youtube && <span className="text-white/70"><SiYoutube className="w-6 h-6" /></span>}
                      {curatorProfile.socials.tiktok && <span className="text-white/70"><SiTiktok className="w-6 h-6" /></span>}
                      {curatorProfile.socials.podcast && <span className="text-white/70"><Podcast className="w-6 h-6" /></span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                {curatorProfile.bio && (
                  <p className="text-base text-white/90 leading-relaxed" data-testid="text-curator-bio-preview">{curatorProfile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {tabOrder.some(key => (visibleTabs as any)[key]) && (
            <div className="relative z-10 px-5 md:px-8 pb-0">
              <div className="flex gap-1 overflow-x-auto" data-testid="preview-tabs">
                {tabOrder.filter(key => (visibleTabs as any)[key]).map((key) => {
                  const TAB_LABELS: Record<string, string> = {
                    kurationen: 'Kurationen',
                    buchbesprechung: 'Shownotes',
                    rezensionen: 'Rezensionen',
                    bewertungen: 'Bewertungen',
                    veranstaltungen: 'Veranstaltungen',
                    buchclub: 'Buchclub',
                    leseliste: 'Leseliste',
                  };
                  return (
                    <span
                      key={key}
                      className="px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg"
                      style={{
                        color: 'rgba(255,255,255,0.75)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      }}
                      data-testid={`preview-tab-${key}`}
                    >
                      {TAB_LABELS[key] || key}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>
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

      <div className="flex items-center justify-between pt-4 gap-4">
        <button
          onClick={() => {
            if (bookstoreProfile.isPublished) {
              setShowHideModal(true);
            } else {
              setBookstoreProfile(prev => ({ ...prev, isPublished: true }));
              handleSave({ isPublished: true });
            }
          }}
          data-testid="button-toggle-publish"
          className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-all duration-200 border"
          style={{
            borderColor: bookstoreProfile.isPublished ? '#FCA5A5' : '#86EFAC',
            backgroundColor: bookstoreProfile.isPublished ? '#FEF2F2' : '#F0FDF4',
            color: bookstoreProfile.isPublished ? '#991B1B' : '#166534',
          }}
        >
          {bookstoreProfile.isPublished ? (
            <><EyeOff className="w-4 h-4" />Profil verbergen</>
          ) : (
            <><Eye className="w-4 h-4" />Profil veröffentlichen</>
          )}
        </button>

        <button onClick={handleSave} disabled={saving} data-testid="button-save-public-profile"
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: saving ? '#9CA3AF' : '#247ba0', color: '#FFFFFF' }}>
          {saving ? (
            <><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#FFFFFF40', borderTopColor: '#FFFFFF' }} />Wird gespeichert...</>
          ) : (
            <><Save className="w-5 h-5" />Änderungen speichern</>
          )}
        </button>
      </div>

      {showHideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="modal-hide-profile">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowHideModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" style={{ zIndex: 51 }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEF2F2' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1F2937', fontFamily: 'Fjalla One' }}>
                  Profil verbergen?
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  Wenn du dein Profil verbirgst, werden auch alle deine öffentlichen Inhalte — Kurationen, Rezensionen, Bewertungen, Veranstaltungen und Buchclub-Beiträge — nicht mehr für andere sichtbar sein.
                </p>
                <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
                  Du kannst dein Profil jederzeit wieder veröffentlichen.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowHideModal(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                data-testid="button-cancel-hide"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setBookstoreProfile(prev => ({ ...prev, isPublished: false }));
                  setShowHideModal(false);
                  handleSave({ isPublished: false });
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: '#DC2626' }}
                data-testid="button-confirm-hide"
              >
                Profil verbergen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
