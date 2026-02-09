/**
 * ==================================================================
 * CURATED LISTS SECTION - DETAIL PAGE
 * ==================================================================
 * 
 * Component: ScrollSection + CuratedListCard
 * Zweck: Horizontaler Carousel mit Curated List Cards
 * Pattern: Diverse Listen (Themen, Genres, Occasions)
 * 
 * Used in: Homepage (alte Version) - Not currently active
 * 
 * ==================================================================
 */

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { CuratedListCard } from '../../components/homepage/CuratedListCard';
import { SectionHeader } from '../../components/homepage/SectionHeader';

interface MockCuratedList {
  id: number;
  title: string;
  reason: string;
  bookCount: number;
  coverImages: string[];
  curator: {
    name: string;
    avatar: string;
  };
}

export default function CuratedListsSectionPage() {
  const listsCarouselRef = useRef<HTMLDivElement>(null);

  // Mock Curated Lists Data
  const curatedLists: MockCuratedList[] = [
    {
      id: 1,
      title: 'Bücher über Klimawandel',
      reason: 'Weil die Klimakrise das zentrale Thema unserer Zeit ist',
      bookCount: 12,
      coverImages: [
        'https://i.ibb.co/q3d4RtzF/lichtungen.jpg',
        'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
        'https://i.ibb.co/fzztP0nY/die-mitternachtsbibliothek.jpg'
      ],
      curator: {
        name: 'Emma Green',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
      }
    },
    {
      id: 2,
      title: 'Feministische Klassiker',
      reason: 'Weil diese Werke den Feminismus geprägt haben',
      bookCount: 18,
      coverImages: [
        'https://i.ibb.co/yBkXZ74g/Klara-und-die-Sonne.jpg',
        'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
        'https://i.ibb.co/jkqmyj9n/Der-Gesang-der-Flusskrebse.jpg'
      ],
      curator: {
        name: 'Lisa Wagner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
      }
    },
    {
      id: 3,
      title: 'Queere Liebesgeschichten',
      reason: 'Weil Liebe vielfältig ist und jede Geschichte zählt',
      bookCount: 15,
      coverImages: [
        'https://i.ibb.co/GvrS3cwJ/geordnete-verh-ltnisse-von-lana-lux.jpg',
        'https://i.ibb.co/q3WbDPc3/1000-letzte-dates.jpg',
        'https://i.ibb.co/Z1SY1gCB/schmidt.jpg'
      ],
      curator: {
        name: 'Alex Jordan',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
      }
    },
    {
      id: 4,
      title: 'Wirtschaft verstehen',
      reason: 'Weil Ökonomie alle betrifft und zugänglich sein muss',
      bookCount: 21,
      coverImages: [
        'https://i.ibb.co/q3d4RtzF/lichtungen.jpg',
        'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
        'https://i.ibb.co/fzztP0nY/die-mitternachtsbibliothek.jpg'
      ],
      curator: {
        name: 'Maurice Ökonomius',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
      }
    },
    {
      id: 5,
      title: 'Debut-Romane 2024',
      reason: 'Weil neue Stimmen frischen Wind in die Literatur bringen',
      bookCount: 9,
      coverImages: [
        'https://i.ibb.co/yBkXZ74g/Klara-und-die-Sonne.jpg',
        'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
        'https://i.ibb.co/jkqmyj9n/Der-Gesang-der-Flusskrebse.jpg'
      ],
      curator: {
        name: 'coratiert Redaktion',
        avatar: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400'
      }
    }
  ];

  // Scroll function
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (listsCarouselRef.current) {
      const scrollAmount = 380;
      listsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
              <List className="w-6 h-6" style={{ color: '#70c1b3' }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fjalla One' }}>
                Curated Lists Section
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2 ml-10">
            Kuratierte Listen · Themen, Genres, Occasions
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
              <List className="w-6 h-6 text-teal" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fjalla One' }}>
                Curated Lists Section
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Horizontaler Carousel mit Curated List Cards. Jede Card zeigt eine thematische 
                Buchsammlung mit Titel, Begründung, Cover-Vorschau und Curator Info.
              </p>
            </div>
          </div>

          {/* Component Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Container Component</h3>
              <code className="text-xs text-teal font-mono">
                /components/homepage/ScrollSection.tsx
              </code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Card Component</h3>
              <code className="text-xs text-teal font-mono">
                /components/homepage/CuratedListCard.tsx
              </code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Type</h3>
              <span className="text-sm text-gray-900">Scroll Carousel Section</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Card Width</h3>
              <span className="text-sm text-gray-900">320px (mobile) → 360px (desktop)</span>
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
                <span className="text-sm text-gray-700">Horizontal Scroll mit Snap</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Navigation Arrows</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">3 Cover Preview (Overlap)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">List Title + Reason</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Book Count Badge</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Curator Attribution</span>
              </div>
            </div>
          </div>

          {/* Usage Notes */}
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-teal rounded">
            <h3 className="font-semibold text-green-900 mb-2">💡 Usage Notes</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Cards sind klickbar und navigieren zur List Detail Page</li>
              <li>• Cover-Images sollten mindestens 3 sein für optimale Darstellung</li>
              <li>• "Reason" sollte kurz und prägnant sein (max. 2 Zeilen)</li>
              <li>• Ideal für thematische Sammlungen, Genre-Listen, Occasions</li>
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
          
          {/* Curated Lists Section */}
          <section className="py-12 md:py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="Kuratierte Listen"
                subtitle="Thematisch zusammengestellte Buchsammlungen"
              />
              
              <div className="relative">
                <div
                  ref={listsCarouselRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {curatedLists.map(list => (
                    <div key={list.id} className="snap-start">
                      <CuratedListCard 
                        {...list as any}
                        onClick={() => console.log(`Navigate to /list/${list.id}`)}
                      />
                    </div>
                  ))}
                </div>

                {/* Scroll Arrows */}
                <button
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                  aria-label="Vorherige Listen"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                  aria-label="Nächste Listen"
                >
                  <ChevronRight className="w-6 h-6 text-gray-900" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Props Interface */}
        <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Fjalla One' }}>
            Data Structure
          </h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
{`interface CuratedList {
  id: number;
  title: string;             // List Title (e.g., "Bücher über Klimawandel")
  reason: string;            // Kurze Begründung ("Weil...")
  bookCount: number;         // Anzahl Bücher in der Liste
  coverImages: string[];     // Array of cover URLs (min. 3 für Preview)
  curator: {
    name: string;            // Curator Name
    avatar: string;          // Curator Avatar URL
  };
}

// CuratedListCard Props
interface CuratedListCardProps extends CuratedList {
  onClick: () => void;       // Navigation handler
}`}
          </pre>
        </div>

        {/* Use Cases */}
        <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Fjalla One' }}>
            Use Cases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Thematische Listen</h4>
              <p className="text-sm text-gray-600">
                Klimawandel, Feminismus, LGBTQ+, Politik, Geschichte
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Genre-Listen</h4>
              <p className="text-sm text-gray-600">
                Krimi, Fantasy, Science Fiction, Romantik, Thriller
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Occasion Lists</h4>
              <p className="text-sm text-gray-600">
                Geschenke, Urlaubslektüre, Winterabende, Sommer-Reads
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Curator Collections</h4>
              <p className="text-sm text-gray-600">
                Persönliche Favoriten, Jahresrückblicke, Debuts
              </p>
            </div>
          </div>
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
            to="/dashboard/sections/creator-carousel"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-teal hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Creator Carousel</h4>
            <p className="text-sm text-gray-600">Carousel mit Curator Info</p>
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
