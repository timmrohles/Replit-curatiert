import { ONIXTag, Book } from '../api';

/**
 * Tag Recommendation Algorithm
 * Suggests related tags based on co-occurrence and tag relationships
 */

export interface TagRecommendation {
  tag: ONIXTag;
  score: number; // 0-1, higher = more relevant
  reason: 'co-occurrence' | 'same-type' | 'complementary';
}

/**
 * Get recommended tags based on a current tag
 * Uses co-occurrence analysis and tag relationship rules
 */
export function getRelatedTags(
  currentTag: ONIXTag,
  allTags: ONIXTag[],
  allBooks: Book[]
): TagRecommendation[] {
  const recommendations: TagRecommendation[] = [];

  // Filter out the current tag and invisible tags
  const candidateTags = allTags.filter(t => 
    t.id !== currentTag.id && t.visible
  );

  // === 1. Co-occurrence Analysis ===
  // Find tags that often appear together with the current tag
  const currentTagBooks = allBooks.filter(book =>
    book.onixTagIds?.includes(currentTag.id)
  );

  const coOccurrenceCounts: Record<string, number> = {};
  currentTagBooks.forEach(book => {
    book.onixTagIds?.forEach(tagId => {
      if (tagId !== currentTag.id) {
        coOccurrenceCounts[tagId] = (coOccurrenceCounts[tagId] || 0) + 1;
      }
    });
  });

  // Add co-occurrence recommendations
  Object.entries(coOccurrenceCounts).forEach(([tagId, count]) => {
    const tag = allTags.find(t => t.id === tagId);
    if (tag) {
      const score = Math.min(count / currentTagBooks.length, 1); // Normalize
      recommendations.push({
        tag,
        score,
        reason: 'co-occurrence'
      });
    }
  });

  // === 2. Same-Type Recommendations ===
  // Suggest other tags of the same type (e.g. other Auszeichnungen)
  const sameTypeTags = candidateTags.filter(t => 
    t.type === currentTag.type
  );

  sameTypeTags.forEach(tag => {
    // Check if not already recommended
    if (!recommendations.find(r => r.tag.id === tag.id)) {
      recommendations.push({
        tag,
        score: 0.5, // Medium score for same-type
        reason: 'same-type'
      });
    }
  });

  // === 3. Complementary Tag Rules ===
  // Domain-specific rules for complementary tags
  const complementaryTags = getComplementaryTags(currentTag, candidateTags);
  
  complementaryTags.forEach(tag => {
    if (!recommendations.find(r => r.tag.id === tag.id)) {
      recommendations.push({
        tag,
        score: 0.7, // High score for complementary
        reason: 'complementary'
      });
    }
  });

  // Sort by score (descending)
  recommendations.sort((a, b) => b.score - a.score);

  // Return top 10
  return recommendations.slice(0, 10);
}

/**
 * Get complementary tags based on editorial rules
 */
function getComplementaryTags(currentTag: ONIXTag, candidateTags: ONIXTag[]): ONIXTag[] {
  const complementary: ONIXTag[] = [];

  // Rules by tag type
  switch (currentTag.type) {
    case 'Status':
    case 'Auszeichnung':
      // Awards → Suggest Genres, Feelings
      complementary.push(
        ...candidateTags.filter(t => 
          t.type === 'Genre (THEMA)' || t.type === 'Feeling'
        )
      );
      break;

    case 'Genre (THEMA)':
      // Genre → Suggest Feelings, Settings
      complementary.push(
        ...candidateTags.filter(t => 
          t.type === 'Feeling' || t.type === 'Schauplatz'
        )
      );
      break;

    case 'Feeling':
    case 'Motiv (MVB)':
      // Feeling → Suggest Genres, Styles
      complementary.push(
        ...candidateTags.filter(t => 
          t.type === 'Genre (THEMA)' || t.type === 'Stil-Veredelung'
        )
      );
      break;

    case 'Schauplatz':
      // Location → Suggest Genres, Language
      complementary.push(
        ...candidateTags.filter(t => 
          t.type === 'Genre (THEMA)' || t.type === 'Herkunft'
        )
      );
      break;

    case 'Serie':
      // Series → Suggest Genre, Feeling
      complementary.push(
        ...candidateTags.filter(t => 
          t.type === 'Genre (THEMA)' || t.type === 'Feeling'
        )
      );
      break;

    case 'Herkunft':
      // Language/Origin → Suggest Genres, Settings
      complementary.push(
        ...candidateTags.filter(t => 
          t.type === 'Genre (THEMA)' || t.type === 'Schauplatz'
        )
      );
      break;
  }

  return complementary;
}

/**
 * Get personalized book recommendations based on user's liked tags
 * Used for building user profiles
 */
export function getBookRecommendationsByTags(
  userLikedTags: ONIXTag[],
  allBooks: Book[],
  allTags: ONIXTag[]
): Book[] {
  if (userLikedTags.length === 0) return [];

  const scoredBooks = allBooks.map(book => {
    let score = 0;
    const bookTags = allTags.filter(tag => 
      book.onixTagIds?.includes(tag.id)
    );

    // Calculate overlap score
    bookTags.forEach(bookTag => {
      // Direct match
      if (userLikedTags.find(likedTag => likedTag.id === bookTag.id)) {
        score += 10; // High score for exact match
      }

      // Same type match
      if (userLikedTags.find(likedTag => likedTag.type === bookTag.type)) {
        score += 3; // Medium score for same type
      }

      // Complementary match
      userLikedTags.forEach(likedTag => {
        const complementary = getComplementaryTags(likedTag, [bookTag]);
        if (complementary.find(t => t.id === bookTag.id)) {
          score += 5; // High score for complementary
        }
      });
    });

    return { book, score };
  });

  // Sort by score and return top books
  return scoredBooks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.book);
}

/**
 * Analyze tag combinations for discovery
 * Suggests interesting tag combinations that have books
 */
export function suggestTagCombinations(
  allTags: ONIXTag[],
  allBooks: Book[]
): Array<{ tags: ONIXTag[]; bookCount: number }> {
  const combinations: Array<{ tags: ONIXTag[]; bookCount: number }> = [];

  // Get only prominent/filter tags
  const interestingTags = allTags.filter(t => 
    t.visible && ['prominent', 'filter', 'link'].includes(t.visibilityLevel)
  );

  // Generate 2-tag combinations
  for (let i = 0; i < interestingTags.length; i++) {
    for (let j = i + 1; j < interestingTags.length; j++) {
      const tag1 = interestingTags[i];
      const tag2 = interestingTags[j];

      // Skip same-type combinations (usually not interesting)
      if (tag1.type === tag2.type) continue;

      // Count books with both tags
      const bookCount = allBooks.filter(book =>
        book.onixTagIds?.includes(tag1.id) &&
        book.onixTagIds?.includes(tag2.id)
      ).length;

      if (bookCount > 0) {
        combinations.push({
          tags: [tag1, tag2],
          bookCount
        });
      }
    }
  }

  // Sort by book count (descending)
  combinations.sort((a, b) => b.bookCount - a.bookCount);

  // Return top 20 combinations
  return combinations.slice(0, 20);
}
