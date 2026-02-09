/**
 * SECTION DETAIL PAGE: Grid Section
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { GridSection } from '../../components/sections/GridSection.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';

const mockBooks = Array.from({ length: 8 }, (_, i) => ({
  id: `${i + 1}`,
  title: ['Die Mitternachtsbibliothek', 'Klara und die Sonne', 'Die Therapie', 'Der Gesang der Flusskrebse', 'Eine Frage der Chemie', 'Das Lied der Krähen', 'Die Stadt der Blinden', 'Der Schatten des Windes'][i],
  author: ['Matt Haig', 'Kazuo Ishiguro', 'Sebastian Fitzek', 'Delia Owens', 'Bonnie Garmus', 'Leigh Bardugo', 'José Saramago', 'Carlos Ruiz Zafón'][i],
  cover: `https://images.unsplash.com/photo-${['1543002588-bfa74002ed7e', '1512820790803-83ca734da794', '1544947950-fa07a98d237f', '1495446815901-a7297e633e8d', '1589998059171-988d887df646', '1532012197267-da84d127e765', '1524578271613-d550eacf6090', '1476275466078-4007374efbbe'][i]}?w=400&h=600&fit=crop`,
  publisher: ['Droemer', 'Blessing', 'Droemer', 'hanserblau', 'Piper', 'Knaur', 'Rowohlt', 'Insel'][i],
  year: ['2021', '2021', '2022', '2019', '2023', '2021', '2008', '2005'][i],
  price: `${20 + i * 2},00 €`,
  isbn: `978${3426282694 + i * 1000}`
}));

const mockSection = {
  id: 'grid-demo',
  title: 'Unsere Empfehlungen',
  type: 'grid',
  content: {
    description: 'Handverlesene Bücher für jeden Geschmack',
    columns: 4
  }
};

export default function GridSectionPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Grid Section"
        componentPath="/components/sections/GridSection.tsx"
        status="ready"
        description="Responsive grid layout (2-4 columns) for displaying book collections. Clean and organized presentation."
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
          {/* Component Display - Clean, no preview borders */}
          <div className="bg-white">
            <div 
              className={`mx-auto transition-all ${
                viewMode === 'mobile' ? 'max-w-[600px]' : 'max-w-[1400px]'
              }`}
            >
              <div className={viewMode === 'mobile' ? 'px-4 py-6' : 'px-8 py-8'}>
                <GridSection 
                  section={mockSection as any}
                  books={mockBooks as any}
                />
              </div>
            </div>
          </div>

          {/* Props Documentation */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-bold mb-3 text-blue-900 text-lg">🔧 Props Interface</h3>
            <pre className="text-sm text-blue-800 bg-white p-4 rounded border border-blue-200 overflow-x-auto">
{`interface GridSectionProps {
  section: Section;
  books: Book[];
  className?: string;
}`}
            </pre>
          </div>

          {/* Features */}
          <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-green-900">✨ Features</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Responsive Grid (4 Spalten Desktop, 2 Mobile, 1 Tiny)</li>
              <li>• Konfigurierbare Spaltenanzahl</li>
              <li>• Automatisches Wrapping</li>
              <li>• Hover-Effekte auf Book Cards</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}