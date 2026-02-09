/**
 * ==================================================================
 * UNIVERSAL SECTION RENDERER
 * ==================================================================
 * 
 * Rendert Sections basierend auf der zentralen Registry.
 * 
 * Features:
 * - Auto-Loading der richtigen Component aus Registry
 * - Debug-Fallback für unknown types
 * - Error Boundary
 * - Type-Safe
 * 
 * ==================================================================
 */

import React from 'react';
import { AlertCircle, Code } from 'lucide-react';
import { getSectionComponent, isSectionTypeValid } from './sectionRegistry';
import type { PageSection } from '../../types/page-resolve';

// ============================================================================
// TYPES
// ============================================================================

interface UniversalSectionRendererProps {
  section: PageSection;
  books?: any[];
  className?: string;
  debug?: boolean;
}

// ============================================================================
// DEBUG FALLBACK COMPONENT
// ============================================================================

function UnknownSectionFallback({ section, debug = true }: { section: PageSection; debug?: boolean }) {
  const sectionType = section.section_type || section.type;
  
  if (!debug) {
    console.warn(`[UniversalSectionRenderer] Unknown section type: "${sectionType}"`, section);
    return null;
  }

  return (
    <div 
      className="border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg p-6 mx-4 my-4"
      style={{ borderColor: 'var(--warning, #f59e0b)' }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Unknown Section Type
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-orange-800">Type:</span>{' '}
              <code className="bg-orange-100 px-2 py-0.5 rounded text-orange-900">
                {sectionType || 'undefined'}
              </code>
            </div>
            <div>
              <span className="font-medium text-orange-800">Section ID:</span>{' '}
              <span className="text-orange-700">{section.id}</span>
            </div>
            <div>
              <span className="font-medium text-orange-800">Zone:</span>{' '}
              <span className="text-orange-700">{section.zone}</span>
            </div>
            {section.config && Object.keys(section.config).length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer font-medium text-orange-800 hover:text-orange-900">
                  Config Data
                </summary>
                <pre className="mt-2 p-3 bg-orange-100 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(section.config, null, 2)}
                </pre>
              </details>
            )}
          </div>
          <p className="text-xs text-orange-700 mt-3 italic">
            💡 Tip: Check if the section type is registered in <code>sectionRegistry.tsx</code>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN RENDERER
// ============================================================================

export function UniversalSectionRenderer({ 
  section, 
  books = [],
  className = '',
  debug = true 
}: UniversalSectionRendererProps) {
  const sectionType = section.section_type || section.type;
  const SectionComponent = getSectionComponent(sectionType);

  if (!SectionComponent) {
    return <UnknownSectionFallback section={section} debug={debug} />;
  }

  try {
    return <SectionComponent section={section} books={books} className={className} />;
  } catch (error) {
    const sectionType = section.section_type || section.type;
    console.error(`[UniversalSectionRenderer] Error rendering section type "${sectionType}":`, error);
    
    if (!debug) return null;
    
    return (
      <div 
        className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-6 mx-4 my-4"
        style={{ borderColor: 'var(--destructive, #ef4444)' }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">
              Section Render Error
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-red-800">Type:</span>{' '}
                <code className="bg-red-100 px-2 py-0.5 rounded text-red-900">
                  {sectionType}
                </code>
              </div>
              <div>
                <span className="font-medium text-red-800">Error:</span>{' '}
                <span className="text-red-700">{String(error)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ============================================================================
// BULK RENDERER
// ============================================================================

interface BulkSectionRendererProps {
  sections: PageSection[];
  className?: string;
  debug?: boolean;
}

/**
 * Renders multiple sections with automatic filtering by status/visibility
 */
export function BulkSectionRenderer({ 
  sections, 
  className = '',
  debug = true 
}: BulkSectionRendererProps) {
  // Filter to only published & visible sections (for public rendering)
  const visibleSections = sections.filter(
    s => s.status === 'published' && s.visibility === 'visible'
  );

  return (
    <>
      {visibleSections.map((section) => (
        <UniversalSectionRenderer
          key={section.id}
          section={section}
          className={className}
          debug={debug}
        />
      ))}
    </>
  );
}
