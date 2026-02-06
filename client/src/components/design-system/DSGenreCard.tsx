import { LikeButton } from '../LikeButton';

interface DSGenreCardProps {
  label: string;
  image: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * DSGenreCard - Genre Category Card für coratiert.de
 * 
 * Interaktive Genre-Karte mit:
 * - Hintergrundbild
 * - Gradient Overlay (schwarz nach transparent)
 * - Genre-Label
 * - Hover-Effekt (Bild-Zoom)
 * 
 * Verwendung:
 * - Homepage Genre Carousel
 * - Genre Übersichtsseite
 * - Kategorie Navigation
 * 
 * Größen:
 * - small: 128x80px (Mobile)
 * - medium: 176x112px (Default)
 * - large: 256x160px (Desktop)
 * 
 * @example
 * <DSGenreCard
 *   label="Hardboiled"
 *   image="/genre-hardboiled.jpg"
 *   onClick={() => navigate('/genre/hardboiled')}
 * />
 */
export function DSGenreCard({ 
  label, 
  image, 
  onClick,
  size = 'medium'
}: DSGenreCardProps) {
  
  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-32 h-20',
      label: 'text-xs',
      padding: 'bottom-1 left-1'
    },
    medium: {
      container: 'w-44 h-28',
      label: 'text-sm',
      padding: 'bottom-2 left-2'
    },
    large: {
      container: 'w-64 h-40',
      label: 'text-base',
      padding: 'bottom-3 left-3'
    }
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={`flex-shrink-0 ${config.container} snap-center group cursor-pointer`}
      onClick={onClick}
    >
      <div 
        className="relative w-full h-full rounded-xl overflow-hidden mb-3" 
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      >
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div 
          className={`absolute ${config.padding} text-white`}
          style={{ 
            fontFamily: 'Fjalla One', 
            fontSize: config.label === 'text-xs' ? '14px' : config.label === 'text-sm' ? '16px' : '18px',
            letterSpacing: '0.02em',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
          }}
        >
          {label}
        </div>
        {/* Follow Heart Button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-full p-1 shadow-lg">
            <LikeButton 
              entityId={`genre-${label.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'und')}`}
              entityType="genre"
              entityTitle={label}
              entityImage={image}
              size="sm" 
              variant="minimal"
              iconColor="#247ba0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}