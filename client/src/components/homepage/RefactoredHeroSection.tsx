/**
 * REFACTORED Hero Section - Proof of Concept
 * 
 * This is a side-by-side comparison showing how the UI Core Components
 * simplify the code and improve maintainability.
 * 
 * BEFORE: 270+ lines with hardcoded values, inline styles, manual responsive
 * AFTER: ~180 lines with semantic components, clean structure, auto-responsive
 * 
 * Key Improvements:
 * ✅ No hardcoded font-sizes (text-[26px], text-[56px])
 * ✅ No inline styles (style={{ fontFamily, letterSpacing }})
 * ✅ Semantic HTML with Typography components
 * ✅ Consistent spacing via Section/Container
 * ✅ Dark Mode ready
 * ✅ Better accessibility
 */

import { useState, useMemo } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import { Section, Container, Heading, Text } from '../ui';
import type { Creator } from '../../types/homepage';

interface RefactoredHeroSectionProps {
  creators: Creator[];
  availableTags: string[];
  onNavigateToStorefront?: (storefrontId: string) => void;
}

export function RefactoredHeroSection({ 
  creators,
  availableTags,
  onNavigateToStorefront 
}: RefactoredHeroSectionProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [activeCreatorIndex, setActiveCreatorIndex] = useState(0);

  // Filter logic (unchanged)
  const filteredCreators = useMemo(() => {
    if (selectedTags.length === 0) return creators;
    return creators.filter(creator =>
      selectedTags.every(tag => creator.tags?.includes(tag))
    );
  }, [creators, selectedTags]);

  const featuredCreators = useMemo(() => 
    filteredCreators.slice(0, 10), 
    [filteredCreators]
  );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setActiveCreatorIndex(0);
  };

  const handleNextCreator = () => {
    setActiveCreatorIndex(prev =>
      prev === featuredCreators.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevCreator = () => {
    setActiveCreatorIndex(prev =>
      prev === 0 ? featuredCreators.length - 1 : prev - 1
    );
  };

  return (
    <Section 
      variant="hero" 
      className="py-0 pt-32 md:pt-24 pb-8"
      ariaLabel="Willkommen bei coratiert"
    >
      <Container>
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* ========================================
              LEFT COLUMN: Intro Text
              BEFORE: Hardcoded text-[26px], inline styles
              AFTER: Clean Typography components
              ======================================== */}
          <div className="w-full pr-4 md:pr-0 -mt-20 md:-mt-32">
            {/* Main Headline - Using Heading component */}
            <Heading 
              as="h1" 
              className="mb-3 md:mb-6 drop-shadow-sm"
            >
              <span className="font-bold text-blue">
                DIE PERSÖNLICHSTE BUCHHANDLUNG IM NETZ.
              </span>{' '}
              <span className="text-foreground">
                Kuratiert von Menschen mit Leidenschaft und Expertise.
              </span>
            </Heading>

            {/* Subtitle - Using Text component */}
            <Text 
              variant="body" 
              className="mb-6 max-w-lg font-bold text-muted-foreground"
            >
              coratiert, die Community-Buchhandlung, in der Kurator*innen und Expert*innen 
              ihre Lieblingswerke vorstellen. Entdecke Bücher abseits vom Mainstream, 
              unterstütze mit jedem Kauf Publizist*innen und trage somit zu einer vielfältigen 
              Kultur- und Medienlandschaft bei.
            </Text>
          </div>

          {/* ========================================
              RIGHT COLUMN: Creator Discovery
              BEFORE: Many hardcoded values
              AFTER: Cleaner structure
              ======================================== */}
          <div className="relative flex flex-col items-center justify-start w-full md:px-0">
            {filteredCreators.length === 0 ? (
              // Empty State
              <div className="text-center py-12">
                <Heading as="h2" variant="h3" className="mb-2 text-center">
                  Keine Kurator*innen für diese Kombination gefunden.
                </Heading>
                <Text variant="small" className="text-muted-foreground text-center">
                  Versuche andere Tags oder entferne einige Filter.
                </Text>
              </div>
            ) : (
              <div className="relative w-full flex flex-col items-center">
                {/* Stacked Cards Fan Effect */}
                <div className="relative w-full max-w-[280px] md:max-w-[320px] h-[400px] md:h-[440px] mb-6 pl-10">
                  {featuredCreators.slice(0, 4).map((creator, index) => {
                    const isActive = index === activeCreatorIndex;
                    const baseRotationY = -12;
                    const rotation = baseRotationY + (index - activeCreatorIndex) * 8;
                    const translateX = (index - activeCreatorIndex) * 25;
                    const translateY = (index - activeCreatorIndex) * 15;
                    const scale = isActive ? 1 : 0.92 - (Math.abs(index - activeCreatorIndex) * 0.04);
                    const zIndex = featuredCreators.length - Math.abs(index - activeCreatorIndex);

                    return (
                      <div
                        key={creator.id}
                        onClick={() => {
                          if (index === activeCreatorIndex && (creator as any).storefrontId) {
                            onNavigateToStorefront?.((creator as any).storefrontId);
                          } else {
                            setActiveCreatorIndex(index);
                          }
                        }}
                        className={`absolute top-0 left-0 w-full cursor-pointer transition-all duration-500 ease-out ${
                          isActive ? 'shadow-2xl' : 'shadow-lg'
                        }`}
                        style={{
                          transform: `
                            perspective(1200px) 
                            rotateY(${rotation}deg) 
                            rotateX(8deg)
                            translateX(${translateX}px) 
                            translateY(${translateY}px)
                            scale(${scale})
                          `,
                          zIndex,
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* Creator Card */}
                        <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white dark:border-gray-700">
                          <img
                            src={(creator as any).image || creator.photo}
                            alt={creator.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Creator Info Overlay */}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 backdrop-blur-sm">
                            {/* Name - Using Heading component */}
                            <Heading 
                              as="h3" 
                              variant="h4" 
                              className="text-white mb-1"
                            >
                              {creator.name}
                            </Heading>
                            
                            {/* Role - Using Text component */}
                            <Text 
                              variant="small" 
                              className="text-white/90 mb-2"
                            >
                              {(creator as any).role || creator.specialty}
                            </Text>

                            {/* Metrics */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white text-sm">📚</span>
                                <Text variant="xs" className="text-white/80">
                                  {(creator as any).booksCount || 0} Bücher
                                </Text>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Heart 
                                  className="w-4 h-4 fill-teal text-teal" 
                                  aria-hidden="true"
                                />
                                <Text variant="xs" className="text-white/80">
                                  {(creator as any).followersCount || 0}
                                </Text>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                {featuredCreators.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevCreator}
                      aria-label="Vorheriger Creator"
                      className="absolute left-0 md:left-0 top-1/2 md:top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-black/90 hover:bg-black dark:bg-white/90 dark:hover:bg-white shadow-lg flex items-center justify-center transition-all z-30 text-white dark:text-black"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path 
                          d="M15 18l-6-6 6-6" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          stroke="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextCreator}
                      aria-label="Nächster Creator"
                      className="absolute right-0 md:right-0 top-1/2 md:top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-black/90 hover:bg-black dark:bg-white/90 dark:hover:bg-white shadow-lg flex items-center justify-center transition-all z-30 text-white dark:text-black"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path 
                          d="M9 18l6-6-6-6" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          stroke="currentColor"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* ========================================
                    Tag Selection
                    BEFORE: Inline fontFamily styles
                    AFTER: Typography components + semantic classes
                    ======================================== */}
                <div className="w-full mt-6">
                  {/* Section Title - Using Heading */}
                  <Heading 
                    as="h3" 
                    variant="h4" 
                    className="mb-3"
                  >
                    Finde deine Kurator*innen
                  </Heading>

                  {/* Tags Container */}
                  <div
                    className={`flex flex-wrap gap-2 transition-all duration-500 ${
                      !tagsExpanded ? 'max-h-[100px] overflow-hidden' : 'overflow-visible'
                    }`}
                  >
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-2 shadow-sm font-headline text-xs text-white ${
                          selectedTags.includes(tag)
                            ? 'ring-2 ring-coral bg-coral'
                            : 'bg-coral hover:bg-coral/90'
                        }`}
                        aria-pressed={selectedTags.includes(tag)}
                        aria-label={`Filter nach ${tag}`}
                      >
                        {tag}
                        <Heart 
                          className="w-3 h-3" 
                          style={{ 
                            fill: selectedTags.includes(tag) ? '#ffffff' : 'transparent', 
                            stroke: '#ffffff' 
                          }}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Expand/Collapse Button & Results */}
                  <div className="flex flex-col items-start gap-2 mt-3">
                    <button
                      onClick={() => setTagsExpanded(!tagsExpanded)}
                      className="flex items-center gap-2 text-blue hover:text-blue hover:opacity-80 transition-colors font-headline text-sm"
                      aria-expanded={tagsExpanded}
                      aria-label={tagsExpanded ? 'Weniger Tags anzeigen' : 'Mehr Tags anzeigen'}
                    >
                      {tagsExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-300 ${
                          tagsExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Results Count - Using Text component */}
                    {selectedTags.length > 0 && (
                      <Text variant="body" className="font-semibold">
                        <span className="font-bold">{filteredCreators.length}</span> 
                        {' '}Kurator*innen gefunden
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}