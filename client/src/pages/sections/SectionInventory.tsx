/**
 * ==================================================================
 * SECTION INVENTORY - KOMPLETTE ÜBERSICHT
 * ==================================================================
 * 
 * Zeigt ALLE Sections im Projekt an für Cleanup-Entscheidung
 * Status: Welche behalten, welche löschen?
 * 
 * ==================================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, FileCode, Monitor } from 'lucide-react';

interface SectionInfo {
  name: string;
  componentPath: string;
  detailPagePath?: string;
  category: 'header-footer' | 'above-fold' | 'main-content' | 'special';
  description: string;
  duplicateOf?: string;
  notes?: string;
  inLibrary: boolean;
}

const allSections: SectionInfo[] = [
  // ===== HEADER/FOOTER =====
  {
    name: 'Header',
    componentPath: '/components/Header.tsx',
    detailPagePath: '/pages/sections/HeaderSection.tsx',
    category: 'header-footer',
    description: 'Main navigation with search, mega menu, favorites',
    inLibrary: true
  },
  {
    name: 'Footer',
    componentPath: '/components/Footer.tsx',
    detailPagePath: '/pages/sections/FooterPage.tsx',
    category: 'header-footer',
    description: 'Footer with links, social media, newsletter',
    inLibrary: true
  },

  // ===== ABOVE THE FOLD =====
  {
    name: 'Hero Section',
    componentPath: '/components/sections/HeroSection.tsx',
    detailPagePath: '/pages/sections/HeroSectionPage.tsx',
    category: 'above-fold',
    description: 'Large hero banner with gradient, stats, CTA',
    inLibrary: true
  },
  {
    name: 'Hero Section (homepage)',
    componentPath: '/components/homepage/HeroSection.tsx',
    category: 'above-fold',
    description: 'Hero in /homepage/ - DUPLICATE?',
    duplicateOf: '/components/sections/HeroSection.tsx',
    notes: '⚠️ Prüfen ob identisch mit sections/HeroSection.tsx',
    inLibrary: false
  },
  {
    name: 'Refactored Hero Section',
    componentPath: '/components/sections/RefactoredHeroSection.tsx',
    detailPagePath: '/pages/sections/RefactoredHeroSectionPage.tsx',
    category: 'above-fold',
    description: 'Advanced hero with creator cards, 3D effects',
    inLibrary: true
  },
  {
    name: 'Refactored Hero (homepage)',
    componentPath: '/components/homepage/RefactoredHeroSection.tsx',
    category: 'above-fold',
    description: 'RefactoredHero in /homepage/ - DUPLICATE?',
    duplicateOf: '/components/sections/RefactoredHeroSection.tsx',
    notes: '⚠️ Prüfen ob identisch mit sections/RefactoredHeroSection.tsx',
    inLibrary: false
  },

  // ===== MAIN CONTENT - BOOK DISPLAYS =====
  {
    name: 'Horizontal Row Section',
    componentPath: '/components/sections/HorizontalRowSection.tsx',
    detailPagePath: '/pages/sections/HorizontalRowSectionPage.tsx',
    category: 'main-content',
    description: 'Compact horizontal scrollable book row',
    inLibrary: true
  },
  {
    name: 'Grid Section',
    componentPath: '/components/sections/GridSection.tsx',
    detailPagePath: '/pages/sections/GridSectionPage.tsx',
    category: 'main-content',
    description: 'Responsive grid layout (2-4 columns)',
    inLibrary: true
  },
  {
    name: 'Featured Section',
    componentPath: '/components/sections/FeaturedSection.tsx',
    detailPagePath: '/pages/sections/FeaturedSectionPage.tsx',
    category: 'main-content',
    description: 'Editorial highlight with large image + 3 books',
    inLibrary: true
  },
  {
    name: 'Creator Carousel Section',
    componentPath: '/components/sections/CreatorCarouselSection.tsx',
    detailPagePath: '/pages/sections/CreatorCarouselSectionPage.tsx',
    category: 'main-content',
    description: 'Carousel with curator info badge',
    inLibrary: true
  },
  {
    name: 'Scroll Section',
    componentPath: '/components/sections/ScrollSection.tsx',
    detailPagePath: '/pages/sections/ScrollSectionPage.tsx',
    category: 'main-content',
    description: 'Horizontal scroll with arrow navigation (WRAPPER)',
    inLibrary: true
  },
  {
    name: 'Scroll Section (homepage)',
    componentPath: '/components/homepage/ScrollSection.tsx',
    category: 'main-content',
    description: 'ScrollSection in /homepage/ - DUPLICATE?',
    duplicateOf: '/components/sections/ScrollSection.tsx',
    notes: '⚠️ Prüfen ob identisch mit sections/ScrollSection.tsx',
    inLibrary: false
  },
  {
    name: 'Book Carousel Section',
    componentPath: '/components/sections/BookCarouselSection.tsx',
    detailPagePath: '/pages/sections/BookCarouselPage.tsx',
    category: 'main-content',
    description: 'Book carousel - UNTERSCHIED zu Creator Carousel?',
    notes: '⚠️ Vergleichen mit CreatorCarouselSection - evtl. redundant',
    inLibrary: false
  },
  {
    name: 'Book Carousel (homepage)',
    componentPath: '/components/homepage/BookCarousel.tsx',
    category: 'main-content',
    description: 'BookCarousel in /homepage/ - DUPLICATE?',
    duplicateOf: '/components/sections/BookCarouselSection.tsx',
    notes: '⚠️ Prüfen ob identisch oder unterschiedlich',
    inLibrary: false
  },

  // ===== MAIN CONTENT - CATEGORIES/TAGS =====
  {
    name: 'Category Grid',
    componentPath: '/components/sections/CategoryGrid.tsx',
    detailPagePath: '/pages/sections/CategoryGridPage.tsx',
    category: 'main-content',
    description: 'Grid für Buchkategorien (Krimi, Fantasy, etc.)',
    notes: '📋 Featured content type - evtl. behalten für Marketing',
    inLibrary: false
  },
  {
    name: 'Topic Tags Grid',
    componentPath: '/components/sections/TopicTagsGrid.tsx',
    detailPagePath: '/pages/sections/TopicTagsGridPage.tsx',
    category: 'main-content',
    description: 'Grid für Topic Tags (Feminismus, Klima, etc.)',
    notes: '📋 Featured content type - evtl. behalten für Marketing',
    inLibrary: false
  },
  {
    name: 'Recipient Category Grid',
    componentPath: '/components/sections/RecipientCategoryGrid.tsx',
    detailPagePath: '/pages/sections/RecipientCategoryGridPage.tsx',
    category: 'main-content',
    description: 'Grid für Empfänger-Kategorien (Geschenke)',
    notes: '📋 Featured content type - evtl. behalten für Gift Guide',
    inLibrary: false
  },

  // ===== MAIN CONTENT - OTHER =====
  {
    name: 'Supporters Section',
    componentPath: '/components/sections/SupportersSection.tsx',
    detailPagePath: '/pages/sections/SupportersSectionPage.tsx',
    category: 'main-content',
    description: 'Partners/Supporters showcase',
    inLibrary: true
  },
  {
    name: 'Supporters (homepage)',
    componentPath: '/components/homepage/SupportersSection.tsx',
    category: 'main-content',
    description: 'SupportersSection in /homepage/ - DUPLICATE?',
    duplicateOf: '/components/sections/SupportersSection.tsx',
    notes: '⚠️ Prüfen ob identisch',
    inLibrary: false
  },
  {
    name: 'Latest Reviews Section',
    componentPath: '/components/homepage/LatestReviewsSection.tsx',
    detailPagePath: '/pages/sections/LatestReviewsSectionPage.tsx',
    category: 'main-content',
    description: 'Display recent book reviews',
    inLibrary: true
  },

  // ===== SPECIAL / INTERACTIVE =====
  {
    name: 'Curator Matchmaking',
    componentPath: '/components/homepage/CuratorMatchmaking.tsx',
    detailPagePath: '/pages/sections/CuratorMatchmakingPage.tsx',
    category: 'special',
    description: 'Interactive quiz für Curator-Match',
    notes: '🎯 Unique feature - evtl. wichtig für UX',
    inLibrary: false
  },

  // ===== INFRASTRUCTURE (nicht löschbar) =====
  {
    name: 'Section Renderer',
    componentPath: '/components/sections/SectionRenderer.tsx',
    category: 'special',
    description: '🔧 INFRASTRUCTURE - Section Rendering Logic',
    notes: '⛔ NICHT LÖSCHEN - wird für dynamische Pages gebraucht',
    inLibrary: false
  },
  {
    name: 'Universal Section Renderer',
    componentPath: '/components/sections/UniversalSectionRenderer.tsx',
    category: 'special',
    description: '🔧 INFRASTRUCTURE - Universal Rendering',
    notes: '⛔ NICHT LÖSCHEN - Core Backend Integration',
    inLibrary: false
  },
  {
    name: 'Section Registry',
    componentPath: '/components/sections/sectionRegistry.tsx',
    category: 'special',
    description: '🔧 INFRASTRUCTURE - Section Type Registry',
    notes: '⛔ NICHT LÖSCHEN - Type definitions',
    inLibrary: false
  },
  {
    name: 'Section Detail Header',
    componentPath: '/components/sections/SectionDetailHeader.tsx',
    category: 'special',
    description: '🔧 INFRASTRUCTURE - Shared Header Component',
    notes: '⛔ NICHT LÖSCHEN - gerade erst erstellt',
    inLibrary: false
  }
];

export default function SectionInventory() {
  const [filter, setFilter] = useState<'all' | 'in-library' | 'not-in-library' | 'duplicates'>('all');

  const filteredSections = allSections.filter(section => {
    if (filter === 'in-library') return section.inLibrary;
    if (filter === 'not-in-library') return !section.inLibrary;
    if (filter === 'duplicates') return !!section.duplicateOf;
    return true;
  });

  const stats = {
    total: allSections.length,
    inLibrary: allSections.filter(s => s.inLibrary).length,
    notInLibrary: allSections.filter(s => !s.inLibrary).length,
    duplicates: allSections.filter(s => !!s.duplicateOf).length,
    infrastructure: allSections.filter(s => s.category === 'special' && s.notes?.includes('INFRASTRUCTURE')).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link 
              to="/dashboard/sections" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Zurück zur Section Library</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <FileCode className="w-8 h-8 text-coral" />
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fjalla One' }}>
              Section Inventory
            </h1>
          </div>
          <p className="text-gray-600">
            Komplette Übersicht aller Sections · Cleanup-Entscheidung
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Fjalla One', color: '#2a2a2a' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Sections</div>
          </div>
          <div className="bg-teal/10 border-2 border-teal rounded-lg p-4">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Fjalla One', color: '#70c1b3' }}>
              {stats.inLibrary}
            </div>
            <div className="text-sm text-gray-600">In Library</div>
          </div>
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Fjalla One', color: '#f97316' }}>
              {stats.notInLibrary}
            </div>
            <div className="text-sm text-gray-600">Not in Library</div>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Fjalla One', color: '#ef4444' }}>
              {stats.duplicates}
            </div>
            <div className="text-sm text-gray-600">Possible Duplicates</div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Fjalla One', color: '#3b82f6' }}>
              {stats.infrastructure}
            </div>
            <div className="text-sm text-gray-600">Infrastructure</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-semibold text-gray-600">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            Alle ({stats.total})
          </button>
          <button
            onClick={() => setFilter('in-library')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'in-library'
                ? 'bg-teal text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            In Library ({stats.inLibrary})
          </button>
          <button
            onClick={() => setFilter('not-in-library')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'not-in-library'
                ? 'bg-orange-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            Nicht in Library ({stats.notInLibrary})
          </button>
          <button
            onClick={() => setFilter('duplicates')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'duplicates'
                ? 'bg-red-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            Duplicates ({stats.duplicates})
          </button>
        </div>

        {/* Section List */}
        <div className="space-y-3">
          {filteredSections.map((section, idx) => (
            <div
              key={idx}
              className={`bg-white border-2 rounded-lg p-4 ${
                section.duplicateOf
                  ? 'border-red-300 bg-red-50'
                  : section.notes?.includes('INFRASTRUCTURE')
                  ? 'border-blue-300 bg-blue-50'
                  : section.inLibrary
                  ? 'border-teal bg-teal/5'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Fjalla One' }}>
                      {section.name}
                    </h3>
                    {section.inLibrary && (
                      <span className="px-3 py-1 bg-teal text-white rounded-full text-xs font-semibold">
                        In Library
                      </span>
                    )}
                    {section.duplicateOf && (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                        Possible Duplicate
                      </span>
                    )}
                    {section.notes?.includes('INFRASTRUCTURE') && (
                      <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                        Infrastructure
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-3">{section.description}</p>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-gray-400" />
                      <code className="text-gray-600 font-mono">{section.componentPath}</code>
                    </div>
                    {section.detailPagePath && (
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        <code className="text-gray-600 font-mono">{section.detailPagePath}</code>
                      </div>
                    )}
                    {section.duplicateOf && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-semibold">Duplicate of: {section.duplicateOf}</span>
                      </div>
                    )}
                    {section.notes && (
                      <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        {section.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Category Badge */}
                <div className="ml-4">
                  <div
                    className="px-3 py-1 rounded text-xs font-semibold text-white whitespace-nowrap"
                    style={{
                      backgroundColor:
                        section.category === 'header-footer'
                          ? '#f25f5c'
                          : section.category === 'above-fold'
                          ? '#247ba0'
                          : section.category === 'main-content'
                          ? '#70c1b3'
                          : '#6b7280'
                    }}
                  >
                    {section.category.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decision Helper */}
        <div className="mt-12 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Fjalla One' }}>
            🎯 Cleanup Empfehlung
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <strong className="text-red-700">Löschen (wahrscheinlich):</strong>
                <ul className="mt-1 ml-4 space-y-1 text-gray-700">
                  <li>• Alle Duplikate in /homepage/ (Hero, Scroll, Supporters, BookCarousel)</li>
                  <li>• BookCarouselSection wenn identisch zu CreatorCarouselSection</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <strong className="text-orange-700">Prüfen:</strong>
                <ul className="mt-1 ml-4 space-y-1 text-gray-700">
                  <li>• CategoryGrid, TopicTagsGrid, RecipientCategoryGrid → Marketing Features?</li>
                  <li>• CuratorMatchmaking → Unique UX Feature?</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <strong className="text-green-700">Behalten:</strong>
                <ul className="mt-1 ml-4 space-y-1 text-gray-700">
                  <li>• Alle Infrastructure Components</li>
                  <li>• Alle Components die bereits in Library sind</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
