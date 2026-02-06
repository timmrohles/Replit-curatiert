/**
 * SECTION DETAIL PAGE: Horizontal Row Section
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { HorizontalRowSection } from '../../components/sections/HorizontalRowSection.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';

const mockBooks = [
  {
    id: '1',
    title: 'Die Mitternachtsbibliothek',
    author: 'Matt Haig',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
    publisher: 'Droemer',
    year: '2021',
    price: '22,00 €',
    availability: 'Sofort lieferbar',
    isbn: '9783426282694',
    category: 'Roman',
    review: {
      curatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      curatorName: 'Maurice Ökonomius',
      reviewText: 'Ein wunderbares Buch über zweite Chancen.'
    }
  },
  {
    id: '2',
    title: 'Klara und die Sonne',
    author: 'Kazuo Ishiguro',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
    publisher: 'Blessing',
    year: '2021',
    price: '24,00 €',
    availability: 'Sofort lieferbar',
    isbn: '9783896675866',
    category: 'Roman',
    review: {
      curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      curatorName: 'Sarah Feminist',
      reviewText: 'Berührend und philosophisch.'
    }
  },
  {
    id: '3',
    title: 'Die Therapie',
    author: 'Sebastian Fitzek',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
    publisher: 'Droemer',
    year: '2022',
    price: '20,00 €',
    availability: 'Sofort lieferbar',
    isbn: '9783426199008',
    category: 'Thriller',
    review: {
      curatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      curatorName: 'Maurice Ökonomius',
      reviewText: 'Spannend von der ersten bis zur letzten Seite.'
    }
  },
  {
    id: '4',
    title: 'Der Gesang der Flusskrebse',
    author: 'Delia Owens',
    cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
    publisher: 'hanserblau',
    year: '2019',
    price: '22,00 €',
    availability: 'Sofort lieferbar',
    isbn: '9783446264199',
    category: 'Roman',
    review: {
      curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      curatorName: 'Sarah Feminist',
      reviewText: 'Atmosphärisch dicht und bewegend.'
    }
  }
];

const mockSection = {
  id: 'horizontal-demo',
  title: 'Bestseller der Woche',
  type: 'horizontal_row',
  content: {
    description: 'Die meistgelesenen Bücher dieser Woche'
  }
};

export default function HorizontalRowSectionPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Horizontal Row Section"
        componentPath="/components/sections/HorizontalRowSection.tsx"
        status="ready"
        description="Compact horizontal book row with scrollable layout. Ideal for multiple book lists on one page."
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
                <HorizontalRowSection 
                  section={mockSection}
                  books={mockBooks}
                />
              </div>
            </div>
          </div>

          {/* Props Documentation */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-bold mb-3 text-blue-900 text-lg">🔧 Props Interface</h3>
            <pre className="text-sm text-blue-800 bg-white p-4 rounded border border-blue-200 overflow-x-auto">
{`interface HorizontalRowSectionProps {
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
              <li>• Horizontal Scroll (keine Navigation Buttons)</li>
              <li>• Kompakte Darstellung für viele Bücher</li>
              <li>• Responsive Grid</li>
              <li>• Optional: Description unter Titel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}