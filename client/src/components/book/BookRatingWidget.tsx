import { useState, useEffect, useRef } from 'react';
import { Save, Check } from 'lucide-react';
import { 
  BOOK_WORLD_SCALES, 
  saveBookRating, 
  getBookRating,
  type BookWorldForRating,
  type RatingScale,
  type BookRating
} from '../../utils/api';
import { ScaleSelector } from '../common/ScaleSelector';
import { CarouselContainer } from '../carousel/CarouselContainer';

interface BookRatingWidgetProps {
  bookId: string;
  bookWorld: BookWorldForRating;
  userId?: string;
  sessionId?: string;
  onRatingChange?: (rating: Record<string, number>) => void;
}

export function BookRatingWidget({ 
  bookId, 
  bookWorld, 
  userId, 
  sessionId,
  onRatingChange 
}: BookRatingWidgetProps) {
  const [scales, setScales] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const scaleDefinitions = BOOK_WORLD_SCALES[bookWorld];

  // Load existing rating
  useEffect(() => {
    loadRatings();
  }, [bookId, userId, sessionId]);
  
  async function loadRatings() {
    try {
      // Load user's rating if exists
      if (userId || sessionId) {
        const userRating = await getBookRating(bookId, userId, sessionId);
        if (userRating) {
          setScales(userRating.scales);
        } else {
          // Initialize with neutral values (50)
          const initialScales: Record<string, number> = {};
          scaleDefinitions.forEach(scale => {
            initialScales[scale.id] = 50;
          });
          setScales(initialScales);
        }
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  }

  const handleScaleChange = (scaleId: string, value: number) => {
    const newScales = { ...scales, [scaleId]: value };
    setScales(newScales);
    setIsSaved(false);
    
    if (onRatingChange) {
      onRatingChange(newScales);
    }
  };

  const handleSave = async () => {
    if (!userId && !sessionId) {
      alert('Bitte melde dich an, um eine Bewertung abzugeben.');
      return;
    }

    setIsSaving(true);
    try {
      await saveBookRating(bookId, scales, userId, sessionId);
      setIsSaved(true);
      
      // Reset saved indicator after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save rating:', error);
      alert('Fehler beim Speichern der Bewertung. Bitte versuche es erneut.');
    } finally {
      setIsSaving(false);
    }
  };

  if (scaleDefinitions.length === 0) {
    return null;
  }

  return (
    <div className="bg-transparent rounded-lg">
      {/* Scales - Using CarouselContainer */}
      <div className="mb-6">
        <CarouselContainer showDesktopButtons={true} showMobileButtons={true}>
          <div className="flex gap-6">
            {scaleDefinitions.map((scale: RatingScale) => {
              return (
                <div key={scale.id} className="flex-shrink-0 w-full">
                  <ScaleSelector
                    label={scale.label}
                    labelLeft={scale.labelLeft}
                    labelRight={scale.labelRight}
                    description={scale.description}
                    value={scales[scale.id]}
                    onChange={(value) => handleScaleChange(scale.id, value)}
                    isPro={scale.isPro}
                  />
                </div>
              );
            })}
          </div>
        </CarouselContainer>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className={`
            px-6 py-3 rounded-md font-semibold transition-all duration-200
            ${isSaved 
              ? 'cursor-default' 
              : 'cursor-pointer hover:opacity-90'
            }
            ${(isSaving || isSaved) ? 'opacity-75 cursor-not-allowed' : ''}
          `}
          style={{
            backgroundColor: isSaved ? 'var(--tropical-teal)' : 'var(--button-primary-bg)',
            color: isSaved ? 'var(--charcoal)' : 'var(--button-primary-text)'
          }}
          aria-label={isSaving ? 'Bewertung wird gespeichert' : isSaved ? 'Bewertung gespeichert' : 'Bewertung speichern'}
        >
          {isSaving ? (
            <>
              Speichern...
            </>
          ) : isSaved ? (
            <>
              Gespeichert!
            </>
          ) : (
            <>
              Bewertung speichern
            </>
          )}
        </button>
      </div>

      {/* Info text */}
      <p className="text-xs text-center mt-4 text-foreground-muted">
        Deine Bewertung ist anonym und hilft anderen Lesern bei ihrer Auswahl
      </p>
    </div>
  );
}