import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useTheme } from "../../utils/ThemeContext";

export interface Review {
  id: string;
  userName: string;
  date: string;
  comment?: string;
  helpful: number;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { resolvedTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongComment = (review.comment?.length || 0) > 200;

  return (
    <div className="review-card bg-muted/50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="review-author">{review.userName}</h4>
          <div className="flex items-center gap-2">
            <span className="review-date">{review.date}</span>
          </div>
        </div>
      </div>
      
      {/* Comment with fade-out effect */}
      <div className="relative">
        <p className={`review-text ${!isExpanded && isLongComment ? 'line-clamp-4' : ''}`}>
          {review.comment || ''}
        </p>
        
        {/* Fade-out gradient overlay */}
        {!isExpanded && isLongComment && (
          <div className="review-comment-fade" />
        )}
      </div>
      
      {/* Read more / Read less button */}
      {isLongComment && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-btn text-body-small"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Rezension verkürzen' : 'Vollständige Rezension anzeigen'}
        >
          {isExpanded ? 'Weniger anzeigen' : 'Mehr lesen'}
        </button>
      )}
      
      <div className="flex gap-4 mt-4">
        <button 
          className="flex items-center gap-1 text-body-small" 
          style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Hilfreich ({review.helpful})</span>
        </button>
        <button 
          className="flex items-center gap-1 text-body-small" 
          style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}