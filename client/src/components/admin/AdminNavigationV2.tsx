/**
 * ==================================================================
 * ADMIN NAVIGATION - CRUD Interface
 * ==================================================================
 * 
 * Complete CRUD interface for Navigation system with:
 * - Load from database via API
 * - Create/Edit/Delete items
 * - Hierarchical tree view
 * - Reorder with arrow buttons
 * - Publish/Draft workflow
 * - Location filter (Header/Footer)
 * - Fallback export
 * 
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  AlertCircle,
  Loader2,
  Layout,
  FolderTree,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { getAdminToken } from '../../utils/adminToken';
import { NavigationPageLinker } from './NavigationPageLinker';

// ==================================================================
// TYPES
// ==================================================================

interface NavigationItem {
  id: number;
  name: string;
  label: string;
  slug: string;
  path: string | null;
  description: string | null;
  icon: string | null;
  parent_id: number | null;
  level: number;
  column_id: number | null;
  display_order: number;
  visible: boolean;
  status: 'draft' | 'published';
  
  kind?: 'link' | 'group' | 'heading' | 'divider' | 'promo';
  location?: 'header' | 'footer' | 'mobile' | 'sidebar';
  panel_layout?: 'none' | 'mega' | 'dropdown';
  target_type?: 'page' | 'category' | 'tag' | 'book' | 'external' | null;
  target_page_id?: number | null;
  target_category_id?: number | null;
  target_tag_id?: number | null;
  
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  
  clickable?: boolean;
  scope?: string;

  children?: NavigationItem[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================================================================
// API BASE
// ==================================================================

function getApiBase(): string {
    return '/api';
}

function getAdminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// ==================================================================
// DRAGGABLE NAVIGATION ITEM COMPONENT
// ==================================================================

interface DraggableItemProps {
  item: NavigationItem;
  depth: number;
  isExpanded: boolean;
  isEditing: boolean;
  editForm: Partial<NavigationItem>;
  onToggleExpand: (id: number) => void;
  onStartEdit: (item: NavigationItem) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: number) => void;
  onUpdateForm: (form: Partial<NavigationItem>) => void;
  onMove: (itemId: number, newOrder: number, newParentId: number | null) => void;
  onMoveUp: (itemId: number) => void;
  onMoveDown: (itemId: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  allItems: NavigationItem[];
  saving: boolean;
}

function DraggableNavigationItem({
  item,
  depth,
  isExpanded,
  isEditing,
  editForm,
  onToggleExpand,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdateForm,
  onMove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  allItems,
  saving
}: DraggableItemProps) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      style={{
        marginLeft: `${depth * 24}px`,
      }}
    >
      {/* ITEM ROW */}
      <div
        className="flex items-center gap-2 p-3 rounded border mb-2 hover:bg-gray-50"
        style={{
          borderColor: '#E5E7EB',
          backgroundColor: isEditing ? '#FEF3C7' : '#FFFFFF',
        }}
      >
        {/* Reorder Buttons */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onMoveUp(item.id)}
            disabled={!canMoveUp}
            className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Nach oben"
            data-testid={`button-move-up-${item.id}`}
          >
            <ArrowUp className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={() => onMoveDown(item.id)}
            disabled={!canMoveDown}
            className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Nach unten"
            data-testid={`button-move-down-${item.id}`}
          >
            <ArrowDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(item.id)}
            className="p-1 hover:bg-gray-100 rounded"
            data-testid={`button-toggle-${item.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Visibility Icon */}
        {item.visible ? (
          <Eye className="w-4 h-4 text-green-600" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}

        {/* Status Badge */}
        <span
          className="px-2 py-1 text-xs rounded font-medium"
          style={{
            backgroundColor: item.status === 'published' ? '#D1FAE5' : '#FEE2E2',
            color: item.status === 'published' ? '#065F46' : '#991B1B',
          }}
          data-testid={`status-badge-${item.id}`}
        >
          {item.status}
        </span>

        {/* Name */}
        {isEditing ? (
          <input
            type="text"
            value={editForm.name || ''}
            onChange={(e) => onUpdateForm({ ...editForm, name: e.target.value })}
            className="flex-1 px-3 py-1 border rounded"
            style={{ borderColor: '#E5E7EB' }}
            data-testid={`input-edit-name-${item.id}`}
          />
        ) : (
          <span className="flex-1 font-medium" data-testid={`text-name-${item.id}`}>
            {item.name || item.slug || item.path || 'Unnamed Item'}
          </span>
        )}

        {/* Slug */}
        <span className="text-sm text-gray-500 font-mono">
          {item.slug ? `/${item.slug}` : item.path || '—'}
        </span>

        {/* Order */}
        <span className="text-xs text-gray-400">#{item.display_order}</span>

        {/* Actions */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                disabled={saving}
                className="p-2 rounded hover:bg-green-100"
                data-testid={`button-save-${item.id}`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-green-600" />
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={saving}
                className="p-2 rounded hover:bg-gray-200"
                data-testid={`button-cancel-${item.id}`}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onStartEdit(item)}
                className="p-2 rounded hover:bg-blue-100"
                data-testid={`button-edit-${item.id}`}
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 rounded hover:bg-red-100"
                data-testid={`button-delete-${item.id}`}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* EDIT FORM (Expanded) */}
      {isEditing && (
        <div
          className="ml-12 mb-4 p-4 border rounded"
          style={{
            borderColor: '#E5E7EB',
            backgroundColor: '#FFFBEB',
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Übergeordnetes Element (Parent)</label>
              <select
                value={editForm.parent_id ?? ''}
                onChange={(e) => onUpdateForm({ ...editForm, parent_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E5E7EB' }}
                data-testid={`select-parent-${item.id}`}
              >
                <option value="">— Kein übergeordnetes Element (Root) —</option>
                {allItems
                  .filter(i => i.id !== item.id && i.parent_id === null)
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                  .map(i => (
                    <option key={i.id} value={i.id}>{i.name || i.slug}</option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={editForm.slug || ''}
                onChange={(e) => onUpdateForm({ ...editForm, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Path</label>
              <input
                type="text"
                value={editForm.path || ''}
                onChange={(e) => onUpdateForm({ ...editForm, path: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kind</label>
              <select
                value={editForm.kind || 'link'}
                onChange={(e) => onUpdateForm({ ...editForm, kind: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="link">Link</option>
                <option value="group">Group</option>
                <option value="heading">Heading</option>
                <option value="divider">Divider</option>
                <option value="promo">Promo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <select
                value={editForm.location || 'header'}
                onChange={(e) => onUpdateForm({ ...editForm, location: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="mobile">Mobile</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Panel Layout</label>
              <select
                value={editForm.panel_layout || 'none'}
                onChange={(e) => onUpdateForm({ ...editForm, panel_layout: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="none">None</option>
                <option value="mega">Mega Menu</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editForm.status || 'draft'}
                onChange={(e) => onUpdateForm({ ...editForm, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.visible !== false}
                  onChange={(e) => onUpdateForm({ ...editForm, visible: e.target.checked })}
                />
                <span className="text-sm font-medium">Visible</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.clickable !== false}
                  onChange={(e) => onUpdateForm({ ...editForm, clickable: e.target.checked })}
                />
                <span className="text-sm font-medium">Clickable</span>
              </label>
            </div>

            {/* Page Linker - nur für Link-Items - volle Breite */}
            {item.kind === 'link' && item.id && (
              <div className="col-span-2">
                <NavigationPageLinker
                  menuItemId={item.id}
                  currentTargetType={item.target_type === 'page' ? 'page' : item.target_type === 'external' ? 'url' : null}
                  currentTargetPageId={item.target_page_id}
                  currentPath={item.path}
                  onLinked={() => {
                    onSave();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================================
// CREATE ITEM MODAL
// ==================================================================

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (item: Partial<NavigationItem>) => Promise<void>;
  items: NavigationItem[];
  defaultLocation: 'header' | 'footer';
}

function CreateItemModal({ isOpen, onClose, onCreate, items, defaultLocation }: CreateModalProps) {
  const [form, setForm] = useState<Partial<NavigationItem>>({
    name: '',
    label: '',
    slug: '',
    path: '',
    kind: 'link',
    location: defaultLocation,
    scope: 'public',
    panel_layout: 'none',
    clickable: true,
    visible: true,
    status: 'draft',
    parent_id: null,
    column_id: null,
    display_order: 0
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setForm(prev => ({ ...prev, location: defaultLocation }));
  }, [defaultLocation]);

  const handleCreate = async () => {
    if (!form.name || form.name.trim() === '' || !form.slug || form.slug.trim() === '') {
      alert('Name and Slug are required and cannot be empty');
      return;
    }

    const formWithLabel = {
      ...form,
      label: (form.label?.trim() || form.name?.trim() || 'Unnamed')
    };

    setCreating(true);
    try {
      await onCreate(formWithLabel);
      setForm({
        name: '',
        label: '',
        slug: '',
        path: '',
        kind: 'link',
        location: defaultLocation,
        scope: 'public',
        panel_layout: 'none',
        clickable: true,
        visible: true,
        status: 'draft',
        parent_id: null,
        column_id: null,
        display_order: 0
      });
      onClose();
    } catch (error) {
      console.error('Create failed:', error);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create Navigation Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded" data-testid="button-close-create-modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. Belletristik"
              data-testid="input-create-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Label * (Display Text)</label>
            <input
              type="text"
              value={form.label || ''}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. Belletristik"
              data-testid="input-create-label"
            />
            <p className="text-xs text-gray-500 mt-1">
              The visible text in the menu. Leave empty to use Name.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              value={form.slug || ''}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. belletristik"
              data-testid="input-create-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Path</label>
            <input
              type="text"
              value={form.path || ''}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. /belletristik"
              data-testid="input-create-path"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kind</label>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                data-testid="select-create-kind"
              >
                <option value="link">Link</option>
                <option value="group">Group</option>
                <option value="heading">Heading</option>
                <option value="divider">Divider</option>
                <option value="promo">Promo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                data-testid="select-create-location"
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="mobile">Mobile</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Panel Layout</label>
              <select
                value={form.panel_layout || 'none'}
                onChange={(e) => setForm({ ...form, panel_layout: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                data-testid="select-create-panel-layout"
              >
                <option value="none">None</option>
                <option value="mega">Mega Menu</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
                data-testid="select-create-status"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Parent Item</label>
              <select
                value={form.parent_id || ''}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded"
                data-testid="select-create-parent"
              >
                <option value="">None (Top Level)</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
                data-testid="input-create-order"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.visible !== false}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              />
              <span className="text-sm font-medium">Visible</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.clickable !== false}
                onChange={(e) => setForm({ ...form, clickable: e.target.checked })}
              />
              <span className="text-sm font-medium">Clickable</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCreate}
            disabled={creating || !form.name || !form.slug}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            data-testid="button-create-submit"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 inline mr-2" />
                Create Item
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            data-testid="button-create-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================================
// MAIN COMPONENT
// ==================================================================

export function AdminNavigationV2() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<NavigationItem>>({});
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [locationFilter, setLocationFilter] = useState<'header' | 'footer' | 'all'>('header');
  const [exportSuccess, setExportSuccess] = useState(false);

  // ==================================================================
  // FETCH DATA
  // ==================================================================

  const fetchNavigation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBase()}/navigation/admin/items`, {
            credentials: 'include',
        headers: getAdminHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result: ApiResponse<NavigationItem[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch navigation');
      }

      setItems(result.data || []);
      
      if (error) {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      let friendlyMessage = errorMessage;
      
      if (errorMessage.includes('Failed to fetch')) {
        friendlyMessage = 'Netzwerkfehler: Server ist nicht erreichbar. Bitte überprüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.';
      } else if (errorMessage.includes('CORS')) {
        friendlyMessage = 'CORS-Fehler: Die Server-Konfiguration erlaubt diese Anfrage nicht.';
      } else if (errorMessage.includes('401')) {
        friendlyMessage = 'Authentifizierungsfehler: Bitte melden Sie sich erneut an.';
      }
      
      setError(`Navigation konnte nicht geladen werden: ${friendlyMessage}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigation();
  }, []);

  // ==================================================================
  // TREE HELPERS
  // ==================================================================

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const buildTree = (items: NavigationItem[]): NavigationItem[] => {
    const itemMap = new Map<number, NavigationItem>();
    const roots: NavigationItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    itemMap.forEach(item => {
      if (item.parent_id === null) {
        roots.push(item);
      } else {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(item);
        } else {
          roots.push(item);
        }
      }
    });

    const sortByOrder = (items: NavigationItem[]) => {
      items.sort((a, b) => a.display_order - b.display_order);
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortByOrder(item.children);
        }
      });
    };

    sortByOrder(roots);
    return roots;
  };

  // ==================================================================
  // LOCATION FILTER
  // ==================================================================

  const getFilteredItems = () => {
    if (locationFilter === 'all') return items;
    if (locationFilter === 'header') {
      return items.filter(item => !item.location || item.location === 'header');
    }
    return items.filter(item => item.location === locationFilter);
  };

  // ==================================================================
  // CRUD OPERATIONS
  // ==================================================================

  const startEdit = (item: NavigationItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      slug: item.slug,
      path: item.path,
      icon: item.icon,
      kind: item.kind,
      location: item.location,
      scope: item.scope,
      panel_layout: item.panel_layout,
      clickable: item.clickable,
      visible: item.visible,
      status: item.status,
      parent_id: item.parent_id,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    if (!editForm.name || editForm.name.trim() === '') {
      alert('Name is required and cannot be empty');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id: editingId,
        name: editForm.name.trim(),
        label: editForm.name.trim(),
        slug: editForm.slug,
        path: editForm.path || null,
        description: null,
        icon: editForm.icon || null,
        parent_id: editForm.parent_id || null,
        level: editForm.level || 0,
        column_id: editForm.column_id || null,
        display_order: editForm.display_order || 0,
        visible: editForm.visible !== false,
        status: editForm.status || 'draft',
        kind: editForm.kind || 'link',
        location: editForm.location || 'header',
        panel_layout: editForm.panel_layout || 'none',
        target_type: editForm.target_type || null,
        target_page_id: editForm.target_page_id || null,
        target_category_id: editForm.target_category_id || null,
        target_tag_id: editForm.target_tag_id || null,
      };

      const response = await fetch(`${getApiBase()}/navigation/admin/items`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: ApiResponse<NavigationItem> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      await fetchNavigation();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Save error:', err);
      alert(`Failed to save: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this navigation item?')) {
      return;
    }

    try {
      const response = await fetch(`${getApiBase()}/navigation/admin/items/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete');
      }

      await fetchNavigation();
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Failed to delete: ${err}`);
    }
  };

  const createItem = async (item: Partial<NavigationItem>) => {
    try {
      if (!item.name || item.name.trim() === '') {
        throw new Error('Name is required and cannot be empty');
      }

      const trimmedName = item.name.trim();
      const trimmedLabel = item.label?.trim() || trimmedName;

      const payload = {
        name: trimmedName,
        label: trimmedLabel,
        slug: item.slug?.trim() || trimmedName.toLowerCase().replace(/\s+/g, '-'),
        path: item.path?.trim() || null,
        description: null,
        icon: item.icon || null,
        parent_id: item.parent_id || null,
        level: item.level || 0,
        column_id: item.column_id || null,
        display_order: item.display_order || 0,
        visible: item.visible !== false,
        status: item.status || 'draft',
        kind: item.kind || 'link',
        location: item.location || 'header',
        scope: item.scope || 'public',
        panel_layout: item.panel_layout || 'none',
        clickable: item.clickable !== false,
      };

      const response = await fetch(`${getApiBase()}/navigation/admin/items`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: ApiResponse<NavigationItem> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create');
      }

      await fetchNavigation();
    } catch (err) {
      console.error('Create error:', err);
      throw err;
    }
  };

  const moveItem = async (itemId: number, newOrder: number, newParentId: number | null) => {
    try {
      const response = await fetch(`${getApiBase()}/navigation/admin/items`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({
          id: itemId,
          display_order: newOrder,
          parent_id: newParentId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchNavigation();
    } catch (err) {
      console.error('Move error:', err);
      alert(`Failed to move: ${err}`);
    }
  };

  const reorderItems = async (reorderedItems: { id: number; display_order: number; parent_id: number | null }[]) => {
    try {
      const response = await fetch(`${getApiBase()}/navigation/admin/items/reorder`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({ items: reorderedItems }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchNavigation();
    } catch (err) {
      console.error('Reorder error:', err);
      alert(`Sortierung fehlgeschlagen: ${err}`);
    }
  };

  const moveItemUp = (itemId: number) => {
    const siblings = items.filter(i => {
      const item = items.find(x => x.id === itemId);
      return item && i.parent_id === item.parent_id;
    });
    siblings.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = siblings.findIndex(s => s.id === itemId);
    if (idx <= 0) return;

    const reordered = siblings.map((s, i) => {
      if (i === idx - 1) return { id: s.id, display_order: idx, parent_id: s.parent_id };
      if (i === idx) return { id: s.id, display_order: idx - 1, parent_id: s.parent_id };
      return { id: s.id, display_order: i, parent_id: s.parent_id };
    });
    reorderItems(reordered);
  };

  const moveItemDown = (itemId: number) => {
    const siblings = items.filter(i => {
      const item = items.find(x => x.id === itemId);
      return item && i.parent_id === item.parent_id;
    });
    siblings.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = siblings.findIndex(s => s.id === itemId);
    if (idx < 0 || idx >= siblings.length - 1) return;

    const reordered = siblings.map((s, i) => {
      if (i === idx) return { id: s.id, display_order: idx + 1, parent_id: s.parent_id };
      if (i === idx + 1) return { id: s.id, display_order: idx, parent_id: s.parent_id };
      return { id: s.id, display_order: i, parent_id: s.parent_id };
    });
    reorderItems(reordered);
  };

  // ==================================================================
  // FALLBACK EXPORT
  // ==================================================================

  const exportFallback = async () => {
    try {
      const response = await fetch(`${getApiBase()}/navigation`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export fehlgeschlagen: ${err}`);
    }
  };

  // ==================================================================
  // RENDER TREE
  // ==================================================================

  const renderItem = (item: NavigationItem, depth: number = 0, siblingItems?: NavigationItem[]) => {
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const siblings = siblingItems || items.filter(i => i.parent_id === item.parent_id);
    const sortedSiblings = [...siblings].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const siblingIdx = sortedSiblings.findIndex(s => s.id === item.id);

    return (
      <div key={item.id}>
        <DraggableNavigationItem
          item={item}
          depth={depth}
          isExpanded={isExpanded}
          isEditing={editingId === item.id}
          editForm={editForm}
          onToggleExpand={toggleExpand}
          onStartEdit={startEdit}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onDelete={deleteItem}
          onUpdateForm={setEditForm}
          onMove={moveItem}
          onMoveUp={moveItemUp}
          onMoveDown={moveItemDown}
          canMoveUp={siblingIdx > 0}
          canMoveDown={siblingIdx < sortedSiblings.length - 1}
          allItems={items}
          saving={saving}
        />

        {/* CHILDREN */}
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ==================================================================
  // RENDER
  // ==================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading navigation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Failed to load navigation</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchNavigation}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              data-testid="button-retry"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();
  const tree = buildTree(filteredItems);
  const rootItems = items.filter(item => item.parent_id === null);

  const defaultCreateLocation: 'header' | 'footer' = locationFilter === 'all' || locationFilter === 'header' ? 'header' : 'footer';

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-navigation-title">Navigation</h2>
          <p className="text-sm text-gray-600 mt-1" data-testid="text-navigation-subtitle">
            {filteredItems.length} von {items.length} Items
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Expand/Collapse All Toggle */}
          <button
            onClick={() => {
              if (expandedIds.size === 0) {
                const allIds = new Set<number>();
                items.forEach(item => {
                  if (item.id) allIds.add(item.id);
                });
                setExpandedIds(allIds);
              } else {
                setExpandedIds(new Set());
              }
            }}
            className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            style={{ borderColor: '#E5E7EB' }}
            title={expandedIds.size === 0 ? 'Expand All' : 'Collapse All'}
            data-testid="button-toggle-all"
          >
            {expandedIds.size === 0 ? (
              <><FolderTree className="w-4 h-4 inline mr-1" /> Alle aufklappen</>
            ) : (
              <><FolderTree className="w-4 h-4 inline mr-1" /> Alle zuklappen</>
            )}
          </button>
          
          <button
            onClick={fetchNavigation}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            style={{ borderColor: '#E5E7EB' }}
            data-testid="button-refresh"
          >
            Refresh
          </button>

          <button
            onClick={exportFallback}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            style={{ borderColor: '#E5E7EB' }}
            data-testid="button-export-fallback"
          >
            <Copy className="w-4 h-4 inline mr-2" />
            {exportSuccess ? 'Kopiert!' : 'Fallback exportieren'}
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
            data-testid="button-add-item"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* LOCATION FILTER TABS */}
      <div className="flex gap-1 mb-4 border rounded p-1" style={{ borderColor: '#E5E7EB' }} data-testid="tabs-location-filter">
        <button
          onClick={() => setLocationFilter('header')}
          className={`px-4 py-2 text-sm rounded font-medium ${locationFilter === 'header' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          data-testid="tab-filter-header"
        >
          Header
        </button>
        <button
          onClick={() => setLocationFilter('footer')}
          className={`px-4 py-2 text-sm rounded font-medium ${locationFilter === 'footer' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          data-testid="tab-filter-footer"
        >
          Footer
        </button>
        <button
          onClick={() => setLocationFilter('all')}
          className={`px-4 py-2 text-sm rounded font-medium ${locationFilter === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          data-testid="tab-filter-all"
        >
          Alle
        </button>
      </div>

      {/* TREE VIEW */}
      <div className="space-y-2">
        {tree.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p data-testid="text-empty-state">No navigation items found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              data-testid="button-create-first"
            >
              Create First Item
            </button>
          </div>
        ) : (
          tree.map(item => renderItem(item, 0))
        )}
      </div>

      {/* CREATE MODAL */}
      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createItem}
        items={rootItems}
        defaultLocation={defaultCreateLocation}
      />
    </div>
  );
}
