import { Plus, Save, Edit2, Trash2, FileText, Database, Calendar, Eye, EyeOff, AlertCircle, Menu, X } from 'lucide-react';
import { Page } from '../../utils/api';
import { seedDemoData } from '../../utils/seedDemoData';
import { useState, useEffect } from 'react';
import { PageComposer } from './PageComposer';
import { API_BASE_URL } from '../../config/apiClient';
import { getAllONIXTags, type ONIXTag } from '../../utils/api/tags';

interface PagesTabContentProps {
  pages: Page[];
  loading: boolean;
  editingPage: Partial<Page> | null;
  setEditingPage: (page: Partial<Page> | null) => void;
  handleSavePage: () => void;
  handleDeletePage: (id: number) => void;
  onPagesCreated: () => void;
}

export function PagesTabContent({
  pages,
  loading,
  editingPage,
  setEditingPage,
  handleSavePage,
  handleDeletePage,
  onPagesCreated
}: PagesTabContentProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  
  // ✅ Navigation Integration State
  const [menuItems, setMenuItems] = useState<Array<{ id: number; name: string; href_resolved: string }>>([]);
  const [showInNavigation, setShowInNavigation] = useState(false);
  const [selectedParentMenuId, setSelectedParentMenuId] = useState<number | null>(null);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);
  
  const [existingLinks, setExistingLinks] = useState<Array<{ id: number; name: string; href_resolved: string }>>([]);
  const [existingLinksLoading, setExistingLinksLoading] = useState(false);
  const [onixCategories, setOnixCategories] = useState<ONIXTag[]>([]);

  useEffect(() => {
    getAllONIXTags()
      .then(tags => setOnixCategories(tags))
      .catch(() => {});
  }, []);

  // ✅ CRASH-SAFE: Ensure pages is always an array
  const safePages = Array.isArray(pages) ? pages : [];

  // ✅ Load Menu Items + Existing Links when editing a page
  useEffect(() => {
    if (editingPage) {
      loadMenuItems();
      if (editingPage.id) {
        loadExistingLinks(editingPage.id);
      }
    } else {
      // Reset navigation state when closing editor
      setShowInNavigation(false);
      setSelectedParentMenuId(null);
      setExistingLinks([]);
    }
  }, [editingPage]);

  const loadMenuItems = async () => {
    try {
      setMenuItemsLoading(true);
      setMenuItemsError(null);
      
      const response = await fetch(`${API_BASE_URL}/navigation/items`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        setMenuItems(Array.isArray(result.data) ? result.data : []);
        console.log('✅ [loadMenuItems] Loaded:', result.data);
      } else {
        const errorText = await response.text();
        console.error('❌ [loadMenuItems] Failed:', response.status, errorText);
        setMenuItemsError(`Fehler ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ [loadMenuItems] Exception:', error);
      setMenuItemsError('Netzwerkfehler beim Laden der Menüpunkte');
    } finally {
      setMenuItemsLoading(false);
    }
  };

  const loadExistingLinks = async (pageId: number) => {
    try {
      setExistingLinksLoading(true);
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/pages/${pageId}/navigation-links`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        setExistingLinks(Array.isArray(result.data) ? result.data : []);
        console.log('✅ [loadExistingLinks] Loaded:', result.data);
        
        // ✅ Auto-select existing link if there is one
        if (result.data && result.data.length > 0) {
          setShowInNavigation(true);
          setSelectedParentMenuId(result.data[0].id);
        }
      } else {
        console.error('❌ [loadExistingLinks] Failed:', response.status);
      }
    } catch (error) {
      console.error('❌ [loadExistingLinks] Exception:', error);
    } finally {
      setExistingLinksLoading(false);
    }
  };

  const handleSaveWithNavigation = async () => {
    // First save the page
    await handleSavePage();

    // If navigation integration is active and we have a page ID
    if (showInNavigation && selectedParentMenuId && editingPage?.id) {
      try {
        // Use session-based auth via credentials: 'include'
        const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/admin/menu-items/${selectedParentMenuId}/link-page`, {
          method: 'POST',
          credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: editingPage.id,
          }),
        });

        if (response.ok) {
          console.log('✅ Page linked to navigation');
          alert('✅ Seite gespeichert und mit Navigation verknüpft!');
          
          // ✅ RELOAD: Refresh existing links to show the connection
          if (editingPage.id) {
            await loadExistingLinks(editingPage.id);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to link page to navigation:', response.status, errorData);
          alert(`⚠️ Seite gespeichert, aber Verknüpfung mit Navigation fehlgeschlagen (${response.status}).`);
        }
      } catch (error) {
        console.error('Error linking page to navigation:', error);
        alert('⚠️ Seite gespeichert, aber Verknüpfung mit Navigation fehlgeschlagen.');
      }
    } else {
      // ✅ Even if no new link was created, reload to show current state
      if (editingPage?.id) {
        await loadExistingLinks(editingPage.id);
      }
    }
  };

  const handleCreateDemoPages = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDemoData();
      if (result.success) {
        alert('✅ Demo-Seiten wurden erstellt!');
        onPagesCreated();
      } else {
        alert('❌ Fehler beim Erstellen der Demo-Seiten');
      }
    } catch (error) {
      console.error('Error creating demo pages:', error);
      alert('❌ Fehler beim Erstellen der Demo-Seiten');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUnlinkPage = async (menuItemId: number, menuItemName: string) => {
    if (!confirm(`Verknüpfung "${menuItemName}" wirklich entfernen?`)) return;

    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/menu-items/${menuItemId}/unlink-page`, {
            credentials: 'include',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        console.log(`✅ Unlinked menu item ${menuItemId} from page`);
        alert(`✅ Verknüpfung "${menuItemName}" entfernt!`);
        
        // Reload existing links
        if (editingPage?.id) {
          await loadExistingLinks(editingPage.id);
        }
        
        // Reset navigation state
        setShowInNavigation(false);
        setSelectedParentMenuId(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to unlink page:', response.status, errorData);
        alert(`❌ Fehler beim Entfernen der Verknüpfung (${response.status})`);
      }
    } catch (error) {
      console.error('Error unlinking page:', error);
      alert('❌ Fehler beim Entfernen der Verknüpfung');
    }
  };

  // ✅ Display Name: seo_title ?? slug (Fallback)
  const getDisplayName = (page: Page | Partial<Page>): string => {
    return page.seo_title || page.slug || '(Unbenannt)';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Seiten ({safePages.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleCreateDemoPages}
            disabled={isSeeding}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            title="Erstellt/Aktualisiert alle Standard-Seiten"
          >
            <Database className="w-5 h-5" />
            {isSeeding ? 'Erstelle...' : 'Standard-Seiten sync'}
          </button>
          <button
            onClick={() => setEditingPage({
              slug: '',
              type: 'composed',
              status: 'draft',
              visibility: 'visible',
              seo_title: '',
              seo_description: '',
              content_version: 1
            })}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
          >
            <Plus className="w-5 h-5" />
            Neue Seite
          </button>
        </div>
      </div>

      {editingPage && (
        <div className="mb-6 p-6 border-2 rounded-lg" style={{ borderColor: '#f25f5c' }}>
          <h3 className="text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {editingPage.id ? 'Seite bearbeiten' : 'Neue Seite erstellen'}
          </h3>
          
          <div className="space-y-4">
            {/* Slug (Required) */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                Slug (URL) *
              </label>
              <input
                type="text"
                placeholder="deutscher-buchpreis"
                value={editingPage.slug || ''}
                onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
                required
              />
              <p className="text-xs mt-1" style={{ color: '#999999' }}>
                URL: https://coratiert.de{editingPage.slug === '/' ? '/' : `/${editingPage.slug || 'slug'}`}
              </p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                Seitentyp
              </label>
              <select
                value={editingPage.type || 'composed'}
                onChange={(e) => setEditingPage({ ...editingPage, type: e.target.value as "static" | "dynamic" | "composed" })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="composed">Composed (Sections)</option>
                <option value="custom">Custom</option>
                <option value="landing">Landing Page</option>
              </select>
            </div>

            {/* Page Type & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                  Seitenvorlage
                </label>
                <select
                  value={(editingPage as any).page_type || 'composed'}
                  onChange={(e) => setEditingPage({ ...editingPage, page_type: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="composed">Standard (Composed)</option>
                  <option value="category">Kategorie-Seite</option>
                </select>
                <p className="text-xs mt-1" style={{ color: '#999999' }}>
                  Kategorie-Seiten filtern Sektionen automatisch nach der zugeordneten Kategorie.
                </p>
              </div>

              {(editingPage as any).page_type === 'category' && (
                <div>
                  <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                    Kategorie
                  </label>
                  <select
                    value={(editingPage as any).category_id || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, category_id: e.target.value ? parseInt(e.target.value) : null } as any)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <option value="">Keine Kategorie</option>
                    {onixCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {(cat as any).displayName || cat.name}{(cat as any).tag_type ? ` (${(cat as any).tag_type})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: '#999999' }}>
                    Sektionen auf dieser Seite erhalten diese Kategorie als Filter.
                  </p>
                </div>
              )}
            </div>

            {/* Status & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                  Status
                </label>
                <select
                  value={editingPage.status || 'draft'}
                  onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as 'draft' | 'published' })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                  Sichtbarkeit
                </label>
                <select
                  value={editingPage.visibility || 'visible'}
                  onChange={(e) => setEditingPage({ ...editingPage, visibility: e.target.value as 'visible' | 'hidden' })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            {/* SEO Title */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                SEO Title (max. 60 Zeichen)
              </label>
              <input
                type="text"
                placeholder="Deutscher Buchpreis 2025 | coratiert.de"
                value={editingPage.seo_title || ''}
                onChange={(e) => setEditingPage({ ...editingPage, seo_title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
                maxLength={60}
              />
              <p className="text-xs mt-1" style={{ color: '#999999' }}>
                {editingPage.seo_title?.length || 0}/60 Zeichen • Wird als Display Name verwendet
              </p>
            </div>

            {/* SEO Description */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                SEO Description (max. 160 Zeichen)
              </label>
              <textarea
                placeholder="Kurze Beschreibung für Suchmaschinen..."
                value={editingPage.seo_description || ''}
                onChange={(e) => setEditingPage({ ...editingPage, seo_description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
                rows={3}
                maxLength={160}
              />
              <p className="text-xs mt-1" style={{ color: '#999999' }}>
                {editingPage.seo_description?.length || 0}/160 Zeichen
              </p>
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                Canonical URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://coratiert.de/page-slug"
                value={editingPage.canonical_url || ''}
                onChange={(e) => setEditingPage({ ...editingPage, canonical_url: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            {/* Robots */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                Robots Meta Tag
              </label>
              <select
                value={editingPage.robots || 'index,follow'}
                onChange={(e) => setEditingPage({ ...editingPage, robots: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="index,follow">Index, Follow (Standard)</option>
                <option value="noindex,nofollow">NoIndex, NoFollow</option>
                <option value="index,nofollow">Index, NoFollow</option>
                <option value="noindex,follow">NoIndex, Follow</option>
              </select>
            </div>

            {/* Publish/Unpublish Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Publish At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={editingPage.publish_at ? new Date(editingPage.publish_at as string).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingPage({ ...editingPage, publish_at: e.target.value || null })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E5E7EB' }}
                />
                <p className="text-xs mt-1" style={{ color: '#999999' }}>
                  Seite wird automatisch am ausgewählten Datum veröffentlicht
                </p>
              </div>

              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: '#666666' }}>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Unpublish At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={editingPage.unpublish_at ? new Date(editingPage.unpublish_at as string).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingPage({ ...editingPage, unpublish_at: e.target.value || null })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E5E7EB' }}
                />
                <p className="text-xs mt-1" style={{ color: '#999999' }}>
                  Seite wird automatisch am ausgewählten Datum depubliziert
                </p>
              </div>
            </div>

            {/* Navigation Integration - MOVED AFTER SAVE BUTTON */}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSaveWithNavigation}
              className="px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
            >
              <Save className="w-5 h-5" />
              Speichern
            </button>
            <button
              onClick={() => setEditingPage(null)}
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A' }}
            >
              Abbrechen
            </button>
          </div>

          {/* ✅ Navigation Integration - POSITIONED BEFORE PageComposer */}
          <div className="pt-4 mt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
            <h4 className="text-md mb-3 flex items-center gap-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              <Menu className="w-5 h-5" />
              Navigation Integration
              {menuItemsLoading && (
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#247ba020', color: '#247ba0' }}>
                  Lädt...
                </span>
              )}
              {!menuItemsLoading && menuItems.length > 0 && (
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#70c1b320', color: '#70c1b3' }}>
                  {menuItems.length} Menüs verfügbar
                </span>
              )}
              {!menuItemsLoading && menuItems.length === 0 && (
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#f25f5c20', color: '#f25f5c' }}>
                  Keine Menüs gefunden
                </span>
              )}
            </h4>

            {/* ✅ NEW: Existing Links Display */}
            {existingLinksLoading && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#247ba010', border: '1px solid #247ba0' }}>
                <p className="text-sm" style={{ color: '#247ba0' }}>
                  🔍 Prüfe bestehende Verknüpfungen...
                </p>
              </div>
            )}

            {!existingLinksLoading && existingLinks.length > 0 && (
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#70c1b310', border: '2px solid #70c1b3' }}>
                <div className="flex items-start gap-2 mb-3">
                  <Menu className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#70c1b3' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-3" style={{ color: '#70c1b3' }}>
                      ✅ Diese Seite ist bereits verknüpft mit:
                    </p>
                    <ul className="space-y-2">
                      {existingLinks.map(link => (
                        <li key={link.id} className="flex items-center justify-between gap-2 p-2 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                          <span className="text-sm" style={{ color: '#666666' }}>
                            <strong>{link.name}</strong> ({link.href_resolved})
                          </span>
                          <button
                            onClick={() => handleUnlinkPage(link.id, link.name)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-100"
                            style={{ color: '#f25f5c' }}
                            title="Verknüpfung entfernen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs mt-3" style={{ color: '#999999' }}>
                      💡 Tipp: Klicke auf <X className="w-3 h-3 inline" /> um eine Verknüpfung zu entfernen, oder wähle ein anderes Menü und speichere.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ⚠️ Warning: Multiple Links */}
            {!existingLinksLoading && existingLinks.length > 1 && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#ffe59c20', border: '1px solid #ffe59c' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#d4a017' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d4a017' }}>
                      ⚠️ Mehrfach-Verknüpfung erkannt!
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#666666' }}>
                      Diese Seite ist mit mehreren Menüpunkten verknüpft. Das kann zu unerwarteten Problemen führen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {menuItemsError && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#f25f5c20', border: '1px solid #f25f5c' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f25f5c' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#f25f5c' }}>
                      {menuItemsError}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#666666' }}>
                      Bitte prüfe die Browser-Konsole für Details
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State Warning */}
            {!menuItemsLoading && menuItems.length === 0 && !menuItemsError && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#ffe59c20', border: '1px solid #ffe59c' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#d4a017' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d4a017' }}>
                      Keine Menüpunkte vorhanden
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#666666' }}>
                      Bitte erstelle zuerst Menüpunkte im Navigation-Tab, bevor du Seiten zuordnen kannst.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInNavigation}
                  onChange={(e) => setShowInNavigation(e.target.checked)}
                  className="mr-3 w-4 h-4"
                  disabled={menuItems.length === 0}
                />
                <span className="text-sm" style={{ color: menuItems.length === 0 ? '#999999' : '#666666' }}>
                  Diese Seite in der Navigation anzeigen
                </span>
              </label>
            </div>

            {showInNavigation && menuItems.length > 0 && (
              <div className="pl-7">
                <label className="block text-sm mb-2 font-medium" style={{ color: '#666666' }}>
                  Übergeordnetes Menü *
                </label>
                <select
                  value={selectedParentMenuId || ''}
                  onChange={(e) => setSelectedParentMenuId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="">-- Menü auswählen --</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.href_resolved})
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: '#999999' }}>
                  Die Seite wird als Unterpunkt des gewählten Menüs angezeigt
                </p>
              </div>
            )}
          </div>

          {/* ✅ Page Composer - nur für existierende Pages */}
          {editingPage.id && (
            <div className="mt-8">
              <PageComposer 
                page={editingPage as any} 
                onPageUpdate={() => console.log('Page updated')} 
              />
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#666666' }}>Laden...</p>
      ) : safePages.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#666666' }}>
          <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
          <p>Noch keine Seiten vorhanden.</p>
          <p className="text-sm mt-2">Erstelle deine erste Seite!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {safePages.map((page) => (
            <div
              key={page.id}
              className="p-4 border rounded-lg"
              style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                      {getDisplayName(page)}
                    </h4>
                    <span className="px-2 py-1 rounded text-xs" style={{
                      backgroundColor: page.status === 'published' ? '#70c1b320' : '#f0f0f0',
                      color: page.status === 'published' ? '#70c1b3' : '#999'
                    }}>
                      {page.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs" style={{
                      backgroundColor: page.visibility === 'visible' ? '#247ba020' : '#f0f0f0',
                      color: page.visibility === 'visible' ? '#247ba0' : '#999'
                    }}>
                      {page.visibility === 'visible' ? 'Visible' : 'Hidden'}
                    </span>
                    {page.type && (
                      <span className="px-2 py-1 rounded text-xs" style={{
                        backgroundColor: '#f0f0f0',
                        color: '#666'
                      }}>
                        {page.type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#666666' }}>
                    <strong>URL:</strong> /{page.slug}
                  </p>
                  <p className="text-sm mb-1" style={{ color: '#666666' }}>
                    <strong>ID:</strong> {page.id}
                  </p>
                  {page.seo_description && (
                    <p className="text-sm mb-1" style={{ color: '#999999' }}>{page.seo_description}</p>
                  )}
                  {page.template_key && (
                    <p className="text-xs mt-2 px-2 py-1 rounded inline-block" style={{ backgroundColor: '#70c1b320', color: '#70c1b3' }}>
                      Template: {page.template_key}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingPage(page)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePage(page.id)}
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
      )}
    </div>
  );
}