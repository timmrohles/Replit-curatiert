import { AlertTriangle } from 'lucide-react';
import { ReviewData } from '../ReviewWizard';

interface WizardStepExtendedStrengthsProps {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

const STRENGTHS = [
  'Starke Figuren',
  'Großartige Sprache',
  'Viel Spannung',
  'Wichtige Perspektiven',
  'Originelle Handlung',
  'Atmosphärisch dicht',
  'Emotional berührend',
  'Intellektuell anregend',
  'Humorvoll',
  'Gut recherchiert',
  'Überraschende Wendungen',
  'Zeitgemäß / relevant'
];

const CONTENT_WARNINGS = [
  'Gewalt',
  'Trauma',
  'Tod / Trauer',
  'Diskriminierung',
  'Sexuelle Inhalte',
  'Suizid',
  'Substanzmissbrauch',
  'Psychische Erkrankungen',
  'Tierquälerei',
  'Kriegsdarstellungen'
];

export function WizardStepExtended_Strengths({ reviewData, updateReviewData }: WizardStepExtendedStrengthsProps) {
  const toggleStrength = (strength: string) => {
    const strengths = reviewData.strengths || [];
    const newStrengths = strengths.includes(strength)
      ? strengths.filter(s => s !== strength)
      : [...strengths, strength];
    
    // Max 3 strengths
    if (newStrengths.length <= 3) {
      updateReviewData({ strengths: newStrengths });
    }
  };

  const toggleWarning = (warning: string) => {
    const warnings = reviewData.contentWarnings || [];
    const newWarnings = warnings.includes(warning)
      ? warnings.filter(w => w !== warning)
      : [...warnings, warning];
    
    updateReviewData({ contentWarnings: newWarnings });
  };

  const selectedStrengths = reviewData.strengths || [];
  const selectedWarnings = reviewData.contentWarnings || [];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Strengths */}
      <div>
        <div className="text-center mb-6">
          <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Was sind die Stärken des Buches?
          </h3>
          <p className="text-sm" style={{ color: '#666' }}>
            Wähle max. 3 Stärken aus
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STRENGTHS.map((strength) => {
            const isSelected = selectedStrengths.includes(strength);
            const isDisabled = !isSelected && selectedStrengths.length >= 3;

            return (
              <button
                key={strength}
                onClick={() => !isDisabled && toggleStrength(strength)}
                disabled={isDisabled}
                className="px-4 py-2 rounded-full text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSelected ? '#70c1b3' : '#f5f5f0',
                  color: isSelected ? '#FFFFFF' : '#3A3A3A',
                  border: `1px solid ${isSelected ? '#70c1b3' : 'transparent'}`
                }}
              >
                {strength}
              </button>
            );
          })}
        </div>

        {selectedStrengths.length > 0 && (
          <div className="mt-4 p-3 rounded-lg text-center text-sm" style={{ backgroundColor: '#70c1b310', color: '#3A3A3A' }}>
            ✓ {selectedStrengths.length} von 3 Stärken ausgewählt
          </div>
        )}
      </div>

      {/* Content Warnings */}
      <div>
        <div className="text-center mb-6">
          <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Content Warnings (optional)
          </h3>
          <p className="text-sm" style={{ color: '#666' }}>
            Gibt es sensible Themen, die Leser:innen kennen sollten?
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CONTENT_WARNINGS.map((warning) => {
            const isSelected = selectedWarnings.includes(warning);

            return (
              <button
                key={warning}
                onClick={() => toggleWarning(warning)}
                className="px-4 py-2 rounded-full text-sm transition-all duration-200 flex items-center gap-1"
                style={{
                  backgroundColor: isSelected ? '#f25f5c' : '#f5f5f0',
                  color: isSelected ? '#FFFFFF' : '#3A3A3A',
                  border: `1px solid ${isSelected ? '#f25f5c' : 'transparent'}`
                }}
              >
                {isSelected && <AlertTriangle className="w-3 h-3" />}
                {warning}
              </button>
            );
          })}
        </div>

        {selectedWarnings.length > 0 && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#f25f5c10', color: '#3A3A3A' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f25f5c' }} />
              <div>
                <p className="mb-1" style={{ fontFamily: 'Fjalla One' }}>
                  {selectedWarnings.length} Content Warning{selectedWarnings.length > 1 ? 's' : ''} hinzugefügt
                </p>
                <p className="text-xs" style={{ color: '#666' }}>
                  Diese werden deutlich sichtbar auf der Buchseite angezeigt, um Leser:innen zu informieren.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skip Info */}
      {selectedStrengths.length === 0 && selectedWarnings.length === 0 && (
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f5f5f0' }}>
          <p className="text-sm" style={{ color: '#666' }}>
            Du kannst diesen Schritt auch überspringen und direkt fortfahren.
          </p>
        </div>
      )}
    </div>
  );
}
