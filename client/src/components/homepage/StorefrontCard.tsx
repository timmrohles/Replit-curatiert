import React, { memo } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Heart } from 'lucide-react';
import { useFavorites } from '../favorites/FavoritesContext';

interface StorefrontCardProps {
  id: string | number;
  bannerImage: string;
  avatar: string;
  name: string;
  focus: string;
  bookCount: number;
  description: string;
  bookCovers: string[];
  onNavigate?: () => void;
}

export const StorefrontCard = memo(function StorefrontCard({
  id,
  bannerImage,
  avatar,
  name,
  focus,
  bookCount,
  description,
  bookCovers,
  onNavigate
}: StorefrontCardProps) {
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

  const content = (
    <div 
      className="relative transition-all duration-500 cursor-pointer group w-40 h-[260px] lg:w-[260px] lg:h-[360px]"
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
          width: '32px',
          background: 'linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.6), rgba(255,255,255,0.3))',
          transform: 'translateX(-32px) rotateY(-90deg)',
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
        <div className="absolute inset-0 p-3 lg:p-6 flex flex-col justify-between">
          {/* Top: Specialty and Name */}
          <div>
            <div 
              className="text-[10px] lg:text-xs mb-1 tracking-wide uppercase text-left"
              style={{
                color: 'white',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >{focus}</div>
            <div className="flex items-center gap-2">
              <h3 
                className="text-base lg:text-xl text-left" 
                style={{ 
                  color: 'white',
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
                  className={`w-4 h-4 md:w-5 md:h-5 ${
                    isFavorite(`storefront-${id}`) ? 'fill-[#f25f5c] text-[#f25f5c]' : ''
                  }`}
                  style={{ 
                    strokeWidth: 1.5,
                    color: isFavorite(`storefront-${id}`) ? '#f25f5c' : 'white'
                  }}
                />
              </button>
            </div>
          </div>
          
          {/* Bottom: Bio */}
          <div>
            <p 
              className="text-xs md:text-sm text-left"
              style={{
                color: 'white',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >{description}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return onNavigate ? (
    content
  ) : (
    content
  );
});