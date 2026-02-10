import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, AlertCircle, CheckCircle, Plus, Edit2, Trash2, Palette } from 'lucide-react';
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
  bg_color: string;
  text_color: string;
  badge_bg_color: string;
  badge_text_color: string;
  visible: boolean;
  status: 'draft' | 'published' | 'archived';
  position: 'top' | 'bottom';
  display_order: number;
}

const COLOR_PRESETS = [
  { name: 'Blue Cerulean', bg: '#247ba0', text: '#ffffff' },
  { name: 'Coral', bg: '#f25f5c', text: '#ffffff' },
  { name: 'Teal', bg: '#70c1b3', text: '#2a2a2a' },
  { name: 'Saffron', bg: '#f4a261', text: '#2a2a2a' },
  { name: 'Gold', bg: '#ffe066', text: '#2a2a2a' },
  { name: 'Charcoal', bg: '#2a2a2a', text: '#ffffff' },
];

function getAdminToken(): string {
  return localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';
}

export function SiteBannerTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/site-config/banners`, {
        headers: {
          'X-Admin-Token': getAdminToken(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.ok && data.banners) {
        setBanners(data.banners);
      } else {
        setBanners([]);
      }
    } catch (err) {
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
      bg_color: '#247ba0',
      text_color: '#ffffff',
      badge_bg_color: '#ffe066',
      badge_text_color: '#2a2a2a',
      visible: true,
      status: 'published',
      position: 'top',
      display_order: 0,
    });
    setIsCreating(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner({
      ...banner,
      bg_color: banner.bg_color || '#247ba0',
      text_color: banner.text_color || '#ffffff',
      badge_bg_color: banner.badge_bg_color || '#ffe066',
      badge_text_color: banner.badge_text_color || '#2a2a2a',
    });
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
          'X-Admin-Token': getAdminToken(),
        },
        body: JSON.stringify({
          name: editingBanner.name.trim(),
          message: editingBanner.message.trim(),
          badge_text: editingBanner.badge_text.trim() || null,
          button_text: editingBanner.button_text.trim() || null,
          button_url: editingBanner.button_url.trim() || null,
          bg_color: editingBanner.bg_color,
          text_color: editingBanner.text_color,
          badge_bg_color: editingBanner.badge_bg_color,
          badge_text_color: editingBanner.badge_text_color,
          visible: editingBanner.visible,
          status: editingBanner.status,
          position: editingBanner.position,
          display_order: editingBanner.display_order,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Speichern fehlgeschlagen');
      }

      const data = await response.json();

      if (data.ok) {
        setSuccess(`Banner "${editingBanner.name}" erfolgreich gespeichert!`);
        setEditingBanner(null);
        setIsCreating(false);
        fetchBanners();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
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
          'X-Admin-Token': getAdminToken(),
        },
      });

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen');
      }

      setSuccess(`Banner "${name}" gelöscht!`);
      fetchBanners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleToggleVisibility = async (banner: Banner) => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-config/banner/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': getAdminToken(),
        },
        body: JSON.stringify({
          ...banner,
          visible: !banner.visible,
        }),
      });

      if (!response.ok) {
        throw new Error('Sichtbarkeit konnte nicht geändert werden');
      }

      setSuccess(`Banner "${banner.name}" ${!banner.visible ? 'sichtbar' : 'versteckt'}!`);
      fetchBanners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
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
              data-testid="button-create-banner"
            >
              <Plus className="w-4 h-4" />
              Neuer Banner
            </button>
          )}
        </div>
      </div>

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

          {editingBanner.message && (
            <div className="border-2 border-gold/30 rounded-lg p-4 bg-charcoal/50 space-y-2">
              <Text variant="xs" className="text-white/60 uppercase tracking-wider">
                Vorschau:
              </Text>
              <div
                className="w-full py-3 px-4 text-center rounded-lg"
                style={{ backgroundColor: editingBanner.bg_color }}
              >
                <div className="flex items-center justify-center gap-2 text-xs md:text-sm flex-wrap">
                  {editingBanner.badge_text && (
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: editingBanner.badge_bg_color,
                        color: editingBanner.badge_text_color,
                        fontFamily: 'Fjalla One, sans-serif',
                      }}
                    >
                      {editingBanner.badge_text}
                    </span>
                  )}
                  <span
                    className="text-xs md:text-sm font-medium"
                    style={{ color: editingBanner.text_color }}
                  >
                    {editingBanner.message}
                  </span>
                  {editingBanner.button_text && editingBanner.button_url && (
                    <span
                      className="ml-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: editingBanner.badge_bg_color,
                        color: editingBanner.badge_text_color,
                      }}
                    >
                      {editingBanner.button_text} →
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                data-testid="input-banner-name"
              />
            </div>

            <div>
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">Position</Text>
              </label>
              <select
                value={editingBanner.position}
                onChange={(e) => setEditingBanner({ ...editingBanner, position: e.target.value as 'top' | 'bottom' })}
                className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                data-testid="select-banner-position"
              >
                <option value="top">Oben (über Header)</option>
                <option value="bottom">Unten (über Footer)</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">Status</Text>
              </label>
              <select
                value={editingBanner.status}
                onChange={(e) => setEditingBanner({ ...editingBanner, status: e.target.value as Banner['status'] })}
                className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                data-testid="select-banner-status"
              >
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
                <option value="archived">Archiviert</option>
              </select>
            </div>

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
                data-testid="button-toggle-visibility"
              >
                {editingBanner.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {editingBanner.visible ? 'Sichtbar' : 'Versteckt'}
              </button>
            </div>
          </div>

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
              data-testid="input-banner-message"
            />
          </div>

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
              data-testid="input-banner-badge"
            />
          </div>

          <div className="border-t-2 border-white/10 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-gold" />
              <Text variant="small" className="text-white font-semibold">
                Farben
              </Text>
            </div>

            <div className="mb-4">
              <Text variant="xs" className="text-white/60 mb-2 block">Schnellauswahl:</Text>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setEditingBanner({
                      ...editingBanner,
                      bg_color: preset.bg,
                      text_color: preset.text,
                    })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-all"
                    title={preset.name}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/30"
                      style={{ backgroundColor: preset.bg }}
                    />
                    <Text variant="xs" className="text-white/80">{preset.name}</Text>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2">
                  <Text variant="xs" className="text-white/80">Hintergrund</Text>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingBanner.bg_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, bg_color: e.target.value })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                    data-testid="input-banner-bg-color"
                  />
                  <input
                    type="text"
                    value={editingBanner.bg_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, bg_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <Text variant="xs" className="text-white/80">Textfarbe</Text>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingBanner.text_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                    data-testid="input-banner-text-color"
                  />
                  <input
                    type="text"
                    value={editingBanner.text_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <Text variant="xs" className="text-white/80">Badge Hintergrund</Text>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingBanner.badge_bg_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge_bg_color: e.target.value })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                    data-testid="input-banner-badge-bg-color"
                  />
                  <input
                    type="text"
                    value={editingBanner.badge_bg_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge_bg_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <Text variant="xs" className="text-white/80">Badge Textfarbe</Text>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingBanner.badge_text_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge_text_color: e.target.value })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                    data-testid="input-banner-badge-text-color"
                  />
                  <input
                    type="text"
                    value={editingBanner.badge_text_color}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge_text_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
            </div>
          </div>

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
                  data-testid="input-banner-button-text"
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
                  data-testid="input-banner-button-url"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-white/10 pt-6">
            <div>
              <label className="block mb-2">
                <Text variant="small" className="text-white font-semibold">Display Order (Sortierung)</Text>
              </label>
              <input
                type="number"
                value={editingBanner.display_order}
                onChange={(e) => setEditingBanner({ ...editingBanner, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                data-testid="input-banner-order"
              />
              <Text variant="xs" className="text-white/60 mt-1">
                Höhere Werte werden bevorzugt angezeigt
              </Text>
            </div>
          </div>

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
              data-testid="button-save-banner"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

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
                  data-testid="button-create-first-banner"
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
                data-testid={`banner-item-${banner.id}`}
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
                        {banner.status === 'published' ? 'Veröffentlicht' : banner.status === 'draft' ? 'Entwurf' : 'Archiviert'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/50">
                        {banner.position === 'top' ? 'Oben' : 'Unten'}
                      </span>
                    </div>

                    <div
                      className="w-full py-2 px-3 text-center rounded-lg text-xs"
                      style={{ backgroundColor: banner.bg_color || '#247ba0' }}
                    >
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {banner.badge_text && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: banner.badge_bg_color || '#ffe066',
                              color: banner.badge_text_color || '#2a2a2a',
                            }}
                          >
                            {banner.badge_text}
                          </span>
                        )}
                        <span style={{ color: banner.text_color || '#ffffff' }}>
                          {banner.message}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(banner)}
                      className={`p-2.5 rounded-lg transition-all shadow-md hover:shadow-lg ${
                        banner.visible
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                      title={banner.visible ? 'Verstecken' : 'Sichtbar machen'}
                      data-testid={`button-toggle-${banner.id}`}
                    >
                      {banner.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                      title="Bearbeiten"
                      data-testid={`button-edit-${banner.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id!, banner.name)}
                      className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                      title="Löschen"
                      data-testid={`button-delete-${banner.id}`}
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
    </Container>
  );
}
