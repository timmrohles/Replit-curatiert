import { ReviewData } from '../ReviewWizard';

interface WizardStep2Props {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

const MOODS = [
  'bewegend',
  'leicht',
  'spannend',
  'humorvoll',
  'melancholisch',
  'aufwühlend',
  'inspirierend',
  'entspannend',
  'düster',
  'hoffnungsvoll',
  'provokant',
  'berührend'
];

const TARGET_AUDIENCES = [
  'Einsteiger:innen',
  'Vielleser:innen',
  'Politikinteressierte',
  'Jugendliche',
  'Sportbegeisterte',
  'Lesemuffel',
  'Queere Community',
  'Eltern',
  'Wissenschaftsinteressierte',
  'Krimi-Fans',
  'Fantasy-Liebhaber:innen',
  'Geschichtsinteressierte'
];

const OCCASIONS = [
  'Geschenk',
  'Urlaub',
  'Diskussion',
  'Weiterbildung',
  'Comfort-Read',
  'Buchclub',
  'Commute',
  'Entspannung',
  'Inspiration'
];

export function WizardStep2_MoodTarget({ reviewData, updateReviewData }: WizardStep2Props) {
  const isDetailed = reviewData.reviewType === 'detailed';

  const toggleMood = (mood: string) => {
    const moods = reviewData.moods.includes(mood)
      ? reviewData.moods.filter(m => m !== mood)
      : [...reviewData.moods, mood];
    updateReviewData({ moods });
  };

  const toggleAudience = (audience: string) => {
    const audiences = reviewData.targetAudiences.includes(audience)
      ? reviewData.targetAudiences.filter(a => a !== audience)
      : [...reviewData.targetAudiences, audience];
    updateReviewData({ targetAudiences: audiences });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Moods */}
      <div>
        <h3 className="text-lg mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Welche Stimmung hatte das Buch?
        </h3>
        <p className="text-sm mb-4" style={{ color: '#666' }}>
          Wähle beliebig viele Stimmungen aus
        </p>
        
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => {
            const isSelected = reviewData.moods.includes(mood);
            return (
              <button
                key={mood}
                onClick={() => toggleMood(mood)}
                className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? '#70c1b3' : '#f5f5f0',
                  color: isSelected ? '#FFFFFF' : '#3A3A3A',
                  border: `1px solid ${isSelected ? '#70c1b3' : 'transparent'}`
                }}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Audiences */}
      <div>
        <h3 className="text-lg mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Für wen ist das Buch geeignet?
        </h3>
        <p className="text-sm mb-4" style={{ color: '#666' }}>
          Wähle passende Zielgruppen aus
        </p>
        
        <div className="flex flex-wrap gap-2">
          {TARGET_AUDIENCES.map((audience) => {
            const isSelected = reviewData.targetAudiences.includes(audience);
            return (
              <button
                key={audience}
                onClick={() => toggleAudience(audience)}
                className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? '#247ba0' : '#f5f5f0',
                  color: isSelected ? '#FFFFFF' : '#3A3A3A',
                  border: `1px solid ${isSelected ? '#247ba0' : 'transparent'}`
                }}
              >
                {audience}
              </button>
            );
          })}
        </div>
      </div>

      {/* Occasions - Only for Detailed */}
      {isDetailed && (
        <div>
          <h3 className="text-lg mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Bei welchem Anlass würdest du das Buch empfehlen?
          </h3>
          <p className="text-sm mb-4" style={{ color: '#666' }}>
            Optional: Wähle einen oder mehrere Anlässe
          </p>
          
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((occasion) => {
              const isSelected = reviewData.occasion === occasion;
              return (
                <button
                  key={occasion}
                  onClick={() => updateReviewData({ occasion: isSelected ? '' : occasion })}
                  className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? '#ffe066' : '#f5f5f0',
                    color: isSelected ? '#3A3A3A' : '#3A3A3A',
                    border: `1px solid ${isSelected ? '#ffe066' : 'transparent'}`
                  }}
                >
                  {occasion}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
