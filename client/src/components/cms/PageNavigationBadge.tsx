import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, Link2Off } from 'lucide-react';
interface NavigationLink {
  id: number;
  name: string;
  path: string;
  parent_id: number | null;
  parentName?: string;
}

interface Props {
  pageId: number | string;
}

export function PageNavigationBadge({ pageId }: Props) {
  const [searchParams] = useSearchParams();
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Only show in preview mode
  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    // ✅ ALWAYS log page ID for debugging
    console.log('📍 PageNavigationBadge mounted with pageId:', pageId, 'preview:', isPreview);
    
    if (!isPreview) {
      setLoading(false);
      return;
    }

    const fetchNavigationLinks = async () => {
      try {
        setLoading(true);
        
        // ✅ DIRECT API: Fetch menu items linked to this page
        const response = await fetch(
          `/api/navigation/items`,
          {
            headers: {
            },
          }
        );

        if (!response.ok) {
          console.warn('Failed to fetch navigation items');
          return;
        }

        const data = await response.json();
        
        if (!data.ok || !data.data) {
          console.warn('Invalid navigation response');
          return;
        }

        // Filter ALL items (including children) that link to this page
        const linkedItems = data.data
          .filter((item: any) => {
            return item.target_type === 'page' && 
                   String(item.target_page_id) === String(pageId);
          })
          .map((item: any) => {
            // Find parent name if exists
            const parent = data.data.find((p: any) => p.id === item.parent_id);
            
            return {
              id: item.id,
              name: item.name,
              path: item.path || item.href || item.href_resolved || '#',
              parent_id: item.parent_id,
              parentName: parent?.name,
            };
          });

        console.log('🔍 PageNavigationBadge Debug:', {
          pageId,
          totalItems: data.data.length,
          linkedItems: linkedItems.length,
          links: linkedItems
        });

        setLinks(linkedItems);
      } catch (error) {
        console.error('Error fetching navigation links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavigationLinks();
  }, [pageId, isPreview]);
  
  // Don't render if not in preview mode
  if (!isPreview) return null;
  if (loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: links.length > 0 ? 'rgba(34, 197, 94, 0.95)' : 'rgba(251, 146, 60, 0.95)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '320px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {links.length > 0 ? (
          <Link2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <Link2Off size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        )}
        
        <div style={{ flex: 1 }}>
          {links.length > 0 ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                ✅ In Navigation ({links.length})
              </div>
              {links.map((link) => (
                <div
                  key={link.id}
                  style={{
                    fontSize: '13px',
                    opacity: 0.95,
                    marginTop: '4px',
                    paddingLeft: '8px',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {link.parentName && (
                    <span style={{ opacity: 0.8 }}>{link.parentName} → </span>
                  )}
                  <strong>{link.name}</strong>
                </div>
              ))}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600 }}>⚠️ Nicht in Navigation</div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                Diese Seite ist keinem Menüpunkt zugeordnet
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}