import { CuratorMatchmaking } from './homepage/CuratorMatchmaking';
import { useState } from 'react';
import { MoodSelector } from './matching/MoodSelector';
import { DailyRecommendations } from './matching/DailyRecommendations';
import { TasteQuiz } from './matching/TasteQuiz';
import { MostRecommended } from './matching/MostRecommended';
import { RecipientFinder } from './matching/RecipientFinder';

export function MatchingPage() {
  const [showMatchmaker, setShowMatchmaker] = useState(false);

  return (
    <div 
      className="gradient-bg"
    >
      {/* Header Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 
            className="mb-4" 
            style={{ 
              fontFamily: 'Fjalla One',
              color: '#3A3A3A',
              fontSize: '3rem',
              lineHeight: '1.2'
            }}
          >
            Finde deine perfekte Kurator*in
          </h1>
          <p 
            className="max-w-2xl mx-auto"
            style={{ 
              color: '#3A3A3A',
              fontSize: '1.125rem',
              lineHeight: '1.6'
            }}
          >
            Beantworte ein paar kurze Fragen und wir helfen dir, Kurator*innen zu finden, 
            die deinen Lesegeschmack perfekt treffen.
          </p>
        </div>
      </section>

      {/* 1. Mood Selector - Was suchst du heute? */}
      <MoodSelector onMoodSelect={(mood) => console.log('Selected mood:', mood)} />

      {/* 2. Daily Recommendations - Top-Empfehlungen des Tages */}
      <DailyRecommendations onViewAll={() => console.log('View all daily recommendations')} />

      {/* 3. Taste Quiz - Der Geschmackstest */}
      <TasteQuiz onComplete={(answers) => console.log('Quiz completed:', answers)} />

      {/* 4. Most Recommended - Die meistempfohlenen Bücher */}
      <MostRecommended onViewAll={() => console.log('View all most recommended')} />

      {/* 5. Recipient Finder - Ich suche etwas für... */}
      <RecipientFinder onRecipientSelect={(recipientId) => console.log('Selected recipient:', recipientId)} />

      {/* Curator Matchmaking Section */}
      <CuratorMatchmaking />
    </div>
  );
}