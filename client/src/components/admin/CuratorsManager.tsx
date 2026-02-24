import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Search, Upload, X, Check, Star, Users, BookOpen, BadgeCheck, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../config/apiClient';

interface Curator {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  focus: string;
  verified: boolean;
  follower_count: number;
  curation_count: number;
  book_count: number;
  socials: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    podcast?: string;
    website?: string;
  };
  created_at: string;
  updated_at: string;
}

export function CuratorsManager() {
  const [curators, setCurators] = useState<Curator[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCurator, setEditingCurator] = useState<Partial<Curator> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCurators();
  }, []);

  const getAdminHeaders = () => ({'Content-Type': 'application/json'
  });

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';
      const response = await fetch(`${API_BASE_URL}/admin/upload/avatar`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: formData,
      });

      const data = await response.json();
      if (data.ok && data.data?.url) {
        setEditingCurator(prev => prev ? { ...prev, avatar_url: data.data.url } : prev);
        toast.success('Avatar hochgeladen');
      } else {
        toast.error(data.error || 'Upload fehlgeschlagen');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const loadCurators = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/curators`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok && data.data) {
        // ✅ BACKEND RETURNS {ok: true, data: [...]}\n        // Map DB columns to frontend format with robust validation
        const mappedCurators = data.data
          .filter((c: any) => c && c.id && c.name)  // ✅ Filter out invalid items
          .map((c: any) => ({
            id: String(c.id),  // ✅ Ensure string ID
            name: c.name || '',
            slug: c.slug || '',
            bio: c.bio || '',
            avatar_url: c.avatar_url || c.avatar || '',
            focus: c.focus || '',
            verified: c.verified || c.visible || false,
            socials: {
              instagram: c.instagram || c.instagram_url || '',
              youtube: c.youtube || c.youtube_url || '',
              tiktok: c.tiktok || c.tiktok_url || '',
              podcast: c.podcast || '',
              website: c.website || c.website_url || ''
            },
            follower_count: Number(c.follower_count) || 0,
            book_count: Number(c.book_count) || 0,
            curation_count: Number(c.curation_count) || 0,
            created_at: c.created_at || c.createdAt || new Date().toISOString(),
            updated_at: c.updated_at || c.updatedAt || new Date().toISOString()
          }));
        setCurators(mappedCurators);
      } else {
        console.error('❌ API error:', data);
        toast.error('Fehler beim Laden der Kuratoren');
      }
    } catch (error) {
      console.error('❌ Error loading curators:', error);
      toast.error('Fehler beim Laden der Kuratoren');
    } finally {
      setLoading(false);
    }
  };

  const saveCurator = async () => {
    if (!editingCurator || !editingCurator.name) {
      toast.error('Bitte Name angeben');
      return;
    }

    try {
      // ✅ BACKEND EXPECTS avatar_url (not image_url!)
      const backendCurator = {
        id: editingCurator.id,
        name: editingCurator.name,
        slug: editingCurator.slug || editingCurator.name.toLowerCase().replace(/\s+/g, '-'),
        bio: editingCurator.bio || '',  // ✅ NEVER undefined: bio has NOT NULL constraint
        focus: editingCurator.focus || '',  // ✅ NEVER undefined
        avatar_url: editingCurator.avatar_url || '',
        website_url: editingCurator.socials?.website || '',
        instagram_url: editingCurator.socials?.instagram || '',
        tiktok_url: editingCurator.socials?.tiktok || '',
        youtube_url: editingCurator.socials?.youtube || '',
        visible: editingCurator.verified || false,
        display_order: (editingCurator as any).display_order || 0
      };
      
      const response = await fetch(`${API_BASE_URL}/curators`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify(backendCurator)
      });

      const data = await response.json();

      if (data.ok) {
        toast.success(editingCurator.id ? 'Kurator aktualisiert' : 'Kurator erstellt');
        setEditingCurator(null);
        loadCurators();
      } else {
        console.error('❌ API error:', data);
        toast.error(data.error?.message || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Error saving curator:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const deleteCurator = async (id: string) => {
    if (!confirm('Kurator wirklich löschen?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/curators/${id}`, {
            credentials: 'include',
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      const data = await response.json();
      
      if (data.ok) {
        toast.success('Kurator gelöscht');
        loadCurators();
      } else {
        toast.error(data.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting curator:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const filteredCurators = curators.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.focus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Kuratoren ({curators.length})
          </h2>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>
            Verwalte Creator-Profile und Kuratoren
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingCurator({
              name: '',
              slug: '',
              bio: '',
              avatar_url: '',
              focus: '',
              verified: false,
              socials: {}
            })}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
          >
            <Plus className="w-4 h-4" />
            Neuer Kurator
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Kuratoren durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>
      </div>

      {/* Curators Grid */}
      {loading ? (
        <div className="text-center py-8" style={{ color: '#666666' }}>
          Lade Kuratoren...
        </div>
      ) : filteredCurators.length === 0 ? (
        <div className="text-center py-12 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F7F4EF' }}>
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: '#666666' }} />
          <p style={{ color: '#666666' }}>
            {searchTerm ? 'Keine Kuratoren gefunden' : 'Noch keine Kuratoren vorhanden'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCurators.map((curator) => (
            <div
              key={curator.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              style={{ borderColor: '#E5E7EB' }}
            >
              {/* Avatar */}
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100">
                {curator.avatar_url ? (
                  <img
                    src={curator.avatar_url}
                    alt={curator.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-16 h-16" style={{ color: '#247ba0' }} />
                  </div>
                )}
                {curator.verified && (
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#70c1b3' }}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: '#3A3A3A' }}>
                      {curator.name}
                      {curator.verified && (
                        <BadgeCheck className="w-5 h-5" style={{ color: '#247ba0' }} />
                      )}
                    </h3>
                    {curator.focus && (
                      <p className="text-sm mt-1" style={{ color: '#666666' }}>
                        {curator.focus}
                      </p>
                    )}
                  </div>
                </div>

                {curator.bio && (
                  <p className="text-sm mt-2 line-clamp-2" style={{ color: '#666666' }}>
                    {curator.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" style={{ color: '#666666' }} />
                    <span className="text-sm" style={{ color: '#666666' }}>
                      {curator.follower_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" style={{ color: '#666666' }} />
                    <span className="text-sm" style={{ color: '#666666' }}>
                      {curator.book_count || 0}
                    </span>
                  </div>
                </div>

                {/* Socials */}
                {curator.socials && Object.values(curator.socials).some(v => v) && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {curator.socials.youtube && (
                      <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                        YouTube
                      </span>
                    )}
                    {curator.socials.podcast && (
                      <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                        Podcast
                      </span>
                    )}
                    {curator.socials.instagram && (
                      <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: '#FCE7F3', color: '#DB2777' }}>
                        Instagram
                      </span>
                    )}
                    {curator.socials.tiktok && (
                      <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: '#E0E7FF', color: '#4F46E5' }}>
                        TikTok
                      </span>
                    )}
                    {curator.socials.website && (
                      <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
                        Website
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setEditingCurator(curator)}
                    className="flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#F7F4EF', color: '#3A3A3A' }}
                  >
                    <Edit2 className="w-3 h-3" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteCurator(curator.id)}
                    className="px-3 py-2 rounded text-sm flex items-center gap-1"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingCurator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {editingCurator.id ? 'Kurator bearbeiten' : 'Neuer Kurator'}
                </h3>
                <button
                  onClick={() => setEditingCurator(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm mb-2 font-medium" style={{ color: '#3A3A3A' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingCurator.name || ''}
                    onChange={(e) => setEditingCurator({
                      ...editingCurator,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. Sarah Buchliebe"
                  />
                </div>

                {/* Slug (auto-generated) */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#666666' }}>
                    Slug (automatisch generiert)
                  </label>
                  <input
                    type="text"
                    value={editingCurator.slug || ''}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                    style={{ borderColor: '#E5E7EB', color: '#666666' }}
                  />
                </div>

                {/* Focus */}
                <div>
                  <label className="block text-sm mb-2 font-medium" style={{ color: '#3A3A3A' }}>
                    Fokus / Thema *
                  </label>
                  <input
                    type="text"
                    value={editingCurator.focus || ''}
                    onChange={(e) => setEditingCurator({ ...editingCurator, focus: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. Krimis & Thriller, Fantasy, Klassiker"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm mb-2 font-medium" style={{ color: '#3A3A3A' }}>
                    Biografie *
                  </label>
                  <textarea
                    value={editingCurator.bio || ''}
                    onChange={(e) => {
                      const words = countWords(e.target.value);
                      if (words <= 100 || e.target.value.length < (editingCurator.bio || '').length) {
                        setEditingCurator({ ...editingCurator, bio: e.target.value });
                      }
                    }}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: countWords(editingCurator.bio || '') >= 90 ? '#f25f5c' : '#E5E7EB' }}
                    placeholder="Kurze Beschreibung des Kurators (max. 100 Wörter)..."
                  />
                  <div className="flex justify-end mt-1">
                    <span
                      className="text-xs"
                      style={{ color: countWords(editingCurator.bio || '') > 100 ? '#f25f5c' : '#666666' }}
                    >
                      {countWords(editingCurator.bio || '')} / 100 Wörter
                    </span>
                  </div>
                </div>

                {/* Avatar */}
                <div>
                  <label className="block text-sm mb-2 font-medium" style={{ color: '#3A3A3A' }}>
                    Avatar
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {editingCurator.avatar_url ? (
                        <img
                          src={editingCurator.avatar_url}
                          alt="Avatar"
                          className="w-24 h-24 rounded-full object-cover border-2"
                          style={{ borderColor: '#E5E7EB' }}
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed"
                          style={{ borderColor: '#9CA3AF', backgroundColor: '#F7F4EF' }}
                        >
                          <Users className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadAvatar(file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full px-4 py-2 border rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ borderColor: '#E5E7EB', color: '#3A3A3A' }}
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
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
                        value={editingCurator.avatar_url || ''}
                        onChange={(e) => setEditingCurator({ ...editingCurator, avatar_url: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                        placeholder="oder URL eingeben: https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Verified */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCurator.verified || false}
                      onChange={(e) => setEditingCurator({ ...editingCurator, verified: e.target.checked })}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
                      Verifizierter Kurator
                    </span>
                    <BadgeCheck className="w-5 h-5" style={{ color: editingCurator.verified ? '#247ba0' : '#9CA3AF' }} />
                  </label>
                  <p className="text-xs mt-1 ml-6" style={{ color: '#666666' }}>
                    Zeigt einen blauen Haken neben dem Kurator-Namen im Frontend
                  </p>
                </div>

                {/* Socials */}
                <div>
                  <label className="block text-sm mb-3 font-medium" style={{ color: '#3A3A3A' }}>
                    Social Media Präsenzen
                  </label>
                  <div className="space-y-3">
                    {/* Instagram */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#666666' }}>
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={editingCurator.socials?.instagram || ''}
                        onChange={(e) => setEditingCurator({
                          ...editingCurator,
                          socials: { ...editingCurator.socials, instagram: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                        placeholder="@username oder https://instagram.com/username"
                      />
                    </div>

                    {/* YouTube */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#666666' }}>
                        YouTube
                      </label>
                      <input
                        type="text"
                        value={editingCurator.socials?.youtube || ''}
                        onChange={(e) => setEditingCurator({
                          ...editingCurator,
                          socials: { ...editingCurator.socials, youtube: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                        placeholder="@channel oder https://youtube.com/@channel"
                      />
                    </div>

                    {/* TikTok */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#666666' }}>
                        TikTok
                      </label>
                      <input
                        type="text"
                        value={editingCurator.socials?.tiktok || ''}
                        onChange={(e) => setEditingCurator({
                          ...editingCurator,
                          socials: { ...editingCurator.socials, tiktok: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                        placeholder="@username oder https://tiktok.com/@username"
                      />
                    </div>

                    {/* Podcast */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#666666' }}>
                        Podcast
                      </label>
                      <input
                        type="text"
                        value={editingCurator.socials?.podcast || ''}
                        onChange={(e) => setEditingCurator({
                          ...editingCurator,
                          socials: { ...editingCurator.socials, podcast: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                        placeholder="Podcast Name oder URL"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#666666' }}>
                        Website
                      </label>
                      <input
                        type="text"
                        value={editingCurator.socials?.website || ''}
                        onChange={(e) => setEditingCurator({
                          ...editingCurator,
                          socials: { ...editingCurator.socials, website: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                <button
                  onClick={saveCurator}
                  className="flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                >
                  <Check className="w-4 h-4" />
                  Speichern
                </button>
                <button
                  onClick={() => setEditingCurator(null)}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F7F4EF', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}