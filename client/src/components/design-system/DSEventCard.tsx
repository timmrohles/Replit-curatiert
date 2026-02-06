import { Calendar, MapPin, Clock } from 'lucide-react';
import { DSText } from './DSTypography';

interface DSEventCardProps {
  image: string;
  title: string;
  date: string;
  time: string;
  location: string;
  onClick?: () => void;
}

export function DSEventCard({
  image,
  title,
  date,
  time,
  location,
  onClick,
}: DSEventCardProps) {
  return (
    <div
      className="bg-[var(--ds-bg-primary)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] overflow-hidden hover:shadow-[var(--ds-shadow-md)] transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-video bg-[var(--ds-neutral-300)] relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <DSText variant="label" color="primary" className="line-clamp-2">
          {title}
        </DSText>

        <div className="space-y-2">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--ds-text-tertiary)] flex-shrink-0" />
            <DSText variant="caption" color="secondary">
              {date}
            </DSText>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--ds-text-tertiary)] flex-shrink-0" />
            <DSText variant="caption" color="secondary">
              {time}
            </DSText>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--ds-text-tertiary)] flex-shrink-0" />
            <DSText variant="caption" color="secondary" className="line-clamp-1">
              {location}
            </DSText>
          </div>
        </div>
      </div>
    </div>
  );
}
