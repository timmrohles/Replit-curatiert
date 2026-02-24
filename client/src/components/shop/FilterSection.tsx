import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Heading, Text } from '../ui/typography';

interface FilterSectionProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
  defaultExpanded?: boolean;
}

export function FilterSection({ 
  title, 
  items, 
  selectedItems, 
  onToggle, 
  defaultExpanded = false 
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState('');

  if (items.length === 0) return null;

  // Filter items based on search
  const filteredItems = items.filter(item => 
    !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-5 first:pt-4 last:pb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <Heading as="h3" variant="h6" className="uppercase">
          {title}
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
              placeholder={`${title} filtern...`}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 transition-all bg-surface text-foreground border border-border"
              style={{ fontFamily: 'Inter' }}
            />
          </div>

          {/* Items List */}
          <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-hide">
            {filteredItems.map(item => (
              <label key={item} className="flex items-start gap-3 cursor-pointer group hover:opacity-70 transition-opacity">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => onToggle(item)}
                    className="appearance-none w-5 h-5 border-2 rounded transition-all cursor-pointer"
                    style={{ 
                      borderColor: selectedItems.includes(item) ? 'var(--color-teal)' : '#D1D5DB',
                      backgroundColor: selectedItems.includes(item) ? 'var(--color-teal)' : 'white'
                    }}
                  />
                  {selectedItems.includes(item) && (
                    <svg className="w-3 h-3 absolute text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <Text variant="small">{item}</Text>
              </label>
            ))}
            {filteredItems.length === 0 && (
              <Text variant="small" className="text-center py-4 text-foreground-muted">
                Keine Ergebnisse gefunden
              </Text>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
