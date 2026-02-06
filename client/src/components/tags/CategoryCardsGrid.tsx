import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useSafeNavigate } from '../utils/routing';
import { DSCarousel } from './design-system/DSCarousel';
import { DSGenreCard } from './design-system/DSGenreCard';

const API_BASE = '/api';

interface CategoryCard {
  id: string;
  name: string;
  color: string;
  link: string;
  image_url: string;
  display_order: number;
}

interface CategoryCardsGridProps {
  location: string; // 'homepage' or 'page:slug'
}

// Demo Fallback Cards (wenn Backend nicht verfügbar)
const DEMO_CARDS: CategoryCard[] = [
  {
    id: 'demo-krimis-thriller',
    name: 'Krimis & Thriller',
    color: '#FF5733',
    link: 'krimis-thriller',
    image_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800',
    display_order: 0
  },
  {
    id: 'demo-fantasy-scifi',
    name: 'Fantasy & Science Fiction',
    color: '#33FF57',
    link: 'fantasy-science-fiction',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    display_order: 1
  },
  {
    id: 'demo-liebesromane',
    name: 'Liebesromane',
    color: '#3357FF',
    link: 'liebesromane',
    image_url: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800',
    display_order: 2
  },
  {
    id: 'demo-belletristik',
    name: 'Belletristik',
    color: '#FF33A1',
    link: 'belletristik',
    image_url: 'https://images.unsplash.com/photo-1698954634383-eba274a1b1c7?w=800',
    display_order: 3
  },
  {
    id: 'demo-sachbuch',
    name: 'Sachbuch & Ratgeber',
    color: '#FFA133',
    link: 'sachbuch-ratgeber',
    image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    display_order: 4
  },
  {
    id: 'demo-historisch',
    name: 'Historische Romane',
    color: '#33FFA1',
    link: 'historische-romane',
    image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
    display_order: 5
  }
];

export function CategoryCardsGrid({ location }: CategoryCardsGridProps) {
  const [cards, setCards] = useState<CategoryCard[]>(DEMO_CARDS);
  const [loading, setLoading] = useState(true);
  const navigate = useSafeNavigate();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/category-cards`,
        {
          headers: {
          }
        }
      );
      
      if (!response.ok) {
        console.info('Using local category cards data');
        setCards(DEMO_CARDS);
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setCards(data.data);
      } else {
        console.info('Using local category cards data');
        setCards(DEMO_CARDS);
      }
    } catch (error) {
      // Silently use demo cards as fallback - this is expected behavior
      setCards(DEMO_CARDS);
    } finally {
      setLoading(false);
    }
  };

  const visibleCards = useMemo(() => {
    // ✅ SAFE: Defensive check for undefined cards
    if (!Array.isArray(cards)) {
      console.warn('⚠️ CategoryCardsGrid: cards is not an array:', cards);
      return [];
    }
    
    return cards
      .filter(card => 
        card.display_order >= 0 && 
        card.display_order < 6
      )
      .sort((a, b) => a.display_order - b.display_order);
  }, [cards, location]);

  const handleCardClick = (card: CategoryCard) => {
    if (card.link) {
      navigate(`/${card.link}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8" style={{ color: '#666666' }}>
        Lade Kategorien...
      </div>
    );
  }

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <DSCarousel
      itemWidth={176}
      gap={12}
      arrowSize="medium"
      arrowBg="rgba(0, 0, 0, 0.5)"
    >
      {visibleCards.map((card) => (
        <DSGenreCard
          key={card.id}
          label={card.name}
          image={card.image_url}
          onClick={() => handleCardClick(card)}
          size="medium"
        />
      ))}
    </DSCarousel>
  );
}