import { useState, useEffect, useMemo } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { DSCarousel } from '../design-system/DSCarousel';
import { DSGenreCard } from '../design-system/DSGenreCard';

const API_BASE = '/api';

interface CategoryCard {
  id: number;
  name: string;
  color: string;
  link: string;
  image_url: string | null;
  display_order: number;
}

interface CategoryCardsGridProps {
  location: string;
}

export function CategoryCardsGrid({ location }: CategoryCardsGridProps) {
  const [cards, setCards] = useState<CategoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useSafeNavigate();

  useEffect(() => {
    loadCards();
  }, [location]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/category-cards?location=${encodeURIComponent(location)}`);
      if (!response.ok) {
        setCards([]);
        return;
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCards(data.data);
      } else {
        setCards([]);
      }
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (card: CategoryCard) => {
    if (card.link) {
      const target = card.link.startsWith('/') ? card.link : `/${card.link}`;
      navigate(target);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8" style={{ color: '#666666' }}>
        Lade Kategorien...
      </div>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <DSCarousel
      itemWidth={176}
      gap={12}
      arrowBg="rgba(0, 0, 0, 0.5)"
    >
      {cards.map((card) => (
        <DSGenreCard
          key={card.id}
          label={card.name}
          image={card.image_url || ''}
          onClick={() => handleCardClick(card)}
          size="medium"
        />
      ))}
    </DSCarousel>
  );
}
