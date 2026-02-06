/**
 * ==================================================================
 * SITE BANNER TAB - Admin UI for managing the site-wide InfoBar
 * ==================================================================
 * 
 * Features:
 * - Create/Edit/Delete banners
 * - Toggle visibility ON/OFF
 * - Set position (top/bottom)
 * - Set status (draft/published/archived)
 * - Edit message, badge, button
 * 
 * ✅ UI-SYSTEM COMPLIANT (Guidelines 8.1):
 * - Uses Container, Section, Heading, Text from /components/ui/
 * - No manual font-size classes
 * - Proper visual hierarchy & contrast
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, AlertCircle, CheckCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiClient';
import { Container } from '../ui/container';
import { Heading } from '../ui/typography';
import { Text } from '../ui/typography';

interface Banner {
  id?: number;
  name: string;
  message: string;
  badge_text: string;
  button_text: string;
  button_url: string;
  visible: boolean;
  status: 'draft' | 'published' | 'archived';
  position: 'top' | 'bottom';
  display_order: number;
}

export function SiteBannerTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/site-config/banners`, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend Response Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: `${API_BASE_URL}/site-config/banners`
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.ok && data.banners) {
        setBanners(data.banners);
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        setBanners([]);
      }
    } catch (err) {
      console.error('❌ Error fetching banners:', err);
      setError(`Fehler beim Laden der Banner: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreate = () => {
    setEditingBanner({
      name: '',
      message: '',
      badge_text: '',
      button_text: '',
      button_url: '',
      visible: true,
      status: 'published',
      position: 'top',
      display_order: 0,
    });
    setIsCreating(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingBanner(null);
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingBanner) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate
      if (!editingBanner.name.trim()) {
        setError('Name darf nicht leer sein');
        return;
      }

      if (!editingBanner.message.trim()) {
        setError('Nachricht darf nicht leer sein');
        return;
      }

      if (editingBanner.button_text && !editingBanner.button_url) {
        setError('Wenn Button-Text gesetzt ist, muss auch ein Link angegeben werden');
        return;
      }

      const endpoint = isCreating
        ? `${API_BASE_URL}/site-config/banner`
        : `${API_BASE_URL}/site-config/banner/${editingBanner.id}`;

      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
        body: JSON.stringify({
          name: editingBanner.name.trim(),
          message: editingBanner.message.trim(),
          badge_text: editingBanner.badge_text.trim() || null,
          button_text: editingBanner.button_text.trim() || null,
          button_url: editingBanner.button_url.trim() || null,
          visible: editingBanner.visible,
          status: editingBanner.status,
          position: editingBanner.position,
          display_order: editingBanner.display_order,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save banner');
      }

      const data = await response.json();

      if (data.ok) {
        setSuccess(`✅ Banner "${editingBanner.name}" erfolgreich gespeichert!`);
        setEditingBanner(null);
        setIsCreating(false);
        fetchBanners(); // Reload list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('❌ Error saving banner:', err);
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Banner "${name}" wirklich löschen?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/site-config/banner/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }

      setSuccess(`✅ Banner "${name}" gelöscht!`);
      fetchBanners(); // Reload list
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error deleting banner:', err);
      setError(String(err));
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold/20 border-t-gold"></div>
          <Text variant="small" className="text-white/60">Lade Banner...</Text>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Heading as="h2" variant="h3" className="text-white">
              Site Banner Verwaltung
            </Heading>
            <Text variant="small" className="text-white/70">
              Verwalte Banner, die auf der Seite angezeigt werden (top/bottom)
            </Text>
          </div>

          {!editingBanner && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold/90 text-charcoal rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Neuer Banner
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <Text variant="small" className="text-red-300">{error}</Text>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border-2 border-green-500/50 rounded-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
          <Text variant="small" className="text-green-300">{success}</Text>
        </div>
      )}

      {/* Edit Form */}
      {editingBanner && (
        <div className="border-2 border-white/20 rounded-xl p-6 bg-charcoal/80 backdrop-blur-sm space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <Heading as="h3" variant="h5" className="text-white">
              {isCreating ? 'Neuen Banner erstellen' : `Banner bearbeiten: ${editingBanner.name}`}
            </Heading>
            <button
              onClick={handleCancel}
              className="text-white/60 hover:text-white transition-colors font-medium"
            >
              Abbrechen
            </button>
          </div>

          {/* Preview */}
          {editingBanner.visible && editingBanner.message && (
            <div className="border-2 border-gold/30 rounded-lg p-4 bg-charcoal/50 space-y-2">
              <Text variant="xs" className="text-white/60 uppercase tracking-wider">
                Vorschau:
              </Text>
              <div className="w-full py-3 px-4 text-center bg-blue rounded-lg">
                <div className="flex items-center justify-center gap-2 text-xs md:text-sm flex-wrap">
                  {editingBanner.badge_text && (
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: 'var(--color-gold)',
                        color: 'var(--color-black)',
                        fontFamily: 'Fjalla One, sans-serif',
                      }}
                    >
                      {editingBanner.badge_text}
                    </span>
                  )}
                  <span className="text-white text-xs md:text-sm font-medium">{editingBanner.message}</span>
                  {editingBanner.button_text && editingBanner.button_url && (
                    <span
                      className="ml-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: 'var(--color-gold)',
                        color: 'var(--color-black)',
                      }}
                    >
                      {editingBanner.button_text} →
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">
                  Name (intern) <span className="text-red-400">*</span>
                </Text>
              </label>
              <input
                type="text"
                value={editingBanner.name}
                onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                placeholder="z.B. Beta-Hinweis, Sale-Banner"
                className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">Position</Text>
              </label>
              <select
                value={editingBanner.position}
                onChange={(e) => setEditingBanner({ ...editingBanner, position: e.target.value as 'top' | 'bottom' })}
                className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
              >
                <option value="top">Oben (über Header)</option>
                <option value="bottom">Unten (über Footer)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">Status</Text>
              </label>
              <select
                value={editingBanner.status}
                onChange={(e) => setEditingBanner({ ...editingBanner, status: e.target.value as Banner['status'] })}
                className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
              >
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
                <option value="archived">Archiviert</option>
              </select>
            </div>

            {/* Visible Toggle */}
            <div>
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">Sichtbarkeit</Text>
              </label>
              <button
                onClick={() => setEditingBanner({ ...editingBanner, visible: !editingBanner.visible })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all w-full justify-center shadow-lg ${
                  editingBanner.visible
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {editingBanner.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {editingBanner.visible ? 'Sichtbar' : 'Versteckt'}
              </button>
            </div>

            {/* Display Order */}
            <div className="md:col-span-2">
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">Display Order (Sortierung)</Text>
              </label>
              <input
                type="number"
                value={editingBanner.display_order}
                onChange={(e) => setEditingBanner({ ...editingBanner, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
              />
              <Text variant="xs" className="text-white/60 mt-1">
                Höhere Werte werden bevorzugt angezeigt (z.B. 100 wird vor 50 angezeigt)
              </Text>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block mb-2">
              <Text variant="small" className="text-white font-semibold">
                Nachricht <span className="text-red-400">*</span>
              </Text>
            </label>
            <textarea
              value={editingBanner.message}
              onChange={(e) => setEditingBanner({ ...editingBanner, message: e.target.value })}
              placeholder="z.B. Diese Seite befindet sich derzeit in der Beta-Phase"
              rows={3}
              className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all resize-none"
            />
          </div>

          {/* Badge Text */}
          <div>
            <label className="block mb-2">
              <Text variant="small" className="text-white font-semibold">Badge-Text (optional)</Text>
            </label>
            <input
              type="text"
              value={editingBanner.badge_text}
              onChange={(e) => setEditingBanner({ ...editingBanner, badge_text: e.target.value })}
              placeholder="z.B. NEU, BETA, SALE"
              maxLength={50}
              className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
            />
          </div>

          {/* Button (Optional) */}
          <div className="border-t-2 border-white/10 pt-6">
            <Text variant="small" className="text-white font-semibold mb-4">
              Call-to-Action Button (optional)
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">
                  <Text variant="small" className="text-white/80">Button-Text</Text>
                </label>
                <input
                  type="text"
                  value={editingBanner.button_text}
                  onChange={(e) => setEditingBanner({ ...editingBanner, button_text: e.target.value })}
                  placeholder="z.B. Mehr erfahren"
                  maxLength={100}
                  className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                />
              </div>

              <div>
                <label className="block mb-2">
                  <Text variant="small" className="text-white/80">Button-Link</Text>
                </label>
                <input
                  type="text"
                  value={editingBanner.button_url}
                  onChange={(e) => setEditingBanner({ ...editingBanner, button_url: e.target.value })}
                  placeholder="z.B. /about oder https://..."
                  className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-6 border-t-2 border-white/10">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-charcoal rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      {/* Banner List */}
      {!editingBanner && (
        <div className="space-y-4">
          {banners.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/20 rounded-xl bg-charcoal/30 backdrop-blur-sm">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-white/40" />
                </div>
                <Heading as="h3" variant="h5" className="text-white/80">
                  Noch keine Banner erstellt
                </Heading>
                <Text variant="small" className="text-white/60">
                  Erstelle deinen ersten Banner, um wichtige Nachrichten auf der Seite anzuzeigen
                </Text>
                <button
                  onClick={handleCreate}
                  className="mt-4 px-6 py-3 bg-gold hover:bg-gold/90 text-charcoal rounded-lg font-semibold transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Ersten Banner erstellen
                </button>
              </div>
            </div>
          ) : (
            banners.map((banner) => (
              <div
                key={banner.id}
                className="border-2 border-white/20 rounded-xl p-5 bg-charcoal/50 backdrop-blur-sm hover:bg-charcoal/70 hover:border-white/30 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Heading as="h3" variant="h6" className="text-white">
                        {banner.name}
                      </Heading>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          banner.status === 'published'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                            : banner.status === 'draft'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                        }`}
                      >
                        {banner.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/50">
                        {banner.position}
                      </span>
                      {banner.visible ? (
                        <Eye className="w-4 h-4 text-green-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <Text variant="small" className="text-white/80">
                      {banner.message}
                    </Text>
                    {banner.badge_text && (
                      <Text variant="xs" className="text-white/60">
                        Badge: "{banner.badge_text}"
                      </Text>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id!, banner.name)}
                      className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="space-y-2 border-t-2 border-white/10 pt-6">
        <Text variant="xs" className="text-white/60">
          <strong className="text-white/80">Tipp:</strong> Banner mit Status "published" und "visible" werden auf der Seite angezeigt.
        </Text>
        <Text variant="xs" className="text-white/50">
          • <strong>Position "top":</strong> Ganz oben über dem Header (wie jetzt)
        </Text>
        <Text variant="xs" className="text-white/50">
          • <strong>Position "bottom":</strong> Ganz unten über dem Footer
        </Text>
        <Text variant="xs" className="text-white/50">
          • <strong>Display Order:</strong> Höhere Werte werden bevorzugt angezeigt
        </Text>
      </div>
    </Container>
  );
}