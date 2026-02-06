/**
 * LESER-EINSCHÄTZUNG - Sprachliche Verdichtung der Community-Bewertungen
 * 
 * Zeigt KEINE Zahlen, nur journalistische Beschreibungen im Feuilleton-Stil
 * Beispiel: "überwiegend sprachlich anspruchsvoll, ruhiges Erzähltempo"
 */

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { getBookAggregateRatings, type BookWorldForRating, type AggregateRatings } from '../../utils/api';
import { aggregateToTextBullets } from '../../utils/rating-labels';

interface BookReaderAssessmentProps {
  bookId: string;
  bookWorld: BookWorldForRating;
  minRatings?: number;
}

export function BookReaderAssessment({ 
  bookId, 
  bookWorld,
  minRatings = 5 
}: BookReaderAssessmentProps) {
  const [aggregateRatings, setAggregateRatings] = useState<AggregateRatings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAggregateRatings();
  }, [bookId]);

  async function loadAggregateRatings() {
    setLoading(true);
    console.log('🔍 [BookReaderAssessment] Loading aggregate ratings for bookId:', bookId);
    try {
      const data = await getBookAggregateRatings(bookId);
      console.log('✅ [BookReaderAssessment] Received aggregate data:', data);
      console.log('✅ [BookReaderAssessment] Data details:', {
        hasData: !!data,
        totalRatings: data?.totalRatings,
        scalesKeys: data?.scales ? Object.keys(data.scales) : [],
        scalesData: data?.scales
      });
      setAggregateRatings(data);
    } catch (error) {
      console.error('❌ [BookReaderAssessment] Failed to load aggregate ratings:', error);
    } finally {
      setLoading(false);
    }
  }

  // Nicht anzeigen wenn zu wenig Bewertungen
  if (loading) {
    return (
      <div className="bg-white/30 backdrop-blur-md rounded-lg shadow-lg p-6 md:p-8 border border-white/40">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg md:text-xl font-headline text-foreground">
            Leser-Einschätzung
          </h3>
        </div>
        <p className="text-sm text-foreground-muted">
          Lädt...
        </p>
      </div>
    );
  }

  if (!aggregateRatings || aggregateRatings.totalRatings < minRatings) {
    console.log('⚠️ [BookReaderAssessment] Not enough ratings:', { 
      hasData: !!aggregateRatings, 
      totalRatings: aggregateRatings?.totalRatings, 
      minRequired: minRatings 
    });
    return (
      <div className="bg-white/30 backdrop-blur-md rounded-lg shadow-lg p-6 md:p-8 border border-white/40">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg md:text-xl font-headline text-foreground">
            Leser-Einschätzung
          </h3>
        </div>
        <p className="text-sm mb-4 text-foreground-muted">
          Noch keine Bewertungen vorhanden
        </p>
        <div className="bg-white/50 rounded-lg p-4">
          <p className="text-sm text-foreground">
            Sei der Erste, der dieses Buch bewertet! Deine Einschätzung hilft anderen Lesern bei ihrer Auswahl.
          </p>
        </div>
      </div>
    );
  }

  // Generiere sprachliche Bullets
  const bullets = aggregateToTextBullets(aggregateRatings.scales, bookWorld, 1);
  console.log('📊 [BookReaderAssessment] Generated bullets:', { 
    scales: aggregateRatings.scales,
    bookWorld,
    bulletsCount: bullets.length,
    bullets 
  });

  if (bullets.length === 0) {
    return (
      <div className="bg-white/30 backdrop-blur-md rounded-lg shadow-lg p-6 md:p-8 border border-white/40">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg md:text-xl font-headline text-foreground">
            Leser-Einschätzung
          </h3>
        </div>
        <p className="text-sm text-foreground-muted">
          Noch keine ausreichenden Daten vorhanden
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg md:text-xl font-headline text-foreground">
              Leser-Einschätzung
            </h3>
          </div>
          <p className="text-xs text-foreground-muted">
            Basierend auf {aggregateRatings.totalRatings} {aggregateRatings.totalRatings === 1 ? 'Bewertung' : 'Bewertungen'}
          </p>
        </div>
      </div>

      {/* Sprachliche Bullets - KEINE Zahlen */}
      <div className="space-y-2">
        {bullets.map((bullet, index) => (
          <div 
            key={index} 
            className="flex items-start gap-3 text-sm md:text-base text-foreground"
          >
            <span className="text-lg select-none text-cerulean">–</span>
            <span className="flex-1">{bullet}</span>
          </div>
        ))}
      </div>

      {/* Optionaler Hinweis */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs italic text-foreground-muted">
          Diese Einschätzung basiert auf den Bewertungen der Leser-Community und kann von deiner persönlichen Wahrnehmung abweichen.
        </p>
      </div>
    </div>
  );
}