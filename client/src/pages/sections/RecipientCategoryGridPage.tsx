/**
 * SECTION DETAIL PAGE: Recipient Category Grid
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { RecipientCategoryGrid } from '../../components/sections/RecipientCategoryGrid.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';
import type { Section } from '../../components/sections/SectionRenderer';

const mockSection = {
  id: 'recipient-demo',
  type: 'recipient_grid' as const,
  config: {
    title: 'Geschenke finden'
  },
  items: [
    {
      id: '1',
      sortOrder: 1,
      data: { title: 'Für Kinder' },
      target: { type: 'category' as const, category: { name: 'Für Kinder' } }
    },
    {
      id: '2',
      sortOrder: 2,
      data: { title: 'Für Jugendliche' },
      target: { type: 'category' as const, category: { name: 'Für Jugendliche' } }
    },
    {
      id: '3',
      sortOrder: 3,
      data: { title: 'Für Eltern' },
      target: { type: 'category' as const, category: { name: 'Für Eltern' } }
    },
    {
      id: '4',
      sortOrder: 4,
      data: { title: 'Für Großeltern' },
      target: { type: 'category' as const, category: { name: 'Für Großeltern' } }
    },
    {
      id: '5',
      sortOrder: 5,
      data: { title: 'Für Freunde' },
      target: { type: 'category' as const, category: { name: 'Für Freunde' } }
    },
    {
      id: '6',
      sortOrder: 6,
      data: { title: 'Für Partner*innen' },
      target: { type: 'category' as const, category: { name: 'Für Partner*innen' } }
    }
  ]
};

export default function RecipientCategoryGridPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Recipient Category Grid"
        componentPath="/components/sections/RecipientCategoryGrid.tsx"
        status="ready"
        description="Gift finder grid showing recipient categories (For Kids, For Parents, etc.)."
        category="Main Content"
      />

      {/* View Mode Controls */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Preview Mode</div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-semibold">Desktop</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-semibold">Mobile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white">
            <div 
              className={`mx-auto transition-all ${
                viewMode === 'mobile' ? 'max-w-[600px]' : 'max-w-[1400px]'
              }`}
            >
              <div className={viewMode === 'mobile' ? 'px-4 py-6' : 'px-8 py-8'}>
                <RecipientCategoryGrid 
                  section={mockSection as any}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}