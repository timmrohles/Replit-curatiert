import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Star } from 'lucide-react';
import { WizardStep0_Type } from './steps/WizardStep0_Type';
import { WizardStep1_Rating } from './steps/WizardStep1_Rating';
import { WizardStep2_MoodTarget } from './steps/WizardStep2_MoodTarget';
import { WizardStep3_Text } from './steps/WizardStep3_Text';
import { WizardStep4_ExternalLink } from './steps/WizardStep4_ExternalLink';
import { WizardStep5_Marketing } from './steps/WizardStep5_Marketing';
import { WizardStep6_Complete } from './steps/WizardStep6_Complete';
// Extended steps for detailed review
import { WizardStepExtended_Motives } from './steps/WizardStepExtended_Motives';
import { WizardStepExtended_Strengths } from './steps/WizardStepExtended_Strengths';

export interface ReviewData {
  // Step 0: Type
  reviewType: 'short' | 'detailed' | null;
  
  // Step 1: Rating
  rating: number;
  wouldRecommend: boolean | null;
  intensity?: number; // Only for detailed
  
  // Step 2: Mood & Target
  moods: string[];
  targetAudiences: string[];
  occasion?: string;
  
  // Step 3: Text
  headline: string;
  text: string;
  
  // Step 4: External Link
  externalUrl: string;
  externalTitle: string;
  externalPlatform: string;
  showExternalLink: boolean;
  
  // Step 5: Marketing
  allowHighlight: boolean;
  allowSocialQuotes: boolean;
  allowPublisherQuotes: boolean;
  displayName: 'firstname' | 'anonymous';
  
  // Extended for detailed review
  readingMotives?: string[];
  strengths?: string[];
  contentWarnings?: string[];
}

interface ReviewWizardProps {
  onClose: () => void;
  onComplete: (data: ReviewData) => void;
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
}

export function ReviewWizard({ 
  onClose, 
  onComplete,
  bookId,
  bookTitle = "Das ausgewählte Buch",
  bookAuthor = "Autor",
  bookCover
}: ReviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [reviewData, setReviewData] = useState<ReviewData>({
    reviewType: null,
    rating: 0,
    wouldRecommend: null,
    moods: [],
    targetAudiences: [],
    headline: '',
    text: '',
    externalUrl: '',
    externalTitle: '',
    externalPlatform: 'Blog',
    showExternalLink: false,
    allowHighlight: false,
    allowSocialQuotes: false,
    allowPublisherQuotes: false,
    displayName: 'firstname',
    readingMotives: [],
    strengths: [],
    contentWarnings: []
  });

  const updateReviewData = (updates: Partial<ReviewData>) => {
    setReviewData(prev => ({ ...prev, ...updates }));
  };

  // Determine steps based on review type
  const getSteps = () => {
    if (reviewData.reviewType === 'short') {
      return [
        { id: 0, title: 'Art wählen', component: WizardStep0_Type },
        { id: 1, title: 'Bewertung', component: WizardStep1_Rating },
        { id: 2, title: 'Stimmung', component: WizardStep2_MoodTarget },
        { id: 3, title: 'Text', component: WizardStep3_Text },
        { id: 4, title: 'Link', component: WizardStep4_ExternalLink },
        { id: 5, title: 'Freigabe', component: WizardStep5_Marketing },
        { id: 6, title: 'Fertig', component: WizardStep6_Complete }
      ];
    } else if (reviewData.reviewType === 'detailed') {
      return [
        { id: 0, title: 'Art wählen', component: WizardStep0_Type },
        { id: 1, title: 'Bewertung', component: WizardStep1_Rating },
        { id: 'motives', title: 'Lesemotive', component: WizardStepExtended_Motives },
        { id: 2, title: 'Stimmung', component: WizardStep2_MoodTarget },
        { id: 'strengths', title: 'Stärken', component: WizardStepExtended_Strengths },
        { id: 3, title: 'Text', component: WizardStep3_Text },
        { id: 4, title: 'Link', component: WizardStep4_ExternalLink },
        { id: 5, title: 'Freigabe', component: WizardStep5_Marketing },
        { id: 6, title: 'Fertig', component: WizardStep6_Complete }
      ];
    }
    // Initial step
    return [
      { id: 0, title: 'Art wählen', component: WizardStep0_Type }
    ];
  };

  const steps = getSteps();
  const CurrentStepComponent = steps[currentStep]?.component;

  const canGoNext = () => {
    // Step 0: Must select review type
    if (currentStep === 0) {
      return reviewData.reviewType !== null;
    }
    // Step 1: Must have rating
    if (steps[currentStep].id === 1) {
      return reviewData.rating > 0;
    }
    // Step 2: Must have at least one mood
    if (steps[currentStep].id === 2) {
      return reviewData.moods.length > 0;
    }
    // Step 3: Must have headline and text
    if (steps[currentStep].id === 3) {
      return reviewData.headline.trim().length > 0 && reviewData.text.trim().length > 0;
    }
    // Other steps can proceed
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 1) {
      // Complete
      onComplete(reviewData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              {steps[currentStep]?.title || 'Rezension schreiben'}
            </h2>
            <p className="text-sm" style={{ color: '#666' }}>
              {bookTitle} · {bookAuthor}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" style={{ color: '#3A3A3A' }} />
          </button>
        </div>

        {/* Progress Stepper */}
        {reviewData.reviewType && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 ${
                        index < currentStep 
                          ? 'bg-green-500' 
                          : index === currentStep 
                          ? 'bg-blue-500' 
                          : 'bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: index < currentStep ? '#70c1b3' : index === currentStep ? '#247ba0' : '#e5e5e5',
                        color: index <= currentStep ? '#FFFFFF' : '#999'
                      }}
                    >
                      {index < currentStep ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="hidden sm:inline">{index + 1}</span>
                      )}
                    </div>
                    <p className="text-xs mt-1 hidden md:block" style={{ color: index <= currentStep ? '#3A3A3A' : '#999' }}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className="h-0.5 flex-1 mx-2"
                      style={{ 
                        backgroundColor: index < currentStep ? '#70c1b3' : '#e5e5e5' 
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {CurrentStepComponent && (
            <CurrentStepComponent
              reviewData={reviewData}
              updateReviewData={updateReviewData}
              bookTitle={bookTitle}
              bookAuthor={bookAuthor}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: currentStep === 0 ? '#f5f5f0' : '#f5f5f0',
              color: '#3A3A3A'
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>

          <div className="text-sm" style={{ color: '#666' }}>
            {reviewData.reviewType && `Schritt ${currentStep + 1} von ${steps.length}`}
          </div>

          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canGoNext() ? '#247ba0' : '#e5e5e5',
              color: canGoNext() ? '#FFFFFF' : '#999'
            }}
          >
            {currentStep === steps.length - 1 ? 'Abschließen' : 'Weiter'}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
