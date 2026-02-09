// ============================================================================
// Topic Tags Grid Section - Frontend Render Component  
// Tag Cloud / Pills Layout
// ============================================================================

import { useSafeNavigate } from '../../utils/routing';
import { linkForTarget } from '../../utils/link-resolver';
import { TopicTagsGridProps } from './TopicTagsGrid.schema';

export function TopicTagsGrid({ section }: TopicTagsGridProps) {
  const navigate = useSafeNavigate();

  // Sortiere Items nach sortOrder
  const sortedItems = [...section.items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="py-8 md:py-12 lg:py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        {/* Überschrift */}
        {section.config.title && (
          <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl mb-6 md:mb-8 lg:mb-12 text-center text-foreground">
            {section.config.title}
          </h2>
        )}

        {/* Tag Cloud - Flexbox Wrap */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {sortedItems.map((item) => {
            // Label: Fallback von data.label zu target.tag.name
            const label =
              item.data.label ||
              (item.target.type === "tag" ? item.target.tag.name : "");

            const link = linkForTarget(item.target);

            return (
              <button
                key={item.id}
                onClick={() => navigate(link)}
                className="tag-pill px-4 md:px-5 lg:px-6 py-2 md:py-2.5 lg:py-3 rounded-full text-sm md:text-base hover:scale-105 hover:shadow-md"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
