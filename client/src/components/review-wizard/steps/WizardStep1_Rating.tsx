import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ReviewData } from '../ReviewWizard';

interface WizardStep1Props {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

export function WizardStep1_Rating({ reviewData, updateReviewData }: WizardStep1Props) {
  const isDetailed = reviewData.reviewType === 'detailed';

  const handleStarClick = (rating: number) => {
    updateReviewData({ rating });
  };

  const handleStarHover = (rating: number) => {
    // Visual feedback could be added here
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Star Rating */}
      <div className="text-center">
        <h3 className="text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Wie hat dir das Buch gefallen?
        </h3>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              className="transition-transform hover:scale-110"
            >
              <Star 
                className="w-12 h-12"
                fill={star <= reviewData.rating ? '#ffe066' : 'none'}
                style={{ 
                  color: star <= reviewData.rating ? '#ffe066' : '#e5e5e5',
                  cursor: 'pointer'
                }}
              />
            </button>
          ))}
        </div>

        {reviewData.rating > 0 && (
          <p className="text-sm" style={{ color: '#666' }}>
            {reviewData.rating === 5 && 'Absolut großartig!'}
            {reviewData.rating === 4 && 'Sehr gut'}
            {reviewData.rating === 3 && 'Gut'}
            {reviewData.rating === 2 && 'Geht so'}
            {reviewData.rating === 1 && 'Nicht mein Fall'}
          </p>
        )}
      </div>

      {/* Would Recommend */}
      <div className="text-center">
        <h4 className="text-lg mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Würdest du das Buch weiterempfehlen?
        </h4>
        
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => updateReviewData({ wouldRecommend: true })}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all duration-200"
            style={{
              borderColor: reviewData.wouldRecommend === true ? '#70c1b3' : '#e5e5e5',
              backgroundColor: reviewData.wouldRecommend === true ? '#70c1b320' : '#FFFFFF',
              color: '#3A3A3A'
            }}
          >
            <ThumbsUp className="w-5 h-5" style={{ color: '#70c1b3' }} />
            Ja, auf jeden Fall
          </button>

          <button
            onClick={() => updateReviewData({ wouldRecommend: false })}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all duration-200"
            style={{
              borderColor: reviewData.wouldRecommend === false ? '#f25f5c' : '#e5e5e5',
              backgroundColor: reviewData.wouldRecommend === false ? '#f25f5c20' : '#FFFFFF',
              color: '#3A3A3A'
            }}
          >
            <ThumbsDown className="w-5 h-5" style={{ color: '#f25f5c' }} />
            Eher nicht
          </button>
        </div>
      </div>

      {/* Intensity Slider - Only for Detailed Reviews */}
      {isDetailed && (
        <div className="text-center">
          <h4 className="text-lg mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Wie intensiv war das Leseerlebnis?
          </h4>
          
          <div className="max-w-md mx-auto">
            <input
              type="range"
              min="1"
              max="10"
              value={reviewData.intensity || 5}
              onChange={(e) => updateReviewData({ intensity: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #70c1b3 0%, #70c1b3 ${((reviewData.intensity || 5) - 1) * 11.11}%, #e5e5e5 ${((reviewData.intensity || 5) - 1) * 11.11}%, #e5e5e5 100%)`
              }}
            />
            
            <div className="flex justify-between mt-2 text-xs" style={{ color: '#666' }}>
              <span>Ruhig</span>
              <span className="font-semibold">{reviewData.intensity || 5}/10</span>
              <span>Sehr intensiv</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
