import { useState } from 'react';
import { ReviewData } from '../ReviewWizard';

interface WizardStep3Props {
  reviewData: ReviewData;
  updateReviewData: (updates: Partial<ReviewData>) => void;
}

export function WizardStep3_Text({ reviewData, updateReviewData }: WizardStep3Props) {
  const isShort = reviewData.reviewType === 'short';
  const maxHeadlineChars = 80;
  const maxTextCharsShort = 280; // Like a tweet
  const maxTextCharsDetailed = 2000;
  const maxTextChars = isShort ? maxTextCharsShort : maxTextCharsDetailed;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          {isShort ? 'Dein Eindruck in wenigen Worten' : 'Deine ausführliche Rezension'}
        </h3>
        <p className="text-sm" style={{ color: '#666' }}>
          {isShort 
            ? 'Teile deine Meinung in 1-2 Sätzen' 
            : 'Nimm dir Zeit für deine Gedanken zum Buch'}
        </p>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Überschrift
        </label>
        <input
          type="text"
          value={reviewData.headline}
          onChange={(e) => updateReviewData({ headline: e.target.value.slice(0, maxHeadlineChars) })}
          placeholder="z.B. Ein bewegendes Meisterwerk über Zeit und Erinnerung"
          className="w-full px-4 py-3 rounded-lg border transition-colors"
          style={{
            borderColor: reviewData.headline.length > 0 ? '#247ba0' : '#e5e5e5',
            backgroundColor: '#FFFFFF'
          }}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs" style={{ color: '#666' }}>
            Eine prägnante Zusammenfassung deiner Meinung
          </p>
          <p className="text-xs" style={{ color: reviewData.headline.length > maxHeadlineChars * 0.9 ? '#f25f5c' : '#666' }}>
            {reviewData.headline.length}/{maxHeadlineChars}
          </p>
        </div>
      </div>

      {/* Main Text */}
      <div>
        <label className="block text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          {isShort ? 'Dein Eindruck (1-2 Sätze)' : 'Deine Rezension'}
        </label>
        <textarea
          value={reviewData.text}
          onChange={(e) => updateReviewData({ text: e.target.value.slice(0, maxTextChars) })}
          placeholder={isShort 
            ? "z.B. Ernaux' autobiografische Chronik ist ein literarisches Meisterwerk. Sie verbindet persönliche Erinnerungen mit gesellschaftlichen Entwicklungen auf einzigartige Weise."
            : "Teile deine Gedanken zum Buch: Was hat dich beeindruckt? Welche Themen werden behandelt? Wie ist der Schreibstil? Was macht das Buch besonders?"}
          rows={isShort ? 4 : 12}
          className="w-full px-4 py-3 rounded-lg border transition-colors resize-none"
          style={{
            borderColor: reviewData.text.length > 0 ? '#247ba0' : '#e5e5e5',
            backgroundColor: '#FFFFFF'
          }}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs" style={{ color: '#666' }}>
            {isShort 
              ? 'Kurz und prägnant - wie ein Tweet' 
              : 'Ausführlich, aber nicht zu lang'}
          </p>
          <p className="text-xs" style={{ color: reviewData.text.length > maxTextChars * 0.9 ? '#f25f5c' : '#666' }}>
            {reviewData.text.length}/{maxTextChars}
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: '#ffe06610', border: '1px solid #ffe06630' }}>
        <p className="text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          💡 Tipps für eine gute Rezension
        </p>
        <ul className="text-xs space-y-1" style={{ color: '#666' }}>
          {isShort ? (
            <>
              <li>• Konzentriere dich auf den Kern deiner Meinung</li>
              <li>• Vermeide Spoiler</li>
              <li>• Sei authentisch und ehrlich</li>
            </>
          ) : (
            <>
              <li>• Schreib über deine persönlichen Eindrücke</li>
              <li>• Vermeide große Spoiler (kleine Plot-Details sind okay)</li>
              <li>• Erwähne Schreibstil, Charaktere, Themen</li>
              <li>• Für wen ist das Buch geeignet?</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
