import { CheckCircle, Star } from 'lucide-react';
import { ReviewData } from '../ReviewWizard';

interface WizardStep6Props {
  reviewData: ReviewData;
  bookTitle?: string;
  bookAuthor?: string;
}

export function WizardStep6_Complete({ reviewData, bookTitle, bookAuthor }: WizardStep6Props) {
  return (
    <div className="text-center py-8 max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ backgroundColor: '#70c1b320' }}
      >
        <CheckCircle className="w-12 h-12" style={{ color: '#70c1b3' }} />
      </div>

      {/* Title */}
      <h3 className="text-2xl mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
        Danke für deine Rezension! 🎉
      </h3>

      {/* Summary */}
      <div className="mb-8">
        <p className="text-sm mb-4" style={{ color: '#666' }}>
          Deine {reviewData.reviewType === 'short' ? 'Kurz-' : 'ausführliche '}Rezension 
          zu <span style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>{bookTitle}</span> wurde gespeichert.
        </p>

        {/* Rating Display */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className="w-5 h-5" 
                fill={i < reviewData.rating ? '#ffe066' : 'none'}
                style={{ color: i < reviewData.rating ? '#ffe066' : '#e5e5e5' }}
              />
            ))}
          </div>
          <span className="text-sm" style={{ color: '#666' }}>
            {reviewData.rating}/5 Sterne
          </span>
        </div>

        {/* Headline Preview */}
        {reviewData.headline && (
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#f5f5f0' }}>
            <p style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              "{reviewData.headline}"
            </p>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="space-y-3 mb-6">
        <div className="p-4 rounded-lg text-left" style={{ backgroundColor: '#247ba010' }}>
          <p className="text-sm mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            📚 Deine Rezension ist jetzt sichtbar
          </p>
          <p className="text-xs" style={{ color: '#666' }}>
            Sie erscheint auf der Buchseite und in deinem Profil.
          </p>
        </div>

        {reviewData.allowHighlight && (
          <div className="p-4 rounded-lg text-left" style={{ backgroundColor: '#70c1b310' }}>
            <p className="text-sm mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              ⭐ Chance auf Hervorhebung
            </p>
            <p className="text-xs" style={{ color: '#666' }}>
              Besonders hilfreiche Rezensionen werden in Empfehlungsmodulen hervorgehoben.
            </p>
          </div>
        )}

        {reviewData.externalUrl && (
          <div className="p-4 rounded-lg text-left" style={{ backgroundColor: '#ffe06610' }}>
            <p className="text-sm mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              🔗 Externer Link verknüpft
            </p>
            <p className="text-xs" style={{ color: '#666' }}>
              Dein Beitrag auf {reviewData.externalPlatform} ist mit dieser Rezension verbunden.
            </p>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f5f0' }}>
        <p className="text-xs" style={{ color: '#666' }}>
          💡 Tipp: Je mehr Rezensionen du schreibst, desto besser werden unsere Empfehlungen für dich!
        </p>
      </div>
    </div>
  );
}
