import { Plus, Minus, Star } from 'lucide-react';
import { DSText } from './DSTypography';
import { useState } from 'react';

interface DSBookCardProps {
  cover: string;
  title: string;
  author: string;
  price: string;
  rating?: number;
  added?: boolean;
  onToggle?: (added: boolean) => void;
  onClick?: () => void;
}

export function DSBookCard({
  cover,
  title,
  author,
  price,
  rating,
  added = false,
  onToggle,
  onClick,
}: DSBookCardProps) {
  const [isAdded, setIsAdded] = useState(added);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newAdded = !isAdded;
    setIsAdded(newAdded);
    onToggle?.(newAdded);
  };

  return (
    <div
      className="bg-[var(--ds-bg-primary)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] overflow-hidden hover:shadow-[var(--ds-shadow-md)] transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="aspect-[2/3] bg-transparent relative overflow-hidden" style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)', border: '1px solid #e5e5e5' }}>
        <img
          src={cover}
          alt={title}
          className="w-full h-full"
          style={{ objectFit: 'contain' }}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <DSText variant="label" color="primary" className="line-clamp-2 min-h-[2.5rem]">
          {title}
        </DSText>
        
        <DSText variant="caption" color="secondary">
          {author}
        </DSText>

        {/* Rating */}
        {rating !== undefined && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? 'fill-[var(--ds-accent-warm-amber)] text-[var(--ds-accent-warm-amber)]'
                    : 'text-[var(--ds-neutral-400)]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Price */}
        <DSText variant="label" className="text-[var(--ds-accent-slate-blue)]">
          {price}
        </DSText>
      </div>
    </div>
  );
}