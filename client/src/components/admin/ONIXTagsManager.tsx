import { useState, useEffect } from 'react';
import { Plus, Save, Edit2, Trash2, Tag as TagIcon, Search, Database, Eye, EyeOff, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { ONIXTag, ONIXTagType, ONIXTagVisibilityLevel, getAllONIXTags, saveONIXTag, deleteONIXTag } from '../../utils/api';
import { BulkTagEditor } from './BulkTagEditor';

// Helper: Generate slug from tag name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, c => ({'ä':'ae','ö':'oe','ü':'ue','ß':'ss'}[c] || c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper: Get color for tag type
function getTypeColor(type: ONIXTagType): string {
  switch (type) {
    case 'Gattung':
      return '#f25f5c'; // Coral
    case 'Genre (THEMA)':
      return '#247ba0'; // Blue
    case 'Motiv (MVB)':
      return '#ffe066'; // Gold
    case 'Auszeichnung':
      return '#FFD700'; // Gold (Preise)
    case 'Medienecho':
      return '#9C27B0'; // Purple (Medien)
    case 'Stil-Veredelung':
      return '#FF5722'; // Deep Orange (Stilistik)
    case 'Herkunft':
      return '#70c1b3'; // Teal (Übersetzungen)
    case 'Ausstattung':
      return '#9B59B6'; // Purple (Schöne Bücher)
    case 'Schauplatz':
      return '#E67E22'; // Orange (Orte)
    case 'Zeitgeist':
      return '#E91E63'; // Pink (Epochen)
    case 'Zielgruppe':
      return '#2ECC71'; // Green (Audience)
    default:
      return '#70c1b3'; // Teal
  }
}

// Helper: Get icon for tag type
function getTypeIcon(type: ONIXTagType): string {
  switch (type) {
    case 'Gattung':
      return '📚';
    case 'Genre (THEMA)':
      return '🎭';
    case 'Motiv (MVB)':
      return '💫';
    case 'Auszeichnung':
      return '🏆';
    case 'Medienecho':
      return '📺';
    case 'Stil-Veredelung':
      return '✍️';
    case 'Herkunft':
      return '🌍';
    case 'Ausstattung':
      return '✨';
    case 'Schauplatz':
      return '📍';
    case 'Zeitgeist':
      return '🕰️';
    case 'Zielgruppe':
      return '👥';
    default:
      return '🏷️';
  }
}

// Helper: Get visibility level description
function getVisibilityDescription(level: ONIXTagVisibilityLevel): string {
  switch (level) {
    case 'prominent':
      return 'Immer sichtbar am Buch';
    case 'filter':
      return 'In Filtern/Seitenleiste';
    case 'internal':
      return 'Nur Backend/SEO';
    default:
      return '';
  }
}

export function ONIXTagsManager() {
  const [tags, setTags] = useState<ONIXTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Partial<ONIXTag> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ONIXTagType | 'all'>('all');
  const [filterVisibility, setFilterVisibility] = useState<ONIXTagVisibilityLevel | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'tags' | 'bulk'>('tags'); // NEW: Tab state

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    const data = await getAllONIXTags();
    setTags(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!editingTag) return;

    if (!editingTag.type || !editingTag.onixCode || !editingTag.originalName || !editingTag.displayName || !editingTag.visibilityLevel) {
      alert('Bitte alle Pflichtfelder ausfüllen!');
      return;
    }

    const saved = await saveONIXTag(editingTag);
    if (saved) {
      await loadTags();
      setEditingTag(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tag wirklich löschen?')) return;
    
    const success = await deleteONIXTag(id);
    if (success) {
      await loadTags();
    }
  }

  async function toggleVisibility(tag: ONIXTag) {
    const updated = await saveONIXTag({ ...tag, visible: !tag.visible });
    if (updated) {
      await loadTags();
    }
  }

  async function seedDemoTags() {
    if (!confirm('Demo-Tags erstellen? (Bestehende Tags bleiben erhalten)')) return;

    const demoTags: Partial<ONIXTag>[] = [
      // === PROMINENT TAGS (Immer sichtbar am Buch) ===
      
      // Auszeichnungen
      { type: 'Auszeichnung', onixCode: 'Prize 01', originalName: 'Preisträger', displayName: '🏆 Buchpreis Gewinner', silo: 'Ausgezeichnet', visibilityLevel: 'prominent', visible: true },
      { type: 'Auszeichnung', onixCode: 'Prize 02', originalName: 'Shortlist', displayName: '🏆 Shortlist Buchpreis 2025', silo: 'Ausgezeichnet', visibilityLevel: 'prominent', visible: true },
      
      // Lesemotive (Prominent)
      { type: 'Motiv (MVB)', onixCode: '14', originalName: 'Verstehen', displayName: 'Intellektuelle Tiefe', silo: 'Leseerlebnis', visibilityLevel: 'prominent', visible: true },
      { type: 'Motiv (MVB)', onixCode: '11', originalName: 'Nervenkitzel', displayName: 'Adrenalin & Puls', silo: 'Leseerlebnis', visibilityLevel: 'prominent', visible: true },
      { type: 'Motiv (MVB)', onixCode: '15', originalName: 'Mitfühlen', displayName: 'Emotionale Wucht', silo: 'Leseerlebnis', visibilityLevel: 'prominent', visible: true },
      
      // Medienecho
      { type: 'Medienecho', onixCode: 'MEDIA-01', originalName: 'Literarisches Quartett', displayName: '📺 Im Literarischen Quartett', silo: 'In den Medien', visibilityLevel: 'prominent', visible: true },
      { type: 'Medienecho', onixCode: 'MEDIA-02', originalName: 'Zeit Bestseller', displayName: '📰 Zeit Bestseller', silo: 'In den Medien', visibilityLevel: 'prominent', visible: true },
      
      // Stil-Veredelung
      { type: 'Stil-Veredelung', onixCode: 'STYLE-01', originalName: 'Sprachgewaltig', displayName: 'Sprachgewaltig', silo: 'Stilistik', visibilityLevel: 'prominent', visible: true },
      { type: 'Stil-Veredelung', onixCode: 'STYLE-02', originalName: 'Zynisch', displayName: 'Zynisch & Bissig', silo: 'Stilistik', visibilityLevel: 'prominent', visible: true },
      { type: 'Stil-Veredelung', onixCode: 'STYLE-03', originalName: 'Poetisch', displayName: 'Poetisch verdichtet', silo: 'Stilistik', visibilityLevel: 'prominent', visible: true },
      
      // Schauplatz (Oft sichtbar)
      { type: 'Schauplatz', onixCode: 'DE-BE', originalName: 'Berlin', displayName: '📍 Spielt in Venedig', silo: 'Schauplätze', visibilityLevel: 'prominent', visible: true },
      { type: 'Schauplatz', onixCode: 'IT-VE', originalName: 'Venedig', displayName: '📍 Spielt in Berlin', silo: 'Schauplätze', visibilityLevel: 'prominent', visible: true },
      
      // === FILTER TAGS (Funktionale Tags in Seitenleiste) ===
      
      // Genre (THEMA)
      { type: 'Genre (THEMA)', onixCode: 'FBA', originalName: 'Crime & Mystery', displayName: 'Krimi & Thriller', silo: 'Genre', visibilityLevel: 'filter', visible: true },
      { type: 'Genre (THEMA)', onixCode: 'FFB', originalName: 'Historical Fiction', displayName: 'Historische Romane', silo: 'Genre', visibilityLevel: 'filter', visible: true },
      { type: 'Genre (THEMA)', onixCode: 'FLS', originalName: 'Family Saga', displayName: 'Familiensagas', silo: 'Genre', visibilityLevel: 'filter', visible: true },
      
      // Zielgruppe
      { type: 'Zielgruppe', onixCode: '01', originalName: 'Allgemein', displayName: 'Für Einsteiger', silo: 'Leserschaft', visibilityLevel: 'filter', visible: true },
      { type: 'Zielgruppe', onixCode: '06', originalName: 'Fachpublikum', displayName: 'Fachbuch', silo: 'Leserschaft', visibilityLevel: 'filter', visible: true },
      
      // Zeitgeist/Epoche
      { type: 'Zeitgeist', onixCode: '13', originalName: '1920er Jahre', displayName: 'Die Goldenen Zwanziger', silo: 'Epochen', visibilityLevel: 'filter', visible: true },
      { type: 'Zeitgeist', onixCode: '14', originalName: '1940er Jahre', displayName: 'Zweiter Weltkrieg', silo: 'Epochen', visibilityLevel: 'filter', visible: true },
      { type: 'Zeitgeist', onixCode: 'CONT', originalName: 'Gegenwart', displayName: 'Zeitgenössisch', silo: 'Epochen', visibilityLevel: 'filter', visible: true },
      
      // Herkunft/Originalsprache
      { type: 'Herkunft', onixCode: 'Lang eng', originalName: 'Aus dem Englischen', displayName: 'Englische Übersetzung', silo: 'Übersetzungen', visibilityLevel: 'filter', visible: true },
      { type: 'Herkunft', onixCode: 'Lang fra', originalName: 'Aus dem Französischen', displayName: 'Französische Übersetzung', silo: 'Übersetzungen', visibilityLevel: 'filter', visible: true },
      
      // === INTERNAL TAGS (Nur Backend/SEO) ===
      
      // Gattung/Warengruppe
      { type: 'Gattung', onixCode: 'WG 1110', originalName: 'Belletristik: Allgemeines', displayName: 'Literatur & Belletristik', silo: 'Warengruppen', visibilityLevel: 'internal', visible: true },
      { type: 'Gattung', onixCode: 'WG 1120', originalName: 'Erzählende Literatur', displayName: 'Erzählkunst', silo: 'Warengruppen', visibilityLevel: 'internal', visible: true },
      { type: 'Gattung', onixCode: 'WG 1950', originalName: 'Sachbuch: Allgemeines', displayName: 'Sachbuch & Essayistik', silo: 'Warengruppen', visibilityLevel: 'internal', visible: true },
      
      // Ausstattung (ONIX-Codes)
      { type: 'Ausstattung', onixCode: 'B108', originalName: 'Leinenrücken', displayName: 'Schön ausgestattetes Leinenbuch', silo: 'Format', visibilityLevel: 'internal', visible: true },
      { type: 'Ausstattung', onixCode: 'B411', originalName: 'Illustriert', displayName: 'Illustriertes Buch', silo: 'Format', visibilityLevel: 'internal', visible: true },
    ];

    for (const tag of demoTags) {
      await saveONIXTag(tag);
    }

    await loadTags();
    alert(`✅ ${demoTags.length} Demo-Tags wurden erstellt!`);
  }

  const filteredTags = tags.filter(tag => {
    const matchesSearch = 
      tag.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((tag as any).originalName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((tag as any).onixCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((tag as any).silo && (tag as any).silo.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || tag.type === filterType;
    const matchesVisibility = filterVisibility === 'all' || tag.visibilityLevel === filterVisibility;
    
    return matchesSearch && matchesType && matchesVisibility;
  });

  // Group tags by visibility level first, then by type
  const tagsByVisibility = {
    prominent: filteredTags.filter(t => t.visibilityLevel === 'prominent'),
    filter: filteredTags.filter(t => t.visibilityLevel === 'filter'),
    internal: filteredTags.filter(t => t.visibilityLevel === 'internal')
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            ONIX Tag-System ({tags.length})
          </h2>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>
            VLB-konforme Tags mit 3-Stufen-Sichtbarkeit
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={seedDemoTags}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
          >
            <Database className="w-5 h-5" />
            Demo-Tags laden
          </button>
          <button
            onClick={() => setEditingTag({
              type: 'Motiv (MVB)',
              onixCode: '',
              originalName: '',
              displayName: '',
              visibilityLevel: 'prominent',
              visible: true
            })}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
          >
            <Plus className="w-5 h-5" />
            Neuer Tag
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#666666' }}>
              Suche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#999999' }} />
              <input
                type="text"
                placeholder="Tag suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
          </div>

          {/* Filter by Type */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#666666' }}>
              Filter nach Typ
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ONIXTagType | 'all')}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: '#E5E7EB' }}
            >
              <option value="all">Alle Typen</option>
              <option value="Auszeichnung">🏆 Auszeichnung</option>
              <option value="Motiv (MVB)">💫 Lesemotiv</option>
              <option value="Medienecho">📺 Medienecho</option>
              <option value="Stil-Veredelung">✍️ Stil-Veredelung</option>
              <option value="Schauplatz">📍 Schauplatz</option>
              <option value="Genre (THEMA)">🎭 Genre</option>
              <option value="Zielgruppe">👥 Zielgruppe</option>
              <option value="Zeitgeist">🕰️ Zeitgeist</option>
              <option value="Herkunft">🌍 Herkunft</option>
              <option value="Gattung">📚 Gattung (WG)</option>
              <option value="Ausstattung">✨ Ausstattung</option>
            </select>
          </div>

          {/* Filter by Visibility Level */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#666666' }}>
              Sichtbarkeit
            </label>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as ONIXTagVisibilityLevel | 'all')}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: '#E5E7EB' }}
            >
              <option value="all">Alle</option>
              <option value="prominent">⭐ Prominent (am Buch)</option>
              <option value="filter">🔍 Filter (Seitenleiste)</option>
              <option value="internal">🔒 Internal (Backend/SEO)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor */}
      {editingTag && (
        <div className="mb-6 p-6 border-2 rounded-lg" style={{ borderColor: '#f25f5c' }}>
          <h3 className="text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {editingTag.id ? 'Tag bearbeiten' : 'Neuer Tag'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Type */}
            <div>
              <label className="block text-sm mb-2" style={{ color: '#666666' }}>
                Typ *
              </label>
              <select
                value={editingTag.type || 'Motiv (MVB)'}
                onChange={(e) => setEditingTag({ ...editingTag, type: e.target.value as ONIXTagType })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              >
                <optgroup label="🔥 Prominent Tags">
                  <option value="Auszeichnung">🏆 Auszeichnung</option>
                  <option value="Motiv (MVB)">💫 Lesemotiv (MVB)</option>
                  <option value="Medienecho">📺 Medienecho</option>
                  <option value="Stil-Veredelung">✍️ Stil-Veredelung</option>
                  <option value="Schauplatz">📍 Schauplatz</option>
                </optgroup>
                <optgroup label="🔍 Filter Tags">
                  <option value="Genre (THEMA)">🎭 Genre (THEMA)</option>
                  <option value="Zielgruppe">👥 Zielgruppe</option>
                  <option value="Zeitgeist">🕰️ Zeitgeist/Epoche</option>
                  <option value="Herkunft">🌍 Herkunft/Sprache</option>
                </optgroup>
                <optgroup label="🔒 Internal Tags">
                  <option value="Gattung">📚 Gattung (WG)</option>
                  <option value="Ausstattung">✨ Ausstattung</option>
                </optgroup>
              </select>
            </div>

            {/* Visibility Level */}
            <div>
              <label className="block text-sm mb-2" style={{ color: '#666666' }}>
                Sichtbarkeit *
              </label>
              <select
                value={editingTag.visibilityLevel || 'prominent'}
                onChange={(e) => setEditingTag({ ...editingTag, visibilityLevel: e.target.value as ONIXTagVisibilityLevel })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="prominent">⭐ Prominent - Immer am Buch sichtbar</option>
                <option value="filter">🔍 Filter - In Seitenleiste/Filtern</option>
                <option value="internal">🔒 Internal - Nur Backend/SEO</option>
              </select>
            </div>

            {/* ONIX Code */}
            <div>
              <label className="block text-sm mb-2" style={{ color: '#666666' }}>
                ONIX Code *
              </label>
              <input
                type="text"
                placeholder="z.B. WG 1110, FBA, MEDIA-01"
                value={editingTag.onixCode || ''}
                onChange={(e) => setEditingTag({ ...editingTag, onixCode: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            {/* Silo */}
            <div>
              <label className="block text-sm mb-2" style={{ color: '#666666' }}>
                Silo/Hub (Optional)
              </label>
              <input
                type="text"
                placeholder="z.B. Ausgezeichnet, In den Medien"
                value={(editingTag as any).silo || ''}
                onChange={(e) => setEditingTag({ ...editingTag, silo: e.target.value } as any)}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            {/* Original Name */}
            <div>
              <label className="block text-sm mb-2" style={{ color: '#666666' }}>
                Original Bezeichnung (VLB) *
              </label>
              <input
                type="text"
                placeholder="z.B. Belletristik: Allgemeines"
                value={(editingTag as any).originalName || ''}
                onChange={(e) => setEditingTag({ ...editingTag, originalName: e.target.value } as any)}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm mb-2" style={{ color: '#666666' }}>
                Magazin-Tag (Anzeigename) *
              </label>
              <input
                type="text"
                placeholder="z.B. 🏆 Shortlist Buchpreis 2025"
                value={editingTag.displayName || ''}
                onChange={(e) => setEditingTag({ ...editingTag, displayName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
            >
              <Save className="w-5 h-5" />
              Speichern
            </button>
            <button
              onClick={() => setEditingTag(null)}
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A' }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Tag List - Grouped by Visibility Level */}
      {loading ? (
        <p style={{ color: '#666666' }}>Laden...</p>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#666666' }}>
          <TagIcon className="w-16 h-16 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
          <p>Keine Tags gefunden.</p>
          <p className="text-sm mt-2">Erstelle deinen ersten ONIX-Tag!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* PROMINENT TAGS */}
          {tagsByVisibility.prominent.length > 0 && (
            <div>
              <div 
                className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg"
                style={{ backgroundColor: '#FFD70020', borderLeft: '4px solid #FFD700' }}
              >
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Prominent Tags - Immer am Buch sichtbar ({tagsByVisibility.prominent.length})
                  </h3>
                  <p className="text-sm" style={{ color: '#666666' }}>
                    Auszeichnungen, Lesemotive, Medienecho, Stil-Veredelung, Schauplatz
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tagsByVisibility.prominent.map(tag => (
                  <div
                    key={tag.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    style={{ 
                      borderColor: getTypeColor(tag.type as ONIXTagType), 
                      backgroundColor: '#FFFFFF',
                      opacity: tag.visible ? 1 : 0.5
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="inline-block px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: getTypeColor(tag.type as ONIXTagType), color: '#FFFFFF' }}
                          >
                            {(tag as any).onixCode}
                          </div>
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#F0F0F0', color: '#666' }}>
                            {getTypeIcon(tag.type as ONIXTagType)} {tag.type}
                          </span>
                        </div>
                        <h4 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A', fontSize: '1.1rem' }}>
                          {tag.displayName}
                        </h4>
                        <p className="text-sm mt-1" style={{ color: '#999999' }}>
                          {(tag as any).originalName}
                        </p>
                        {(tag as any).silo && (
                          <p className="text-xs mt-1 px-2 py-1 inline-block rounded" style={{ backgroundColor: '#E3F2FD', color: '#1976D2' }}>
                            {(tag as any).silo}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={() => toggleVisibility(tag)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: tag.visible ? '#4CAF50' : '#9E9E9E', color: '#FFFFFF' }}
                          title={tag.visible ? 'Sichtbar' : 'Versteckt'}
                        >
                          {tag.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILTER TAGS */}
          {tagsByVisibility.filter.length > 0 && (
            <div>
              <div 
                className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg"
                style={{ backgroundColor: '#247ba020', borderLeft: '4px solid #247ba0' }}
              >
                <span className="text-2xl">🔍</span>
                <div>
                  <h3 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Filter Tags - In Seitenleiste/Filtern ({tagsByVisibility.filter.length})
                  </h3>
                  <p className="text-sm" style={{ color: '#666666' }}>
                    Genre, Zielgruppe, Zeitgeist, Originalsprache
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {tagsByVisibility.filter.map(tag => (
                  <div
                    key={tag.id}
                    className="p-3 border rounded-lg hover:shadow-md transition-shadow"
                    style={{ 
                      borderColor: getTypeColor(tag.type as ONIXTagType), 
                      backgroundColor: '#FFFFFF',
                      opacity: tag.visible ? 1 : 0.5
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h4 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A', fontSize: '0.95rem' }}>
                          {tag.displayName}
                        </h4>
                        <p className="text-xs mt-1" style={{ color: '#999999' }}>
                          {getTypeIcon(tag.type as ONIXTagType)} {tag.type}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => toggleVisibility(tag)}
                          className="p-1 rounded transition-colors"
                          style={{ backgroundColor: tag.visible ? '#4CAF50' : '#9E9E9E', color: '#FFFFFF' }}
                          title={tag.visible ? 'Sichtbar' : 'Versteckt'}
                        >
                          {tag.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-1 rounded transition-colors"
                          style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTERNAL TAGS */}
          {tagsByVisibility.internal.length > 0 && (
            <div>
              <div 
                className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg"
                style={{ backgroundColor: '#9E9E9E20', borderLeft: '4px solid #9E9E9E' }}
              >
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Internal Tags - Nur Backend/SEO ({tagsByVisibility.internal.length})
                  </h3>
                  <p className="text-sm" style={{ color: '#666666' }}>
                    Warengruppe, ONIX-Codes, Ausstattung
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {tagsByVisibility.internal.map(tag => (
                  <div
                    key={tag.id}
                    className="p-2 border rounded hover:shadow transition-shadow"
                    style={{ 
                      borderColor: '#E5E7EB', 
                      backgroundColor: '#FAFAFA',
                      opacity: tag.visible ? 1 : 0.5
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs" style={{ fontFamily: 'Fjalla One', color: '#666' }}>
                          {(tag as any).onixCode}
                        </p>
                        <p className="text-xs" style={{ color: '#999' }}>
                          {tag.displayName}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingTag(tag)}
                        className="p-1 rounded transition-colors"
                        style={{ backgroundColor: '#E5E7EB', color: '#666' }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}