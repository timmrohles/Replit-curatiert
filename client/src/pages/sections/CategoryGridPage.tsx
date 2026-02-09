/**
 * SECTION DETAIL PAGE: Category Grid
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { CategoryGrid } from '../../components/sections/CategoryGrid.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';
import type { Section } from '../../components/sections/SectionRenderer';

const mockSection = {
  id: 'category-demo',
  type: 'category_grid' as const,
  config: {
    title: 'Kategorien entdecken'
  },
  items: [
    {
      id: '1',
      sortOrder: 1,
      data: { title: 'Belletristik' },
      target: { type: 'category' as const, category: { name: 'Belletristik' } }
    },
    {
      id: '2',
      sortOrder: 2,
      data: { title: 'Sachbuch' },
      target: { type: 'category' as const, category: { name: 'Sachbuch' } }
    },
    {
      id: '3',
      sortOrder: 3,
      data: { title: 'Krimi & Thriller' },
      target: { type: 'category' as const, category: { name: 'Krimi & Thriller' } }
    },
    {
      id: '4',
      sortOrder: 4,
      data: { title: 'Science Fiction' },
      target: { type: 'category' as const, category: { name: 'Science Fiction' } }
    },
    {
      id: '5',
      sortOrder: 5,
      data: { title: 'Fantasy' },
      target: { type: 'category' as const, category: { name: 'Fantasy' } }
    },
    {
      id: '6',
      sortOrder: 6,
      data: { title: 'Biografien' },
      target: { type: 'category' as const, category: { name: 'Biografien' } }
    }
  ]
};

export default function CategoryGridPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Category Grid"
        componentPath="/components/sections/CategoryGrid.tsx"
        status="ready"
        description="Grid layout displaying book categories with icons, colors, and book counts."
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
                <CategoryGrid 
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