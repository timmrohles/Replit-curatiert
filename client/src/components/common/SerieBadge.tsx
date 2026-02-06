import { memo } from 'react';
import { motion } from 'motion/react';
import { useSafeNavigate } from '../../utils/routing';
import { getSeriesBadge, getBadgeStyle } from '../../utils/serieBadge';
import { ONIXTag } from '../../utils/api';

interface SerieBadgeProps {
  onixTags?: ONIXTag[];
  context?: 'cover' | 'detail' | 'list';
  className?: string;
  seriesName?: string;
  seriesSlug?: string;
  collectionNumber?: number;
  clickable?: boolean;
}

/**
 * Serie Badge Component
 * 
 * Displays series information prominently on book covers
 * Extracts series data from ONIX tags or accepts direct props
 */
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
  
  // Use direct props if provided, otherwise use ONIX data
  const finalSeriesName = seriesName || badge?.seriesName;
  const finalSeriesNumber = collectionNumber || badge?.seriesNumber;
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

  return (
    <div
      className={`inline-flex items-center rounded-full whitespace-nowrap overflow-hidden text-ellipsis ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      style={{
        backgroundColor: badge?.color || '#247ba0',
        color: '#FFFFFF',
        fontFamily: 'Fjalla One',
        fontSize: style.fontSize,
        padding: style.padding,
        maxWidth: style.maxWidth,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        fontWeight: 'normal'
      }}
      title={text}
      onClick={handleClick}
    >
      📚 {text}
    </div>
  );
}