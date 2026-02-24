import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Save, ExternalLink, Globe, Instagram, Podcast, Check, Plus, Search, X, Store, GripVertical, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserBookstore } from './UserBookstore';
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
  const DEFAULT_TAB_ORDER = ['kurationen', 'buchbesprechung', 'rezensionen', 'bewertungen', 'veranstaltungen', 'buchclub'];
  const [visibleTabs, setVisibleTabs] = useState({
    kurationen: true,
    buchbesprechung: true,
    rezensionen: true,
    bewertungen: true,
    veranstaltungen: true,
    buchclub: false,
  });
  const [tabOrder, setTabOrder] = useState<string[]>(DEFAULT_TAB_ORDER);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

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
    } catch (err) {
      console.error('Failed to load curator profile:', err);
    } finally {
      setLoading(false);
    }
  }, [curatorId]);

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
        setSaveMessage({ type: 'success', text: 'Öffentliches Profil erfolgreich gespeichert!' });
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

      <section className="p-5 md:p-6" data-testid="hero-profile-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div className="flex items-center gap-5 md:gap-6">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden ring-2 ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]" style={{ '--tw-ring-color': '#247ba0' } as React.CSSProperties}>
                {curatorProfile.avatarUrl ? (
                  <img src={curatorProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" data-testid="avatar-user-image" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)' }} data-testid="avatar-user">
                    <span className="text-4xl md:text-5xl" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}>
                      {displayName.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }} data-testid="text-username">
                {curatorProfile.publicName || displayName}
              </h2>
              {curatorProfile.focus && (
                <p className="text-sm font-semibold mb-1" style={{ color: '#6B7280' }} data-testid="text-curator-focus">{curatorProfile.focus}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                {roles.map((role, index) => (
                  <span key={index} className="px-2.5 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: '#247ba0' }} data-testid={`badge-role-${index}`}>
                    {role}
                  </span>
                ))}
              </div>
              {(curatorProfile.socials.website || curatorProfile.socials.instagram || curatorProfile.socials.youtube || curatorProfile.socials.tiktok || curatorProfile.socials.podcast) && (
                <div className="flex items-center gap-3 flex-wrap mt-2" data-testid="social-links-preview">
                  {curatorProfile.socials.website && <span className="text-gray-400"><Globe className="w-5 h-5" /></span>}
                  {curatorProfile.socials.instagram && <span className="text-gray-400"><Instagram className="w-5 h-5" /></span>}
                  {curatorProfile.socials.youtube && <span className="text-gray-400"><SiYoutube className="w-5 h-5" /></span>}
                  {curatorProfile.socials.tiktok && <span className="text-gray-400"><SiTiktok className="w-5 h-5" /></span>}
                  {curatorProfile.socials.podcast && <span className="text-gray-400"><Podcast className="w-5 h-5" /></span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            {curatorProfile.bio && (
              <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }} data-testid="text-curator-bio-preview">{curatorProfile.bio}</p>
            )}
          </div>
        </div>
        {bookstoreSlug && (
          <div className="mt-4 pt-4 border-t flex justify-center" style={{ borderColor: '#E5E7EB' }}>
            <a href={`/${bookstoreSlug}`} data-testid="button-open-profile" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all" style={{ backgroundColor: '#247ba0', color: '#ffffff' }}>
              <ExternalLink className="w-4 h-4" />
              Öffentliches Profil ansehen
            </a>
          </div>
        )}
      </section>

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
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)' }}>
            <Store className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#1F2937' }}>
              Mein Bookstore
            </h2>
            <p className="text-xs" style={{ color: '#6B7280' }}>Dein öffentlicher Bookstore & Einstellungen</p>
          </div>
        </div>
        <UserBookstore />
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
    </div>
  );
}
