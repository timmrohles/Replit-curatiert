import { useState, useEffect } from 'react';
import { Plus, Save, Edit2, Trash2, Award as AwardIcon, Upload, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { Award, AwardType, getAllAwards, saveAward, deleteAward, uploadAwardLogo, clearAwardsCache, getAllONIXTags, ONIXTag } from '../../utils/api';
import { toast } from 'sonner';

// Helper: Get icon for award type
function getAwardTypeIcon(type: AwardType): string {
  switch (type) {
    case 'Gewinner':
      return '🏆';
    case 'Shortlist':
      return '🥈';
    case 'Longlist':
      return '🥉';
    case 'Nominierung':
      return '🎖️';
    default:
      return '🏅';
  }
}

// Helper: Get color for award type
function getAwardTypeColor(type: AwardType): string {
  switch (type) {
    case 'Gewinner':
      return '#FFD700'; // Gold
    case 'Shortlist':
      return '#C0C0C0'; // Silver
    case 'Longlist':
      return '#CD7F32'; // Bronze
    case 'Nominierung':
      return '#9C27B0'; // Purple
    default:
      return '#70c1b3'; // Teal
  }
}

export function AwardsManager() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAward, setEditingAward] = useState<Partial<Award> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AwardType | 'all'>('all');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const [awardsData, tagsData] = await Promise.all([
        getAllAwards(),
        getAllONIXTags()
      ]);
      setAwards(awardsData);
      setOnixTags(tagsData);
    } catch (error) {
      console.error('Error loading awards and ONIX tags:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Fehler beim Laden: ${errorMessage}`);
      setAwards([]);
      setOnixTags([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editingAward?.name || !editingAward?.type || !editingAward?.logoUrl) {
      toast.error('Bitte Name, Typ und Logo angeben');
      return;
    }

    const award: Partial<Award> = {
      ...editingAward,
      id: editingAward.id || `award-${Date.now()}`,
      onixTagIds: editingAward.onixTagIds || [],
      visible: editingAward.visible ?? true,
      order: editingAward.order ?? awards.length,
      createdAt: editingAward.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveAward(award);
    if (saved) {
      toast.success('Auszeichnung gespeichert');
      setEditingAward(null);
      loadData();
    } else {
      toast.error('Fehler beim Speichern');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Auszeichnung wirklich löschen?')) return;

    const success = await deleteAward(id);
    if (success) {
      toast.success('Auszeichnung gelöscht');
      loadData();
    } else {
      toast.error('Fehler beim Löschen');
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte ein Bild auswählen');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bild zu groß (max 2MB)');
      return;
    }

    setUploadingLogo(true);
    const url = await uploadAwardLogo(file);
    setUploadingLogo(false);

    if (url) {
      setEditingAward({ ...editingAward, logoUrl: url });
      toast.success('Logo hochgeladen');
    } else {
      toast.error('Fehler beim Upload');
    }
  }

  // Filter awards
  const filteredAwards = awards
    .filter(award => 
      (filterType === 'all' || award.type === filterType) &&
      (searchQuery === '' || 
        award.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => a.order - b.order);

  // Get ONIX Tags of type "Auszeichnung" for linking
  const auszeichnungTags = onixTags.filter(tag => tag.type === 'Auszeichnung' && tag.visible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Auszeichnungen ({awards.length})
          </h2>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>
            Verwalte Buchpreise und Nominierungen mit Logos und ONIX-Tag-Verknüpfung
          </p>
        </div>
        <button
          onClick={() => setEditingAward({ 
            visible: true, 
            order: awards.length,
            onixTagIds: []
          })}
          className="px-4 py-2 rounded-lg flex items-center gap-2"
          style={{ 
            backgroundColor: '#ff6f59', 
            color: 'white',
            fontFamily: 'Inter'
          }}
        >
          <Plus className="w-4 h-4" />
          Neue Auszeichnung
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Suche nach Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border"
          style={{ 
            borderColor: '#e0e0e0',
            fontFamily: 'Inter'
          }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AwardType | 'all')}
          className="px-4 py-2 rounded-lg border"
          style={{ 
            borderColor: '#e0e0e0',
            fontFamily: 'Inter'
          }}
        >
          <option value="all">Alle Typen</option>
          <option value="Gewinner">Gewinner 🏆</option>
          <option value="Shortlist">Shortlist 🥈</option>
          <option value="Longlist">Longlist 🥉</option>
          <option value="Nominierung">Nominierung 🎖️</option>
        </select>
      </div>

      {/* Awards List */}
      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: '#666666' }}>Lade Auszeichnungen...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">⚠️ Fehler beim Laden</p>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#ff6f59', color: 'white', fontFamily: 'Inter' }}
          >
            Erneut versuchen
          </button>
        </div>
      ) : filteredAwards.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-lg border border-dashed" style={{ borderColor: '#e0e0e0' }}>
          <AwardIcon className="w-12 h-12 mx-auto mb-4" style={{ color: '#cccccc' }} />
          <p style={{ color: '#666666', fontSize: '1.125rem' }}>
            {searchQuery || filterType !== 'all' 
              ? 'Keine Auszeichnungen gefunden' 
              : 'Noch keine Auszeichnungen angelegt'}
          </p>
          <p className="text-sm mt-2" style={{ color: '#999999' }}>
            Erstelle deine erste Auszeichnung mit Logo und ONIX-Tag-Verknüpfung
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAwards.map((award) => {
            const linkedTags = onixTags.filter(tag => award.onixTagIds.includes(tag.id));
            
            return (
              <div
                key={award.id}
                className="bg-white/80 rounded-lg border p-4 flex items-center gap-4"
                style={{ borderColor: '#e0e0e0' }}
              >
                {/* Logo */}
                <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center overflow-hidden border" style={{ borderColor: '#e0e0e0' }}>
                  {award.logoUrl ? (
                    <img src={award.logoUrl} alt={award.name} className="w-full h-full object-contain" />
                  ) : (
                    <AwardIcon className="w-8 h-8" style={{ color: '#cccccc' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getAwardTypeIcon(award.type)}</span>
                    <h3 className="font-semibold" style={{ fontFamily: 'Inter', color: '#3A3A3A' }}>
                      {award.name}
                    </h3>
                    {!award.visible && (
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#f0f0f0', color: '#666666' }}>
                        Versteckt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span 
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: getAwardTypeColor(award.type) + '20',
                        color: getAwardTypeColor(award.type)
                      }}
                    >
                      {award.type}
                    </span>
                    {linkedTags.length > 0 && (
                      <span className="text-xs" style={{ color: '#666666' }}>
                        🏷️ {linkedTags.length} ONIX-Tag{linkedTags.length > 1 ? 's' : ''}: {linkedTags.map(t => t.displayName).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAward(award)}
                    className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" style={{ color: '#247ba0' }} />
                  </button>
                  <button
                    onClick={() => handleDelete(award.id)}
                    className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#ff6f59' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingAward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              {editingAward.id ? 'Auszeichnung bearbeiten' : 'Neue Auszeichnung'}
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666666', fontFamily: 'Inter' }}>
                  Name der Auszeichnung *
                </label>
                <input
                  type="text"
                  value={editingAward.name || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, name: e.target.value })}
                  placeholder="z.B. Deutscher Buchpreis"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#e0e0e0', fontFamily: 'Inter' }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666666', fontFamily: 'Inter' }}>
                  Typ *
                </label>
                <select
                  value={editingAward.type || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, type: e.target.value as AwardType })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#e0e0e0', fontFamily: 'Inter' }}
                >
                  <option value="">Typ wählen...</option>
                  <option value="Gewinner">🏆 Gewinner</option>
                  <option value="Shortlist">🥈 Shortlist</option>
                  <option value="Longlist">🥉 Longlist</option>
                  <option value="Nominierung">🎖️ Nominierung</option>
                </select>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666666', fontFamily: 'Inter' }}>
                  Logo * (max 2MB)
                </label>
                <div className="flex gap-4 items-start">
                  {editingAward.logoUrl && (
                    <div className="w-24 h-24 rounded-lg bg-white border flex items-center justify-center overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
                      <img src={editingAward.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#e0e0e0' }}>
                      {uploadingLogo ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#247ba0' }} />
                          <span style={{ fontFamily: 'Inter', color: '#666666' }}>Lädt...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" style={{ color: '#247ba0' }} />
                          <span style={{ fontFamily: 'Inter', color: '#247ba0' }}>
                            {editingAward.logoUrl ? 'Neues Logo hochladen' : 'Logo hochladen'}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                    <p className="text-xs mt-1" style={{ color: '#999999' }}>
                      PNG, JPG oder SVG empfohlen. Quadratisches Format für beste Darstellung.
                    </p>
                  </div>
                </div>
              </div>

              {/* ONIX Tags */}
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666666', fontFamily: 'Inter' }}>
                  Verknüpfte ONIX-Tags (Auszeichnung)
                </label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto" style={{ borderColor: '#e0e0e0' }}>
                  {auszeichnungTags.length === 0 ? (
                    <p className="text-sm" style={{ color: '#999999' }}>
                      Keine Auszeichnungs-Tags verfügbar. Erstelle zuerst Tags vom Typ "Auszeichnung" im ONIX-Tag-Manager.
                    </p>
                  ) : (
                    auszeichnungTags.map(tag => (
                      <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingAward.onixTagIds?.includes(tag.id) || false}
                          onChange={(e) => {
                            const tagIds = editingAward.onixTagIds || [];
                            setEditingAward({
                              ...editingAward,
                              onixTagIds: e.target.checked
                                ? [...tagIds, tag.id]
                                : tagIds.filter(id => id !== tag.id)
                            });
                          }}
                          className="rounded"
                        />
                        <span className="text-sm" style={{ fontFamily: 'Inter', color: '#3A3A3A' }}>
                          {tag.displayName}
                          {tag.onixCode && (
                            <span style={{ color: '#999999' }}> ({tag.onixCode})</span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: '#999999' }}>
                  Bücher mit diesen ONIX-Tags erhalten diese Auszeichnung automatisch.
                </p>
              </div>

              {/* Visibility & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAward.visible ?? true}
                      onChange={(e) => setEditingAward({ ...editingAward, visible: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ fontFamily: 'Inter', color: '#3A3A3A' }}>
                      Sichtbar
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#666666', fontFamily: 'Inter' }}>
                    Reihenfolge
                  </label>
                  <input
                    type="number"
                    value={editingAward.order ?? 0}
                    onChange={(e) => setEditingAward({ ...editingAward, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#e0e0e0', fontFamily: 'Inter' }}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#247ba0', color: 'white', fontFamily: 'Inter' }}
              >
                Speichern
              </button>
              <button
                onClick={() => setEditingAward(null)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#f0f0f0', color: '#666666', fontFamily: 'Inter' }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}