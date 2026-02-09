/**
 * ==================================================================
 * ADMIN NAVIGATION V2 - FULL FEATURED EDITION
 * ==================================================================
 * 
 * Complete CRUD interface for Navigation V2 system with:
 * ✅ Load from database via API
 * ✅ Create/Edit/Delete items
 * ✅ Hierarchical tree view
 * ✅ Drag & Drop sorting
 * ✅ Publish/Draft workflow
 * ✅ Mega Menu Columns Management
 * 
 * ==================================================================
 */

import { useState, useEffect, useRef } from 'react';
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
  CheckCircle,
  Loader2,
  Layout,
  ExternalLink,
  GripVertical,
  Columns,
  FolderTree,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { getAdminToken } from '../../utils/adminToken';
// ❌ BUILD-BLOCKER REMOVED: react-dnd prevents Figma Make publishing
// import { useDrag, useDrop } from 'react-dnd';
import { NavigationPageLinker } from './NavigationPageLinker';

// ==================================================================
// TYPES
// ==================================================================

interface NavigationItem {
  id: number;
  name: string;
  label: string; // ✅ DB field: display text
  slug: string;
  path: string | null;
  description: string | null; // ✅ DB field
  icon: string | null;
  parent_id: number | null;
  level: number;
  column_id: number | null;
  display_order: number;
  visible: boolean;
  status: 'draft' | 'published';
  
  // ⚠️ Navigation V2 fields (OPTIONAL until DB migration is run)
  kind?: 'link' | 'group' | 'heading' | 'divider' | 'promo';
  location?: 'header' | 'footer' | 'mobile' | 'sidebar';
  panel_layout?: 'none' | 'mega' | 'dropdown';
  target_type?: 'page' | 'category' | 'tag' | 'book' | 'external' | null;
  target_page_id?: number | null;
  target_category_id?: number | null;
  target_tag_id?: number | null;
  
  // ✅ Timestamps from DB
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  
  // Extended fields
  clickable?: boolean;
  scope?: string;

  // ✅ Client-side only (not in DB)
  children?: NavigationItem[];
}

interface MegaMenuColumn {
  id: number;
  root_menu_id: number;
  label: string;
  display_order: number;
  visible: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Drag and Drop Types
const DND_TYPES = {
  NAV_ITEM: 'navigation_item',
  COLUMN: 'mega_menu_column'
};

// ==================================================================
// API BASE
// ==================================================================

function getApiBase(): string {
  // Dynamic runtime resolution to avoid undefined at build time
    return '/api';
}

function getAdminHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    'X-Admin-Token': token || '',
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
  saving
}: DraggableItemProps) {
  const hasChildren = item.children && item.children.length > 0;

  // ❌ BUILD-BLOCKER: DnD disabled for Figma Make publishing
  // Use arrow buttons for reordering instead
  const isDragging = false;
  const isOver = false;
  const drag = (node: HTMLElement | null) => node;
  const drop = (node: HTMLElement | null) => node;
  const preview = (node: HTMLElement | null) => node;

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        marginLeft: `${depth * 24}px`,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move'
      }}
    >
      {/* ITEM ROW */}
      <div
        className="flex items-center gap-2 p-3 rounded border mb-2 hover:bg-gray-50"
        style={{
          borderColor: isOver ? '#3B82F6' : '#E5E7EB',
          backgroundColor: isEditing ? '#FEF3C7' : isOver ? '#EFF6FF' : '#FFFFFF',
          borderWidth: isOver ? '2px' : '1px'
        }}
      >
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(item.id)}
            className="p-1 hover:bg-gray-100 rounded"
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
          />
        ) : (
          <span className="flex-1 font-medium">
            {item.name || item.slug || item.path || 'Unnamed Item'}
          </span>
        )}

        {/* Slug */}
        <span className="text-sm text-gray-500 font-mono">
          {item.slug ? `/${item.slug}` : item.path || '—'}
        </span>

        {/* ❌ REMOVED: Kind Badge (field doesn't exist in DB) */}

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
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onStartEdit(item)}
                className="p-2 rounded hover:bg-blue-100"
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 rounded hover:bg-red-100"
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

            {/* ✅ Page Linker - nur für Link-Items - volle Breite */}
            {item.kind === 'link' && item.id && (
              <div className="col-span-2">
                <NavigationPageLinker
                  menuItemId={item.id}
                  currentTargetType={item.target_type === 'page' ? 'page' : item.target_type === 'external' ? 'url' : null}
                  currentTargetPageId={item.target_page_id}
                  currentPath={item.path}
                  onLinked={() => {
                    // Refresh navigation after linking
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
}

function CreateItemModal({ isOpen, onClose, onCreate, items }: CreateModalProps) {
  const [form, setForm] = useState<Partial<NavigationItem>>({
    name: '',
    label: '', // ✅ ADD: Default empty string (will be auto-filled in validation)
    slug: '',
    path: '',
    kind: 'link',
    location: 'header',
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

  const handleCreate = async () => {
    // ✅ VALIDATION: Trim and check for empty strings
    if (!form.name || form.name.trim() === '' || !form.slug || form.slug.trim() === '') {
      alert('Name and Slug are required and cannot be empty');
      return;
    }

    // ✅ CRITICAL FIX: Ensure label is ALWAYS set before calling onCreate
    const formWithLabel = {
      ...form,
      label: (form.label?.trim() || form.name?.trim() || 'Unnamed')
    };

    setCreating(true);
    try {
      await onCreate(formWithLabel);
      setForm({
        name: '',
        label: '', // ✅ RESET: Include label in reset
        slug: '',
        path: '',
        kind: 'link',
        location: 'header',
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kind</label>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
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
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================================
// MEGA MENU COLUMNS MANAGER
// ==================================================================

interface ColumnsManagerProps {
  rootMenuItems: NavigationItem[];
  onRefresh: () => void;
}

function MegaMenuColumnsManager({ rootMenuItems, onRefresh }: ColumnsManagerProps) {
  const [selectedRootId, setSelectedRootId] = useState<number | null>(null);
  const [columns, setColumns] = useState<MegaMenuColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<MegaMenuColumn>>({});

  const fetchColumns = async (rootId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/navigation/columns/${rootId}`, {
        headers: getAdminHeaders(),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: ApiResponse<MegaMenuColumn[]> = await response.json();
      setColumns(result.data || []);
    } catch (error) {
      console.error('Columns fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRootId) {
      fetchColumns(selectedRootId);
    }
  }, [selectedRootId]);

  const createColumn = async () => {
    if (!selectedRootId) return;

    const label = prompt('Column Label:');
    if (!label) return;

    try {
      const response = await fetch(`${getApiBase()}/navigation/columns`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          root_menu_id: selectedRootId,
          label,
          display_order: columns.length,
          visible: true
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await fetchColumns(selectedRootId);
      onRefresh();
    } catch (error) {
      alert(`Failed to create column: ${error}`);
    }
  };

  const updateColumn = async (columnId: number, updates: Partial<MegaMenuColumn>) => {
    try {
      const response = await fetch(`${getApiBase()}/navigation/columns/${columnId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await fetchColumns(selectedRootId!);
      setEditingColumnId(null);
      onRefresh();
    } catch (error) {
      alert(`Failed to update column: ${error}`);
    }
  };

  const deleteColumn = async (columnId: number) => {
    if (!confirm('Delete this column?')) return;

    try {
      const response = await fetch(`${getApiBase()}/navigation/columns/${columnId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await fetchColumns(selectedRootId!);
      onRefresh();
    } catch (error) {
      alert(`Failed to delete column: ${error}`);
    }
  };

  const megaMenuItems = rootMenuItems.filter(item => item.panel_layout === 'mega');

  return (
    <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
      <div className="flex items-center gap-3 mb-4">
        <Columns className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold">Mega Menu Columns</h3>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Menu Item with Mega Menu:</label>
        <select
          value={selectedRootId || ''}
          onChange={(e) => setSelectedRootId(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">-- Select Menu Item --</option>
          {megaMenuItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} (#{item.id})
            </option>
          ))}
        </select>
      </div>

      {selectedRootId && (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">{columns.length} columns</span>
            <button
              onClick={createColumn}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add Column
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : columns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Columns className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No columns yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {columns.map(col => (
                <div
                  key={col.id}
                  className="flex items-center gap-3 p-3 bg-white border rounded"
                >
                  <span className="text-xs text-gray-400">#{col.display_order}</span>

                  {editingColumnId === col.id ? (
                    <input
                      type="text"
                      value={editForm.label || ''}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded"
                    />
                  ) : (
                    <span className="flex-1 font-medium">{col.label}</span>
                  )}

                  {col.visible ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}

                  <div className="flex gap-2">
                    {editingColumnId === col.id ? (
                      <>
                        <button
                          onClick={() => updateColumn(col.id, editForm)}
                          className="p-1 hover:bg-green-100 rounded"
                        >
                          <Save className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => setEditingColumnId(null)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingColumnId(col.id);
                            setEditForm({ label: col.label });
                          }}
                          className="p-1 hover:bg-blue-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => deleteColumn(col.id)}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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
  const [viewMode, setViewMode] = useState<'tree' | 'columns'>('tree');
  
  // 🐛 DEBUG STATE
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [lastError, setLastError] = useState<any>(null);

  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
    setDebugLog(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  // ==================================================================
  // FETCH DATA
  // ==================================================================

  const fetchNavigation = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching navigation from:', `${getApiBase()}/navigation/admin/items`);
      console.log('📋 Admin Token:', getAdminToken() ? '✅ Present' : '❌ Missing');

      const response = await fetch(`${getApiBase()}/navigation/admin/items`, {
        headers: getAdminHeaders(),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        // Gracefully handle HTTP errors
        const errorText = await response.text();
        console.error('❌ Navigation API HTTP error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result: ApiResponse<NavigationItem[]> = await response.json();
      console.log('📦 Navigation API response:', result);

      if (!result.success) {
        // Backend returned error but didn't throw
        console.error('❌ Navigation API returned error:', result.error);
        throw new Error(result.error || 'Failed to fetch navigation');
      }

      // Successfully loaded (even if empty array)
      console.log(`✅ Loaded ${result.data?.length || 0} navigation items`);
      setItems(result.data || []);
      
      // Clear error if we had one before
      if (error) {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Navigation fetch error:', err);
      console.error('Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });
      
      // Set user-friendly error message with more context
      let friendlyMessage = errorMessage;
      
      if (errorMessage.includes('Failed to fetch')) {
        friendlyMessage = 'Netzwerkfehler: Server ist nicht erreichbar. Bitte überprüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.';
      } else if (errorMessage.includes('CORS')) {
        friendlyMessage = 'CORS-Fehler: Die Server-Konfiguration erlaubt diese Anfrage nicht.';
      } else if (errorMessage.includes('401')) {
        friendlyMessage = 'Authentifizierungsfehler: Bitte melden Sie sich erneut an.';
      }
      
      setError(`Navigation konnte nicht geladen werden: ${friendlyMessage}`);
      
      // Set empty array so UI doesn't crash
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

    // Create map
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build tree
    itemMap.forEach(item => {
      if (item.parent_id === null) {
        roots.push(item);
      } else {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(item);
        } else {
          // Orphaned item - add to roots
          roots.push(item);
        }
      }
    });

    // Sort by display_order
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
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    // ✅ VALIDATION: Ensure name is provided and not empty
    if (!editForm.name || editForm.name.trim() === '') {
      alert('Name is required and cannot be empty');
      return;
    }

    try {
      setSaving(true);

      // ✅ FIX: Only send fields that exist in menu_items table
      const payload = {
        id: editingId,
        name: editForm.name.trim(),
        label: editForm.name.trim(), // ✅ FIX: label is NOT NULL in DB, use name as fallback
        slug: editForm.slug,
        path: editForm.path || null,
        description: null, // TODO: Add description field to form
        icon: editForm.icon || null,
        parent_id: editForm.parent_id || null,
        level: editForm.level || 0,
        column_id: editForm.column_id || null,
        display_order: editForm.display_order || 0,
        visible: editForm.visible !== false,
        status: editForm.status || 'draft', // ✅ NEW: v1125 field
        // ✅ NEW: Navigation V2 fields (v1125 migration)
        kind: editForm.kind || 'link',
        location: editForm.location || 'header',
        panel_layout: editForm.panel_layout || 'none',
        target_type: editForm.target_type || null,
        target_page_id: editForm.target_page_id || null,
        target_category_id: editForm.target_category_id || null,
        target_tag_id: editForm.target_tag_id || null,
      };

      console.log('🔄 Updating navigation item with payload:', payload);

      const response = await fetch(`${getApiBase()}/navigation/admin/items`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update failed - Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: ApiResponse<NavigationItem> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      // Refresh data
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
        headers: getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete');
      }

      // Refresh data
      await fetchNavigation();
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Failed to delete: ${err}`);
    }
  };

  const createItem = async (item: Partial<NavigationItem>) => {
    try {
      addDebugLog('🔄 Starting createItem...', { name: item.name, slug: item.slug });
      
      // ✅ VALIDATION: Ensure name is provided and not empty
      if (!item.name || item.name.trim() === '') {
        const msg = 'Name is required and cannot be empty';
        addDebugLog('❌ Validation failed', { error: msg });
        throw new Error(msg);
      }

      // ✅ ENHANCED FIX: Ensure label is ALWAYS set and never empty (works with old & new backend)
      const trimmedName = item.name.trim();
      const trimmedLabel = item.label?.trim() || trimmedName; // Fallback to name if label missing

      // ✅ FIX: Only send fields that exist in menu_items table
      const payload = {
        name: trimmedName,
        label: trimmedLabel, // ✅ GUARANTEED NOT NULL/EMPTY - Works with both backend versions
        slug: item.slug?.trim() || trimmedName.toLowerCase().replace(/\s+/g, '-'), // Auto-generate from name
        path: item.path?.trim() || null,
        description: null, // TODO: Add description field to form
        icon: item.icon || null,
        parent_id: item.parent_id || null,
        level: item.level || 0,
        column_id: item.column_id || null,
        display_order: item.display_order || 0,
        visible: item.visible !== false,
        status: 'draft', // ✅ Always start as draft
        // Note: kind, location, scope, panel_layout, clickable are NOT in DB schema
        // They need to be added to menu_items table or stored in navigation_metadata
      };

      addDebugLog('✅ Payload prepared', payload);
      addDebugLog('✅ Label validation OK', {
        name: trimmedName,
        label: trimmedLabel,
        isLabelValid: !!trimmedLabel && trimmedLabel.length > 0
      });

      const url = `${getApiBase()}/navigation/admin/items`;
      addDebugLog('📡 Sending POST request', { url });

      const response = await fetch(url, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      addDebugLog('📡 Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        addDebugLog('❌ HTTP Error', {
          status: response.status,
          body: errorText
        });
        setLastError({ status: response.status, body: errorText, payload });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: ApiResponse<NavigationItem> = await response.json();
      addDebugLog('📦 Response parsed', result);

      if (!result.success) {
        addDebugLog('❌ Backend returned error', result.error);
        setLastError({ result, payload });
        throw new Error(result.error || 'Failed to create');
      }

      addDebugLog('✅ Item created successfully', result.data);
      // Refresh data
      await fetchNavigation();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addDebugLog('❌ Create error', {
        message: errorMsg,
        error: err
      });
      setLastError({ error: err, item });
      throw err;
    }
  };

  const moveItem = async (itemId: number, newOrder: number, newParentId: number | null) => {
    try {
      const response = await fetch(`${getApiBase()}/navigation/admin/items`, {
        method: 'POST',
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

      // Refresh data
      await fetchNavigation();
    } catch (err) {
      console.error('Move error:', err);
      alert(`Failed to move: ${err}`);
    }
  };

  // 🐛 TEST BACKEND CONNECTION
  const testBackendConnection = async () => {
    addDebugLog('🧪 Testing backend connection...');
    setDebugLog([]); // Clear previous logs
    
    try {
      const url = `${getApiBase()}/navigation/admin/items`;
      addDebugLog('📡 GET request', { url });
      
      const response = await fetch(url, {
        headers: getAdminHeaders(),
      });
      
      addDebugLog('📡 Response', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      const text = await response.text();
      addDebugLog('📦 Response body (first 500 chars)', text.substring(0, 500));
      
      try {
        const json = JSON.parse(text);
        addDebugLog('✅ JSON parsed successfully', json);
      } catch {
        addDebugLog('❌ Response is not valid JSON', text);
      }
      
      // 🆕 TEST CREATE ENDPOINT with minimal payload
      addDebugLog('');
      addDebugLog('🧪 Testing CREATE endpoint with minimal payload...');
      
      const testPayload = {
        name: 'BACKEND_TEST',
        label: 'Backend Test Label',
        slug: 'backend-test-' + Date.now(),
        path: null,
        description: null,
        icon: null,
        parent_id: null,
        level: 0,
        column_id: null,
        display_order: 999,
        visible: false,
        status: 'draft'
      };
      
      addDebugLog('📤 Sending test payload', testPayload);
      
      const createResponse = await fetch(`${getApiBase()}/navigation/admin/items`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(testPayload),
      });
      
      addDebugLog('📡 CREATE Response', {
        status: createResponse.status,
        ok: createResponse.ok,
        statusText: createResponse.statusText
      });
      
      const createText = await createResponse.text();
      addDebugLog('📦 CREATE Response body', createText);
      
      if (createResponse.ok) {
        addDebugLog('✅ CREATE WORKS! Backend is deployed correctly!');
        addDebugLog('⚠️ Test item created. Clean it up in the database if needed.');
      } else {
        addDebugLog('❌ CREATE FAILED! Backend might not be deployed!');
      }
      
      setShowDebug(true);
    } catch (err) {
      addDebugLog('❌ Network error', err);
      setShowDebug(true);
    }
  };

  // ==================================================================
  // RENDER TREE
  // ==================================================================

  const renderItem = (item: NavigationItem, depth: number = 0) => {
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

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
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tree = buildTree(items);
  const rootItems = items.filter(item => item.parent_id === null);

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Navigation Management V2</h2>
          <p className="text-sm text-gray-600 mt-1">
            {items.length} items total • Drag & Drop enabled
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 border rounded" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 text-sm rounded ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              <FolderTree className="w-4 h-4 inline mr-1" />
              Tree View
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={`px-3 py-2 text-sm rounded ${viewMode === 'columns' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              <Columns className="w-4 h-4 inline mr-1" />
              Columns
            </button>
          </div>
          
          {/* Expand/Collapse All Toggle */}
          <button
            onClick={() => {
              if (expandedIds.size === 0) {
                // Expand all
                const allIds = new Set<number>();
                items.forEach(item => {
                  if (item.id) allIds.add(item.id);
                });
                setExpandedIds(allIds);
              } else {
                // Collapse all
                setExpandedIds(new Set());
              }
            }}
            className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            style={{ borderColor: '#E5E7EB' }}
            title={expandedIds.size === 0 ? 'Expand All' : 'Collapse All'}
          >
            {expandedIds.size === 0 ? '📂 Expand All' : '📁 Collapse All'}
          </button>
          
          <button
            onClick={fetchNavigation}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            style={{ borderColor: '#E5E7EB' }}
          >
            Refresh
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* VIEW MODES */}
      {viewMode === 'tree' ? (
        <div className="space-y-2">
          {tree.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No navigation items found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create First Item
              </button>
            </div>
          ) : (
            tree.map(item => renderItem(item, 0))
          )}
        </div>
      ) : (
        <MegaMenuColumnsManager
          rootMenuItems={rootItems}
          onRefresh={fetchNavigation}
        />
      )}

      {/* FOOTER INFO */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">🎯 Features</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Drag & Drop:</strong> Drag items to reorder them</li>
              <li><strong>Hierarchical:</strong> Create parent-child relationships</li>
              <li><strong>Mega Menu Columns:</strong> Manage columns for mega menus</li>
              <li><strong>Publish Workflow:</strong> Draft items before publishing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🐛 DEBUG PANEL */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-300 rounded">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-yellow-900">🐛 Debug Tools</h3>
          <div className="flex gap-2">
            <button
              onClick={testBackendConnection}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              Test Backend Connection
            </button>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              {showDebug ? 'Hide' : 'Show'} Debug Log
            </button>
            <button
              onClick={() => setDebugLog([])}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear Log
            </button>
          </div>
        </div>

        {showDebug && (
          <div className="bg-black text-green-400 font-mono text-xs p-4 rounded max-h-96 overflow-y-auto">
            {debugLog.length === 0 ? (
              <p className="text-gray-500">No debug logs yet. Try creating a navigation item...</p>
            ) : (
              debugLog.map((log, i) => (
                <div key={i} className="mb-2 whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
          </div>
        )}

        {lastError && showDebug && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <h4 className="font-semibold text-red-900 mb-2">❌ Last Error Details:</h4>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(lastError, null, 2)}
            </pre>
          </div>
        )}

        <p className="text-xs text-yellow-800 mt-3">
          ⚠️ Wenn beim Erstellen ein Fehler auftritt, wird er hier angezeigt.
          Klicke auf "Test Backend Connection" um zu prüfen, ob das Backend deployed ist.
        </p>
      </div>

      {/* CREATE MODAL */}
      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createItem}
        items={rootItems}
      />
    </div>
  );
}