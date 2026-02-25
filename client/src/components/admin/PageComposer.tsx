/**
 * ==================================================================
 * PAGE COMPOSER - Modern Admin UI for Page Composition
 * ==================================================================
 * 
 * DB-driven Page Editor with:
 * - Zone-based Sections (Header, Above Fold, Main, Footer)
 * - Drag & Drop Reordering
 * - Typed Target Selectors (category, tag, page)
 * - Status & Publishing Management
 * 
 * PRINCIPLES:
 * - DB is Source of Truth
 * - No implicit logic / automation
 * - Everything is explicit & editable
 * - UI Core Components only
 * 
 * ==================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Save, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Calendar,
  Layout,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Video,
  Image as ImageIcon,
  BadgeCheck,
  Search,
  User,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Heading } from '../ui/typography';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { API_BASE_URL } from '../../config/apiClient';  // ✅ FIXED: Use canonical import
import { SectionItemsManager } from './SectionItemsManager';
import { BookSourceBuilder, type BookSourceConfig } from './BookSourceBuilder';
// ❌ BUILD-BLOCKER REMOVED: react-dnd prevents Figma Make publishing
// import { useDrag, useDrop } from 'react-dnd';
import { SECTION_TYPES, getSectionTypesForZone, isQueryOnlySection } from '../sections/sectionRegistry';

function toLocalDatetimeString(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============================================================================
// TYPES
// ============================================================================

const DND_TYPES = {
  SECTION: 'SECTION',
};

export interface Page {
  id: number;
  slug: string;
  type?: string;
  template_key?: string;
  status: 'draft' | 'published';
  visibility: 'visible' | 'hidden';
  seo_title?: string;
  seo_description?: string;
  publish_at?: string | null;
  unpublish_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PageSection {
  id: number;
  page_id: number;
  zone: 'header' | 'aboveFold' | 'main' | 'footer';
  type: string;
  sort_order: number;
  status: 'draft' | 'published';
  visibility: 'visible' | 'hidden';
  config?: Record<string, any>;
  publish_at?: string | null;
  unpublish_at?: string | null;
  max_views?: number | null;
  max_clicks?: number | null;
  current_views?: number;
  current_clicks?: number;
  created_at?: string;
  updated_at?: string;
}

interface PageComposerProps {
  page: Page;
  onPageUpdate?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageComposer({ page, onPageUpdate }: PageComposerProps) {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set(['aboveFold', 'main']));
  const [editingSection, setEditingSection] = useState<Partial<PageSection> | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  
  // ✅ NEW: Draft/Published Filter
  const [includeDraft, setIncludeDraft] = useState(true);

  // Curator picker state
  const [curators, setCurators] = useState<any[]>([]);
  const [curatorsLoading, setCuratorsLoading] = useState(false);
  const [curatorSearch, setCuratorSearch] = useState('');
  const [allOnixTags, setAllOnixTags] = useState<any[]>([]);

  // Category Hero Unsplash search state
  const [heroUnsplashQuery, setHeroUnsplashQuery] = useState('');
  const [heroUnsplashResults, setHeroUnsplashResults] = useState<Array<{ id: string; url: string; thumb: string; alt: string; author: string; authorUrl: string }>>([]);
  const [heroUnsplashLoading, setHeroUnsplashLoading] = useState(false);

  const searchHeroUnsplash = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setHeroUnsplashLoading(true);
    try {
      const res = await fetch(`/api/unsplash/search?query=${encodeURIComponent(query)}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setHeroUnsplashResults(data.data || []);
      }
    } catch {
      setHeroUnsplashResults([]);
    } finally {
      setHeroUnsplashLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/onix-tags?limit=500')
      .then(r => r.json())
      .then(data => { if (data.ok) setAllOnixTags(data.data || []); })
      .catch(() => {});
  }, []);

  const loadCurators = useCallback(async () => {
    if (curators.length > 0) return;
    setCuratorsLoading(true);
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE_URL}/curators`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const result = await res.json();
        setCurators(Array.isArray(result.data) ? result.data : []);
      }
    } catch (e) {
      console.error('Failed to load curators:', e);
    } finally {
      setCuratorsLoading(false);
    }
  }, [curators.length]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (page.id) {
      loadSections();
    }
  }, [page.id]);

  const loadSections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/pages/${page.id}/sections`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to load sections: ${response.status}`);
      }

      const result = await response.json();
      const sectionsData = Array.isArray(result.data) ? result.data : [];
      
      // ✅ Map database schema (section_type, config, zone snake_case) to frontend (type, config, zone camelCase)
      interface DBSection {
        section_type?: string;
        config?: Record<string, unknown>;
        zone?: string;
        [key: string]: unknown;
      }
      
      const sectionsWithType = sectionsData.map((section: DBSection) => ({
        ...section,
        type: section.section_type || 'category_grid',
        config: section.config || {},
        zone: section.zone === 'above_fold' ? 'aboveFold' : section.zone, // Convert snake_case to camelCase
      }));
      
      setSections(sectionsWithType);
    } catch (err) {
      console.error('❌ Error loading sections:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleSaveSection = async () => {
    if (!editingSection) return;

    // ============================================================================
    // CLIENT-SIDE VALIDATION
    // ============================================================================
    
    // Validate book_carousel config
    if (editingSection.type === 'book_carousel') {
      const config = editingSection.config || {};
      
      // Title is required
      if (!config.title || config.title.trim() === '') {
        alert('❌ Fehler: Title ist ein Pflichtfeld für Book Carousel');
        return;
      }
      
      // If showVideo is true, validate video fields
      if (config.showVideo === true) {
        const errors: string[] = [];
        
        if (!config.videoUrl || config.videoUrl.trim() === '') {
          errors.push('Video URL');
        } else if (!config.videoUrl.startsWith('http://') && !config.videoUrl.startsWith('https://')) {
          alert('❌ Fehler: Video URL muss mit http:// oder https:// beginnen');
          return;
        }
        
        if (!config.videoThumbnail || config.videoThumbnail.trim() === '') {
          errors.push('Video Thumbnail URL');
        } else if (!config.videoThumbnail.startsWith('http://') && !config.videoThumbnail.startsWith('https://')) {
          alert('❌ Fehler: Video Thumbnail URL muss mit http:// oder https:// beginnen');
          return;
        }
        
        if (!config.videoTitle || config.videoTitle.trim() === '') {
          errors.push('Video Title');
        }
        
        if (errors.length > 0) {
          alert(`❌ Fehler: Folgende Pflichtfelder sind leer:\n${errors.join(', ')}`);
          return;
        }
      }
    }

    // Validate creator_carousel config
    if (editingSection.type === 'creator_carousel') {
      const config = editingSection.config || {};
      
      // Title is required
      if (!config.title || config.title.trim() === '') {
        alert('❌ Fehler: Title ist ein Pflichtfeld für Creator Carousel');
        return;
      }
      
      // If showVideo is true, validate video fields
      if (config.showVideo === true) {
        const errors: string[] = [];
        
        if (!config.videoUrl || config.videoUrl.trim() === '') {
          errors.push('Video URL');
        }
        
        if (!config.videoThumbnail || config.videoThumbnail.trim() === '') {
          errors.push('Video Thumbnail URL');
        }
        
        if (!config.videoTitle || config.videoTitle.trim() === '') {
          errors.push('Video Title');
        }
        
        if (errors.length > 0) {
          alert(`❌ Fehler: Folgende Pflichtfelder sind leer:\n${errors.join(', ')}`);
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      // ✅ FIX: section_type is a separate column, NOT part of config
      const sectionType = editingSection.type || 'category_grid';

      // ✅ Convert camelCase zone to snake_case for database
      const zoneForDB = editingSection.zone === 'aboveFold' ? 'above_fold' : editingSection.zone || 'main';
      
      const payload = {
        page_id: page.id,
        zone: zoneForDB,
        sort_order: editingSection.sort_order || 0,
        section_type: sectionType,
        config: editingSection.config || {},
        status: editingSection.status || 'published',
        visibility: editingSection.visibility || 'visible',
        publish_at: editingSection.publish_at || null,
        unpublish_at: editingSection.unpublish_at || null,
        max_views: editingSection.max_views ?? null,
        max_clicks: editingSection.max_clicks ?? null,
      };

      // ✅ FIX: Use PATCH for existing sections, POST for new sections
      const isUpdate = !!editingSection.id;
      const url = isUpdate 
        ? `${API_BASE_URL}/admin/sections/${editingSection.id}`
        : `${API_BASE_URL}/admin/pages/${page.id}/sections`;
      const method = isUpdate ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Section save failed:', errorData);
        throw new Error(`Failed to save section: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      await response.json().catch(() => null);

      setError(null);
      try {
        await loadSections();
      } catch (loadErr) {
        console.error('⚠️ Section saved but reload failed:', loadErr);
      }
      setEditingSection(null);
    } catch (err) {
      console.error('❌ Error saving section:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save section';
      setError(msg);
      alert(`❌ Fehler beim Speichern: ${msg}`);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm('Section wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/sections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete section: ${response.status}`);
      }

      await loadSections();
    } catch (err) {
      console.error('❌ Error deleting section:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete section');
    }
  };

  const handleDuplicateSection = async (section: PageSection) => {
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      const zoneForDB = section.zone === 'aboveFold' ? 'above_fold' : section.zone;

      const payload = {
        page_id: page.id,
        zone: zoneForDB,
        sort_order: section.sort_order + 5,
        section_type: section.type || (section.config as any)?.section_type || 'category_grid',
        status: section.status || 'published',
        visibility: section.visibility,
        config: section.config || {},
      };

      // Use standard sections endpoint (URL fixed with correct function name)
      const response = await fetch(`${API_BASE_URL}/admin/pages/${page.id}/sections`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to duplicate section: ${response.status}`)  ;
      }

      await loadSections();
    } catch (err) {
      console.error('❌ Error duplicating section:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate section');
    }
  };

  const handleMoveSection = async (draggedId: number, targetId: number, zone: string) => {
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      // Find dragged and target sections
      const zoneSections = getSectionsByZone(zone);
      const draggedIndex = zoneSections.findIndex(s => s.id === draggedId);
      const targetIndex = zoneSections.findIndex(s => s.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Calculate new sort orders
      const updates: Array<{ id: number; sort_order: number }> = [];
      const newOrder = [...zoneSections];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, removed);
      
      // Assign new sort_orders (10, 20, 30, ...)
      newOrder.forEach((section, index) => {
        const newSortOrder = (index + 1) * 10;
        if (section.sort_order !== newSortOrder) {
          updates.push({ id: section.id, sort_order: newSortOrder });
        }
      });
      
      // Batch update via reorder endpoint
      const response = await fetch(`${API_BASE_URL}/admin/pages/${page.id}/sections/reorder`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionOrders: updates }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reorder sections: ${response.status}`);
      }
      
      await loadSections();
    } catch (err) {
      console.error('❌ Error moving section:', err);
      setError(err instanceof Error ? err.message : 'Failed to move section');
    }
  };

  // ============================================================================
  // ZONE MANAGEMENT
  // ============================================================================

  const zones = [
    { key: 'aboveFold', label: 'Oberer Bereich (Above the Fold)', icon: Layout, isGlobal: false },
    { key: 'main', label: 'Hauptinhalt', icon: Layout, isGlobal: false },
  ];

  const getSectionsByZone = (zone: string) => {
    return sections
      .filter(s => s.zone === zone)
      .filter(s => includeDraft || s.status === 'published')
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const toggleZone = (zone: string) => {
    const newExpanded = new Set(expandedZones);
    if (newExpanded.has(zone)) {
      newExpanded.delete(zone);
    } else {
      newExpanded.add(zone);
    }
    setExpandedZones(newExpanded);
  };

  const toggleSectionItems = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // ============================================================================
  // SECTION TYPE OPTIONS - From Central Registry
  // ============================================================================
  
  // ✅ REMOVED: Local sectionTypes array - now using SECTION_TYPES from sectionRegistry.tsx
  // ✅ Filter section types based on current zone
  const getAvailableSectionTypes = (zone?: string) => {
    return getSectionTypesForZone(zone);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Lade Sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading variant="h3" className="mb-2">
                Page Composer
              </Heading>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {page.slug}
                </span>
                <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                  {page.status}
                </Badge>
                <Badge variant={page.visibility === 'visible' ? 'default' : 'secondary'}>
                  {page.visibility === 'visible' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {page.visibility}
                </Badge>
              </div>
            </div>
            {/* ✅ NEW: Draft Preview Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="include-draft" className="text-sm font-normal">
                Entwürfe anzeigen
              </Label>
              <Switch
                id="include-draft"
                checked={includeDraft}
                onCheckedChange={setIncludeDraft}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Zone Cards */}
      {zones.map(zone => {
        const zoneSections = getSectionsByZone(zone.key);
        const isExpanded = expandedZones.has(zone.key);

        return (
          <Card key={zone.key} className="border-2">
            <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleZone(zone.key)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <zone.icon className="w-5 h-5 text-gray-600" />
                  <Heading variant="h4">{zone.label}</Heading>
                  {zone.isGlobal && (
                    <Badge variant="secondary">Global (Navigation V2)</Badge>
                  )}
                  {!zone.isGlobal && (
                    <Badge variant="outline">{zoneSections.length} Sections</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!zone.isGlobal && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSection({ 
                          zone: zone.key as any, 
                          sort_order: (zoneSections.length + 1) * 10,
                          status: 'published',
                          visibility: 'visible'
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Sektion hinzufügen
                    </Button>
                  )}
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-4">
                {zone.isGlobal ? (
                  <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border-2 border-dashed">
                    <zone.icon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium mb-1">Global {zone.label}</p>
                    <p className="text-sm text-gray-500">
                      Managed via Navigation V2
                    </p>
                  </div>
                ) : zoneSections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Noch keine Sektionen in diesem Bereich
                  </div>
                ) : (
                  <div className="space-y-3">
                    {zoneSections.map((section, idx) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        isExpanded={expandedSections.has(section.id)}
                        onToggleItems={() => toggleSectionItems(section.id)}
                        onEdit={() => setEditingSection(section)}
                        onDelete={() => handleDeleteSection(section.id)}
                        onDuplicate={() => handleDuplicateSection(section)}
                        onMove={(draggedId, targetId) => handleMoveSection(draggedId, targetId, zone.key)}
                        isFirst={idx === 0}
                        isLast={idx === zoneSections.length - 1}
                        onMoveUp={() => idx > 0 && handleMoveSection(section.id, zoneSections[idx - 1].id, zone.key)}
                        onMoveDown={() => idx < zoneSections.length - 1 && handleMoveSection(section.id, zoneSections[idx + 1].id, zone.key)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Section Editor Dialog (simplified for now) */}
      {editingSection && (
        <Card className="fixed inset-4 z-50 overflow-auto shadow-2xl">
          <CardHeader>
            <CardTitle>
              {editingSection.id ? 'Sektion bearbeiten' : 'Neue Sektion erstellen'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Zone</label>
              <Select
                value={editingSection.zone || 'main'}
                onValueChange={(value) => setEditingSection({ ...editingSection, zone: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones.filter(z => !z.isGlobal).map(zone => (
                    <SelectItem key={zone.key} value={zone.key}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sektionstyp</label>
              <Select
                value={editingSection.type || 'category_grid'}
                onValueChange={(value) => setEditingSection({ ...editingSection, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSectionTypes(editingSection.zone as string).map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="section-status"
                    value="draft"
                    checked={editingSection.status === 'draft'}
                    onChange={(e) => setEditingSection({ ...editingSection, status: 'draft' })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Entwurf</span>
                  <Badge variant="secondary">Entwurf</Badge>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="section-status"
                    value="published"
                    checked={editingSection.status === 'published'}
                    onChange={(e) => setEditingSection({ ...editingSection, status: 'published' })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Veröffentlicht</span>
                  <Badge variant="default">Live</Badge>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sichtbarkeit</label>
              <Select
                value={editingSection.visibility || 'visible'}
                onValueChange={(value) => setEditingSection({ ...editingSection, visibility: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Sichtbar</SelectItem>
                  <SelectItem value="hidden">Versteckt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/50">
              <Switch
                id="hide-when-empty"
                checked={editingSection.config?.hide_when_empty === true}
                onCheckedChange={(checked) => setEditingSection({
                  ...editingSection,
                  config: { ...(editingSection.config || {}), hide_when_empty: checked }
                })}
              />
              <div>
                <Label htmlFor="hide-when-empty" className="text-sm font-medium cursor-pointer">Ausblenden wenn leer</Label>
                <p className="text-xs text-muted-foreground">Sektion wird auf der Website nicht angezeigt, wenn keine Bücher vorhanden sind.</p>
              </div>
            </div>

            {/* ============================================================================ */}
            {/* SCHEDULING & TRACKING */}
            {/* ============================================================================ */}
            <div className="space-y-4 pt-2">
              <Heading variant="h5" className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Zeitplanung & Tracking
              </Heading>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Veröffentlichen ab</label>
                  <Input
                    type="datetime-local"
                    value={editingSection.publish_at ? toLocalDatetimeString(editingSection.publish_at) : ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      publish_at: e.target.value ? new Date(e.target.value).toISOString() : null
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leer = sofort sichtbar</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Ausblenden ab</label>
                  <Input
                    type="datetime-local"
                    value={editingSection.unpublish_at ? toLocalDatetimeString(editingSection.unpublish_at) : ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      unpublish_at: e.target.value ? new Date(e.target.value).toISOString() : null
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leer = bleibt sichtbar</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Schnell-Perioden</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '1 Woche', days: 7 },
                    { label: '2 Wochen', days: 14 },
                    { label: '1 Monat', days: 30 },
                    { label: '3 Monate', days: 90 },
                    { label: '6 Monate', days: 180 },
                  ].map(preset => (
                    <Button
                      key={preset.days}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        const end = new Date(now.getTime() + preset.days * 24 * 60 * 60 * 1000);
                        setEditingSection({
                          ...editingSection,
                          publish_at: now.toISOString(),
                          unpublish_at: end.toISOString(),
                        });
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSection({
                      ...editingSection,
                      publish_at: null,
                      unpublish_at: null,
                    })}
                  >
                    Zurücksetzen
                  </Button>
                </div>
              </div>

              {(editingSection.publish_at || editingSection.unpublish_at) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  {editingSection.publish_at && (
                    <p>Sichtbar ab: <strong>{new Date(editingSection.publish_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></p>
                  )}
                  {editingSection.unpublish_at && (
                    <p>Ausgeblendet ab: <strong>{new Date(editingSection.unpublish_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></p>
                  )}
                  {editingSection.publish_at && editingSection.unpublish_at && (() => {
                    const start = new Date(editingSection.publish_at!);
                    const end = new Date(editingSection.unpublish_at!);
                    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    return <p className="mt-1 text-xs">Dauer: {days} Tage</p>;
                  })()}
                </div>
              )}

              <Separator />

              <Heading variant="h5" className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Reichweiten-Limits (Anzeigen)
              </Heading>
              <p className="text-xs text-muted-foreground -mt-2">Für bezahlte Karusselle: Sektion wird nach Erreichen der Limits automatisch ausgeblendet.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Max. Aufrufe (Views)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Unbegrenzt"
                    value={editingSection.max_views ?? ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      max_views: e.target.value ? parseInt(e.target.value) : null
                    })}
                  />
                  {editingSection.id && editingSection.current_views !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aktuell: {editingSection.current_views} Views
                      {editingSection.max_views && ` / ${editingSection.max_views}`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max. Klicks</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Unbegrenzt"
                    value={editingSection.max_clicks ?? ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      max_clicks: e.target.value ? parseInt(e.target.value) : null
                    })}
                  />
                  {editingSection.id && editingSection.current_clicks !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aktuell: {editingSection.current_clicks} Klicks
                      {editingSection.max_clicks && ` / ${editingSection.max_clicks}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* ============================================================================ */}
            {/* SECTION CONFIG EDITOR - Dynamic based on section type */}
            {/* ============================================================================ */}
            
            {/* ============================================================================ */}
            {/* CATEGORY GRID / RECIPIENT CATEGORY GRID / TOPIC TAGS GRID */}
            {/* ============================================================================ */}
            
            {(editingSection.type === 'category_grid' || 
              editingSection.type === 'recipient_category_grid' || 
              editingSection.type === 'topic_tags_grid') && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">
                  {editingSection.type === 'category_grid' && 'Category Grid Configuration'}
                  {editingSection.type === 'recipient_category_grid' && 'Recipient Category Grid Configuration'}
                  {editingSection.type === 'topic_tags_grid' && 'Topic Tags Grid Configuration'}
                </Heading>
                
                {/* Title (Required) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder={
                      editingSection.type === 'category_grid' ? 'e.g., Stöbern nach Kategorie' :
                      editingSection.type === 'recipient_category_grid' ? 'e.g., Geschenke nach Empfänger' :
                      'e.g., Beliebte Themen'
                    }
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                  <textarea
                    placeholder={
                      editingSection.type === 'category_grid' ? 'e.g., Entdecke Bücher nach Themengebiet...' :
                      editingSection.type === 'recipient_category_grid' ? 'e.g., Finde das perfekte Geschenk...' :
                      'e.g., Tauche ein in beliebte Buchthemen...'
                    }
                    value={editingSection.config?.description || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                {/* Columns (optional) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Columns per Row (optional)</label>
                  <Select
                    value={String(editingSection.config?.columns || 4)}
                    onValueChange={(value) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, columns: parseInt(value) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Spalten</SelectItem>
                      <SelectItem value="3">3 Spalten</SelectItem>
                      <SelectItem value="4">4 Spalten (Standard)</SelectItem>
                      <SelectItem value="5">5 Spalten</SelectItem>
                      <SelectItem value="6">6 Spalten</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Standard: 4 Spalten</p>
                </div>

                <Separator />

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  <strong className="block mb-2">💡 Nächste Schritte:</strong>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Speichere diese Section</li>
                    <li>Klicke auf den Chevron-Button, um die Section zu öffnen</li>
                    <li>Füge Items hinzu mit dem Section Items Manager</li>
                    <li>Jedes Item kann ein
                      {editingSection.type === 'category_grid' && ' Category Target'}
                      {editingSection.type === 'recipient_category_grid' && ' Category Target'}
                      {editingSection.type === 'topic_tags_grid' && ' Tag Target'}
                      {' '}haben
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            {/* ============================================================================ */}
            {/* HERO SECTION CONFIG EDITOR */}
            {/* ============================================================================ */}
            
            {editingSection.type === 'hero' && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">Hero Section Configuration</Heading>
                
                {/* Title (Required) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Willkommen bei coratiert.de"
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    placeholder="e.g., Entdecke handverlesene Buchempfehlungen..."
                    value={editingSection.config?.description || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, description: e.target.value }
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Image URL</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={editingSection.config?.image_url || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, image_url: e.target.value }
                    })}
                  />
                  {editingSection.config?.image_url && (
                    <img 
                      src={editingSection.config.image_url} 
                      alt="Hero Preview" 
                      className="mt-2 h-32 rounded object-cover border"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>

                <Separator />

                {/* CTA Configuration */}
                <div className="space-y-4 pt-2">
                  <Heading variant="h6" className="text-sm font-medium">Call-to-Action</Heading>
                  
                  {/* CTA Text */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">CTA Text</label>
                    <Input
                      type="text"
                      placeholder="e.g., Jetzt entdecken"
                      value={editingSection.config?.cta_text || ''}
                      onChange={(e) => setEditingSection({
                        ...editingSection,
                        config: { ...editingSection.config, cta_text: e.target.value }
                      })}
                    />
                  </div>

                  {/* CTA Target Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">CTA Target Type</label>
                    <Select
                      value={editingSection.config?.cta_target_type || 'url'}
                      onValueChange={(value) => setEditingSection({
                        ...editingSection,
                        config: { 
                          ...editingSection.config, 
                          cta_target_type: value,
                          // Clear other target fields when switching type
                          cta_target_page_id: undefined,
                          cta_target_category_id: undefined,
                          cta_target_tag_id: undefined,
                          cta_target_template_key: undefined,
                          cta_target_url: value === 'url' ? editingSection.config?.cta_target_url : undefined,
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="page">Page</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="tag">Tag</SelectItem>
                        <SelectItem value="template">Template</SelectItem>
                        <SelectItem value="url">External URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CTA Target Fields (conditional) */}
                  {editingSection.config?.cta_target_type === 'url' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">URL</label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={editingSection.config?.cta_target_url || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, cta_target_url: e.target.value }
                        })}
                      />
                    </div>
                  )}

                  {editingSection.config?.cta_target_type === 'page' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Page ID</label>
                      <Input
                        type="number"
                        placeholder="Page ID"
                        value={editingSection.config?.cta_target_page_id || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, cta_target_page_id: e.target.value ? parseInt(e.target.value) : undefined }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">💡 Page Picker kommt in Phase 2</p>
                    </div>
                  )}

                  {editingSection.config?.cta_target_type === 'category' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category ID</label>
                      <Input
                        type="number"
                        placeholder="Category ID"
                        value={editingSection.config?.cta_target_category_id || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, cta_target_category_id: e.target.value ? parseInt(e.target.value) : undefined }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">💡 Category Picker kommt in Phase 2</p>
                    </div>
                  )}

                  {editingSection.config?.cta_target_type === 'tag' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tag ID</label>
                      <Input
                        type="number"
                        placeholder="Tag ID"
                        value={editingSection.config?.cta_target_tag_id || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, cta_target_tag_id: e.target.value ? parseInt(e.target.value) : undefined }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">💡 Tag Picker kommt in Phase 2</p>
                    </div>
                  )}

                  {editingSection.config?.cta_target_type === 'template' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Template Key</label>
                      <Input
                        type="text"
                        placeholder="e.g., book-details"
                        value={editingSection.config?.cta_target_template_key || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, cta_target_template_key: e.target.value }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">💡 Template Picker kommt in Phase 2</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {editingSection.type === 'category_hero' && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">Kategorie-Hero Konfiguration</Heading>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Titel <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="z.B. Belletristik"
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">SEO-Text / Beschreibung</label>
                  <textarea
                    placeholder="z.B. Entdecke die besten Romane, Erzählungen und literarische Highlights..."
                    value={editingSection.config?.subtitle || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, subtitle: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Hintergrundbild-URL</label>
                  <Input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={editingSection.config?.backgroundImage || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, backgroundImage: e.target.value }
                    })}
                  />
                  {editingSection.config?.backgroundImage && (
                    <img 
                      src={editingSection.config.backgroundImage} 
                      alt="Hero-Vorschau" 
                      className="mt-2 h-32 w-full rounded object-cover border"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">Unsplash-Bildersuche</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="z.B. books, library, reading..."
                      value={heroUnsplashQuery}
                      onChange={(e) => setHeroUnsplashQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') searchHeroUnsplash(heroUnsplashQuery); }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => searchHeroUnsplash(heroUnsplashQuery)}
                      disabled={heroUnsplashLoading || !heroUnsplashQuery.trim()}
                    >
                      {heroUnsplashLoading ? '...' : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  {heroUnsplashResults.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {heroUnsplashResults.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => {
                            setEditingSection({
                              ...editingSection,
                              config: { ...editingSection.config, backgroundImage: img.url }
                            });
                            setHeroUnsplashResults([]);
                            setHeroUnsplashQuery('');
                          }}
                          className="relative aspect-video rounded overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors group"
                        >
                          <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            Foto: {img.author}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Bilder von Unsplash (Querformat, ideal für Hero-Banner)</p>
                </div>
              </div>
            )}

            {editingSection.type === 'creator_carousel' && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">Creator Carousel Configuration</Heading>
                
                {/* Title (Required) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="z.B. Neue Bücher"
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Input
                    type="text"
                    placeholder="z.B. Frisch erschienen und handverlesen"
                    value={editingSection.config?.description || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, description: e.target.value }
                    })}
                  />
                </div>

                {/* Kurator:in auswählen */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Kurator:in <span className="text-red-500">*</span>
                  </label>

                  {editingSection.config?.curatorId && (() => {
                    const selected = curators.find(c => String(c.id) === String(editingSection.config?.curatorId));
                    const displayName = selected?.name || editingSection.config?.curatorName || '';
                    const displayAvatar = selected?.avatar || editingSection.config?.curatorAvatar || '';
                    const displayFocus = selected?.focus || editingSection.config?.curatorFocus || '';
                    const displayVerified = selected?.verified ?? editingSection.config?.isVerified ?? false;
                    if (!displayName) return null;
                    return (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 mb-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm truncate">{displayName}</span>
                            {displayVerified && <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#247ba0' }} />}
                          </div>
                          {displayFocus && <span className="text-xs text-gray-500 truncate block">{displayFocus}</span>}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                          setEditingSection({ ...editingSection, config: { ...editingSection.config, curatorId: null, curatorName: '', curatorAvatar: '', curatorFocus: '', curatorBio: '', isVerified: false } });
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })()}

                  {!editingSection.config?.curatorId && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Kurator:in suchen..."
                          className="pl-9"
                          value={curatorSearch}
                          onChange={(e) => setCuratorSearch(e.target.value)}
                          onFocus={() => loadCurators()}
                        />
                      </div>
                      {curatorsLoading && <p className="text-xs text-gray-500 p-2">Lade Kurator:innen...</p>}
                      {!curatorsLoading && curators.length > 0 && (
                        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                          {curators
                            .filter(c => {
                              if (!curatorSearch.trim()) return true;
                              const q = curatorSearch.toLowerCase();
                              return (c.name || '').toLowerCase().includes(q) || (c.focus || '').toLowerCase().includes(q);
                            })
                            .map(curator => (
                              <button
                                key={curator.id}
                                type="button"
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 transition-colors text-left"
                                onClick={() => {
                                  setEditingSection({
                                    ...editingSection,
                                    config: {
                                      ...editingSection.config,
                                      curatorId: String(curator.id),
                                      curatorName: curator.name || '',
                                      curatorAvatar: curator.avatar || '',
                                      curatorFocus: curator.focus || '',
                                      curatorBio: curator.bio || '',
                                      isVerified: Boolean(curator.verified),
                                    }
                                  });
                                  setCuratorSearch('');
                                }}
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                  {curator.avatar ? (
                                    <img src={curator.avatar} alt={curator.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium truncate">{curator.name}</span>
                                    {curator.verified && <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#247ba0' }} />}
                                  </div>
                                  {curator.focus && <span className="text-xs text-gray-500 truncate block">{curator.focus}</span>}
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                      {!curatorsLoading && curators.length === 0 && curatorSearch && (
                        <p className="text-xs text-gray-500 p-2">Keine Kurator:innen gefunden</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Curator Reason */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Curator Reason
                    <span className="text-xs text-gray-500 ml-2">(overrides Description)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Diese Bücher bieten einen guten Einstieg..."
                    value={editingSection.config?.curatorReason || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, curatorReason: e.target.value }
                    })}
                  />
                </div>

                <Separator />

                {/* Show Video Toggle */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="showVideo"
                    checked={editingSection.config?.showVideo || false}
                    onCheckedChange={(checked) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, showVideo: !!checked }
                    })}
                  />
                  <label htmlFor="showVideo" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Show Video in Carousel
                  </label>
                </div>

                {/* Video Fields - only shown when showVideo is true */}
                {editingSection.config?.showVideo && (
                  <div className="space-y-4 pl-7 border-l-2 border-gray-200">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Video URL</label>
                      <Input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={editingSection.config?.videoUrl || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoUrl: e.target.value }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">YouTube, Vimeo, or direct MP4</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Video Thumbnail URL</label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={editingSection.config?.videoThumbnail || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoThumbnail: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Video Title</label>
                      <Input
                        type="text"
                        placeholder="Podcast Episode: ..."
                        value={editingSection.config?.videoTitle || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoTitle: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Video Card Background</label>
                      <Input
                        type="text"
                        placeholder="#F5F5F5"
                        value={editingSection.config?.videoCardBg || '#F5F5F5'}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoCardBg: e.target.value }
                        })}
                      />
                      <div 
                        className="mt-2 h-8 rounded border"
                        style={{ backgroundColor: editingSection.config?.videoCardBg || '#F5F5F5' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================================ */}
            {/* BOOK CAROUSEL CONFIG EDITOR */}
            {/* ============================================================================ */}
            
            {editingSection.type === 'book_carousel' && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">Book Carousel Configuration</Heading>
                
                {/* Title (Required) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="z.B. Neue Bücher"
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    placeholder="z.B. Frisch erschienen und handverlesen"
                    value={editingSection.config?.description || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                {/* Kurator:in auswählen (Book Carousel) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Kurator:in <span className="text-red-500">*</span>
                  </label>

                  {editingSection.config?.curatorId && (() => {
                    const selected = curators.find(c => String(c.id) === String(editingSection.config?.curatorId));
                    const displayName = selected?.name || editingSection.config?.curatorName || '';
                    const displayAvatar = selected?.avatar || editingSection.config?.curatorAvatar || '';
                    const displayFocus = selected?.focus || editingSection.config?.curatorFocus || '';
                    const displayVerified = selected?.verified ?? editingSection.config?.isVerified ?? false;
                    if (!displayName) return null;
                    return (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 mb-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm truncate">{displayName}</span>
                            {displayVerified && <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#247ba0' }} />}
                          </div>
                          {displayFocus && <span className="text-xs text-gray-500 truncate block">{displayFocus}</span>}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                          setEditingSection({ ...editingSection, config: { ...editingSection.config, curatorId: null, curatorName: '', curatorAvatar: '', curatorFocus: '', curatorBio: '', isVerified: false } });
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })()}

                  {!editingSection.config?.curatorId && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Kurator:in suchen..."
                          className="pl-9"
                          value={curatorSearch}
                          onChange={(e) => setCuratorSearch(e.target.value)}
                          onFocus={() => loadCurators()}
                        />
                      </div>
                      {curatorsLoading && <p className="text-xs text-gray-500 p-2">Lade Kurator:innen...</p>}
                      {!curatorsLoading && curators.length > 0 && (
                        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                          {curators
                            .filter(c => {
                              if (!curatorSearch.trim()) return true;
                              const q = curatorSearch.toLowerCase();
                              return (c.name || '').toLowerCase().includes(q) || (c.focus || '').toLowerCase().includes(q);
                            })
                            .map(curator => (
                              <button
                                key={curator.id}
                                type="button"
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 transition-colors text-left"
                                onClick={() => {
                                  setEditingSection({
                                    ...editingSection,
                                    config: {
                                      ...editingSection.config,
                                      curatorId: String(curator.id),
                                      curatorName: curator.name || '',
                                      curatorAvatar: curator.avatar || '',
                                      curatorFocus: curator.focus || '',
                                      curatorBio: curator.bio || '',
                                      isVerified: Boolean(curator.verified),
                                    }
                                  });
                                  setCuratorSearch('');
                                }}
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                  {curator.avatar ? (
                                    <img src={curator.avatar} alt={curator.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium truncate">{curator.name}</span>
                                    {curator.verified && <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#247ba0' }} />}
                                  </div>
                                  {curator.focus && <span className="text-xs text-gray-500 truncate block">{curator.focus}</span>}
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Curator Reason */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Begründung
                    <span className="text-xs text-gray-500 ml-2">(überschreibt Description)</span>
                  </label>
                  <textarea
                    placeholder="z.B. Diese Bücher bieten einen guten Einstieg..."
                    value={editingSection.config?.curatorReason || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, curatorReason: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                {/* Category Filter (optional, auto-applied on category pages) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Kategorie-Filter
                    <span className="text-xs text-gray-500 ml-2">(optional — wird auf Kategorie-Seiten automatisch gesetzt)</span>
                  </label>
                  <Select
                    value={editingSection.config?.categoryId ? String(editingSection.config.categoryId) : 'none'}
                    onValueChange={(val) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, categoryId: val === 'none' ? undefined : parseInt(val) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keine Kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Kategorie</SelectItem>
                      {(allOnixTags || [])
                        .filter((t: any) => t.tag_type === 'category' || t.tag_type === 'topic' || t.onix_code)
                        .slice(0, 50)
                        .map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.displayName || t.name} {t.tag_type ? `(${t.tag_type})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Show Video Toggle */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="showVideoBookCarousel"
                    checked={editingSection.config?.showVideo || false}
                    onCheckedChange={(checked) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, showVideo: !!checked }
                    })}
                  />
                  <label htmlFor="showVideoBookCarousel" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Show Video in Carousel
                  </label>
                </div>

                {/* Video Fields - only shown when showVideo is true */}
                {editingSection.config?.showVideo && (
                  <div className="space-y-4 pl-7 border-l-2 border-gray-200">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Video URL <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={editingSection.config?.videoUrl || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoUrl: e.target.value }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">YouTube, Vimeo, or direct MP4</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Video Thumbnail URL <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={editingSection.config?.videoThumbnail || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoThumbnail: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Video Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Podcast Episode: ..."
                        value={editingSection.config?.videoTitle || ''}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoTitle: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Video Card Background</label>
                      <Input
                        type="text"
                        placeholder="#F5F5F5"
                        value={editingSection.config?.videoCardBg || '#F5F5F5'}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          config: { ...editingSection.config, videoCardBg: e.target.value }
                        })}
                      />
                      <div 
                        className="mt-2 h-8 rounded border"
                        style={{ backgroundColor: editingSection.config?.videoCardBg || '#F5F5F5' }}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Book Source Builder */}
                {editingSection.id && (
                  <BookSourceBuilder
                    sectionId={editingSection.id}
                    config={editingSection.config?.books || { mode: 'manual' }}
                    onChange={(booksConfig) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, books: booksConfig }
                    })}
                  />
                )}

                {!editingSection.id && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                    💡 <strong>Hinweis:</strong> Speichere die Section zuerst, um den Book Source Builder zu nutzen.
                  </div>
                )}
              </div>
            )}

            {/* ============================================================================ */}
            {/* BOOK GRID FILTERED CONFIG EDITOR */}
            {/* ============================================================================ */}

            {editingSection.type === 'book_grid_filtered' && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">Buch-Grid (gefiltert) Konfiguration</Heading>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="z.B. Debüts in Belletristik"
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    placeholder="z.B. Neue Stimmen in der Belletristik"
                    value={editingSection.config?.description || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, description: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sortierung / Filter-Preset
                  </label>
                  <Select
                    value={editingSection.config?.filterPreset || 'relevance'}
                    onValueChange={(value) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, filterPreset: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevanz</SelectItem>
                      <SelectItem value="newest">Neueste</SelectItem>
                      <SelectItem value="most-awarded">Anzahl Buchpreise</SelectItem>
                      <SelectItem value="popular">Beliebt</SelectItem>
                      <SelectItem value="hidden-gems">Hidden Gems</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Bestimmt, welche Bücher in welcher Reihenfolge angezeigt werden.</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Anzahl Bücher</label>
                  <Select
                    value={String(editingSection.config?.limit || 12)}
                    onValueChange={(value) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, limit: parseInt(value) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Bücher</SelectItem>
                      <SelectItem value="12">12 Bücher (Standard)</SelectItem>
                      <SelectItem value="18">18 Bücher</SelectItem>
                      <SelectItem value="24">24 Bücher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  <strong>💡 Hinweis:</strong> Auf Kategorie-Seiten wird automatisch nach der Seitenkategorie gefiltert.
                  Die Sortierung bestimmt zusätzlich die Reihenfolge der Bücher.
                </div>
              </div>
            )}

            {/* ============================================================================ */}
            {/* USER CURATIONS CONFIG EDITOR */}
            {/* ============================================================================ */}

            {editingSection.type === 'user_curations' && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">Nutzer-Kurationen Konfiguration</Heading>

                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    type="text"
                    placeholder="z.B. Kurationen unserer Community"
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    placeholder="z.B. Entdecke Bücherlisten zu diesem Thema"
                    value={editingSection.config?.description || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, description: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Anzahl Kurationen</label>
                  <Select
                    value={String(editingSection.config?.limit || 6)}
                    onValueChange={(value) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, limit: parseInt(value) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Kurationen</SelectItem>
                      <SelectItem value="6">6 Kurationen (Standard)</SelectItem>
                      <SelectItem value="9">9 Kurationen</SelectItem>
                      <SelectItem value="12">12 Kurationen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  <strong>💡 Hinweis:</strong> Auf Kategorie-Seiten werden automatisch nur Kurationen angezeigt,
                  die zur Seitenkategorie passen.
                </div>
              </div>
            )}

            {/* ============================================================================ */}
            {/* ALL OTHER BOOK SECTIONS (book_grid, book_list_row, book_featured) */}
            {/* ============================================================================ */}
            
            {(editingSection.type === 'book_grid' || editingSection.type === 'book_list_row' || editingSection.type === 'book_featured') && (
              <div className="space-y-4 pt-4 border-t">
                <Heading variant="h5" className="text-sm font-semibold">{editingSection.type} Configuration</Heading>
                
                {/* Title (Required) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Unsere Top Picks"
                    value={editingSection.config?.title || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, title: e.target.value }
                    })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    placeholder="e.g., Handverlesene Buchempfehlungen"
                    value={editingSection.config?.description || ''}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                <Separator />

                {/* Book Source Builder */}
                {editingSection.id && (
                  <BookSourceBuilder
                    sectionId={editingSection.id}
                    config={editingSection.config?.books || { mode: 'manual' }}
                    onChange={(booksConfig) => setEditingSection({
                      ...editingSection,
                      config: { ...editingSection.config, books: booksConfig }
                    })}
                  />
                )}

                {!editingSection.id && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                    💡 <strong>Hinweis:</strong> Speichere die Section zuerst, um den Book Source Builder zu nutzen.
                  </div>
                )}
              </div>
            )}

            <Separator />

            {editingSection.id && !isQueryOnlySection(editingSection.type) && (
              <SectionItemsManager sectionId={editingSection.id} sectionType={editingSection.type} />
            )}

            <Separator />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingSection(null)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveSection}>
                <Save className="w-4 h-4 mr-2" />
                Sektion speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SECTION CARD COMPONENT
// ============================================================================

interface SectionCardProps {
  section: PageSection;
  isExpanded: boolean;
  onToggleItems: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (draggedId: number, targetId: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function SectionCard({ 
  section, 
  isExpanded, 
  onToggleItems, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onMove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: SectionCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // ❌ BUILD-BLOCKER: DnD disabled for Figma Make publishing
  // Use arrow buttons for reordering instead
  const isDragging = false;
  const isOver = false;
  const drag = (node: HTMLElement | null) => node;
  const drop = (node: HTMLElement | null) => node;

  drag(drop(ref.current) as any);

  return (
    <div 
      className="border rounded-lg bg-white" 
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        borderColor: isOver ? '#3B82F6' : '#E5E7EB',
        borderWidth: isOver ? '2px' : '1px',
        backgroundColor: isOver ? '#EFF6FF' : '#FFFFFF',
      }}
    >
      {/* Section Header */}
      <div className="p-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={isFirst}
              className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Nach oben verschieben"
            >
              <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={isLast}
              className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Nach unten verschieben"
            >
              <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {section.config?.title || section.type}
              </span>
              <Badge variant="outline" className="text-xs">
                {section.type}
              </Badge>
              <Badge variant={section.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                {section.status === 'published' ? 'Live' : 'Entwurf'}
              </Badge>
              {section.visibility === 'hidden' && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="w-3 h-3 mr-1" />
                  Versteckt
                </Badge>
              )}
              {(section.publish_at || section.unpublish_at) && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Geplant
                </Badge>
              )}
              {(section.max_views || section.max_clicks) && (
                <Badge variant="outline" className="text-xs">
                  Limit: {section.max_views ? `${section.current_views || 0}/${section.max_views} Views` : ''}{section.max_views && section.max_clicks ? ' | ' : ''}{section.max_clicks ? `${section.current_clicks || 0}/${section.max_clicks} Klicks` : ''}
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Reihenfolge: {section.sort_order}
              {section.publish_at && <span className="ml-2">Ab: {new Date(section.publish_at).toLocaleDateString('de-DE')}</span>}
              {section.unpublish_at && <span className="ml-2">Bis: {new Date(section.unpublish_at).toLocaleDateString('de-DE')}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isQueryOnlySection(section.type) && (
          <Button size="sm" variant="ghost" onClick={onToggleItems} title={isExpanded ? 'Elemente ausblenden' : 'Elemente anzeigen'}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDuplicate}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>

      {isExpanded && !isQueryOnlySection(section.type) && (
        <div className="border-t bg-gray-50 p-4">
          <SectionItemsManager sectionId={section.id} sectionType={section.type} />
        </div>
      )}
    </div>
  );
}