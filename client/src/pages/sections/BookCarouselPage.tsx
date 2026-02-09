/**
 * SECTION DETAIL PAGE: Book Carousel
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { BookCarousel } from '../../components/sections/BookCarousel.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';

const mockBooks = [
  {
    id: '1',
    title: 'Die Mitternachtsbibliothek',
    author: 'Matt Haig',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
    price: 22.00,
    isbn: '9783453291973',
    publisher: 'Heyne',
    year: 2021
  },
  {
    id: '2',
    title: 'Klara und die Sonne',
    author: 'Kazuo Ishiguro',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
    price: 24.00,
    isbn: '9783328601449',
    publisher: 'Blessing',
    year: 2021
  },
  {
    id: '3',
    title: 'Die Therapie',
    author: 'Sebastian Fitzek',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
    price: 20.00,
    isbn: '9783426511305',
    publisher: 'Droemer',
    year: 2006
  },
  {
    id: '4',
    title: 'Der Gesang der Flusskrebse',
    author: 'Delia Owens',
    cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
    price: 22.00,
    isbn: '9783446264199',
    publisher: 'Hanser',
    year: 2019
  },
  {
    id: '5',
    title: 'Eine Frage der Chemie',
    author: 'Bonnie Garmus',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
    price: 24.00,
    isbn: '9783492071338',
    publisher: 'Piper',
    year: 2022
  }
];

export default function BookCarouselPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Book Carousel Section"
        componentPath="/components/sections/BookCarouselSection.tsx"
        status="ready"
        description="Horizontal scrolling carousel for book displays with navigation controls."
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
                <BookCarousel 
                  books={mockBooks as any}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}