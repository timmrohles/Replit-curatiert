import { useState } from 'react';

interface MoodSelectorProps {
  onMoodSelect?: (mood: string) => void;
}

const moods = [
  { id: 'touching', label: 'Ein Buch, das mich berührt', emoji: '💝' },
  { id: 'thrilling', label: 'Etwas Spannendes für heute Abend', emoji: '⚡' },
  { id: 'feminist', label: 'Ein feministisches Highlight', emoji: '✊' },
  { id: 'queer', label: 'Ein queeres Must-read', emoji: '🌈' },
  { id: 'smart', label: 'Ein kluges Sachbuch', emoji: '🧠' },
  { id: 'light', label: 'Ein leichtes, warmes Buch', emoji: '☀️' },
  { id: 'trending', label: 'Etwas, das gerade alle lesen', emoji: '🔥' },
];

export function MoodSelector({ onMoodSelect }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodClick = (moodId: string) => {
    setSelectedMood(moodId);
    if (onMoodSelect) {
      onMoodSelect(moodId);
    }
  };

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
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
            Was suchst du heute?
          </h2>
          <p 
            className="max-w-2xl mx-auto"
            style={{
              fontSize: '1.125rem',
              color: '#3A3A3A',
              lineHeight: '1.6'
            }}
          >
            Finde in wenigen Sekunden Bücher, die zu deiner Stimmung oder deinem Anlass passen.
          </p>
        </div>

        {/* Mood Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleMoodClick(mood.id)}
              className="group relative px-6 py-6 md:py-8 rounded-lg border-2 transition-all duration-300 text-left"
              style={{
                backgroundColor: selectedMood === mood.id ? '#ffe066' : '#FFFFFF',
                borderColor: selectedMood === mood.id ? '#247ba0' : 'transparent',
                boxShadow: selectedMood === mood.id 
                  ? '0 8px 16px rgba(36, 123, 160, 0.2)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
              onMouseEnter={(e) => {
                if (selectedMood !== mood.id) {
                  e.currentTarget.style.borderColor = '#70c1b3';
                  e.currentTarget.style.backgroundColor = '#F5F5F0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMood !== mood.id) {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl md:text-3xl flex-shrink-0">
                  {mood.emoji}
                </span>
                <span 
                  className="text-base md:text-lg flex-1"
                  style={{
                    color: '#3A3A3A',
                    lineHeight: '1.4'
                  }}
                >
                  {mood.label}
                </span>
              </div>
              
              {/* Arrow indicator */}
              <div 
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: '#247ba0' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Regel-Dokumentation */}
        <div 
          className="mt-12 p-6 rounded-lg border-l-4 max-w-4xl mx-auto"
          style={{
            backgroundColor: '#F5F5F0',
            borderLeftColor: '#247ba0',
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
            📋 Logik-Regeln: "Was suchst du heute?"
          </h3>
          <div className="space-y-3 text-sm" style={{ color: '#3A3A3A', lineHeight: '1.6' }}>
            <div>
              <strong>Mood-Kategorien (Tag-Cluster):</strong>
              <ul className="list-disc ml-5 mt-1">
                <li><strong>spannend</strong> → Spannung, Thriller, Ermittler, Psychothriller</li>
                <li><strong>bewegt</strong> → Sozialkritik, Trauma, Identität, Coming-of-Age</li>
                <li><strong>queer</strong> → LGBTQ+, Queere Perspektiven, Gender</li>
                <li><strong>intellektuell</strong> → Essay, Philosophie, Politik, Wirtschaft</li>
                <li><strong>leicht</strong> → Feelgood, Kleinstadt, Humor, Coming-of-Age</li>
                <li><strong>viral</strong> → Bestseller, Trends, Saves↑, hohe CTR</li>
              </ul>
            </div>
            <div>
              <strong>Algorithmische Filterregeln:</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Nur Titel mit mind. einem passenden Tag-Cluster</li>
                <li>Sortierung: Kuratorische Präsenz + Saves (30 Tage) + CTR + Rezensionen (≥4★) + Kaufinteresse</li>
                <li><strong>Diversitätsregel:</strong> Max. 1 Buch/Autor, max. 1 Buch/Serie, Mischung Neu + Backlist</li>
              </ul>
            </div>
            <div>
              <strong>Kuratorischer Override:</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Bis zu 6 Titel pro Mood-Cluster können von Kurator:innen hart gesetzt werden</li>
                <li>Diese "Garantierten Highlights" werden immer vorne angezeigt</li>
                <li>Max. 40% der Gesamtliste → System bleibt menschlich & qualitativ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}