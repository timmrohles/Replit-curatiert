import { Shield, Eye, Share2, Building2, User } from 'lucide-react';
import { ReviewData } from '../ReviewWizard';

interface WizardStep5Props {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

export function WizardStep5_Marketing({ reviewData, updateReviewData }: WizardStep5Props) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Marketingfreigabe & Sichtbarkeit
        </h3>
        <p className="text-sm" style={{ color: '#666' }}>
          Entscheide, wie wir deine Rezension verwenden dürfen
        </p>
      </div>

      {/* Marketing Permissions */}
      <div className="space-y-4">
        {/* Highlight Permission */}
        <div className="p-4 rounded-lg border transition-all duration-200" style={{ 
          borderColor: reviewData.allowHighlight ? '#70c1b3' : '#e5e5e5',
          backgroundColor: reviewData.allowHighlight ? '#70c1b310' : '#FFFFFF'
        }}>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="allowHighlight"
              checked={reviewData.allowHighlight}
              onChange={(e) => updateReviewData({ allowHighlight: e.target.checked })}
              className="w-5 h-5 rounded mt-0.5 flex-shrink-0"
              style={{ accentColor: '#70c1b3' }}
            />
            <div className="flex-1">
              <label htmlFor="allowHighlight" className="block cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4" style={{ color: '#70c1b3' }} />
                  <span style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Hervorhebung in Empfehlungsmodulen
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#666' }}>
                  Deine Rezension darf in Empfehlungsmodulen auf coratiert hervorgehoben werden 
                  (z.B. "Das sagen unsere Leser:innen").
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Social Media Quotes */}
        <div className="p-4 rounded-lg border transition-all duration-200" style={{ 
          borderColor: reviewData.allowSocialQuotes ? '#247ba0' : '#e5e5e5',
          backgroundColor: reviewData.allowSocialQuotes ? '#247ba010' : '#FFFFFF'
        }}>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="allowSocialQuotes"
              checked={reviewData.allowSocialQuotes}
              onChange={(e) => updateReviewData({ allowSocialQuotes: e.target.checked })}
              className="w-5 h-5 rounded mt-0.5 flex-shrink-0"
              style={{ accentColor: '#247ba0' }}
            />
            <div className="flex-1">
              <label htmlFor="allowSocialQuotes" className="block cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Share2 className="w-4 h-4" style={{ color: '#247ba0' }} />
                  <span style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Zitate in Social Media
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#666' }}>
                  Zitate aus deiner Rezension dürfen anonymisiert oder mit deinem Vornamen 
                  in Social Media (Instagram, Facebook, etc.) verwendet werden.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Publisher Quotes */}
        <div className="p-4 rounded-lg border transition-all duration-200" style={{ 
          borderColor: reviewData.allowPublisherQuotes ? '#ffe066' : '#e5e5e5',
          backgroundColor: reviewData.allowPublisherQuotes ? '#ffe06610' : '#FFFFFF'
        }}>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="allowPublisherQuotes"
              checked={reviewData.allowPublisherQuotes}
              onChange={(e) => updateReviewData({ allowPublisherQuotes: e.target.checked })}
              className="w-5 h-5 rounded mt-0.5 flex-shrink-0"
              style={{ accentColor: '#ffe066' }}
            />
            <div className="flex-1">
              <label htmlFor="allowPublisherQuotes" className="block cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4" style={{ color: '#ffe066' }} />
                  <span style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Zitate für Verlagspartner
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#666' }}>
                  Zitate aus deiner Rezension dürfen anonymisiert mit Verlagen und Partnern 
                  geteilt werden (z.B. für Buchmarketing).
                </p>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <h4 className="text-sm mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Wie soll dein Name angezeigt werden?
        </h4>
        
        <div className="space-y-2">
          <div className="p-4 rounded-lg border transition-all duration-200 cursor-pointer" 
            onClick={() => updateReviewData({ displayName: 'firstname' })}
            style={{ 
              borderColor: reviewData.displayName === 'firstname' ? '#247ba0' : '#e5e5e5',
              backgroundColor: reviewData.displayName === 'firstname' ? '#247ba010' : '#FFFFFF'
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="displayName"
                checked={reviewData.displayName === 'firstname'}
                onChange={() => updateReviewData({ displayName: 'firstname' })}
                className="w-5 h-5"
                style={{ accentColor: '#247ba0' }}
              />
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: '#247ba0' }} />
                <span style={{ color: '#3A3A3A' }}>Mit meinem Vornamen anzeigen</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border transition-all duration-200 cursor-pointer" 
            onClick={() => updateReviewData({ displayName: 'anonymous' })}
            style={{ 
              borderColor: reviewData.displayName === 'anonymous' ? '#247ba0' : '#e5e5e5',
              backgroundColor: reviewData.displayName === 'anonymous' ? '#247ba010' : '#FFFFFF'
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="displayName"
                checked={reviewData.displayName === 'anonymous'}
                onChange={() => updateReviewData({ displayName: 'anonymous' })}
                className="w-5 h-5"
                style={{ accentColor: '#247ba0' }}
              />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: '#666' }} />
                <span style={{ color: '#3A3A3A' }}>Anonym anzeigen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f5f0' }}>
        <p className="text-xs" style={{ color: '#666' }}>
          💡 Du kannst diese Einstellungen jederzeit in deinem Profil ändern. 
          Deine Rezension wird niemals ohne deine Zustimmung kommerziell verwendet.
        </p>
      </div>
    </div>
  );
}
