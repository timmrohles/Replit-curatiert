/**
 * SCALE SELECTOR - Qualitative Auswahl ohne Zahlen-Slider
 * 
 * 5-Segment-System: Stark Links | Leicht Links | Neutral | Leicht Rechts | Stark Rechts
 * Kein Slider-Handle, nur Click-Bereiche im Feuilleton-Stil
 * 
 * Mapping (intern für Backend):
 * - Stark Links = 10
 * - Leicht Links = 30
 * - Neutral = 50
 * - Leicht Rechts = 70
 * - Stark Rechts = 90
 */

import { useState } from 'react';

interface ScaleSelectorProps {
  label: string;
  labelLeft: string;
  labelRight: string;
  description?: string;
  value?: number; // 0-100 vom Backend
  onChange: (value: number) => void;
  isPro?: boolean;
}

// Konvertierung: 0-100 → Segment-Index
function valueToSegment(value: number | undefined): number | null {
  if (value === undefined || value === null) return null;
  
  if (value <= 20) return 0; // Stark links
  if (value <= 40) return 1; // Leicht links
  if (value <= 60) return 2; // Neutral
  if (value <= 80) return 3; // Leicht rechts
  return 4; // Stark rechts
}

// Konvertierung: Segment-Index → 0-100 Wert
function segmentToValue(segment: number): number {
  const mapping = [10, 30, 50, 70, 90];
  return mapping[segment] || 50;
}

export function ScaleSelector({
  label,
  labelLeft,
  labelRight,
  description,
  value,
  onChange,
  isPro = false
}: ScaleSelectorProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const selectedSegment = valueToSegment(value);

  const segments = [
    { label: '', position: 'stark-links' },
    { label: '', position: 'leicht-links' },
    { label: '●', position: 'neutral' },
    { label: '', position: 'leicht-rechts' },
    { label: '', position: 'stark-rechts' }
  ];

  function handleSegmentClick(index: number) {
    const newValue = segmentToValue(index);
    onChange(newValue);
  }

  return (
    <div className="mb-6 rounded-lg">
      {/* Label mit Pro-Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm md:text-base text-foreground font-headline">
            {label}
          </label>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs mb-3 text-foreground-muted">
          {description}
        </p>
      )}

      {/* Pol-Labels */}
      <div className="flex items-center justify-between mb-3 text-xs md:text-sm text-foreground-muted">
        <span className="text-left max-w-[45%]">{labelLeft}</span>
        <span className="text-right max-w-[45%]">{labelRight}</span>
      </div>

      {/* Click-Skala mit 5 Segmenten */}
      <div className="relative py-2 bg-gray-100/80 dark:bg-white/5 rounded-lg px-4">
        {/* Segment-Container */}
        <div className="relative flex items-center justify-between px-1">
          {segments.map((segment, index) => {
            const isSelected = selectedSegment === index;
            const isHovered = hoveredSegment === index;
            const isActive = isSelected || isHovered;

            return (
              <button
                key={index}
                onClick={() => handleSegmentClick(index)}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                className="relative flex items-center justify-center transition-all duration-200 cursor-pointer group"
                style={{
                  width: '20%', // Gleichmäßige Verteilung
                  height: '56px',
                  zIndex: isActive ? 10 : 1
                }}
                aria-label={`${label}: ${segment.position}`}
              >
                {/* Hover-Bereich (visuell sichtbar beim Hover) */}
                <div 
                  className="absolute inset-0 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: isHovered ? '#247ba010' : 'transparent'
                  }}
                />

                {/* Visueller Marker */}
                <div
                  className="relative transition-all duration-200 rounded-full"
                  style={{
                    width: isActive ? '20px' : '14px',
                    height: isActive ? '20px' : '14px',
                    backgroundColor: isSelected 
                      ? '#247ba0' 
                      : isHovered 
                        ? '#247ba060' 
                        : '#9CA3AF',
                    border: isActive ? '3px solid #FFFFFF' : '2px solid #FFFFFF',
                    boxShadow: isActive 
                      ? '0 4px 12px rgba(36, 123, 160, 0.4)' 
                      : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                />

                {/* Neutral-Marker (●) */}
                {index === 2 && !isActive && (
                  <div 
                    className="absolute text-base select-none pointer-events-none text-gray-400 top-4"
                  >
                    ●
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Position-Label (nur bei Hover/Selection) */}
        {(selectedSegment !== null || hoveredSegment !== null) && (
          <div className="mt-2 text-center">
            <span 
              className="text-xs px-3 py-1 rounded-full inline-block text-cerulean bg-transparent"
            >
              {hoveredSegment !== null 
                ? getPositionLabel(hoveredSegment, labelLeft, labelRight)
                : selectedSegment !== null
                  ? getPositionLabel(selectedSegment, labelLeft, labelRight)
                  : ''
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generiert sprachliches Label für Position
 */
function getPositionLabel(segment: number, labelLeft: string, labelRight: string): string {
  switch (segment) {
    case 0:
      return `Stark: ${labelLeft}`;
    case 1:
      return `Eher: ${labelLeft}`;
    case 2:
      return 'Ausgewogen';
    case 3:
      return `Eher: ${labelRight}`;
    case 4:
      return `Stark: ${labelRight}`;
    default:
      return '';
  }
}