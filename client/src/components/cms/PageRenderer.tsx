// ============================================================================
// PageRenderer - Zentraler Dispatcher für datengetriebene Pages
// ============================================================================

import { PageSection, PageResolveSuccess } from "../../types/page-resolve";
import { UniversalSectionRenderer } from "../sections/UniversalSectionRenderer";

interface PageRendererProps {
  data: PageResolveSuccess;
  debug?: boolean; // Show debug info for unknown section types
}

/**
 * Rendert eine einzelne Section über den UniversalSectionRenderer
 */
function renderSection(section: PageSection, debug = true): React.ReactNode {
  return (
    <UniversalSectionRenderer 
      key={section.id} 
      section={section}
      debug={debug}
    />
  );
}

/**
 * Rendert eine Zone (sortiert nach sortOrder)
 */
function renderZone(sections: PageSection[], debug = true): React.ReactNode {
  if (!sections || sections.length === 0) {
    return null;
  }

  // Sortiere Sections nach sortOrder
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return <>{sortedSections.map((section) => renderSection(section, debug))}</>;
}

/**
 * PageRenderer - Hauptkomponente
 * 
 * Rendert die Page-Struktur in strikter Reihenfolge:
 * 1. header
 * 2. aboveFold
 * 3. main
 * 4. footer
 * 
 * ✅ Nutzt jetzt UniversalSectionRenderer mit zentraler Registry!
 */
export function PageRenderer({ data, debug = true }: PageRendererProps) {
  const { layout } = data;

  return (
    <div className="page-renderer">
      {/* Zone: Header */}
      {layout.zones.header && layout.zones.header.length > 0 && (
        <div className="zone-header">{renderZone(layout.zones.header, debug)}</div>
      )}

      {/* Zone: Above Fold */}
      {layout.zones.aboveFold && layout.zones.aboveFold.length > 0 && (
        <div className="zone-above-fold">{renderZone(layout.zones.aboveFold, debug)}</div>
      )}

      {/* Zone: Main */}
      {layout.zones.main && layout.zones.main.length > 0 && (
        <div className="zone-main">{renderZone(layout.zones.main, debug)}</div>
      )}

      {/* Zone: Footer */}
      {layout.zones.footer && layout.zones.footer.length > 0 && (
        <div className="zone-footer">{renderZone(layout.zones.footer, debug)}</div>
      )}
    </div>
  );
}
