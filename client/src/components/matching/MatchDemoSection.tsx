import { useState, useEffect } from 'react';
import { BookCard } from '../book/BookCard';
import { calculateBookMatch, getAllBooks, Book } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

/**
 * Demo-Sektion für Match-Badges
 * Zeigt Bücher mit berechneten Match-Prozentsätzen
 */
export function MatchDemoSection() {
  const { resolvedTheme } = useTheme();
  const [booksWithMatches, setBooksWithMatches] = useState<Array<Book & { matchPercentage?: number }>>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock User ID (in production würde dies aus Auth Context kommen)
  const mockUserId = 'demo-user-1';
  
  useEffect(() => {
    async function loadBooksWithMatches() {
      try {
        const books = await getAllBooks();
        
        // Berechne Match für jedes Buch
        const booksWithMatchData = await Promise.all(
          books.slice(0, 6).map(async (book) => {
            const matchResult = await calculateBookMatch(mockUserId, book.id);
            return {
              ...book,
              matchPercentage: matchResult.match
            };
          })
        );
        
        // Sortiere nach Match-Prozentsatz (höchste zuerst)
        booksWithMatchData.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
        
        setBooksWithMatches(booksWithMatchData);
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadBooksWithMatches();
  }, []);
  
  if (loading) {
    return (
      <div className="py-12 px-4" style={{ backgroundColor: resolvedTheme === 'dark' ? '#2a2a2a' : '#F7F4EF' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p style={{ color: resolvedTheme === 'dark' ? '#FFFFFF' : '#3A3A3A' }}>
            Berechne deine Match-Prozentsätze...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <section className="py-12 px-4" style={{ backgroundColor: resolvedTheme === 'dark' ? '#2a2a2a' : '#F7F4EF' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 
            className="text-3xl md:text-4xl mb-3"
            style={{ 
              fontFamily: 'Fjalla One',
              color: resolvedTheme === 'dark' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Deine persönlichen Empfehlungen
          </h2>
          <p 
            className="text-base md:text-lg max-w-2xl"
            style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
          >
            Basierend auf deinem Leseprofil haben wir diese Bücher für dich ausgewählt.
            Der Match-Prozentsatz zeigt, wie gut ein Buch zu deinen Vorlieben passt.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {booksWithMatches.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              matchPercentage={book.matchPercentage}
              cardBackgroundColor="transparent"
            />
          ))}
        </div>
        
        {/* Match-Legende */}
        <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
          <h3 
            className="text-sm mb-2"
            style={{ 
              fontFamily: 'Fjalla One',
              color: resolvedTheme === 'dark' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            So funktioniert der Match-Score:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs" style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#5a9690' }}></div>
              <span>75-100%: Sehr hoher Match (starke Übereinstimmung)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#A0CEC8' }}></div>
              <span>50-74%: Guter Match (gute Übereinstimmung)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F7F4EF', border: '1px solid #3A3A3A' }}></div>
              <span>0-49%: Niedriger Match (wenig Übereinstimmung)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}