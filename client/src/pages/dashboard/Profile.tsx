import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Globe, Save, BookOpen, Mail, Phone, Lock, AlertTriangle, Star, MessageSquare, Heart, Image as ImageIcon } from 'lucide-react';

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
          lastName: lastName || prev.lastName
        }));
        setCuratorProfile({
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
      const resp = await fetch('/api/user/curator-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curatorId: curatorId || undefined,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          bio: curatorProfile.bio,
          focus: curatorProfile.focus,
          avatar_url: curatorProfile.avatarUrl,
          socials: curatorProfile.socials
        })
      });
      const json = await resp.json();
      if (json.ok) {
        if (json.data?.id && !curatorId) {
          const newId = String(json.data.id);
          setCuratorId(newId);
          localStorage.setItem(CURATOR_STORAGE_KEY, newId);
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
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Meine Daten
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Verwalte deine persönlichen Informationen und Einstellungen
        </p>
      </div>

      <section
        className="p-5 md:p-6"
        data-testid="hero-profile-card"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {curatorProfile.avatarUrl ? (
              <img
                src={curatorProfile.avatarUrl}
                alt="Avatar"
                className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2"
                style={{ borderColor: '#E5E7EB' }}
                data-testid="avatar-user-image"
              />
            ) : (
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                data-testid="avatar-user"
              >
                <User className="w-7 h-7 md:w-8 md:h-8" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-xl md:text-2xl mb-1"
              style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
              data-testid="text-username"
            >
              {displayName.toUpperCase()}
            </h2>
            {curatorProfile.focus && (
              <p className="text-sm mb-1" style={{ color: '#6B7280' }} data-testid="text-curator-focus">
                {curatorProfile.focus}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
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
            {curatorProfile.bio && (
              <p className="text-sm mb-3 line-clamp-2" style={{ color: '#4B5563' }} data-testid="text-curator-bio-preview">
                {curatorProfile.bio}
              </p>
            )}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs sm:text-sm" style={{ color: '#6B7280' }}>
                  Profil {progress}% vollständig
                </span>
                <span className="text-xs sm:text-sm font-medium" style={{ color: '#247ba0' }}>
                  {progress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #247ba0, #70c1b3)'
                  }}
                  data-testid="progress-bar"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          {quickStats.map((stat, index) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                data-testid={`stat-pill-${stat.label.toLowerCase()}`}
              >
                <StatIcon className="w-3.5 h-3.5" style={{ color: '#247ba0' }} />
                <span>{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div 
        className="p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#EEF2FF' }}>
            <User className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Persönliche Informationen
          </h2>
        </div>

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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#DBEAFE' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Kurator:in-Profil
          </h2>
        </div>

        <div className="space-y-4">
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
            <Globe className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Sprache & Region
          </h2>
        </div>

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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#DBEAFE' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Lieblingsgenres
          </h2>
        </div>

        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          Wähle deine bevorzugten Genres aus, um personalisierte Empfehlungen zu erhalten.
        </p>

        <div className="flex flex-wrap gap-2">
          {availableGenres.map((genre) => {
            const isSelected = preferredGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                data-testid={`button-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? '#247ba0' : '#F3F4F6',
                  color: isSelected ? '#FFFFFF' : '#3A3A3A',
                  border: `1px solid ${isSelected ? '#247ba0' : '#E5E7EB'}`
                }}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <p className="text-xs mt-4" style={{ color: '#9CA3AF' }}>
          {preferredGenres.length} Genre{preferredGenres.length !== 1 ? 's' : ''} ausgewählt
        </p>
      </div>

      <div 
        className="p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
              <Lock className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Passwort ändern
            </h2>
          </div>
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
