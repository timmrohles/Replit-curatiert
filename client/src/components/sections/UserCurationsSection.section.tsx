import { useState, useEffect } from 'react';
import { Container } from '../ui/container';
import { Section } from '../ui/section';
import { Heading, Text } from '../ui/typography';
import { useSafeNavigate } from '../../utils/routing';
import { useLocale } from '../../utils/LocaleContext';
import { ChevronRight, BookOpen } from 'lucide-react';

interface UserCurationsSectionProps {
  section: any;
  books?: any[];
  className?: string;
  categoryId?: number | null;
}

interface CurationItem {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  book_count: number;
  user_name: string;
  user_avatar: string | null;
  slug: string;
}

export function UserCurationsSection({ section, categoryId, className = '' }: UserCurationsSectionProps) {
  const config = section.config || {};
  const title = section.title || config.title || 'Kurationen unserer Community';
  const description = config.description || '';
  const limit = config.limit || 6;
  const categoryFilter = config.categoryId || categoryId || null;

  const [curations, setCurations] = useState<CurationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useSafeNavigate();
  const { locale } = useLocale();
  const localePrefix = `/${locale}`;

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('status', 'published');
    if (categoryFilter) {
      params.set('category_id', String(categoryFilter));
    }

    fetch(`/api/public/curations?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setCurations(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit, categoryFilter]);

  if (!isLoading && curations.length === 0) return null;

  return (
    <Section className={`!py-8 md:!py-12 ${className}`}>
      <Container>
        {(title || description) && (
          <div className="mb-6 md:mb-8">
            {title && (
              <Heading as="h2" variant="h3" className="text-center">
                {title}
              </Heading>
            )}
            {description && (
              <Text variant="base" className="text-center text-foreground/60 mt-2 max-w-2xl mx-auto">
                {description}
              </Text>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {curations.map((curation) => (
              <button
                key={curation.id}
                onClick={() => navigate(`${localePrefix}/kurationen/${curation.slug || curation.id}`)}
                className="group text-left rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-foreground/20"
                data-testid={`curation-card-${curation.id}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {curation.user_avatar ? (
                    <img
                      src={curation.user_avatar}
                      alt={curation.user_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <Text variant="small" className="text-foreground/50 truncate">
                      {curation.user_name}
                    </Text>
                  </div>
                </div>
                <Heading as="h3" variant="h5" className="mb-2 group-hover:opacity-70 transition-opacity line-clamp-2">
                  {curation.title}
                </Heading>
                {curation.description && (
                  <Text variant="small" className="text-foreground/60 line-clamp-2 mb-3">
                    {curation.description}
                  </Text>
                )}
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-foreground/40" />
                  <Text variant="xs" className="text-foreground/40">
                    {curation.book_count} {curation.book_count === 1 ? 'Buch' : 'Bücher'}
                  </Text>
                </div>
              </button>
            ))}
          </div>
        )}

        {curations.length >= limit && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(`${localePrefix}/kurationen`)}
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-teal)' }}
              data-testid="button-show-more-curations"
            >
              Alle Kurationen entdecken
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Container>
    </Section>
  );
}
