interface DSTopicTagProps {
  label: string;
  count?: number;
  onClick?: () => void;
  variant?: 'default' | 'coral' | 'cerulean' | 'teal' | 'gold';
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
}

/**
 * DSTopicTag - Topic Tag Komponente für coratiert.de
 * 
 * Interaktiver Tag/Button für:
 * - Genre/Kategorie Auswahl
 * - Topic Navigation
 * - Filter Tags
 * - Interest Tags
 * 
 * Varianten:
 * - default: Dunkler Hintergrund (var(--charcoal))
 * - coral: Vibrant Coral (#f25f5c) - CTA
 * - cerulean: Cerulean (#247ba0) - Links
 * - teal: Tropical Teal (#70c1b3) - Hover
 * - gold: Royal Gold (#ffe066) - Highlight
 * 
 * @example
 * <DSTopicTag 
 *   label="Philosophie" 
 *   count={123}
 *   variant="coral"
 *   onClick={() => handleFilter('philosophie')}
 * />
 */
export function DSTopicTag({ 
  label, 
  count, 
  onClick,
  variant = 'default',
  size = 'medium',
  selected = false
}: DSTopicTagProps) {
  
  // Variant colors
  const variantColors = {
    default: { bg: 'var(--charcoal)', hover: 'var(--charcoal)', border: '#70c1b3' },
    coral: { bg: '#f25f5c', hover: '#e14e4b', border: '#f25f5c' },
    cerulean: { bg: '#247ba0', hover: '#1d6380', border: '#247ba0' },
    teal: { bg: '#70c1b3', hover: '#5fb0a2', border: '#70c1b3' },
    gold: { bg: '#ffe066', hover: '#ffd84d', border: '#ffe066' }
  };

  // Size configurations
  const sizeConfig = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const colors = variantColors[variant];
  const textColor = variant === 'gold' ? 'var(--charcoal)' : 'var(--color-white)'; // Adaptive für Dark Mode

  return (
    <button
      onClick={onClick}
      className={`${sizeConfig[size]} rounded-full shadow-sm hover:shadow-md transition-all font-medium hover:scale-105 border ${
        selected ? 'ring-2' : 'border-transparent'
      }`}
      style={{ 
        backgroundColor: colors.bg,
        color: textColor,
        fontFamily: 'Fjalla One',
        letterSpacing: '0.02em',
        borderColor: selected ? colors.border : 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.hover;
        if (!selected) {
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg;
        if (!selected) {
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
    >
      {label}
      {count !== undefined && <span className="ml-2 opacity-70">({count})</span>}
    </button>
  );
}