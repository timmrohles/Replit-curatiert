import React, { memo } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Heart } from 'lucide-react';
import { useFavorites } from '../FavoritesContext';

interface DSStorefrontCardProps {
  id: string | number;
  bannerImage: string;
  avatar: string;
  name: string;
  focus: string;
  bookCount?: number;
  description: string;
  bookCovers?: string[];
  onNavigate?: () => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * DSStorefrontCard - 3D Book-Style Storefront Card für coratiert.de
 * 
 * Zeigt Creator Storefronts als dreidimensionales Buch mit:
 * - Buchrücken-Effekt (Spine)
 * - Gradient Overlay
 * - Creator Info (Name, Focus, Description)
 * - Heart Button zum Folgen
 * 
 * Größen:
 * - small: 140x220px (Mobile)
 * - medium: 200x300px (Default)
 * - large: 260x360px (Desktop)
 * 
 * @example
 * <DSStorefrontCard
 *   id="maurice-oekonomius"
 *   avatar="/creator.jpg"
 *   name="Maurice Ökonomius"
 *   focus="Politik & Wirtschaft"
 *   description="Moderne Geldtheorie..."
 *   onNavigate={() => navigate('/storefront/maurice')}
 * />
 */
export const DSStorefrontCard = memo(function DSStorefrontCard({
  id,
  bannerImage,
  avatar,
  name,
  focus,
  bookCount,
  description,
  bookCovers,
  onNavigate,
  size = 'medium'
}: DSStorefrontCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      id: `storefront-${id}`,
      type: 'storefront',
      title: name,
      subtitle: focus,
      image: avatar,
    });
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-36 h-[240px]',
      spine: '28px',
      text: {
        focus: 'text-[9px]',
        name: 'text-sm',
        description: 'text-[11px]',
      },
      padding: 'p-2',
      heartSize: 'w-3 h-3'
    },
    medium: {
      container: 'w-[200px] h-[300px]',
      spine: '32px',
      text: {
        focus: 'text-[10px]',
        name: 'text-base',
        description: 'text-xs',
      },
      padding: 'p-4',
      heartSize: 'w-4 h-4'
    },
    large: {
      container: 'w-[260px] h-[360px]',
      spine: '36px',
      text: {
        focus: 'text-xs',
        name: 'text-xl',
        description: 'text-sm',
      },
      padding: 'p-6',
      heartSize: 'w-5 h-5'
    }
  };

  const config = sizeConfig[size];

  const content = (
    <div 
      className={`relative transition-all duration-500 cursor-pointer group ${config.container}`}
      onClick={onNavigate}
      style={{ 
        transform: 'perspective(1000px) rotateY(-5deg)',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Book Spine (Buchrücken) */}
      <div 
        className="absolute top-0 left-0 h-full"
        style={{
          width: config.spine,
          background: 'linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.6), rgba(255,255,255,0.3))',
          transform: `translateX(-${config.spine}) rotateY(-90deg)`,
          transformOrigin: 'right',
          boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.6), inset 2px 0 4px rgba(255,255,255,0.1)'
        }}
      />
      
      {/* Book Cover (Front) */}
      <div 
        className="rounded-r-md overflow-hidden w-full h-full relative"
        style={{ 
          boxShadow: '-6px 4px 12px 2px rgba(0, 0, 0, 0.15), -3px 2px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <ImageWithFallback 
          src={avatar}
          alt={`${name} Storefront`}
          className="w-full h-full object-cover"
        />
        
        {/* Transparent overlays - behind text */}
        {/* REMOVED: Multicolor gradient overlay */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        {/* Darker at top and bottom */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.4) 100%)'
          }}
        />
        
        {/* Creator info - on top, no transparency */}
        <div className={`absolute inset-0 ${config.padding} flex flex-col justify-between`}>
          {/* Top: Specialty and Name */}
          <div>
            <div 
              className={`text-white ${config.text.focus} mb-1 tracking-wide uppercase text-left`}
              style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >{focus}</div>
            <div className="flex items-center gap-2">
              <h3 
                className={`text-white ${config.text.name} text-left`}
                style={{ 
                  fontFamily: 'Fjalla One',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
                }}
              >{name}</h3>
              <button
                onClick={handleToggleFavorite}
                className="flex-shrink-0 transition-transform hover:scale-110"
                title={isFavorite(`storefront-${id}`) ? 'Nicht mehr folgen' : 'Folgen'}
              >
                <Heart
                  className={`${config.heartSize} ${
                    isFavorite(`storefront-${id}`) ? 'fill-[#70c1b3] text-[#70c1b3]' : 'text-white'
                  }`}
                  style={{ strokeWidth: 1.5 }}
                />
              </button>
            </div>
          </div>
          
          {/* Bottom: Bio */}
          <div>
            <p 
              className={`text-white ${config.text.description} text-left`}
              style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >{description}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return content;
});