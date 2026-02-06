import { useState } from 'react';
import { DSTag } from './DSTag';
import { X } from 'lucide-react';
import { DSText } from './DSTypography';

interface FilterOption {
  id: string;
  label: string;
  selected: boolean;
}

interface DSFilterBarProps {
  filters: FilterOption[];
  onChange: (filters: FilterOption[]) => void;
  onClearAll?: () => void;
}

export function DSFilterBar({ filters, onChange, onClearAll }: DSFilterBarProps) {
  const handleToggle = (id: string) => {
    const updated = filters.map(f =>
      f.id === id ? { ...f, selected: !f.selected } : f
    );
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = filters.map(f =>
      f.id === id ? { ...f, selected: false } : f
    );
    onChange(updated);
  };

  const selectedCount = filters.filter(f => f.selected).length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="space-y-3">
      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <DSTag
            key={filter.id}
            label={filter.label}
            selected={filter.selected}
            removable={filter.selected}
            onClick={() => handleToggle(filter.id)}
            onRemove={() => handleRemove(filter.id)}
          />
        ))}
      </div>

      {/* Clear All */}
      {hasSelection && (
        <div className="flex items-center gap-2">
          <DSText variant="caption" color="tertiary">
            {selectedCount} {selectedCount === 1 ? 'Filter' : 'Filter'} aktiv
          </DSText>
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="text-[var(--ds-text-link)] hover:underline text-sm font-medium"
            >
              Alle entfernen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
