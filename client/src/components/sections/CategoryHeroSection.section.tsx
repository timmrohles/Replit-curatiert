import { useCategoryFilter, type CategoryFilterMode } from './CategoryFilterContext';
import type { PageSection } from '../../types/page-resolve';

interface CategoryHeroSectionProps {
  section: PageSection;
  books?: any[];
  className?: string;
  categoryId?: number | null;
}

export function CategoryHeroSection({ section }: CategoryHeroSectionProps) {
  const { activeFilter, setActiveFilter } = useCategoryFilter();

  const title = section.config?.title || 'Kategorie';
  const subtitle = section.config?.subtitle || '';
  const backgroundImage = section.config?.backgroundImage || section.config?.background_image || '';

  const handleTabClick = (tab: 'empfehlungen' | 'redaktion') => {
    if (activeFilter === tab) {
      setActiveFilter('all');
    } else {
      setActiveFilter(tab);
    }
  };

  const isTabActive = (tab: 'empfehlungen' | 'redaktion') => {
    return activeFilter === 'all' || activeFilter === tab;
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

        <div className="max-w-4xl mx-auto mt-10">
          <div className="flex gap-1 justify-center" data-testid="category-hero-tabs">
            <button
              onClick={() => handleTabClick('empfehlungen')}
              className="px-6 py-3 text-sm font-medium whitespace-nowrap rounded-t-lg transition-all duration-200"
              style={{
                color: isTabActive('empfehlungen') ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                backgroundColor: isTabActive('empfehlungen') ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                borderBottom: isTabActive('empfehlungen') ? '2px solid #FFFFFF' : '2px solid transparent',
              }}
              data-testid="category-tab-empfehlungen"
            >
              Empfehlungen
            </button>
            <button
              onClick={() => handleTabClick('redaktion')}
              className="px-6 py-3 text-sm font-medium whitespace-nowrap rounded-t-lg transition-all duration-200"
              style={{
                color: isTabActive('redaktion') ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                backgroundColor: isTabActive('redaktion') ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                borderBottom: isTabActive('redaktion') ? '2px solid #FFFFFF' : '2px solid transparent',
              }}
              data-testid="category-tab-redaktion"
            >
              Redaktion
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
