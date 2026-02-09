/**
 * SECTION DETAIL PAGE: Refactored Hero Section
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { RefactoredHeroSection } from '../../components/sections/RefactoredHeroSection.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';

const mockCreators = [
  {
    id: 'maurice-oekonomius',
    name: 'Maurice Ökonomius',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    role: 'Kurator',
    focus: 'Politik & Wirtschaft',
    tags: ['MMT', 'Wirtschaftspolitik', 'Progressive Ökonomie'],
    booksCount: 42,
    followersCount: 1234,
    storefrontId: 'maurice-oekonomius'
  },
  {
    id: 'sarah-feminist',
    name: 'Sarah Feminist',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    role: 'Kuratorin',
    focus: 'Feminismus & Gesellschaft',
    tags: ['Feminismus', 'Gender Studies', 'Intersektionalität'],
    booksCount: 36,
    followersCount: 987,
    storefrontId: 'sarah-feminist'
  }
];

const availableTags = [
  'MMT',
  'Wirtschaftspolitik',
  'Progressive Ökonomie',
  'Politik',
  'Wirtschaft',
  'Feminismus',
  'LGBTQ+',
  'Klima',
  'Geschichte'
];

export default function RefactoredHeroSectionPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Refactored Hero Section"
        componentPath="/components/sections/RefactoredHeroSection.tsx"
        status="ready"
        description="Advanced hero section with creator cards, tag filtering, and 3D card rotation effects. Showcases UI Core Components."
        category="Above the Fold"
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
          {/* Component Display - Clean, no preview borders */}
          <div className="bg-white overflow-hidden">
            <div 
              className={`mx-auto transition-all ${
                viewMode === 'mobile' ? 'max-w-[600px]' : 'max-w-[1400px]'
              }`}
            >
              <div className={viewMode === 'mobile' ? 'px-4 py-6' : 'px-6 py-6'}>
                <RefactoredHeroSection 
                  creators={mockCreators as any}
                  availableTags={availableTags}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-yellow-900">📝 Implementation Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Nutzt UI Core Components (Section, Container, Heading, Text)</li>
              <li>• Creator-Filter mit Tag-Auswahl</li>
              <li>• Follow-Funktion für Creators</li>
              <li>• Dark Mode Ready</li>
              <li>• Reduziert Hardcoded Styles um 40%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}