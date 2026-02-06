import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Heading, Text } from '../ui/typography';

interface CategoryFilterProps {
  categorySubcategoryMap: Record<string, string[]>;
  selectedCategories: string[];
  selectedSubcategories: string[];
  onToggleCategory: (category: string) => void;
  onToggleSubcategory: (subcategory: string) => void;
}

export function CategoryFilter({ 
  categorySubcategoryMap, 
  selectedCategories, 
  selectedSubcategories,
  onToggleCategory,
  onToggleSubcategory
}: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Filter categories based on search
  const filteredCategories = Object.keys(categorySubcategoryMap)
    .filter(category => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const categoryMatches = category.toLowerCase().includes(query);
      const subcategoriesMatch = categorySubcategoryMap[category].some(sub => 
        sub.toLowerCase().includes(query)
      );
      return categoryMatches || subcategoriesMatch;
    })
    .sort();

  return (
    <div className="py-5 first:pt-4 last:pb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <Heading as="h3" variant="h6" className="uppercase">
          Kategorien
        </Heading>
        <ChevronDown 
          className={`w-4 h-4 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-teal)' }}
        />
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kategorien filtern..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 transition-all bg-surface text-foreground border border-border"
              style={{ fontFamily: 'Inter' }}
            />
          </div>

          {/* Categories List */}
          <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
            {filteredCategories.map(category => {
              const subcategories = categorySubcategoryMap[category];
              const filteredSubcategories = searchQuery 
                ? subcategories.filter(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
                : subcategories;
              const isCategoryExpanded = expandedCategories.has(category);
              const hasSubcategories = subcategories.length > 0;

              return (
                <div key={category} className="space-y-1">
                  {/* Category */}
                  <div className="flex items-start gap-2">
                    {hasSubcategories && (
                      <button
                        onClick={() => toggleCategoryExpansion(category)}
                        className="mt-1 p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      >
                        <ChevronRight 
                          className={`w-3.5 h-3.5 transition-transform ${isCategoryExpanded ? 'rotate-90' : ''}`}
                          style={{ color: 'var(--color-teal)' }}
                        />
                      </button>
                    )}
                    {!hasSubcategories && <div className="w-4 flex-shrink-0" />}
                    
                    <label className="flex items-start gap-3 cursor-pointer group hover:opacity-70 transition-opacity flex-1">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => onToggleCategory(category)}
                          className="appearance-none w-5 h-5 border-2 rounded transition-all cursor-pointer"
                          style={{ 
                            borderColor: selectedCategories.includes(category) ? 'var(--color-teal)' : '#D1D5DB',
                            backgroundColor: selectedCategories.includes(category) ? 'var(--color-teal)' : 'white'
                          }}
                        />
                        {selectedCategories.includes(category) && (
                          <svg className="w-3 h-3 absolute text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <Text variant="small">{category}</Text>
                    </label>
                  </div>

                  {/* Subcategories */}
                  {hasSubcategories && isCategoryExpanded && (
                    <div className="ml-8 space-y-2 mt-2">
                      {filteredSubcategories.map(subcategory => (
                        <label key={subcategory} className="flex items-start gap-3 cursor-pointer group hover:opacity-70 transition-opacity">
                          <div className="relative flex items-center justify-center mt-0.5">
                            <input
                              type="checkbox"
                              checked={selectedSubcategories.includes(subcategory)}
                              onChange={() => onToggleSubcategory(subcategory)}
                              className="appearance-none w-4 h-4 border-2 rounded transition-all cursor-pointer"
                              style={{ 
                                borderColor: selectedSubcategories.includes(subcategory) ? 'var(--color-teal)' : '#D1D5DB',
                                backgroundColor: selectedSubcategories.includes(subcategory) ? 'var(--color-teal)' : 'white'
                              }}
                            />
                            {selectedSubcategories.includes(subcategory) && (
                              <svg className="w-2.5 h-2.5 absolute text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <Text variant="small" className="text-foreground-muted">
                            {subcategory}
                          </Text>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
