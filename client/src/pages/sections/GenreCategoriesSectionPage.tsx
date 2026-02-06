/**
 * ==================================================================
 * GENRE CATEGORIES SECTION (Medien & Buch) - DETAIL PAGE
 * ==================================================================
 * 
 * Component: GenreCategoriesSection.tsx
 * Zweck: Podcasts/Media Embeds mit zugehörigen Buchempfehlungen
 * Pattern: 3-Column Grid mit Spotify Embeds + Book Carousels
 * 
 * Used in: Homepage (alte Version)
 * 
 * ==================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Podcast, BookOpen } from 'lucide-react';
import { GenreCategoriesSection } from '../../components/tags/GenreCategoriesSection';

export default function GenreCategoriesSectionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard/sections" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Zurück zur Library</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <Podcast className="w-6 h-6" style={{ color: '#247ba0' }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fjalla One' }}>
                Genre Categories Section
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2 ml-10">
            Medien & Buch · Podcasts mit Buchempfehlungen
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cerulean/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-cerulean" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fjalla One' }}>
                Medien & Buch Section
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Kombiniert Podcast/YouTube Embeds mit zugehörigen Buchempfehlungen in einem 3-spaltigem Grid.
                Jede Card hat ein Spotify/YouTube Embed + scrollbare Bücher-Liste.
              </p>
            </div>
          </div>

          {/* Component Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Component Path</h3>
              <code className="text-xs text-cerulean font-mono">
                /components/GenreCategoriesSection.tsx
              </code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Type</h3>
              <span className="text-sm text-gray-900">Main Content Section</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Background</h3>
              <span className="text-sm text-gray-900">#2a2a2a (Dark Gray)</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Layout</h3>
              <span className="text-sm text-gray-900">3-Column Grid (Responsive)</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Spotify/YouTube Embeds</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Scrollbare Buch-Carousels</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Podcast Metadata (Titel, Folge, Datum)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Navigation Arrows für Books</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Dark Theme optimiert</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Responsive: 1-3 Columns</span>
              </div>
            </div>
          </div>

          {/* Usage Notes */}
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h3 className="font-semibold text-yellow-900 mb-2">💡 Usage Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Embed URLs können für Spotify, YouTube oder andere Plattformen angepasst werden</li>
              <li>• Jede Media Card kann unterschiedlich viele Bücher haben</li>
              <li>• Books haben optionale Metadaten (Publisher, Year, Price)</li>
              <li>• Link "Zur Themenseite" ist vorbereitet für zukünftige Navigation</li>
            </ul>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700">
            <h3 className="text-white font-semibold" style={{ fontFamily: 'Fjalla One' }}>
              Live Preview
            </h3>
          </div>
          <div className="bg-[#2a2a2a]">
            <GenreCategoriesSection />
          </div>
        </div>

        {/* Props Interface */}
        <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Fjalla One' }}>
            Data Structure
          </h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
{`interface MediaBook {
  id: number;
  cover: string;
  title: string;
  author: string;
  publisher: string;  // Optional
  year: string;       // Optional
  price: string;      // Optional
}

interface MediaCardProps {
  embedUrl: string;           // Spotify/YouTube Embed URL
  books: MediaBook[];         // Array of books discussed
  podcastTitle: string;       // e.g., "Buchclub"
  episodeNumber: string;      // e.g., "1"
  episodeDate: string;        // e.g., "2024-01-15"
  carouselRef: React.RefObject<HTMLDivElement>;
  scrollLeft: number;
  onScroll: (direction: 'left' | 'right') => void;
}`}
          </pre>
        </div>

        {/* Related Sections */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/sections/book-carousel"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-teal hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Book Carousel</h4>
            <p className="text-sm text-gray-600">Einzelne Buch-Carousel Section</p>
          </Link>
          <Link
            to="/dashboard/sections/scroll"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-teal hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Scroll Section</h4>
            <p className="text-sm text-gray-600">Generic scrolling container</p>
          </Link>
          <Link
            to="/dashboard/sections"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-coral hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">← Alle Sections</h4>
            <p className="text-sm text-gray-600">Zurück zur Übersicht</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
