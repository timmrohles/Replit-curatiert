import { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface TasteQuizProps {
  onComplete?: (answers: QuizAnswers) => void;
}

interface QuizAnswers {
  mood?: string;
  tempo?: string;
  category?: string;
}

const moods = [
  { id: 'light', label: 'leicht' },
  { id: 'humorous', label: 'humorvoll' },
  { id: 'dark', label: 'düster' },
  { id: 'intellectual', label: 'intellektuell' },
  { id: 'romantic', label: 'romantisch' },
];

const tempos = [
  { id: 'calm', label: 'ruhig' },
  { id: 'medium', label: 'mittel' },
  { id: 'fast', label: 'rasant' },
];

const categories = [
  { id: 'fiction', label: 'Belletristik' },
  { id: 'nonfiction', label: 'Sachbuch' },
  { id: 'any', label: 'egal' },
];

export function TasteQuiz({ onComplete }: TasteQuizProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const handleMoodSelect = (mood: string) => {
    setAnswers({ ...answers, mood });
    setStep(2);
  };

  const handleTempoSelect = (tempo: string) => {
    setAnswers({ ...answers, tempo });
    setStep(3);
  };

  const handleCategorySelect = (category: string) => {
    const finalAnswers = { ...answers, category };
    setAnswers(finalAnswers);
    if (onComplete) {
      onComplete(finalAnswers);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAnswers({});
  };

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 
            className="mb-3"
            style={{
              fontFamily: 'Fjalla One',
              fontSize: '2.5rem',
              color: '#3A3A3A',
              lineHeight: '1.2'
            }}
          >
            Der Geschmackstest
          </h2>
          <p 
            className="max-w-2xl mx-auto"
            style={{
              fontSize: '1.125rem',
              color: '#3A3A3A',
              lineHeight: '1.6'
            }}
          >
            Beantworte 2–3 kurze Fragen und erhalte sofort 5 passende Buchempfehlungen.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: step >= num ? '80px' : '40px',
                backgroundColor: step >= num ? '#247ba0' : '#E0E0E0',
              }}
            />
          ))}
        </div>

        {/* Quiz Content */}
        <div className="bg-white rounded-lg p-8 md:p-12 shadow-lg">
          {/* Step 1: Mood */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 
                className="text-center mb-6"
                style={{
                  fontSize: '1.5rem',
                  color: '#3A3A3A',
                  fontFamily: 'Fjalla One',
                }}
              >
                Welche Stimmung suchst du?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className="px-6 py-4 rounded-lg border-2 transition-all duration-300"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E0E0E0',
                      color: '#3A3A3A',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#247ba0';
                      e.currentTarget.style.backgroundColor = '#F5F5F0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E0E0E0';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Tempo */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 
                className="text-center mb-6"
                style={{
                  fontSize: '1.5rem',
                  color: '#3A3A3A',
                  fontFamily: 'Fjalla One',
                }}
              >
                Welches Tempo magst du?
              </h3>
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                {tempos.map((tempo) => (
                  <button
                    key={tempo.id}
                    onClick={() => handleTempoSelect(tempo.id)}
                    className="px-6 py-4 rounded-lg border-2 transition-all duration-300"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E0E0E0',
                      color: '#3A3A3A',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#247ba0';
                      e.currentTarget.style.backgroundColor = '#F5F5F0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E0E0E0';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    {tempo.label}
                  </button>
                ))}
              </div>
              
              {/* Back Button */}
              <div className="text-center mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm underline"
                  style={{ color: '#247ba0' }}
                >
                  Zurück
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Category */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 
                className="text-center mb-6"
                style={{
                  fontSize: '1.5rem',
                  color: '#3A3A3A',
                  fontFamily: 'Fjalla One',
                }}
              >
                Welche Kategorie bevorzugst du?
              </h3>
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className="px-6 py-4 rounded-lg border-2 transition-all duration-300"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E0E0E0',
                      color: '#3A3A3A',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#247ba0';
                      e.currentTarget.style.backgroundColor = '#F5F5F0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E0E0E0';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              
              {/* Back Button */}
              <div className="text-center mt-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm underline"
                  style={{ color: '#247ba0' }}
                >
                  Zurück
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Button */}
        {step > 1 && (
          <div className="text-center mt-6">
            <Button
              onClick={handleReset}
              variant="ghost"
              className="gap-2"
              style={{ color: '#3A3A3A' }}
            >
              <RotateCcw className="w-4 h-4" />
              Von vorne beginnen
            </Button>
          </div>
        )}

        {/* Regel-Dokumentation */}
        <div 
          className="mt-12 p-6 rounded-lg border-l-4 max-w-4xl mx-auto"
          style={{
            backgroundColor: '#F5F5F0',
            borderLeftColor: '#ffe066',
          }}
        >
          <h3 
            className="mb-3"
            style={{
              fontFamily: 'Fjalla One',
              fontSize: '1.25rem',
              color: '#3A3A3A',
            }}
          >
            📋 Logik-Regeln: "Der Geschmackstest"
          </h3>
          <div className="space-y-3 text-sm" style={{ color: '#3A3A3A', lineHeight: '1.6' }}>
            <div>
              <strong>Stufe 1: Stimmung (Mood)</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Zuordnung über Tag-Cluster wie bei "Was suchst du heute?"</li>
              </ul>
            </div>
            <div>
              <strong>Stufe 2: Tempo (neues internes Metadatum)</strong>
              <ul className="list-disc ml-5 mt-1">
                <li><strong>ruhig:</strong> Psychologische Romane, Literarische Gegenwart</li>
                <li><strong>mittel:</strong> Cozy Romance, High Fantasy</li>
                <li><strong>rasant:</strong> Thriller, Politthriller</li>
                <li>Editorial Mapping oder heuristische Regeln (Genre → Tempo)</li>
                <li>Autor:innen oder Verlage können Werte selbst überschreiben</li>
              </ul>
            </div>
            <div>
              <strong>Stufe 3: Kategorie</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Belletristik / Sachbuch / egal</li>
                <li>Bei "egal" → beide kombiniert</li>
              </ul>
            </div>
            <div>
              <strong>Trefferberechnung (5 Bücher):</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Match: Tag-Cluster + Tempo + Kategorie</li>
                <li>Score nach: Kurationsvorkommen + Saves + Rezensionen + Klicktiefe</li>
                <li><strong>Diversitätsregel:</strong> Max. 1 Buch/Autor, min. 1 Backlist, min. 1 Debüt (wenn verfügbar)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}