interface DSSectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
}

/**
 * DSSectionHeader - Section Header Komponente für coratiert.de
 * 
 * Verwendung:
 * - Konsistente Section Headers mit Fjalla One Font
 * - Automatische Farblogik basierend auf Hintergrundfarbe
 * - Optional: Manuelles Überschreiben der Textfarben
 * 
 * @example
 * <DSSectionHeader 
 *   title="Neuerscheinungen" 
 *   subtitle="Die besten Bücher des Monats"
 * />
 */
export function DSSectionHeader({ 
  title, 
  subtitle, 
  align = 'left', 
  backgroundColor = '#F5F5F0',
  titleColor,
  subtitleColor
}: DSSectionHeaderProps) {
  // Automatische Farblogik: Auf dunklem Hintergrund weiß, sonst dunkelgrau
  const isDarkBackground = 
    backgroundColor === 'var(--creator-dark-bg)' || 
    backgroundColor === 'var(--color-bg-dark)' ||
    backgroundColor === 'var(--charcoal)';
  
  // Turquoise needs special handling for readability
  const isTurquoiseBackground = 
    backgroundColor === 'var(--creator-teal-bg)' || 
    backgroundColor === '#70c1b3';
  
  const defaultTitleColor = (isDarkBackground && !isTurquoiseBackground) ? 'var(--color-white)' : 'var(--charcoal)';
  const defaultSubtitleColor = (isDarkBackground && !isTurquoiseBackground) ? 'var(--color-white)' : 'var(--charcoal)';
  const subtitleOpacity = isTurquoiseBackground ? 1 : 0.7;
  
  return (
    <div className={`mb-6 ${align === 'center' ? 'text-center mx-auto' : ''}`}>
      <h2 
        className="mb-2 leading-tight text-[1.125rem] md:text-[1.25rem] lg:text-[1.5rem]"
        style={{ 
          fontFamily: 'Fjalla One',
          letterSpacing: '0.02em',
          color: titleColor || defaultTitleColor
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p 
          className="text-xs md:text-sm lg:text-base"
          style={{ 
            fontFamily: 'Inter', 
            color: subtitleColor || defaultSubtitleColor,
            opacity: subtitleOpacity
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}