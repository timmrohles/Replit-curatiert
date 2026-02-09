import { Link } from 'react-router-dom';
import { Layout, ArrowLeft, Layers, Box, Navigation, ArrowRight } from 'lucide-react';

interface SectionItem {
  id: string;
  name: string;
  description: string;
  component: string;
  status: 'ready' | 'wip' | 'planned';
  category: 'layout' | 'above_fold' | 'content';
}

const sections: SectionItem[] = [
  {
    id: 'header',
    name: 'Header',
    description: 'Navigation mit Suche, Mega Menu, Favoriten',
    component: 'layout/Header.tsx',
    status: 'ready',
    category: 'layout',
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Footer mit Links, Social Media, Affiliate Hinweis',
    component: 'layout/Footer.tsx',
    status: 'ready',
    category: 'layout',
  },
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Hero-Banner mit Creator Cards und Such-Tags',
    component: 'sections/RefactoredHeroSection.section.tsx',
    status: 'wip',
    category: 'above_fold',
  },
  {
    id: 'category-grid',
    name: 'Kategorie-Raster',
    description: 'Genre-Kategorien als Karten-Grid ("Was möchtest du lesen?")',
    component: 'tags/CategoryCardsGrid.tsx',
    status: 'wip',
    category: 'above_fold',
  },
  {
    id: 'curated-books',
    name: 'Kuratierte Bücher',
    description: 'Bücher-Karussell mit Kurator-Info, Sortier-Chips und optionalem Video',
    component: 'creator/CreatorCarousel.tsx',
    status: 'wip',
    category: 'content',
  },
  {
    id: 'recipient-grid',
    name: 'Empfänger-Raster',
    description: 'Geschenke-Finder ("Bücher für Kinder", "Für Eltern" etc.)',
    component: 'tags/RecipientCategoryGridWithBooks.tsx',
    status: 'wip',
    category: 'content',
  },
  {
    id: 'storefronts-carousel',
    name: 'Storefronts Karussell',
    description: 'Kuratierte Buchläden von Expert*innen als Karten-Karussell',
    component: 'homepage/StorefrontCard.tsx',
    status: 'wip',
    category: 'content',
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Literarische Events mit Typ- und Ort-Filter-Chips',
    component: 'events/EventCard.tsx',
    status: 'wip',
    category: 'content',
  },
  {
    id: 'genre-categories',
    name: 'Medien & Buch',
    description: 'Podcasts und Media-Einbettungen mit Buchempfehlungen',
    component: 'tags/GenreCategoriesSection.tsx',
    status: 'wip',
    category: 'content',
  },
  {
    id: 'supporters',
    name: 'Unterstützer:innen',
    description: 'Partner und Unterstützer der Plattform',
    component: 'homepage/SupportersSection.tsx',
    status: 'wip',
    category: 'content',
  },
];

const categoryLabels: Record<string, { title: string; icon: any; color: string }> = {
  layout: { title: 'Header & Footer', icon: Navigation, color: 'var(--color-coral-vibrant, #f25f5c)' },
  above_fold: { title: 'Above the Fold', icon: Box, color: 'var(--color-cerulean, #247ba0)' },
  content: { title: 'Content Sektionen', icon: Layers, color: 'var(--color-teal, #70c1b3)' },
};

export default function SectionIndex() {
  const statusColors = {
    ready: { bg: '#70c1b3', label: 'Fertig' },
    wip: { bg: '#FFE066', label: 'In Arbeit' },
    planned: { bg: '#E5E7EB', label: 'Geplant' }
  };

  const categories = ['layout', 'above_fold', 'content'] as const;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-beige, #f7f4ef)' }}>
      <div className="border-b sticky top-0 z-50" style={{ backgroundColor: 'var(--color-white, #fff)', borderColor: 'var(--color-border, #e5e5e5)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <Link
                to="/sys-mgmt-xK9/content-manager"
                className="flex items-center gap-2 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Zurück zum Admin</span>
              </Link>
              <div className="h-6 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
              <h1 className="text-2xl font-headline uppercase">
                Section Library
              </h1>
            </div>
          </div>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Alle verfügbaren Sektionstypen der alten Startseite
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-6 mb-12">
          {categories.map((cat) => {
            const info = categoryLabels[cat];
            const count = sections.filter(s => s.category === cat).length;
            return (
              <div key={cat} className="rounded-lg p-6 text-white" style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)` }}>
                <div className="text-4xl font-headline mb-2">{count}</div>
                <div className="text-white/90">{info.title}</div>
              </div>
            );
          })}
        </div>

        <div className="space-y-12">
          {categories.map((cat) => {
            const info = categoryLabels[cat];
            const Icon = info.icon;
            const catSections = sections.filter(s => s.category === cat);
            return (
              <div key={cat}>
                <div className="flex items-center gap-4 mb-6 pb-4 border-b-4" style={{ borderColor: info.color }}>
                  <Icon className="w-8 h-8" style={{ color: info.color }} />
                  <h2 className="text-3xl font-headline uppercase" style={{ color: 'var(--charcoal, #2a2a2a)' }}>
                    {info.title}
                  </h2>
                  <span className="ml-auto text-2xl font-headline" style={{ color: info.color }}>
                    {catSections.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catSections.map((section) => (
                    <div
                      key={section.id}
                      className="group block border-2 rounded-lg p-6 transition-all"
                      style={{
                        backgroundColor: 'var(--color-white, #fff)',
                        borderColor: 'var(--color-border, #e5e5e5)'
                      }}
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h3 className="text-xl font-headline uppercase" style={{ color: 'var(--charcoal, #2a2a2a)' }}>
                          {section.name}
                        </h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: statusColors[section.status].bg,
                            color: section.status === 'wip' ? '#92400e' : '#fff'
                          }}
                        >
                          {statusColors[section.status].label}
                        </span>
                      </div>
                      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                        {section.description}
                      </p>
                      <div className="mb-4 px-3 py-2 rounded" style={{ backgroundColor: 'var(--color-beige, #f7f4ef)' }}>
                        <code className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                          /components/{section.component}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="py-8 mt-16" style={{ backgroundColor: 'var(--charcoal, #2a2a2a)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Section Library · coratiert.de</p>
        </div>
      </footer>
    </div>
  );
}
