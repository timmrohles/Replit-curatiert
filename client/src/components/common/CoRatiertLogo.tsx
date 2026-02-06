interface CoRatiertLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  textColor?: string;
}

export function CoRatiertLogo({ size = 'md', className = '', textColor }: CoRatiertLogoProps) {
  const sizeClasses = {
    sm: 'text-base md:text-lg',
    md: '',  // inherit from parent
    lg: 'text-3xl md:text-5xl'
  };

  const bookWidths = {
    sm: { left: '1px', center: '3px', right: '1px' },
    md: { left: '1.5px', center: '4px', right: '1.5px' },
    lg: { left: '2px', center: '5px', right: '2px' }
  };

  const bookHeights = {
    sm: { left: '1.1em', center: '0.95em', right: '1.1em' },
    md: { left: '1.2em', center: '1.05em', right: '1.2em' },
    lg: { left: '1.2em', center: '1.05em', right: '1.2em' }
  };

  const bookWidth = bookWidths[size] || bookWidths.md;
  const bookHeight = bookHeights[size] || bookHeights.md;

  return (
    <span 
      className={`${sizeClasses[size]} flex items-center ${className}`}
      style={{ 
        letterSpacing: '0.02em', 
        fontWeight: 'bold', 
        fontFamily: 'Fjalla One'
      }}
    >
      <span style={{ color: 'var(--color-coral)' }}>co</span>
      <span className="mx-[2px] flex items-center gap-[1px]">
        <span style={{ 
          width: bookWidth.left, 
          height: bookHeight.left, 
          backgroundColor: 'var(--charcoal)', 
          display: 'inline-block', 
          transform: 'rotate(20deg) translateY(-0.04em)' 
        }}></span>
        <span style={{ 
          width: bookWidth.center, 
          height: bookHeight.center, 
          backgroundColor: '#dfc58d', 
          display: 'inline-block', 
          transform: 'rotate(20deg)' 
        }}></span>
        <span style={{ 
          width: bookWidth.right, 
          height: bookHeight.right, 
          backgroundColor: 'var(--charcoal)', 
          display: 'inline-block', 
          transform: 'rotate(20deg) translateY(0.04em)' 
        }}></span>
      </span>
      <span style={{ color: 'var(--cerulean)' }}>ratiert</span>
    </span>
  );
}