import { useState, useEffect, useCallback } from 'react';
import { BookCarouselItem, type BookCarouselItemData } from '../book/BookCarouselItem';
import { Container } from '../ui/container';
import { Section } from '../ui/section';
import { Heading, Text } from '../ui/typography';
import { useSafeNavigate } from '../../utils/routing';
import { useLocale } from '../../utils/LocaleContext';
import { ChevronRight } from 'lucide-react';

interface BookGridFilteredSectionProps {
  section: any;
  books?: any[];
  className?: string;
  categoryId?: number | null;
}

interface APIBook {
  id: number;
  title: string;
  author: string;
  publisher: string;
  cover_url: string | null;
  price: string | null;
  isbn13: string | null;
  isbn: string | null;
  description: string | null;
  is_indie?: boolean;
  indie_type?: string | null;
  is_hidden_gem?: boolean;
  award_count?: number;
  nomination_count?: number;
  award_details?: Array<{ name: string; year?: number; outcome: string }>;
}

function apiBookToCarouselItem(book: APIBook): BookCarouselItemData {
  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    coverImage: book.cover_url || '',
    price: book.price || '',
    isbn: book.isbn13 || book.isbn || undefined,
    publisher: book.publisher || undefined,
    klappentext: book.description || undefined,
    is_indie: book.is_indie,
    indie_type: book.indie_type,
    is_hidden_gem: book.is_hidden_gem,
    award_count: book.award_count,
    nomination_count: book.nomination_count,
    award_details: book.award_details,
  };
}

export function BookGridFilteredSection({ section, categoryId, className = '' }: BookGridFilteredSectionProps) {
  const config = section.config || {};
  const title = section.title || config.title || '';
  const description = config.description || '';
  const filterPreset = config.filterPreset || 'relevance';
  const limit = config.limit || 12;
  const showMoreLink = config.showMoreLink !== false;
  const categoryFilter = config.categoryId || categoryId || null;

  const [books, setBooks] = useState<APIBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useSafeNavigate();
  const { locale } = useLocale();
  const localePrefix = `/${locale}`;

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', '0');
      params.set('sort', filterPreset);

      if (categoryFilter) {
        params.set('categories', String(categoryFilter));
      }

      const res = await fetch(`/api/books?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setBooks(data.data || []);
        setTotalCount(data.total ?? (data.data || []).length);
      }
    } catch (err) {
      console.error('BookGridFiltered fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterPreset, limit, categoryFilter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleBookClick = (bookId: string, isbn?: string) => {
    const path = isbn ? `${localePrefix}/book/${isbn}` : `${localePrefix}/book/${bookId}`;
    navigate(path);
  };

  if (!isLoading && books.length === 0) return null;

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: limit > 6 ? 6 : limit }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {books.map((book) => (
              <BookCarouselItem
                key={book.id}
                book={apiBookToCarouselItem(book)}
                onBookClick={handleBookClick}
              />
            ))}
          </div>
        )}

        {showMoreLink && totalCount > limit && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(`${localePrefix}/buecher?sort=${filterPreset}`)}
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-teal)' }}
              data-testid="button-show-more-books"
            >
              Alle {totalCount} Bücher anzeigen
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Container>
    </Section>
  );
}
