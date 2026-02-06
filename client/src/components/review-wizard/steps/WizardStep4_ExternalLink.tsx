import { ExternalLink, Info } from 'lucide-react';
import { ReviewData } from '../ReviewWizard';

interface WizardStep4Props {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

const PLATFORMS = [
  'Blog',
  'Substack',
  'Instagram',
  'YouTube',
  'TikTok',
  'Podcast',
  'Goodreads',
  'Sonstige'
];

export function WizardStep4_ExternalLink({ reviewData, updateReviewData }: WizardStep4Props) {
  const hasLink = reviewData.externalUrl.trim().length > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Blog oder Plattform verknüpfen (optional)
        </h3>
        <p className="text-sm" style={{ color: '#666' }}>
          Hast du einen Beitrag auf deinem Blog oder einer anderen Plattform? Verlinke ihn hier.
        </p>
      </div>

      {/* Info Box */}
      <div className="flex gap-3 p-4 rounded-lg" style={{ backgroundColor: '#247ba010', border: '1px solid #247ba030' }}>
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#247ba0' }} />
        <div className="text-sm" style={{ color: '#3A3A3A' }}>
          <p className="mb-2">
            Wenn du bereits eine Rezension auf deinem Blog, Newsletter oder Social Media veröffentlicht hast, 
            kannst du sie hier verknüpfen.
          </p>
          <p className="text-xs" style={{ color: '#666' }}>
            Wir prüfen externe Links stichprobenartig. Bitte verlinke nur eigene Inhalte oder solche, 
            für die du die Rechte hast.
          </p>
        </div>
      </div>

      {/* URL Input */}
      <div>
        <label className="block text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          URL zum Beitrag
        </label>
        <div className="relative">
          <input
            type="url"
            value={reviewData.externalUrl}
            onChange={(e) => updateReviewData({ externalUrl: e.target.value })}
            placeholder="https://meinblog.de/meine-rezension"
            className="w-full px-4 py-3 pl-10 rounded-lg border transition-colors"
            style={{
              borderColor: hasLink ? '#247ba0' : '#e5e5e5',
              backgroundColor: '#FFFFFF'
            }}
          />
          <ExternalLink 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
            style={{ color: hasLink ? '#247ba0' : '#999' }}
          />
        </div>
      </div>

      {/* Title Input */}
      {hasLink && (
        <div>
          <label className="block text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Titel des Beitrags (optional)
          </label>
          <input
            type="text"
            value={reviewData.externalTitle}
            onChange={(e) => updateReviewData({ externalTitle: e.target.value })}
            placeholder="z.B. Meine Gedanken zu 'Die Jahre'"
            className="w-full px-4 py-3 rounded-lg border transition-colors"
            style={{
              borderColor: reviewData.externalTitle.length > 0 ? '#247ba0' : '#e5e5e5',
              backgroundColor: '#FFFFFF'
            }}
          />
        </div>
      )}

      {/* Platform Selection */}
      {hasLink && (
        <div>
          <label className="block text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Plattform
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const isSelected = reviewData.externalPlatform === platform;
              return (
                <button
                  key={platform}
                  onClick={() => updateReviewData({ externalPlatform: platform })}
                  className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? '#247ba0' : '#f5f5f0',
                    color: isSelected ? '#FFFFFF' : '#3A3A3A',
                    border: `1px solid ${isSelected ? '#247ba0' : 'transparent'}`
                  }}
                >
                  {platform}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Show Link Toggle */}
      {hasLink && (
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#f5f5f0' }}>
          <input
            type="checkbox"
            id="showExternalLink"
            checked={reviewData.showExternalLink}
            onChange={(e) => updateReviewData({ showExternalLink: e.target.checked })}
            className="w-5 h-5 rounded"
            style={{ accentColor: '#247ba0' }}
          />
          <label htmlFor="showExternalLink" className="text-sm cursor-pointer" style={{ color: '#3A3A3A' }}>
            Link in meiner Rezension auf coratiert anzeigen
          </label>
        </div>
      )}

      {/* Skip Option */}
      {!hasLink && (
        <div className="text-center pt-4">
          <p className="text-sm" style={{ color: '#666' }}>
            Kein Problem! Du kannst diesen Schritt überspringen und direkt fortfahren.
          </p>
        </div>
      )}
    </div>
  );
}
