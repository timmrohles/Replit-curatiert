/**
 * ==================================================================
 * ADMIN TAGS - GOVERNANCE-KONFORM
 * ==================================================================
 * 
 * Features:
 * - Soft Delete UI ("Archivieren" statt "Löschen")
 * - ONIX-Felder Feature-Flagged
 * - Tag Origin Badges
 * - Slug Freeze (read-only nach erstem Save)
 * 
 * UI-Policy:
 * - ONIX-Felder nur sichtbar wenn FEATURE_FLAGS.onix_enabled
 * - Delete-Button → "Archivieren" Button
 * - Wiederherstellung-Funktion für soft-deleted Tags
 * 
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { Plus, Save, X, Search, Tag as TagIcon, Archive, RefreshCw, Filter, AlertCircle, Edit2, Lock, Database, EyeOff, Trash2, RotateCcw, Upload, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage, logError } from '../../utils/errorHelpers';
import { FEATURE_FLAGS } from '../../utils/featureFlags';
import { API_BASE_URL } from '../../config/apiClient';
// TYPES
// ==================================================================

interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type: 'genre' | 'topic' | 'award' | 'keyword';
  source: 'editorial' | 'onix' | 'awin' | 'derived';
  scope: string;
  
  // ONIX fields (optional)
  onix_scheme_id?: number;
  onix_code?: string;
  onix_label?: string;
  
  // UI fields
  color?: string;
  visible?: boolean;
  display_order?: number;
  image_url?: string;
  
  // Stats
  current_usage_count?: number;
  
  // Soft Delete
  deleted_at?: string;
  deleted_by?: string;
  
  // Slug Freeze
  slug_frozen_at?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// ==================================================================
// COMPONENT
// ==================================================================

export function AdminTagsNeon() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterTagType, setFilterTagType] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Edit Modal
  const [editingTag, setEditingTag] = useState<Partial<Tag> | null>(null);
  const [savingTag, setSavingTag] = useState(false);
  
  // Delete Modal
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // ==================================================================
  // LOAD DATA
  // ==================================================================
  
  useEffect(() => {
    loadTags();
  }, [showDeleted]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/tags${showDeleted ? '?include_deleted=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      
      if (!response.ok) throw new Error('Failed to load tags');
      const data = await response.json();
      setTags(data.data || data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Fehler beim Laden der Themen');
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================
  // SAVE TAG
  // ==================================================================
  
  const handleSaveTag = async () => {
    if (!editingTag) return;
    
    if (!editingTag.name) {
      toast.error('Name ist ein Pflichtfeld');
      return;
    }
    
    if (!editingTag.tag_type) {
      toast.error('Themen-Typ ist ein Pflichtfeld');
      return;
    }
    
    // ONIX Source Policy
    if (editingTag.source === 'onix') {
      if (!editingTag.onix_scheme_id || !editingTag.onix_code) {
        toast.error('ONIX-Themen benötigen Scheme ID und Code');
        return;
      }
    }
    
    setSavingTag(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
        body: JSON.stringify(editingTag),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Speichern');
      }
      
      toast.success(editingTag.id ? 'Thema aktualisiert' : 'Thema erstellt');
      setEditingTag(null);
      loadTags();
      
    } catch (error: unknown) {
      logError('Error saving tag', error);
      toast.error(getErrorMessage(error, 'Fehler beim Speichern'));
    } finally {
      setSavingTag(false);
    }
  };

  // ==================================================================
  // ARCHIVE TAG (Soft Delete)
  // ==================================================================
  
  const handleArchiveTag = async (tag: Tag) => {
    if (!tag.id) return;
    
    const usageCount = tag.current_usage_count || 0;
    
    if (usageCount > 0) {
      if (!confirm(`Dieser Tag wird an ${usageCount} Büchern verwendet. Trotzdem archivieren?`)) {
        return;
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${tag.id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Archivieren');
      }
      
      const result = await response.json();
      
      if (result.action === 'soft_deleted') {
        toast.success(`Tag "${tag.name}" archiviert (kann wiederhergestellt werden)`);
      }
      
      loadTags();
      
    } catch (error: unknown) {
      logError('Error archiving tag', error);
      toast.error(getErrorMessage(error, 'Fehler beim Archivieren'));
    }
  };

  // ==================================================================
  // RESTORE TAG
  // ==================================================================
  
  const handleRestoreTag = async (tag: Tag) => {
    if (!tag.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${tag.id}/restore`, {
        method: 'POST',
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Wiederherstellen');
      }
      
      toast.success(`Tag "${tag.name}" wiederhergestellt`);
      loadTags();
      
    } catch (error: unknown) {
      logError('Error restoring tag', error);
      toast.error(getErrorMessage(error, 'Fehler beim Wiederherstellen'));
    }
  };

  // ==================================================================
  // HARD DELETE TAG
  // ==================================================================
  
  const handleHardDeleteTag = async () => {
    if (!deletingTag) return;
    
    if (!deleteReason || deleteReason.length < 20) {
      toast.error('Begründung muss mindestens 20 Zeichen lang sein');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${deletingTag.id}?force=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '',
        },
        body: JSON.stringify({ reason: deleteReason }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Löschen');
      }
      
      toast.success(`Tag "${deletingTag.name}" endgültig gelöscht`);
      setDeletingTag(null);
      setDeleteReason('');
      loadTags();
      
    } catch (error: unknown) {
      logError('Error deleting tag', error);
      toast.error(getErrorMessage(error, 'Fehler beim Löschen'));
    }
  };

  // ==================================================================
  // HELPERS
  // ==================================================================
  
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'editorial':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Editorial</span>;
      case 'onix':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">ONIX</span>;
      case 'awin':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">AWIN</span>;
      case 'derived':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Derived</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{source}</span>;
    }
  };

  const getTagTypeBadge = (tagType: string) => {
    switch (tagType) {
      case 'genre':
        return <span className="px-2 py-1 bg-coral-100 text-coral-700 text-xs rounded">Genre</span>;
      case 'topic':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Topic</span>;
      case 'award':
        return <span className="px-2 py-1 bg-gold-100 text-gold-700 text-xs rounded">Award</span>;
      case 'keyword':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Keyword</span>;
      default:
        return null;
    }
  };

  // ==================================================================
  // FILTERED TAGS
  // ==================================================================
  
  const filteredTags = tags.filter(tag => {
    // Search filter
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Source filter
    const matchesSource = filterSource === 'all' || tag.source === filterSource;
    
    // Tag type filter
    const matchesTagType = filterTagType === 'all' || tag.tag_type === filterTagType;
    
    return matchesSearch && matchesSource && matchesTagType;
  });

  // ==================================================================
  // RENDER
  // ==================================================================
  
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            <TagIcon className="w-7 h-7" />
            Themen
          </h2>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            {tags.filter(t => !t.deleted_at).length} aktive Themen · 
            {tags.filter(t => t.deleted_at).length} archiviert
          </p>
        </div>
        <button
          onClick={() => setEditingTag({ 
            tag_type: 'topic', 
            source: 'editorial', 
            scope: 'book',
            color: '#f25f5c',
            visible: true,
            display_order: 0
          })}
          className="flex items-center gap-2 px-4 py-2 rounded"
          style={{ backgroundColor: '#f25f5c', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Neues Thema
        </button>
      </div>

      {/* Feature-Flag Info */}
      {!FEATURE_FLAGS.onix_enabled && (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-gray-900">ONIX-Features deaktiviert</p>
              <p className="text-gray-600 mt-1">
                ONIX-Felder werden in Phase 2 aktiviert. Aktuell nur redaktionelle Themen möglich.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Info */}
      {FEATURE_FLAGS.soft_delete_ui && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <Archive className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Soft Delete aktiv</p>
              <p className="text-blue-700 mt-1">
                Themen werden standardmäßig archiviert (nicht gelöscht). Wiederherstellung ist jederzeit möglich.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Name oder Slug..."
            className="w-full pl-10 pr-4 py-2 border rounded"
            style={{ borderColor: '#E0E0E0' }}
          />
        </div>
        
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-2 border rounded"
          style={{ borderColor: '#E0E0E0' }}
        >
          <option value="all">Alle Quellen</option>
          <option value="editorial">Editorial</option>
          <option value="onix">ONIX</option>
          <option value="awin">AWIN</option>
          <option value="derived">Derived</option>
        </select>
        
        <select
          value={filterTagType}
          onChange={(e) => setFilterTagType(e.target.value)}
          className="px-3 py-2 border rounded"
          style={{ borderColor: '#E0E0E0' }}
        >
          <option value="all">Alle Typen</option>
          <option value="genre">Genre</option>
          <option value="topic">Topic</option>
          <option value="award">Award</option>
          <option value="keyword">Keyword</option>
        </select>
        
        <label className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer" style={{ borderColor: '#E0E0E0' }}>
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Archivierte anzeigen</span>
        </label>
      </div>

      {/* Tags List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4" style={{ color: '#666' }}>Lade Themen...</p>
        </div>
      ) : filteredTags.length > 0 ? (
        <div className="space-y-2">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${tag.deleted_at ? 'bg-gray-50 opacity-60' : ''}`}
              style={{ borderColor: '#E0E0E0' }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color || '#f25f5c' }}
                    />
                    <h3 className="font-semibold" style={{ color: '#3A3A3A' }}>
                      {tag.name}
                    </h3>
                    {getTagTypeBadge(tag.tag_type)}
                    {getSourceBadge(tag.source)}
                    {tag.deleted_at && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        ARCHIVIERT
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm" style={{ color: '#666' }}>
                    <span>Slug: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tag.slug}</code></span>
                    {tag.slug_frozen_at && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Frozen
                      </span>
                    )}
                    <span>Verwendungen: {tag.current_usage_count || 0}</span>
                    {tag.visible === false && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Hidden
                      </span>
                    )}
                  </div>
                  
                  {tag.deleted_at && (
                    <p className="text-xs mt-2 text-red-600">
                      Archiviert am {new Date(tag.deleted_at).toLocaleDateString('de-DE')}
                      {tag.deleted_by && ` von ${tag.deleted_by}`}
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  {!tag.deleted_at ? (
                    <>
                      <button
                        onClick={() => setEditingTag(tag)}
                        className="p-2 rounded hover:bg-gray-100"
                        title="Bearbeiten"
                      >
                        <Edit2 className="w-4 h-4" style={{ color: '#247ba0' }} />
                      </button>
                      
                      {FEATURE_FLAGS.soft_delete_ui ? (
                        <button
                          onClick={() => handleArchiveTag(tag)}
                          className="p-2 rounded hover:bg-amber-100"
                          title="Archivieren"
                        >
                          <Archive className="w-4 h-4 text-amber-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeletingTag(tag)}
                          className="p-2 rounded hover:bg-red-100"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestoreTag(tag)}
                      className="p-2 rounded hover:bg-green-100 flex items-center gap-1 text-sm px-3"
                      title="Wiederherstellen"
                    >
                      <RotateCcw className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Wiederherstellen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TagIcon className="w-12 h-12 mx-auto mb-4" style={{ color: '#CCC' }} />
          <p style={{ color: '#999' }}>Keine Themen gefunden</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingTag.id ? 'Thema bearbeiten' : 'Neues Thema'}
              </h3>
              <button onClick={() => setEditingTag(null)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={editingTag.name || ''}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#E0E0E0' }}
                  placeholder="z.B. Krimi, Klimawandel, Feministisch"
                />
              </div>

              {/* Slug (Read-Only wenn frozen) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>
                  Slug
                  {editingTag.slug_frozen_at && (
                    <span className="text-xs text-gray-500 ml-2 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      (Frozen - kann nicht geändert werden)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={editingTag.slug || '(wird automatisch generiert)'}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-gray-50"
                  style={{ borderColor: '#E0E0E0' }}
                />
                <p className="text-xs mt-1 text-gray-500">
                  Format: {editingTag.tag_type}-{'{slugified-name}'}
                </p>
              </div>

              {/* Tag Type */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>
                  Themen-Typ *
                </label>
                <select
                  value={editingTag.tag_type || 'topic'}
                  onChange={(e) => setEditingTag({ ...editingTag, tag_type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#E0E0E0' }}
                >
                  <option value="genre">Genre (Gattung)</option>
                  <option value="topic">Topic (Thema)</option>
                  <option value="award">Award (Auszeichnung)</option>
                  <option value="keyword">Keyword (Schlagwort)</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>
                  Quelle *
                </label>
                <select
                  value={editingTag.source || 'editorial'}
                  onChange={(e) => setEditingTag({ ...editingTag, source: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#E0E0E0' }}
                  disabled={!FEATURE_FLAGS.onix_enabled && editingTag.source === 'editorial'}
                >
                  <option value="editorial">Editorial (Manuell)</option>
                  {FEATURE_FLAGS.onix_enabled && (
                    <>
                      <option value="onix">ONIX (Import)</option>
                      <option value="awin">AWIN (Import)</option>
                      <option value="derived">Derived (Automatisch abgeleitet)</option>
                    </>
                  )}
                </select>
              </div>

              {/* ONIX Fields (nur wenn source=onix UND Feature-Flag aktiv) */}
              {editingTag.source === 'onix' && FEATURE_FLAGS.onix_enabled && (
                <div className="border-t pt-4 bg-purple-50 p-4 rounded">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-purple-900">
                    <Database className="w-4 h-4 text-purple-600" />
                    ONIX-Felder
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-purple-700 mb-1">ONIX Scheme ID *</label>
                      <input
                        type="text"
                        value={editingTag.onix_scheme_id || ''}
                        onChange={(e) => setEditingTag({ ...editingTag, onix_scheme_id: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border rounded"
                        style={{ borderColor: '#E0E0E0' }}
                        placeholder="z.B. 93 (THEMA)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-purple-700 mb-1">ONIX Code *</label>
                      <input
                        type="text"
                        value={editingTag.onix_code || ''}
                        onChange={(e) => setEditingTag({ ...editingTag, onix_code: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        style={{ borderColor: '#E0E0E0' }}
                        placeholder="z.B. FBA"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-purple-700 mb-1">ONIX Label</label>
                      <input
                        type="text"
                        value={editingTag.onix_label || ''}
                        onChange={(e) => setEditingTag({ ...editingTag, onix_label: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        style={{ borderColor: '#E0E0E0' }}
                        placeholder="z.B. Modern & contemporary fiction"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ONIX Disabled Info */}
              {editingTag.source === 'onix' && !FEATURE_FLAGS.onix_enabled && (
                <div className="border-t pt-4 bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    ONIX-Features sind deaktiviert. Quelle muss "Editorial" sein.
                  </p>
                </div>
              )}

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>
                  Farbe
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingTag.color || '#f25f5c'}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="w-12 h-10 border rounded cursor-pointer"
                    style={{ borderColor: '#E0E0E0' }}
                  />
                  <input
                    type="text"
                    value={editingTag.color || '#f25f5c'}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded"
                    style={{ borderColor: '#E0E0E0' }}
                    placeholder="#f25f5c"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>
                  Bild / Logo
                </label>
                {editingTag.image_url ? (
                  <div className="flex items-start gap-3">
                    <img
                      src={editingTag.image_url}
                      alt={editingTag.name || 'Thema'}
                      className="w-20 h-20 object-cover rounded-lg border"
                      style={{ borderColor: '#E0E0E0' }}
                    />
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{editingTag.image_url}</p>
                      <button
                        type="button"
                        onClick={() => setEditingTag({ ...editingTag, image_url: undefined })}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Bild entfernen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50 text-sm" style={{ borderColor: '#E0E0E0' }}>
                      <Upload className="w-4 h-4" style={{ color: '#666' }} />
                      Datei hochladen
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('image', file);
                          try {
                            const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';
                            const res = await fetch('/api/admin/upload/tag-image', {
                              method: 'POST',
                              headers: { 'X-Admin-Token': token || '' },
                              body: formData,
                            });
                            const data = await res.json();
                            if (data.ok && data.data?.url) {
                              setEditingTag({ ...editingTag, image_url: data.data.url });
                              toast.success('Bild hochgeladen');
                            } else {
                              toast.error(data.error || 'Upload fehlgeschlagen');
                            }
                          } catch {
                            toast.error('Upload fehlgeschlagen');
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Bild-URL eingeben (z.B. von Unsplash):');
                        if (url && url.trim()) {
                          setEditingTag({ ...editingTag, image_url: url.trim() });
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
                      style={{ borderColor: '#E0E0E0' }}
                    >
                      <ExternalLink className="w-4 h-4" style={{ color: '#666' }} />
                      URL eingeben
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP oder GIF. Max 5 MB. Wird automatisch in WebP konvertiert.</p>
              </div>

              {/* Visible */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingTag.visible !== false}
                  onChange={(e) => setEditingTag({ ...editingTag, visible: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">Sichtbar (Frontend)</label>
              </div>

              {/* Save Button */}
              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditingTag(null)}
                  className="px-6 py-2 border rounded"
                  style={{ borderColor: '#E0E0E0' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveTag}
                  disabled={savingTag}
                  className="px-6 py-2 rounded flex items-center gap-2"
                  style={{ backgroundColor: '#f25f5c', color: 'white' }}
                >
                  <Save className="w-4 h-4" />
                  {savingTag ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Modal */}
      {deletingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">
              Thema endgültig löschen?
            </h3>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-sm text-red-800">
                ⚠️ Dieser Vorgang kann NICHT rückgängig gemacht werden!
              </p>
              <p className="text-sm text-red-700 mt-2">
                Thema: <strong>{deletingTag.name}</strong><br />
                Verwendungen: <strong>{deletingTag.current_usage_count || 0}</strong>
              </p>
            </div>
            
            {(deletingTag.current_usage_count || 0) > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                <p className="text-sm text-amber-800">
                  Empfehlung: Verwende stattdessen "Archivieren". 
                  Das Thema bleibt erhalten und kann wiederhergestellt werden.
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Begründung (mind. 20 Zeichen) *
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E0E0E0' }}
                placeholder="Warum muss dieses Thema endgültig gelöscht werden?"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeletingTag(null);
                  setDeleteReason('');
                }}
                className="px-6 py-2 border rounded"
                style={{ borderColor: '#E0E0E0' }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleArchiveTag(deletingTag)}
                className="px-6 py-2 rounded bg-amber-500 text-white"
              >
                Stattdessen archivieren
              </button>
              <button
                onClick={handleHardDeleteTag}
                disabled={!deleteReason || deleteReason.length < 20}
                className="px-6 py-2 rounded bg-red-600 text-white disabled:opacity-50"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}