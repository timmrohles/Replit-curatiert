// ============================================================================
// Category Grid Section - Frontend Render Component
// ============================================================================

import { useSafeNavigate } from '../../utils/routing';
import { linkForTarget } from '../../utils/link-resolver';
import { CategoryGridProps } from './CategoryGrid.schema';

export function CategoryGrid({ section }: CategoryGridProps) {
  const navigate = useSafeNavigate();

  // Sortiere Items nach sortOrder
  const sortedItems = [...section.items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="py-8 md:py-12 lg:py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        {/* Überschrift */}
        {section.config.title && (
          <h2
            className="text-2xl md:text-3xl lg:text-4xl mb-6 md:mb-8 lg:mb-12 text-center"
            style={{ fontFamily: "Fjalla One", color: "var(--foreground)" }}
          >
            {section.config.title}
          </h2>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {sortedItems.map((item) => {
            // Titel: Fallback von data.title zu target.category.name
            const title =
              item.data.title ||
              (item.target.type === "category" ? item.target.category.name : "");

            const link = linkForTarget(item.target);

            return (
              <button
                key={item.id}
                onClick={() => navigate(link)}
                className="group relative aspect-square rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  backgroundColor: "var(--color-bg-light)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Placeholder Gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, var(--color-coral) 0%, var(--cerulean) 100%)`,
                    opacity: 0.1,
                  }}
                />

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <h3
                    className="text-base md:text-lg lg:text-xl text-center"
                    style={{
                      fontFamily: "Fjalla One",
                      color: "var(--foreground)",
                    }}
                  >
                    {title}
                  </h3>
                </div>

                {/* Hover Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-coral to-cerulean opacity-0 group-hover:opacity-10 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, var(--color-coral) 0%, var(--cerulean) 100%)`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
