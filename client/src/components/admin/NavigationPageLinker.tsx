import { useState, useEffect } from 'react';
import { Link as LinkIcon, ExternalLink, Save, AlertCircle, Check } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiClient';  // ✅ FIXED: Use canonical import

// ============================================================================
// TYPES
// ============================================================================

interface Page {
  id: number;
  slug: string;
  seo_title?: string | null;
  status: 'draft' | 'published';
}

interface NavigationPageLinkerProps {
  menuItemId: number;
  currentTargetType?: 'page' | 'url' | null;
  currentTargetPageId?: number | null;
  currentPath?: string | null;
  onLinked: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NavigationPageLinker({
  menuItemId,
  currentTargetType,
  currentTargetPageId,
  currentPath,
  onLinked
}: NavigationPageLinkerProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(currentTargetPageId || null);
  const [linking, setLinking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // LOAD PAGES
  // ============================================================================

  useEffect(() => {
    const loadPages = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/admin/pages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setPages(Array.isArray(result.data) ? result.data : []);
        } else {
          setError('Failed to load pages');
        }
      } catch (err) {
        console.error('Error loading pages:', err);
        setError('Error loading pages');
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  // ============================================================================
  // LINK TO PAGE
  // ============================================================================

  const handleLinkToPage = async () => {
    if (!selectedPageId) {
      alert('Please select a page');
      return;
    }

    setLinking(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/menu-items/${menuItemId}/link-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          page_id: selectedPageId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to link page: ${response.status}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onLinked();
      }, 1000);
    } catch (err) {
      console.error('Error linking page:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLinking(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
      <h5 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#666666' }}>
        <LinkIcon className="w-4 h-4" />
        Link zu Page
      </h5>

      {/* Current Status */}
      {currentTargetType === 'page' && currentTargetPageId && (
        <div className="mb-3 p-3 rounded" style={{ backgroundColor: '#70c1b320', color: '#70c1b3' }}>
          <p className="text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            Aktuell verlinkt mit Page ID: {currentTargetPageId}
          </p>
        </div>
      )}

      {currentTargetType === 'url' && currentPath && (
        <div className="mb-3 p-3 rounded" style={{ backgroundColor: '#247ba020', color: '#247ba0' }}>
          <p className="text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Aktuell: URL = {currentPath}
          </p>
        </div>
      )}

      {/* Page Selector */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
            Page auswählen
          </label>
          <select
            value={selectedPageId || ''}
            onChange={(e) => setSelectedPageId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border rounded text-sm"
            style={{ borderColor: '#E5E7EB' }}
            disabled={loading || linking}
          >
            <option value="">-- Page auswählen --</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.seo_title || page.slug} (ID: {page.id}) [{page.status}]
              </option>
            ))}
          </select>
          {loading && <p className="text-xs mt-1" style={{ color: '#999' }}>Loading pages...</p>}
        </div>

        <button
          onClick={handleLinkToPage}
          disabled={!selectedPageId || linking || loading}
          className="w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
          style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
        >
          <Save className="w-4 h-4" />
          {linking ? 'Verlinke...' : 'Mit Page verknüpfen'}
        </button>

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded flex items-center gap-2 text-sm" style={{ backgroundColor: '#70c1b320', color: '#70c1b3' }}>
            <Check className="w-4 h-4" />
            <p>✅ Erfolgreich verlinkt!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded flex items-center gap-2 text-sm" style={{ backgroundColor: '#f25f5c20', color: '#f25f5c' }}>
            <AlertCircle className="w-4 h-4" />
            <p>Fehler: {error}</p>
          </div>
        )}

        <div className="p-3 rounded text-xs" style={{ backgroundColor: '#F3F4F6', color: '#666666' }}>
          <p><strong>Hinweis:</strong> Wenn du ein Menu Item mit einer Page verknüpfst:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><code>target_type</code> wird auf <code>page</code> gesetzt</li>
            <li><code>target_page_id</code> wird auf die gewählte Page-ID gesetzt</li>
            <li><code>href_resolved</code> wird automatisch generiert (/<code>slug</code>)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}