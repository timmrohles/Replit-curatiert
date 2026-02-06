/**
 * ==================================================================
 * SECTION LIBRARY - INDEX & NAVIGATION
 * ==================================================================
 * 
 * Kategorisierte Übersicht aller UI-Sections für Figma Make
 * Jede Section hat ihre eigene Detailseite mit Mock-Daten
 * 
 * Kategorien:
 * 1. Header/Footer Components
 * 2. Above the Fold (Hero Sections)
 * 3. Main Content Sections
 * 
 * ==================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, Layout, Grid, Navigation, ArrowLeft, Settings, Box, Layers, ArrowRight, PackageSearch } from 'lucide-react';

interface SectionItem {
  id: string;
  name: string;
  path: string;
  component: string;
  description: string;
  status: 'ready' | 'wip' | 'planned';
}

const sections = {
  headerFooter: [
    {
      id: 'header',
      name: 'Header',
      path: '/dashboard/sections/header',
      component: 'Header.tsx',
      description: 'Main navigation with search, mega menu, favorites',
      status: 'ready' as const
    },
    {
      id: 'footer',
      name: 'Footer',
      path: '/dashboard/sections/footer',
      component: 'Footer.tsx',
      description: 'Footer with links, social media, affiliate disclaimer',
      status: 'ready' as const
    }
  ],
  aboveFold: [
    {
      id: 'hero-section',
      name: 'Hero Section',
      path: '/dashboard/sections/hero',
      component: 'sections/HeroSection.tsx',
      description: 'Large hero banner with CTA',
      status: 'ready' as const
    },
    {
      id: 'refactored-hero',
      name: 'Refactored Hero Section',
      path: '/dashboard/sections/refactored-hero',
      component: 'sections/RefactoredHeroSection.tsx',
      description: 'Advanced hero with creator cards',
      status: 'ready' as const
    }
  ],
  mainContent: [
    {
      id: 'horizontal-row',
      name: 'Horizontal Row Section',
      path: '/dashboard/sections/horizontal-row',
      component: 'sections/HorizontalRowSection.tsx',
      description: 'Compact horizontal book row',
      status: 'ready' as const
    },
    {
      id: 'grid-section',
      name: 'Grid Section',
      path: '/dashboard/sections/grid',
      component: 'sections/GridSection.tsx',
      description: 'Responsive grid layout (2-4 columns)',
      status: 'ready' as const
    },
    {
      id: 'featured-section',
      name: 'Featured Section',
      path: '/dashboard/sections/featured',
      component: 'sections/FeaturedSection.tsx',
      description: 'Editorial highlight with image',
      status: 'ready' as const
    },
    {
      id: 'creator-carousel',
      name: 'Creator Carousel Section',
      path: '/dashboard/sections/creator-carousel',
      component: 'sections/CreatorCarouselSection.tsx',
      description: 'Large carousel with curator info',
      status: 'ready' as const
    },
    {
      id: 'scroll-section',
      name: 'Scroll Section',
      path: '/dashboard/sections/scroll',
      component: 'sections/ScrollSection.tsx',
      description: 'Horizontal scrolling with arrows',
      status: 'ready' as const
    },
    {
      id: 'supporters',
      name: 'Supporters Section',
      path: '/dashboard/sections/supporters',
      component: 'sections/SupportersSection.tsx',
      description: 'Showcase partners and supporters',
      status: 'ready' as const
    },
    {
      id: 'latest-reviews',
      name: 'Latest Reviews Section',
      path: '/dashboard/sections/latest-reviews',
      component: 'homepage/LatestReviewsSection.tsx',
      description: 'Display recent book reviews',
      status: 'ready' as const
    },
    {
      id: 'book-carousel',
      name: 'Book Carousel Section',
      path: '/dashboard/sections/book-carousel',
      component: 'sections/BookCarouselSection.tsx',
      description: 'Horizontal book carousel with navigation',
      status: 'ready' as const
    },
    {
      id: 'category-grid',
      name: 'Category Grid',
      path: '/dashboard/sections/category-grid',
      component: 'sections/CategoryGrid.tsx',
      description: 'Grid for book categories (Krimi, Fantasy, etc.)',
      status: 'ready' as const
    },
    {
      id: 'topic-tags-grid',
      name: 'Topic Tags Grid',
      path: '/dashboard/sections/topic-tags-grid',
      component: 'sections/TopicTagsGrid.tsx',
      description: 'Grid for topic tags (Feminismus, Climate, etc.)',
      status: 'ready' as const
    },
    {
      id: 'recipient-grid',
      name: 'Recipient Category Grid',
      path: '/dashboard/sections/recipient-grid',
      component: 'sections/RecipientCategoryGrid.tsx',
      description: 'Gift finder grid (For Kids, For Parents, etc.)',
      status: 'ready' as const
    },
    {
      id: 'matchmaking',
      name: 'Curator Matchmaking',
      path: '/dashboard/sections/matchmaking',
      component: 'homepage/CuratorMatchmaking.tsx',
      description: 'Interactive quiz for curator matching',
      status: 'ready' as const
    },
    {
      id: 'genre-categories',
      name: 'Genre Categories (Medien & Buch)',
      path: '/dashboard/sections/genre-categories',
      component: 'GenreCategoriesSection.tsx',
      description: 'Podcasts/Media embeds with book recommendations',
      status: 'ready' as const
    },
    {
      id: 'storefronts-carousel',
      name: 'Storefronts Carousel',
      path: '/dashboard/sections/storefronts-carousel',
      component: 'homepage/StorefrontCard.tsx',
      description: 'Horizontal carousel with creator storefront cards',
      status: 'ready' as const
    },
    {
      id: 'events',
      name: 'Events Section',
      path: '/dashboard/sections/events',
      component: 'EventCard.tsx',
      description: 'Literary events with filter functionality',
      status: 'ready' as const
    },
    {
      id: 'curated-lists',
      name: 'Curated Lists Section',
      path: '/dashboard/sections/curated-lists',
      component: 'homepage/CuratedListCard.tsx',
      description: 'Horizontal carousel with curated list cards',
      status: 'ready' as const
    }
  ]
};

export default function SectionIndex() {
  const statusColors = {
    ready: { bg: '#70c1b3', label: 'Ready' },
    wip: { bg: '#FFE066', label: 'WIP' },
    planned: { bg: '#E5E7EB', label: 'Planned' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/sys-mgmt-xK9/content-manager" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Zurück zum Admin</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fjalla One' }}>
                Section Library
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard/sections/inventory" 
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <PackageSearch className="w-4 h-4" />
                <span className="font-semibold">Cleanup Inventory</span>
              </Link>
              
              <Link 
                to="/sys-mgmt-xK9/content-manager?tab=sections" 
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="font-semibold">Section Management</span>
              </Link>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Browse und verwalte alle UI Sections des Projekts
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Page Header */}
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Layout className="w-12 h-12" style={{ color: '#f25f5c' }} />
            <h1 className="text-6xl font-bold" style={{ fontFamily: 'Fjalla One', color: '#2a2a2a' }}>
              Section Library
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            UI-Component Library für Figma Make → Replit Workflow
          </p>
          <div className="inline-block px-6 py-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
            <p className="text-sm font-semibold text-yellow-900">
              📐 Jede Section auf eigener Page · Mock-Daten · Fokussierte Entwicklung
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-16">
          <div className="bg-gradient-to-br from-coral to-coral/80 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Fjalla One' }}>
              {sections.headerFooter.length}
            </div>
            <div className="text-white/90">Header/Footer</div>
          </div>
          <div className="bg-gradient-to-br from-cerulean to-cerulean/80 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Fjalla One' }}>
              {sections.aboveFold.length}
            </div>
            <div className="text-white/90">Above the Fold</div>
          </div>
          <div className="bg-gradient-to-br from-teal to-teal/80 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Fjalla One' }}>
              {sections.mainContent.length}
            </div>
            <div className="text-white/90">Main Content</div>
          </div>
        </div>

        {/* Section Categories */}
        <div className="space-y-16">
          
          {/* Header/Footer Components */}
          <CategorySection
            icon={<Navigation className="w-8 h-8" />}
            title="Header/Footer Components"
            color="#f25f5c"
            sections={sections.headerFooter}
            statusColors={statusColors}
          />

          {/* Above the Fold */}
          <CategorySection
            icon={<Box className="w-8 h-8" />}
            title="Above the Fold"
            color="#247ba0"
            sections={sections.aboveFold}
            statusColors={statusColors}
          />

          {/* Main Content Sections */}
          <CategorySection
            icon={<Layers className="w-8 h-8" />}
            title="Main Content Sections"
            color="#70c1b3"
            sections={sections.mainContent}
            statusColors={statusColors}
          />

        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">Section Library · coratiert.de</p>
        </div>
      </footer>
    </div>
  );
}

// Helper Component
interface CategorySectionProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  sections: SectionItem[];
  statusColors: any;
}

function CategorySection({ icon, title, color, sections, statusColors }: CategorySectionProps) {
  return (
    <div>
      {/* Category Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b-4" style={{ borderColor: color }}>
        <div style={{ color }}>{icon}</div>
        <h2 className="text-4xl font-bold" style={{ fontFamily: 'Fjalla One', color: '#2a2a2a' }}>
          {title}
        </h2>
        <span className="ml-auto text-2xl font-bold" style={{ color, fontFamily: 'Fjalla One' }}>
          {sections.length}
        </span>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={section.path}
            className="group block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-900 hover:shadow-lg transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold group-hover:text-coral transition-colors" style={{ fontFamily: 'Fjalla One' }}>
                {section.name}
              </h3>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: statusColors[section.status].bg }}
              >
                {statusColors[section.status].label}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">{section.description}</p>

            {/* Component Path */}
            <div className="mb-4 px-3 py-2 bg-gray-50 rounded border border-gray-200">
              <code className="text-xs text-gray-700 font-mono">
                /components/{section.component}
              </code>
            </div>

            {/* View Button */}
            <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color }}>
              <span>Ansehen</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}