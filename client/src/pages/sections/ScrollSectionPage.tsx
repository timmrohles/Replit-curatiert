/**
 * ==================================================================
 * SCROLL SECTION - DETAIL PAGE
 * ==================================================================
 */

import React, { useState, useRef } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { ScrollSection } from '../../components/sections/ScrollSection.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';
import { BookCard } from '../../components/book/BookCard';

const mockBooks = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  title: ['Die Mitternachtsbibliothek', 'Klara und die Sonne', 'Die Therapie', 'Der Gesang der Flusskrebse', 'Eine Frage der Chemie', 'Das Lied der Krähen', 'Die Stadt der Blinden', 'Der Schatten des Windes', 'Der Alchemist', 'Sapiens', 'Homo Deus', 'Die Geschichte der Bienen'][i],
  author: ['Matt Haig', 'Kazuo Ishiguro', 'Sebastian Fitzek', 'Delia Owens', 'Bonnie Garmus', 'Leigh Bardugo', 'José Saramago', 'Carlos Ruiz Zafón', 'Paulo Coelho', 'Yuval Noah Harari', 'Yuval Noah Harari', 'Maja Lunde'][i],
  cover: `https://images.unsplash.com/photo-${['1543002588-bfa74002ed7e', '1512820790803-83ca734da794', '1544947950-fa07a98d237f', '1495446815901-a7297e633e8d', '1589998059171-988d887df646', '1532012197267-da84d127e765', '1524578271613-d550eacf6090', '1476275466078-4007374efbbe', '1455390582262-044cdead277a', '1481627834876-b7833e8f5570', '1532012197267-da84d127e765', '1544947950-fa07a98d237f'][i]}?w=400&h=600&fit=crop`,
  publisher: ['Droemer', 'Blessing', 'Droemer', 'hanserblau', 'Piper', 'Knaur', 'Rowohlt', 'Insel', 'Diogenes', 'DVA', 'C.H.Beck', 'btb'][i],
  year: ['2021', '2021', '2022', '2019', '2023', '2021', '2008', '2005', '2017', '2015', '2017', '2015'][i],
  price: `${18 + i * 2},00 €`,
  isbn: `978${3426282694 + i * 1000}`
}));

export default function ScrollSectionPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const carouselRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Scroll Section"
        componentPath="/components/sections/ScrollSection.tsx"
        status="ready"
        description="Horizontal scrolling section with arrow navigation and fade-out effects. Wrapper for any scrollable content."
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

      {/* Component Display */}
      <div className="bg-white">
        <div 
          className={`mx-auto transition-all ${
            viewMode === 'mobile' ? 'max-w-[600px]' : 'max-w-[1400px]'
          }`}
          style={{ 
            boxShadow: viewMode === 'mobile' ? '0 0 50px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <ScrollSection 
            id="scroll-demo"
            title="Beliebte Bücher"
            subtitle="Handverlesen von unseren Kurator*innen"
            carouselRef={carouselRef}
            scrollAmount={400}
          >
            <div ref={carouselRef} className="flex gap-4 pb-4">
              {mockBooks.map((book) => (
                <div key={book.id} className="flex-shrink-0 w-48">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </ScrollSection>
        </div>
      </div>
    </div>
  );
}