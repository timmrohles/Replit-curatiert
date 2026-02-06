import { FileText, BookOpen } from 'lucide-react';
import { ReviewData } from '../ReviewWizard';

interface WizardStep0Props {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

export function WizardStep0_Type({ reviewData, updateReviewData }: WizardStep0Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Wie möchtest du dein Leseerlebnis teilen?
        </h3>
        <p style={{ color: '#666' }}>
          Wähle zwischen einer schnellen Bewertung oder einer ausführlichen Rezension.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Short Review */}
        <button
          onClick={() => updateReviewData({ reviewType: 'short' })}
          className="p-8 rounded-lg border-2 transition-all duration-200 text-left group hover:shadow-lg"
          style={{
            borderColor: reviewData.reviewType === 'short' ? '#247ba0' : '#e5e5e5',
            backgroundColor: reviewData.reviewType === 'short' ? '#247ba010' : '#FFFFFF'
          }}
        >
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: '#ffe06620' }}
          >
            <FileText className="w-6 h-6" style={{ color: '#ffe066' }} />
          </div>
          <h4 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Kurzer Eindruck
          </h4>
          <p className="text-sm mb-4" style={{ color: '#666' }}>
            Perfekt für eine schnelle Meinung. Bewertung, Stimmung und 1-2 Sätze genügen.
          </p>
          <ul className="text-xs space-y-1" style={{ color: '#666' }}>
            <li>• Sternebewertung</li>
            <li>• Stimmung & Zielgruppe</li>
            <li>• Kurzer Text (1-2 Sätze)</li>
            <li>• Optional: Blog-Link</li>
          </ul>
        </button>

        {/* Detailed Review */}
        <button
          onClick={() => updateReviewData({ reviewType: 'detailed' })}
          className="p-8 rounded-lg border-2 transition-all duration-200 text-left group hover:shadow-lg"
          style={{
            borderColor: reviewData.reviewType === 'detailed' ? '#247ba0' : '#e5e5e5',
            backgroundColor: reviewData.reviewType === 'detailed' ? '#247ba010' : '#FFFFFF'
          }}
        >
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: '#247ba020' }}
          >
            <BookOpen className="w-6 h-6" style={{ color: '#247ba0' }} />
          </div>
          <h4 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Ausführliche Rezension
          </h4>
          <p className="text-sm mb-4" style={{ color: '#666' }}>
            Teile deine Gedanken im Detail. Geführte Fragen helfen dir dabei.
          </p>
          <ul className="text-xs space-y-1" style={{ color: '#666' }}>
            <li>• Detaillierte Bewertung</li>
            <li>• Lesemotive & Anlass</li>
            <li>• Stärken & Content Warnings</li>
            <li>• Ausführlicher Text</li>
            <li>• Optional: Blog-Link</li>
          </ul>
        </button>
      </div>
    </div>
  );
}
