import { useState, useEffect, useMemo } from 'react';
import { Book as APIBook, ONIXTag, getAllBooks, getAllONIXTags } from '../../utils/api';
import { BookCard } from './BookCard';
import { CarouselContainer } from '../carousel/CarouselContainer';
import { Heading, Text } from '../ui/typography';
import { Button } from '../ui/button';

interface SimilarBooksSectionProps {
  currentBook: APIBook;
  maxSuggestions?: number;
}

/**
 * Similar Books Section (2026 Architecture Compliant)
 * 
 * ✅ CarouselContainer für konsistente Scroll-Logic
 * ✅ Typography-System (Heading, Text)
 * ✅ Button-Komponente statt inline styles
 * ✅ CSS-Variablen statt resolvedTheme
 * 
 * Intelligenter Empfehlungs-Algorithmus basierend auf gemeinsamen ONIX Tags:
 * - Berechnet Similarity-Score pro Buch
 * - Priorisiert hochwertige Tags (Prominent > Filter > Internal)
 * - Gewichtet verschiedene Tag-Typen unterschiedlich
 * - Sortiert nach Relevanz
 */
export function SimilarBooksSection({ currentBook, maxSuggestions = 8 }: SimilarBooksSectionProps) {
  const [allBooks, setAllBooks] = useState<APIBook[]>([]);
  const [allTags, setAllTags] = useState<ONIXTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all books and tags
  useEffect(() => {
    Promise.all([
      getAllBooks(),
      getAllONIXTags()
    ]).then(([books, tags]) => {
      setAllBooks(books);
      setAllTags(tags);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading books/tags:', error);
      setLoading(false);
    });
  }, []);

  // Calculate similarity score between two books
  const calculateSimilarity = (book: APIBook): number => {
    const currentTagIds = currentBook.onixTagIds || [];
    const otherTagIds = book.onixTagIds || [];
    
    if (currentTagIds.length === 0 || otherTagIds.length === 0) return 0;
    
    // Find common tag IDs
    const commonTagIds = currentTagIds.filter(id => otherTagIds.includes(id));
    
    if (commonTagIds.length === 0) return 0;
    
    // Calculate weighted score based on tag properties
    let score = 0;
    
    commonTagIds.forEach(tagId => {
      const tag = allTags.find(t => t.id === tagId);
      if (!tag) return;
      
      // Base score for common tag
      let tagScore = 1;
      
      // Weight by visibility level (prominent tags are more important)
      if (tag.visibilityLevel === 'prominent') {
        tagScore *= 3;
      } else if (tag.visibilityLevel === 'filter') {
        tagScore *= 2;
      }
      
      // Weight by tag type (some types are more important for similarity)
      const typeWeights: { [key: string]: number } = {
        'Genre (THEMA)': 3,
        'Zielgruppe': 2.5,
        'Feeling': 2,
        'Motiv (MVB)': 2,
        'Stil-Veredelung': 1.5,
        'Schauplatz': 1.5,
        'Zeitgeist': 1.5,
        'Serie': 5, // Serie-Match ist sehr wichtig!
        'Auszeichnung': 1,
        'Status': 1,
        'Medienecho': 1,
      };
      
      tagScore *= (typeWeights[tag.type] || 1);
      
      score += tagScore;
    });
    
    // Normalize by total possible matches
    const maxPossibleScore = Math.min(currentTagIds.length, otherTagIds.length) * 3 * 5;
    
    return maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;
  };

  // Get similar books sorted by relevance
  const similarBooks = useMemo(() => {
    if (!allBooks.length || !allTags.length) return [];
    
    // Filter out current book and calculate scores
    const booksWithScores = allBooks
      .filter(book => book.id !== currentBook.id)
      .map(book => ({
        book,
        score: calculateSimilarity(book)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
    
    return booksWithScores.map(item => item.book);
  }, [allBooks, allTags, currentBook, maxSuggestions]);

  // Get common tags for a book (for displaying why it's similar)
  const getCommonTags = (book: APIBook): ONIXTag[] => {
    const currentTagIds = currentBook.onixTagIds || [];
    const otherTagIds = book.onixTagIds || [];
    const commonTagIds = currentTagIds.filter(id => otherTagIds.includes(id));
    
    return allTags
      .filter(tag => commonTagIds.includes(tag.id))
      .filter(tag => tag.visibilityLevel === 'prominent' || tag.visibilityLevel === 'filter')
      .slice(0, 3); // Max 3 common tags
  };

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Text variant="base" className="text-foreground">
            Lädt ähnliche Bücher...
          </Text>
        </div>
      </section>
    );
  }

  if (similarBooks.length === 0) {
    return null; // Don't show section if no similar books
  }

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-8">
          <Heading 
            as="h2" 
            className="mb-2 text-foreground"
          >
            Ähnliche Bücher
          </Heading>
          <Text 
            variant="base" 
            className="text-foreground-muted"
          >
            Basierend auf gemeinsamen Eigenschaften
          </Text>
        </div>

        {/* Books Carousel */}
        <CarouselContainer 
          showDesktopButtons={true}
          showMobileButtons={false}
          buttonOffset={-8}
          scrollAmount={300}
        >
          <div className="flex gap-4 pb-4">
            {similarBooks.map((book) => {
              const commonTags = getCommonTags(book);
              
              return (
                <div key={book.id} className="flex-shrink-0 relative group">
                  <BookCard book={book} />
                  
                  {/* Common Tags Tooltip (visible on hover) */}
                  {commonTags.length > 0 && (
                    <div className="absolute -bottom-2 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 px-2">
                      <div className="p-2 rounded-lg shadow-lg bg-white dark:bg-[#2a2a2a] border border-black/10 dark:border-white/10">
                        <Text 
                          variant="xs" 
                          className="!text-[10px] !mb-1 !normal-case !tracking-normal text-foreground-muted"
                        >
                          Gemeinsam:
                        </Text>
                        <div className="flex flex-wrap gap-1">
                          {commonTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-xs text-white"
                              style={{
                                backgroundColor: tag.color || '#70c1b3'
                              }}
                            >
                              {tag.displayName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CarouselContainer>

        {/* Show All Button */}
        {similarBooks.length >= maxSuggestions && (
          <div className="text-center mt-6">
            <Button
              className="bg-coral hover:bg-coral/90 text-white font-semibold px-6 py-3 rounded-full shadow-md"
              onClick={() => {
                // Navigate to a "More Like This" page with tag combination
                const tagIds = currentBook.onixTagIds || [];
                const tagSlugs = tagIds
                  .slice(0, 3) // Use top 3 tags
                  .map(id => allTags.find(t => t.id === id))
                  .filter(Boolean)
                  .map(tag => tag!.slug || tag!.displayName.toLowerCase().replace(/\s+/g, '-'));
                
                if (tagSlugs.length > 0) {
                  window.location.href = `/tags/${tagSlugs.join('+')}`;
                }
              }}
            >
              Mehr ähnliche Bücher entdecken →
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}