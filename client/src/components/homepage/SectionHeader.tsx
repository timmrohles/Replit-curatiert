import { Heading, Text } from '../ui/typography';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  backgroundColor?: string;
  textColor?: string;
}

export function SectionHeader({ title, subtitle, align = 'left', backgroundColor = '#F5F5F0', textColor }: SectionHeaderProps) {
  // Wenn textColor explizit übergeben wird, verwenden wir diese
  // Sonst: Auf dunklem Hintergrund weiß, auf hellem/türkisem Hintergrund schwarz
  const isDarkBackground = backgroundColor === 'var(--creator-dark-bg)' || backgroundColor === 'var(--charcoal)' || backgroundColor === '#3A3A3A' || backgroundColor === '#2a2a2a';
  const isTurquoiseBackground = backgroundColor === 'rgb(160,206,200)' || backgroundColor === '#A0CEC8' || backgroundColor === 'var(--creator-accent)';
  const subtitleOpacity = isTurquoiseBackground ? 1 : 0.7;
  
  const finalTextColor = textColor || (isDarkBackground ? '#ffffff' : 'var(--foreground)');
  const textColorClass = isDarkBackground ? '!text-white' : '';
  
  return (
    <div className={`mb-4 md:mb-6 pt-8 md:pt-12 ${align === 'center' ? 'text-center mx-auto' : ''}`}>
      <Heading 
        as="h2" 
        variant="h2" 
        className={`mb-2 text-shadow-sm ${textColorClass}`}
        style={{ color: finalTextColor }}
      >
        {title}
      </Heading>
      {subtitle && (
        <>
          <Text 
            as="p" 
            variant="large"
            className={`${textColorClass} pb-5`}
            style={{ 
              color: finalTextColor, 
              opacity: subtitleOpacity
            }}
          >
            {subtitle}
          </Text>
          <div 
            style={{ 
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              width: '100%',
              marginTop: '-0.75rem'
            }}
          />
        </>
      )}
    </div>
  );
}