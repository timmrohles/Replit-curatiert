/**
 * SECTION DETAIL PAGE: Topic Tags Grid
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { TopicTagsGrid } from '../../components/sections/TopicTagsGrid.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';
import type { Section } from '../../components/sections/SectionRenderer';

const mockSection = {
  id: 'tags-demo',
  type: 'topic_tags' as const,
  config: {
    title: 'Themen entdecken'
  },
  items: [
    {
      id: '1',
      sortOrder: 1,
      data: { label: 'MMT' },
      target: { type: 'tag' as const, tag: { name: 'MMT' } }
    },
    {
      id: '2',
      sortOrder: 2,
      data: { label: 'Wirtschaftspolitik' },
      target: { type: 'tag' as const, tag: { name: 'Wirtschaftspolitik' } }
    },
    {
      id: '3',
      sortOrder: 3,
      data: { label: 'Progressive Ökonomie' },
      target: { type: 'tag' as const, tag: { name: 'Progressive Ökonomie' } }
    },
    {
      id: '4',
      sortOrder: 4,
      data: { label: 'Feminismus' },
      target: { type: 'tag' as const, tag: { name: 'Feminismus' } }
    },
    {
      id: '5',
      sortOrder: 5,
      data: { label: 'LGBTQ+' },
      target: { type: 'tag' as const, tag: { name: 'LGBTQ+' } }
    },
    {
      id: '6',
      sortOrder: 6,
      data: { label: 'Klima' },
      target: { type: 'tag' as const, tag: { name: 'Klima' } }
    },
    {
      id: '7',
      sortOrder: 7,
      data: { label: 'Geschichte' },
      target: { type: 'tag' as const, tag: { name: 'Geschichte' } }
    },
    {
      id: '8',
      sortOrder: 8,
      data: { label: 'Philosophie' },
      target: { type: 'tag' as const, tag: { name: 'Philosophie' } }
    },
    {
      id: '9',
      sortOrder: 9,
      data: { label: 'Psychologie' },
      target: { type: 'tag' as const, tag: { name: 'Psychologie' } }
    },
    {
      id: '10',
      sortOrder: 10,
      data: { label: 'Biografien' },
      target: { type: 'tag' as const, tag: { name: 'Biografien' } }
    },
    {
      id: '11',
      sortOrder: 11,
      data: { label: 'Politik' },
      target: { type: 'tag' as const, tag: { name: 'Politik' } }
    },
    {
      id: '12',
      sortOrder: 12,
      data: { label: 'Wirtschaft' },
      target: { type: 'tag' as const, tag: { name: 'Wirtschaft' } }
    }
  ]
};

export default function TopicTagsGridPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Topic Tags Grid"
        componentPath="/components/sections/TopicTagsGrid.tsx"
        status="ready"
        description="Tag cloud with clickable topic tags for content discovery and filtering."
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
                <TopicTagsGrid 
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