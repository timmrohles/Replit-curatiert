import { ReviewData } from '../ReviewWizard';

interface WizardStepExtendedMotivesProps {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

const READING_MOTIVES = [
  { id: 'entertainment', label: 'Unterhaltung', icon: '🎭' },
  { id: 'knowledge', label: 'Wissen', icon: '📚' },
  { id: 'relaxation', label: 'Entspannung', icon: '🧘' },
  { id: 'escape', label: 'Flucht aus dem Alltag', icon: '🌌' },
  { id: 'recognition', label: 'Anerkennung / Bildung', icon: '🎓' },
  { id: 'surprise', label: 'Überraschung / Neues', icon: '✨' },
  { id: 'trust', label: 'Vertrauen / Trost', icon: '🤝' },
  { id: 'inspiration', label: 'Inspiration', icon: '💡' }
];

export function WizardStepExtended_Motives({ reviewData, updateReviewData }: WizardStepExtendedMotivesProps) {
  const toggleMotive = (motiveId: string) => {
    const motives = reviewData.readingMotives || [];
    const newMotives = motives.includes(motiveId)
      ? motives.filter(m => m !== motiveId)
      : [...motives, motiveId];
    
    // Max 2 motives
    if (newMotives.length <= 2) {
      updateReviewData({ readingMotives: newMotives });
    }
  };

  const selectedMotives = reviewData.readingMotives || [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Warum hast du dieses Buch gelesen?
        </h3>
        <p className="text-sm" style={{ color: '#666' }}>
          Wähle max. 2 Lesemotive aus
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {READING_MOTIVES.map((motive) => {
          const isSelected = selectedMotives.includes(motive.id);
          const isDisabled = !isSelected && selectedMotives.length >= 2;

          return (
            <button
              key={motive.id}
              onClick={() => !isDisabled && toggleMotive(motive.id)}
              disabled={isDisabled}
              className="p-4 rounded-lg border-2 transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: isSelected ? '#247ba0' : '#e5e5e5',
                backgroundColor: isSelected ? '#247ba010' : '#FFFFFF'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{motive.icon}</span>
                <span style={{ 
                  fontFamily: isSelected ? 'Fjalla One' : 'inherit',
                  color: '#3A3A3A' 
                }}>
                  {motive.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedMotives.length > 0 && (
        <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#70c1b310' }}>
          <p className="text-sm" style={{ color: '#3A3A3A' }}>
            ✓ {selectedMotives.length} von 2 Motiven ausgewählt
          </p>
        </div>
      )}
    </div>
  );
}
