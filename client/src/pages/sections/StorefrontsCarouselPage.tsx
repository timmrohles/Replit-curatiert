/**
 * ==================================================================
 * STOREFRONTS CAROUSEL SECTION - DETAIL PAGE
 * ==================================================================
 * 
 * Component: ScrollSection + StorefrontCard
 * Zweck: Horizontaler Carousel mit Creator Storefront Cards
 * Pattern: Scrollable container mit Banner Images
 * 
 * Used in: Homepage (alte Version)
 * 
 * ==================================================================
 */

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { StorefrontCard } from '../../components/homepage/StorefrontCard';
import { SectionHeader } from '../../components/homepage/SectionHeader';
import { SCROLL_AMOUNTS } from '../../utils/carousel-helpers';

interface MockStorefront {
  id: string;
  name: string;
  tagline: string;
  bannerImage: string;
  curatorAvatar: string;
  curatorName: string;
  curatorBio: string;
  bookCount: number;
  followerCount: number;
}

export default function StorefrontsCarouselPage() {
  const storefrontsCarouselRef = useRef<HTMLDivElement>(null);

  // Mock Storefronts Data
  const storefronts: MockStorefront[] = [
    {
      id: 'maurice-oekonomius',
      name: 'Progressive Ökonomie',
      tagline: 'Wirtschaftspolitik neu denken',
      bannerImage: 'https://images.unsplash.com/photo-1554224311-beee1acb7c8b?w=800',
      curatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      curatorName: 'Maurice Ökonomius',
      curatorBio: 'Wirtschaftsjournalist & MMT-Experte',
      bookCount: 24,
      followerCount: 1284
    },
    {
      id: 'diversity-collective',
      name: 'Diverse Voices',
      tagline: 'Literatur abseits des Mainstreams',
      bannerImage: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
      curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      curatorName: 'Sarah Martinez',
      curatorBio: 'Literaturwissenschaftlerin & Diversity-Aktivistin',
      bookCount: 31,
      followerCount: 2156
    },
    {
      id: 'climate-reads',
      name: 'Climate Fiction',
      tagline: 'Literatur zur Klimakrise',
      bannerImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      curatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      curatorName: 'Emma Green',
      curatorBio: 'Umweltwissenschaftlerin & Buchhändlerin',
      bookCount: 18,
      followerCount: 987
    },
    {
      id: 'queer-literature',
      name: 'Queer Reads',
      tagline: 'LGBTQIA+ Perspektiven',
      bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      curatorName: 'Alex Jordan',
      curatorBio: 'Queere Literatur & Community Building',
      bookCount: 27,
      followerCount: 1823
    },
    {
      id: 'feminist-library',
      name: 'Feminist Bookshelf',
      tagline: 'Feministische Klassiker & Neue Stimmen',
      bannerImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
      curatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      curatorName: 'Lisa Wagner',
      curatorBio: 'Gender Studies & Literaturkritik',
      bookCount: 42,
      followerCount: 3421
    }
  ];

  // Scroll function
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (storefrontsCarouselRef.current) {
      storefrontsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -SCROLL_AMOUNTS.STOREFRONT : SCROLL_AMOUNTS.STOREFRONT,
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
              <Store className="w-6 h-6" style={{ color: '#247ba0' }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fjalla One' }}>
                Storefronts Carousel
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2 ml-10">
            Creator Storefronts · Kuratierte Buchläden
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cerulean/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-cerulean" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fjalla One' }}>
                Storefronts Carousel Section
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Horizontaler Carousel mit Creator Storefront Cards. Jede Card zeigt Banner Image, 
                Curator Info, Storefront Name und Stats (Bücher, Follower).
              </p>
            </div>
          </div>

          {/* Component Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Container Component</h3>
              <code className="text-xs text-cerulean font-mono">
                /components/homepage/ScrollSection.tsx
              </code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Card Component</h3>
              <code className="text-xs text-cerulean font-mono">
                /components/homepage/StorefrontCard.tsx
              </code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Type</h3>
              <span className="text-sm text-gray-900">Scroll Carousel Section</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Card Width</h3>
              <span className="text-sm text-gray-900">320px (mobile) → 400px (desktop)</span>
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
                <span className="text-sm text-gray-700">Banner Image mit Overlay</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Curator Avatar & Name</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Stats (Book Count, Followers)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Hover Effects & Transitions</span>
              </div>
            </div>
          </div>

          {/* Usage Notes */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-cerulean rounded">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Usage Notes</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cards sind klickbar und navigieren zu `/creator/:id`</li>
              <li>• Banner Images sollten mindestens 800x400px sein</li>
              <li>• Scroll-Amount ist in `/utils/carousel-helpers` definiert</li>
              <li>• Dark overlay auf Banner für bessere Text-Lesbarkeit</li>
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
          
          {/* Storefronts Section */}
          <section className="py-12 md:py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="Creator Storefronts"
                subtitle="Entdecke kuratierte Buchläden von Expert*innen"
              />
              
              <div className="relative">
                <div
                  ref={storefrontsCarouselRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {storefronts.map(storefront => (
                    <div key={storefront.id} className="snap-start">
                      <StorefrontCard 
                        {...storefront}
                        onNavigate={() => console.log(`Navigate to /creator/${storefront.id}`)}
                      />
                    </div>
                  ))}
                </div>

                {/* Scroll Arrows */}
                <button
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                  aria-label="Vorherige Storefronts"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                  aria-label="Nächste Storefronts"
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
{`interface Storefront {
  id: string;                // Slug für Navigation
  name: string;              // Storefront Name
  tagline: string;           // Kurze Beschreibung
  bannerImage: string;       // Header Image URL (800x400px+)
  curatorAvatar: string;     // Curator Avatar URL
  curatorName: string;       // Curator Name
  curatorBio: string;        // Curator Bio/Focus
  bookCount: number;         // Anzahl Bücher
  followerCount: number;     // Anzahl Follower
}

// ScrollSection Props
interface ScrollSectionProps {
  id: string;
  title: string;
  subtitle: string;
  carouselRef: React.RefObject<HTMLDivElement>;
  scrollAmount: number;      // from carousel-helpers
  children: React.ReactNode;
}`}
          </pre>
        </div>

        {/* Related Sections */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/sections/creator-carousel"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-teal hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Creator Carousel</h4>
            <p className="text-sm text-gray-600">Book Carousel mit Curator Info</p>
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
