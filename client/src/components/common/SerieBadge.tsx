import { useSafeNavigate } from '../../utils/routing';
import { getSeriesBadge, getBadgeStyle } from '../../utils/serieBadge';
import { ONIXTag } from '../../utils/api';
import { DSBadge } from '../design-system/DSBadge';

interface SerieBadgeProps {
  onixTags?: ONIXTag[];
  context?: 'cover' | 'detail' | 'list';
  className?: string;
  seriesName?: string;
  seriesSlug?: string;
  collectionNumber?: number;
  clickable?: boolean;
}

export function SerieBadgeComponent({ 
  onixTags, 
  context = 'cover', 
  className = '',
  seriesName,
  seriesSlug,
  collectionNumber,
  clickable = true
}: SerieBadgeProps) {
  const navigate = useSafeNavigate();
  const badge = getSeriesBadge(onixTags);
  
  const finalSeriesName = seriesName || badge?.serieName;
  const finalSeriesNumber = collectionNumber || badge?.serieNumber;
  const finalSeriesSlug = seriesSlug || (finalSeriesName ? finalSeriesName.toLowerCase().replace(/\s+/g, '-') : '');
  
  if (!finalSeriesName) return null;

  const style = getBadgeStyle(context);
  const text = finalSeriesNumber 
    ? `${finalSeriesName} - Band ${finalSeriesNumber}`
    : finalSeriesName;

  const handleClick = (e: React.MouseEvent) => {
    if (clickable && finalSeriesSlug) {
      e.stopPropagation();
      navigate(`/serien/${finalSeriesSlug}`);
    }
  };

  const sizeMap = {
    cover: 'small' as const,
    list: 'small' as const,
    detail: 'medium' as const,
  };

  return (
    <div
      className={`inline-flex ${clickable ? 'cursor-pointer' : ''} ${className}`}
      style={{ maxWidth: style.maxWidth }}
      title={text}
      onClick={handleClick}
      data-testid="badge-series"
    >
      <DSBadge
        variant="series"
        size={sizeMap[context]}
        className="font-headline font-normal truncate"
      >
        {text}
      </DSBadge>
    </div>
  );
}
