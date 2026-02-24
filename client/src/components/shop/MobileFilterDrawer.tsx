import { X } from 'lucide-react';
import { Heading } from '../ui/typography';
import { DSButton } from '../design-system/DSButton';
import { FilterSection } from './FilterSection';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  resultCount: number;
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;

  themes: string[];
  selectedThemes: string[];
  onToggleTheme: (theme: string) => void;

  awards: string[];
  selectedAwards: string[];
  onToggleAward: (award: string) => void;

  media: string[];
  selectedMedia: string[];
  onToggleMedia: (media: string) => void;

  authors: string[];
  selectedAuthors: string[];
  onToggleAuthor: (author: string) => void;

  publishers: string[];
  selectedPublishers: string[];
  onTogglePublisher: (publisher: string) => void;

  series: string[];
  selectedSeries: string[];
  onToggleSeries: (series: string) => void;

  formats: string[];
  selectedFormats: string[];
  onToggleFormat: (format: string) => void;

  pubTypeLabels: string[];
  selectedPubTypeLabels: string[];
  onTogglePubType: (label: string) => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  hasActiveFilters,
  clearAllFilters,
  resultCount,
  categories,
  selectedCategories,
  onToggleCategory,
  themes,
  selectedThemes,
  onToggleTheme,
  awards,
  selectedAwards,
  onToggleAward,
  media,
  selectedMedia,
  onToggleMedia,
  authors,
  selectedAuthors,
  onToggleAuthor,
  publishers,
  selectedPublishers,
  onTogglePublisher,
  series,
  selectedSeries,
  onToggleSeries,
  formats,
  selectedFormats,
  onToggleFormat,
  pubTypeLabels,
  selectedPubTypeLabels,
  onTogglePubType
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="absolute inset-y-0 right-0 w-full sm:w-96 overflow-y-auto scrollbar-hide bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 px-4 py-4 flex items-center justify-between border-b bg-surface" style={{ borderColor: 'var(--color-border)' }}>
          <Heading as="h2" variant="h3">
            Filter
          </Heading>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs px-3 py-2 rounded-lg flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{ 
                  backgroundColor: 'var(--color-surface-elevated)', 
                  color: 'var(--color-teal)',
                  fontFamily: 'Inter'
                }}
                data-testid="button-mobile-clear-filters"
              >
                <X className="w-3 h-3" />
                Zurücksetzen
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:opacity-70 rounded-lg transition-opacity"
              style={{ color: 'var(--color-foreground)' }}
              data-testid="button-mobile-close-filters"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-24">
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            <FilterSection
              title="Kategorien"
              items={categories}
              selectedItems={selectedCategories}
              onToggle={onToggleCategory}
              defaultExpanded
            />

            <FilterSection
              title="Themen"
              items={themes}
              selectedItems={selectedThemes}
              onToggle={onToggleTheme}
            />

            <FilterSection
              title="Anzahl Buchpreise"
              items={awards}
              selectedItems={selectedAwards}
              onToggle={onToggleAward}
            />

            <FilterSection
              title="Medienresonanz"
              items={media}
              selectedItems={selectedMedia}
              onToggle={onToggleMedia}
            />

            <FilterSection
              title="Autor*innen"
              items={authors}
              selectedItems={selectedAuthors}
              onToggle={onToggleAuthor}
            />

            <FilterSection
              title="Verlage"
              items={publishers}
              selectedItems={selectedPublishers}
              onToggle={onTogglePublisher}
            />

            <FilterSection
              title="Buchreihen"
              items={series}
              selectedItems={selectedSeries}
              onToggle={onToggleSeries}
            />

            <FilterSection
              title="Medienarten"
              items={formats}
              selectedItems={selectedFormats}
              onToggle={onToggleFormat}
            />

            <FilterSection
              title="Publikationsform"
              items={pubTypeLabels}
              selectedItems={selectedPubTypeLabels}
              onToggle={onTogglePubType}
            />
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 p-4 border-t bg-surface" style={{ borderColor: 'var(--color-border)' }}>
          <DSButton
            onClick={onClose}
            variant="primary"
            size="large"
            fullWidth
            style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
          >
            ANZEIGEN ({resultCount} {resultCount === 1 ? 'BUCH' : 'BÜCHER'})
          </DSButton>
        </div>
      </div>
    </div>
  );
}
