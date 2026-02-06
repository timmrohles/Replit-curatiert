import React, { useState, useEffect, useMemo } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { HorizontalBookRow } from '../carousel/HorizontalBookRow';
import { getAllONIXTags, getBooks, ONIXTag, Book as APIBook } from '../../utils/api';
import { SavedTagCombinations } from './SavedTagCombinations';
import { trackTagClick, trackTagSearch, trackTagCombination } from '../../utils/tagAnalytics';

// Adapter: Convert API Book to HorizontalBookRow Book format
interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  price: string;
  availability?: string;
  category?: string;
  tags?: string[];
  review: {
    curatorAvatar: string;
    curatorName: string;
    curatorFocus: string;
    reviewTitle?: string;
    reviewText?: string;
  };
}

function convertAPIBook(apiBook: APIBook): Book {
  return {
    id: apiBook.id,
    cover: apiBook.coverUrl,
    title: apiBook.title,
    author: apiBook.author,
    publisher: apiBook.publisher,
    year: apiBook.year,
    price: apiBook.price,
    availability: apiBook.availability,
    tags: apiBook.tags,
    review: {
      curatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      curatorName: 'coratiert Team',
      curatorFocus: 'Kuratierte Empfehlungen',
      reviewTitle: `${apiBook.title} - Eine Empfehlung`,
      reviewText: `Ein ausgewähltes Buch von ${apiBook.author}.`
    }
  };
}

/**
 * Tag-Based Book Discovery Grid
 * Replaces recipient categories with ONIX tags for dynamic filtering
 * Supports multiple tag selection and combination filtering
 */
export function RecipientCategoryGridWithBooks() {
  const navigate = useSafeNavigate();
  
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [apiBooks, setApiBooks] = useState<APIBook[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state
  const [activeCategory, setActiveCategory] = useState<string>('all'); // NEW: Category filter

  // Load ONIX tags and books
  useEffect(() => {
    let isMounted = true;
    
    Promise.all([
      getAllONIXTags(),
      getBooks()
    ]).then(([tagsData, booksData]) => {
      if (isMounted) {
        setOnixTags(tagsData);
        setApiBooks(booksData);
        setLoading(false);
      }
    }).catch(error => {
      if (isMounted) {
        console.error('Error loading tags/books:', error);
        // Set empty arrays as fallback
        setOnixTags([]);
        setApiBooks([]);
        setLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter tags for display (Zielgruppe, Genre, Feeling, Status)
  const displayTags = onixTags.filter(tag => 
    ['Zielgruppe', 'Genre (THEMA)', 'Feeling', 'Status'].includes(tag.type) &&
    (tag.visibility === 'prominent' || tag.visibility === 'filter') &&
    tag.visible
  ).slice(0, 12); // Limit to 12 tags for grid

  // NEW: Filter tags based on search query and category
  const filteredDisplayTags = displayTags.filter(tag => {
    // Category filter
    if (activeCategory !== 'all' && tag.type !== activeCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tag.displayName.toLowerCase().includes(query) ||
        tag.type.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // NEW: Available categories
  const categories = [
    { id: 'all', label: 'Alle', icon: '🏷️' },
    { id: 'Zielgruppe', label: 'Zielgruppe', icon: '👥' },
    { id: 'Genre (THEMA)', label: 'Genre', icon: '🎭' },
    { id: 'Feeling', label: 'Feeling', icon: '💫' },
    { id: 'Status', label: 'Status', icon: '🏆' },
  ];

  // Get icon for tag type
  const getTagIcon = (type: string): string => {
    switch (type) {
      case 'Zielgruppe': return '👥';
      case 'Genre (THEMA)': return '🎭';
      case 'Feeling': return '💫';
      case 'Status': return '🏆';
      default: return '🏷️';
    }
  };

  // Get color for tag type
  const getTagColor = (type: string): string => {
    switch (type) {
      case 'Zielgruppe': return '#2ECC71';
      case 'Genre (THEMA)': return '#247ba0';
      case 'Feeling': return '#ffe066';
      case 'Status': return '#FFD700';
      default: return '#70c1b3';
    }
  };

  // Handle tag selection (toggle)
  const handleTagClick = (tagId: string) => {
    const tag = onixTags.find(t => t.id === tagId);
    if (!tag) return;
    
    setSelectedTags(prev => {
      const newSelection = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      
      // Track the click
      trackTagClick(tagId, tag.displayName, tag.type, 'filter');
      
      // Track combination if multiple tags selected
      if (newSelection.length > 1) {
        const tagNames = newSelection
          .map(id => onixTags.find(t => t.id === id)?.displayName)
          .filter(Boolean) as string[];
        const bookCount = apiBooks.filter(book => 
          newSelection.every(id => book.onixTagIds?.includes(id))
        ).length;
        trackTagCombination(newSelection, tagNames, bookCount, 'manual');
      }
      
      return newSelection;
    });
  };

  // Remove tag from selection
  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  // Navigate to tag combination page
  const navigateToTags = () => {
    if (selectedTags.length === 0) return;
    
    const tagObjects = selectedTags
      .map(id => onixTags.find(t => t.id === id))
      .filter(Boolean) as ONIXTag[];
    
    const tagSlugs = tagObjects.map(tag => tag.slug || tag.displayName.toLowerCase().replace(/\s+/g, '-'));
    
    if (tagSlugs.length === 1) {
      navigate(`/tag/${tagSlugs[0]}`);
    } else {
      navigate(`/tags/${tagSlugs.join('+')}`);
    }
    
    // Track navigation
    const tagNames = tagObjects.map(t => t.displayName);
    trackTagCombination(selectedTags, tagNames, filteredBooks.length, 'manual');
  };

  // Filter books by selected tags
  const filteredBooks = selectedTags.length > 0
    ? apiBooks.filter(book => 
        selectedTags.every(tagId => book.onixTagIds?.includes(tagId))
      ).map(convertAPIBook)
    : [];

  // Get selected tag objects
  const selectedTagObjects = selectedTags
    .map(id => onixTags.find(t => t.id === id))
    .filter(Boolean) as ONIXTag[];

  if (loading) {
    return (
      <div className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-foreground">Lädt Tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Selection Section */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2
              className="text-foreground"
              style={{
                fontFamily: 'Fjalla One',
                fontSize: '2.5rem',
                lineHeight: '1.2',
                marginBottom: '1rem',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >
              Entdecke Bücher nach Tags
            </h2>
            <p
              className="text-foreground"
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.6',
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            >
              Wähle einen oder mehrere Tags aus und finde Bücher, die perfekt zu deinen Interessen passen
            </p>
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-foreground" style={{ fontWeight: 600 }}>
                Ausgewählt:
              </span>
              {selectedTagObjects.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => removeTag(tag.id)}
                  className="px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:shadow-md"
                  style={{
                    backgroundColor: tag.color || getTagColor(tag.type),
                    color: '#FFFFFF'
                  }}
                >
                  <span>{tag.displayName}</span>
                  <X className="w-4 h-4" />
                </button>
              ))}
              <button
                onClick={navigateToTags}
                className="px-4 py-2 rounded-full transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#f25f5c',
                  color: '#FFFFFF',
                  fontWeight: 600
                }}
              >
                {filteredBooks.length} {filteredBooks.length === 1 ? 'Buch' : 'Bücher'} anzeigen →
              </button>
            </div>
          )}

          {/* NEW: Search and Filter Controls */}
          <div className="mb-8 space-y-4">
            {/* Search Input */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" />
              <input
                type="text"
                placeholder="Tags durchsuchen..."
                value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQuery(query);
                  
                  // Track search with results
                  if (query.trim()) {
                    const matched = filteredDisplayTags.map(t => t.id);
                    trackTagSearch(query, matched, filteredDisplayTags.length);
                  }
                }}
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-white/50 transition-all focus:outline-none focus:border-[#f25f5c]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#000000'
                }}
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className="px-4 py-2 rounded-full transition-all"
                  style={{
                    backgroundColor: activeCategory === category.id 
                      ? '#f25f5c' 
                      : 'rgba(255, 255, 255, 0.8)',
                    color: activeCategory === category.id 
                      ? '#FFFFFF' 
                      : '#000000',
                    fontWeight: activeCategory === category.id ? 600 : 400,
                    border: '2px solid',
                    borderColor: activeCategory === category.id 
                      ? '#f25f5c' 
                      : 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {category.icon} {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredDisplayTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              const tagColor = tag.color || getTagColor(tag.type);
              const tagIcon = getTagIcon(tag.type);
              
              // Count books with this tag
              const bookCount = apiBooks.filter(book => 
                book.onixTagIds?.includes(tag.id)
              ).length;

              return (
                <motion.button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.id)}
                  className="relative overflow-hidden rounded-lg text-left transition-all duration-300"
                  style={{
                    border: isSelected ? `3px solid ${tagColor}` : '3px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    aspectRatio: '3/2',
                    backgroundColor: isSelected 
                      ? tagColor 
                      : 'rgba(255, 255, 255, 0.95)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Background Pattern */}
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${tagColor} 0%, transparent 70%)`
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span style={{ fontSize: '2rem' }}>
                        {tagIcon}
                      </span>
                      {bookCount > 0 && (
                        <span
                          className="px-2 py-1 rounded-full text-xs"
                          style={{
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : tagColor,
                            color: isSelected ? '#FFFFFF' : '#FFFFFF',
                            fontWeight: 600
                          }}
                        >
                          {bookCount}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3
                        style={{
                          fontFamily: 'Fjalla One',
                          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                          color: isSelected ? '#FFFFFF' : '#000000',
                          marginBottom: '0.25rem',
                          textShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        {tag.displayName}
                      </h3>
                      <p style={{ 
                        color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                        fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                        lineHeight: '1.3',
                        textShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                      }}>
                        {tag.type}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Empty State */}
          {displayTags.length === 0 && (
            <div className="text-center py-12">
              <p className="text-foreground/60" style={{ fontSize: '1.125rem' }}>
                Keine Tags verfügbar. Bitte lege Tags im Admin-Bereich an.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Results Section with HorizontalBookRow */}
      <AnimatePresence>
        {selectedTags.length > 0 && filteredBooks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <HorizontalBookRow
              title={`${filteredBooks.length} ${filteredBooks.length === 1 ? 'Buch' : 'Bücher'} gefunden`}
              description={`Bücher die ${selectedTagObjects.map(t => t.displayName).join(' + ')} kombinieren`}
              books={filteredBooks}
            />
          </motion.section>
        )}
        
        {/* No Results State */}
        {selectedTags.length > 0 && filteredBooks.length === 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="py-16 px-4 md:px-8"
          >
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-foreground/60" style={{ fontSize: '1.125rem' }}>
                Keine Bücher mit dieser Tag-Kombination gefunden. Versuche weniger Tags auszuwählen.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Saved Tag Combinations */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <SavedTagCombinations 
            selectedTags={selectedTags}
            allTags={onixTags}
            onLoadCombination={(tagIds) => setSelectedTags(tagIds)}
          />
        </div>
      </section>
    </div>
  );
}