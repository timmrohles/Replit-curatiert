import { useCategoryFilter, DEFAULT_TABS, type CategoryTab } from './CategoryFilterContext';
import type { PageSection } from '../../types/page-resolve';

interface CategoryHeroSectionProps {
  section: PageSection;
  books?: any[];
  className?: string;
  categoryId?: number | null;
}

export function CategoryHeroSection({ section }: CategoryHeroSectionProps) {
  const { activeFilter, setActiveFilter, tabs } = useCategoryFilter();

  const title = section.config?.title || 'Kategorie';
  const subtitle = section.config?.subtitle || '';
  const backgroundImage = section.config?.backgroundImage || section.config?.background_image || '';

  const handleTabClick = (tabId: string) => {
    if (activeFilter === tabId) {
      setActiveFilter('all');
    } else {
      setActiveFilter(tabId);
    }
  };

  const isTabActive = (tabId: string) => {
    return activeFilter === 'all' || activeFilter === tabId;
  };

  return (
    <section className="relative w-full overflow-hidden" data-testid="category-hero">
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: backgroundImage ? undefined : '#1a1a2e',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="category-hero-bg"
      />
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: backgroundImage
            ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.7) 100%)'
            : 'linear-gradient(180deg, rgba(26,26,46,0.85) 0%, rgba(26,26,46,0.95) 100%)',
        }}
      />

      <div className="relative z-10 pt-16 md:pt-24 pb-0 px-5 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl text-white mb-4"
            style={{ fontFamily: 'Fjalla One', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
            data-testid="category-hero-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-base md:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
              data-testid="category-hero-subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>

        {tabs.length > 0 && (
          <nav className="max-w-4xl mx-auto mt-10" data-testid="category-hero-tabs" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="flex gap-2 flex-wrap justify-center">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative px-5 md:px-8 py-3.5 text-base font-medium whitespace-nowrap transition-colors ${
                    isTabActive(tab.id) ? 'text-white' : 'text-white/60'
                  }`}
                  data-testid={`category-tab-${tab.id}`}
                >
                  {tab.label}
                  {isTabActive(tab.id) && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
                  )}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}
