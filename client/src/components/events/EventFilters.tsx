import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, MapPin, User, Filter, X, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { DSTag } from "../design-system/DSTag";

interface EventFiltersProps {
  selectedCurator: string;
  selectedEventType: string;
  selectedLocationType: string;
  selectedCity: string;
  selectedDateFilter: string;
  sortOrder: 'asc' | 'desc';
  onCuratorChange: (curator: string) => void;
  onEventTypeChange: (type: string) => void;
  onLocationTypeChange: (type: string) => void;
  onCityChange: (city: string) => void;
  onDateFilterChange: (date: string) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  curators: string[];
  cities: string[];
  activeFiltersCount: number;
}

export function EventFilters({
  selectedCurator,
  selectedEventType,
  selectedLocationType,
  selectedCity,
  selectedDateFilter,
  sortOrder,
  onCuratorChange,
  onEventTypeChange,
  onLocationTypeChange,
  onCityChange,
  onDateFilterChange,
  onSortOrderChange,
  onClearFilters,
  curators,
  cities,
  activeFiltersCount
}: EventFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const eventTypes = [
    "Alle",
    "Lesung",
    "Podcast Live-Episode",
    "Livestream",
    "Panel",
    "Buchveröffentlichung"
  ];

  const locationTypes = [
    { value: "alle", label: "Alle Orte" },
    { value: "physical", label: "Vor Ort" },
    { value: "virtual", label: "Online" }
  ];

  const dateFilters = [
    { value: "alle", label: "Alle Termine" },
    { value: "upcoming", label: "Demnächst" },
    { value: "this-month", label: "Diesen Monat" },
    { value: "next-month", label: "Nächsten Monat" }
  ];

  return (
    <div className="mb-8 space-y-4">
      {/* Filter Header with Clear Button */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">
            <span className="text-[var(--creator-accent)]">{activeFiltersCount}</span> {activeFiltersCount === 1 ? 'Filter' : 'Filter'} aktiv
          </p>
          <button
            onClick={onClearFilters}
            className="text-sm transition-colors flex items-center gap-1 text-foreground-muted hover:text-foreground"
          >
            <X className="w-3 h-3" />
            Alle Filter löschen
          </button>
        </div>
      )}

      {/* Event Type Filter */}
      <div>
        <p className="text-sm mb-2 text-foreground">Art der Veranstaltung</p>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((type) => (
            <DSTag
              key={type}
              onClick={() => onEventTypeChange(type)}
              active={selectedEventType === type}
            >
              {type}
            </DSTag>
          ))}
        </div>
      </div>

      {/* Curator Filter */}
      <div>
        <p className="text-sm mb-2 text-foreground">Kurator:in</p>
        <div className="flex flex-wrap gap-2">
          {curators.map((curator) => (
            <DSTag
              key={curator}
              onClick={() => onCuratorChange(curator)}
              active={selectedCurator === curator}
            >
              {curator}
            </DSTag>
          ))}
        </div>
      </div>

      {/* Location Type Filter */}
      <div>
        <p className="text-sm mb-2 text-foreground">Ort</p>
        <div className="flex flex-wrap gap-2">
          {locationTypes.map((locationType) => (
            <DSTag
              key={locationType.value}
              onClick={() => onLocationTypeChange(locationType.value)}
              active={selectedLocationType === locationType.value}
            >
              {locationType.label}
            </DSTag>
          ))}
        </div>
      </div>

      {/* Expandable Filters Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm transition-colors flex items-center gap-2 text-foreground hover:text-blue"
      >
        {isExpanded ? "Weniger Filter" : "Mehr Filter"}
        <Filter className="w-4 h-4" />
      </button>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Date Filter */}
          <div>
            <p className="text-sm mb-2 text-foreground">Zeitraum</p>
            <div className="flex flex-wrap gap-2">
              {dateFilters.map((dateFilter) => (
                <DSTag
                  key={dateFilter.value}
                  onClick={() => onDateFilterChange(dateFilter.value)}
                  active={selectedDateFilter === dateFilter.value}
                >
                  {dateFilter.label}
                </DSTag>
              ))}
            </div>
          </div>

          {/* City Filter */}
          <div>
            <p className="text-sm mb-2 text-foreground">Stadt</p>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <DSTag
                  key={city}
                  onClick={() => onCityChange(city)}
                  active={selectedCity === city}
                >
                  {city}
                </DSTag>
              ))}
            </div>
          </div>

          {/* Sort Order Filter */}
          <div>
            <p className="text-sm mb-2 text-foreground">Sortierung</p>
            <div className="flex flex-wrap gap-2">
              <DSTag
                onClick={() => onSortOrderChange('asc')}
                active={sortOrder === 'asc'}
              >
                Aufsteigend
              </DSTag>
              <DSTag
                onClick={() => onSortOrderChange('desc')}
                active={sortOrder === 'desc'}
              >
                Absteigend
              </DSTag>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}