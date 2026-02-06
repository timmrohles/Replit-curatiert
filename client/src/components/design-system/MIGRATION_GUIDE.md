# Design System Migration Guide

Anleitung zur Migration der coratiert.de Seiten auf die neuen Design System Komponenten.

## 📋 Übersicht

Folgende Komponenten wurden ins Design System überführt:

| Alt (Homepage) | Neu (Design System) | Status |
|---|---|---|
| `SectionHeader` | `DSSectionHeader` | ✅ Fertig |
| `StorefrontCard` | `DSStorefrontCard` | ✅ Fertig |
| `CuratedListCard` | `DSCuratedListCard` | ✅ Fertig |
| `TopicTag` | `DSTopicTag` | ✅ Fertig |
| Genre Card (inline) | `DSGenreCard` | ✅ Fertig |
| Carousel (inline) | `DSCarousel` | ✅ Fertig |

## 🔄 Migration Steps

### 1. SectionHeader → DSSectionHeader

**Vorher:**
```tsx
import { SectionHeader } from './SectionHeader';

<SectionHeader 
  title="Neuerscheinungen"
  subtitle="Die besten Bücher des Monats"
  align="left"
  backgroundColor="#F5F5F0"
/>
```

**Nachher:**
```tsx
import { DSSectionHeader } from '@/components/design-system';

<DSSectionHeader 
  title="Neuerscheinungen"
  subtitle="Die besten Bücher des Monats"
  align="left"
  backgroundColor="#F5F5F0"
/>
```

### 2. StorefrontCard → DSStorefrontCard

**Vorher:**
```tsx
import { StorefrontCard } from './StorefrontCard';

<StorefrontCard
  id="maurice-oekonomius"
  bannerImage="/banner.jpg"
  avatar="/avatar.jpg"
  name="Maurice Ökonomius"
  focus="Politik & Wirtschaft"
  bookCount={87}
  description="Moderne Geldtheorie..."
  bookCovers={[...]}
  onNavigate={() => navigate('/storefront/maurice')}
/>
```

**Nachher:**
```tsx
import { DSStorefrontCard } from '@/components/design-system';

<DSStorefrontCard
  id="maurice-oekonomius"
  bannerImage="/banner.jpg"
  avatar="/avatar.jpg"
  name="Maurice Ökonomius"
  focus="Politik & Wirtschaft"
  bookCount={87}
  description="Moderne Geldtheorie..."
  bookCovers={[...]}
  onNavigate={() => navigate('/storefront/maurice')}
  size="large" // NEU: 'small' | 'medium' | 'large'
/>
```

### 3. CuratedListCard → DSCuratedListCard

**Vorher:**
```tsx
import { CuratedListCard } from './CuratedListCard';

<CuratedListCard
  title="Frauen erzählen"
  reason="Starke weibliche Stimmen"
  curator="Lisa Weber"
  covers={['cover1.jpg', 'cover2.jpg', 'cover3.jpg']}
  onClick={() => navigate('/list/123')}
/>
```

**Nachher:**
```tsx
import { DSCuratedListCard } from '@/components/design-system';

<DSCuratedListCard
  title="Frauen erzählen"
  reason="Starke weibliche Stimmen"
  curator="Lisa Weber"
  covers={['cover1.jpg', 'cover2.jpg', 'cover3.jpg']}
  onClick={() => navigate('/list/123')}
  backgroundColor="transparent" // NEU: Optional
  textColor="#0B1F33" // NEU: Optional
/>
```

### 4. TopicTag → DSTopicTag

**Vorher:**
```tsx
import { TopicTag } from './TopicTag';

<TopicTag 
  label="Philosophie" 
  count={123}
  onClick={() => handleFilter('philosophie')}
/>
```

**Nachher:**
```tsx
import { DSTopicTag } from '@/components/design-system';

<DSTopicTag 
  label="Philosophie" 
  count={123}
  onClick={() => handleFilter('philosophie')}
  variant="coral" // NEU: 'default' | 'coral' | 'cerulean' | 'teal' | 'gold'
  size="medium" // NEU: 'small' | 'medium' | 'large'
  selected={false} // NEU: Boolean für aktiven Zustand
/>
```

### 5. Genre Cards → DSGenreCard

**Vorher (inline):**
```tsx
<div className="flex-shrink-0 w-32 md:w-44 snap-center group cursor-pointer">
  <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-3">
    <img src="image.jpg" alt="Hardboiled" className="..." />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
    <div className="absolute bottom-2 left-2 text-white">Hardboiled</div>
  </div>
</div>
```

**Nachher:**
```tsx
import { DSGenreCard } from '@/components/design-system';

<DSGenreCard
  label="Hardboiled"
  image="image.jpg"
  onClick={() => navigate('/genre/hardboiled')}
  size="medium" // 'small' | 'medium' | 'large'
/>
```

### 6. Carousels → DSCarousel

**Vorher (custom implementation):**
```tsx
const [scrollLeft, setScrollLeft] = useState(0);
const carouselRef = useRef<HTMLDivElement>(null);

const scroll = (direction: 'left' | 'right') => {
  if (!carouselRef.current) return;
  const scrollAmount = 280;
  carouselRef.current.scrollTo({ 
    left: carouselRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount),
    behavior: 'smooth' 
  });
};

<div className="relative">
  {scrollLeft > 0 && (
    <button onClick={() => scroll('left')}>
      <ChevronLeft />
    </button>
  )}
  
  <div ref={carouselRef} className="flex overflow-x-auto gap-4">
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>
  
  <button onClick={() => scroll('right')}>
    <ChevronRight />
  </button>
</div>
```

**Nachher:**
```tsx
import { DSCarousel } from '@/components/design-system';

<DSCarousel
  itemWidth={280}
  gap={16}
  showArrows={true}
  arrowColor="#FFFFFF"
  arrowBg="#247ba0"
  arrowHoverBg="#70c1b3"
>
  {items.map(item => <Card key={item.id} {...item} />)}
</DSCarousel>
```

## 📁 Dateien zu Migrieren

### Priorität 1 (Homepage)
- [x] `/components/homepage/SectionHeader.tsx` → Kann durch `DSSectionHeader` ersetzt werden
- [x] `/components/homepage/StorefrontCard.tsx` → Kann durch `DSStorefrontCard` ersetzt werden
- [x] `/components/homepage/CuratedListCard.tsx` → Kann durch `DSCuratedListCard` ersetzt werden
- [x] `/components/homepage/TopicTag.tsx` → Kann durch `DSTopicTag` ersetzt werden
- [ ] `/components/homepage/NewHomepage.tsx` → Imports aktualisieren

### Priorität 2 (Unterseiten)
- [ ] `/components/AllCuratorsPage.tsx`
- [ ] `/components/AllListsPage.tsx`
- [ ] `/components/EventsPage.tsx`
- [ ] `/components/ShopPage.tsx`
- [ ] `/components/BelletristikPage.tsx`
- [ ] `/components/RomaneErzaehlungenPage.tsx`

### Priorität 3 (Creator Dashboard)
- [ ] `/components/creator-dashboard/*` → Bereits mit DS-Komponenten

## 🎯 Migration Checklist

Für jede Seite/Komponente:

- [ ] Imports aktualisiert (von `./` zu `@/components/design-system`)
- [ ] Props überprüft (neue optionale Props hinzugefügt?)
- [ ] Styling überprüft (backgroundColor, textColor, etc.)
- [ ] Responsive Verhalten getestet (Mobile + Desktop)
- [ ] Accessibility überprüft (Keyboard Navigation, Focus States)
- [ ] Alt-Datei entfernt oder deprecated markiert

## 🚨 Breaking Changes

### DSSectionHeader
- ✅ Keine Breaking Changes - vollständig kompatibel
- ✨ Neu: `titleColor` und `subtitleColor` Props für manuelles Überschreiben

### DSStorefrontCard
- ✅ Keine Breaking Changes
- ✨ Neu: `size` Prop ('small' | 'medium' | 'large')

### DSCuratedListCard
- ✅ Keine Breaking Changes
- ✨ Neu: `backgroundColor` und `textColor` Props

### DSTopicTag
- ✅ Keine Breaking Changes
- ✨ Neu: `variant`, `size`, `selected` Props

### DSGenreCard
- ⚠️ Komplett neue Komponente - ersetzt inline Code

### DSCarousel
- ⚠️ Komplett neue Komponente - vereinfacht carousel Logic erheblich

## 💡 Best Practices

1. **Schrittweise Migration**: Migriere Seite für Seite, nicht alle auf einmal
2. **Testing**: Teste nach jeder Migration Desktop UND Mobile
3. **Props Documentation**: Nutze TypeScript IntelliSense für verfügbare Props
4. **Alte Dateien**: Markiere alte Komponenten als `@deprecated` bevor du sie löschst
5. **Konsistenz**: Verwende überall die gleichen `size` und `variant` Werte

## 🔗 Weitere Ressourcen

- [Design System README](/components/design-system/README.md)
- [Design System Showcase](/components/design-system/DesignSystemShowcase.tsx)
- [Fjalla One Font Guidelines](/styles/globals.css)

---

**Version**: 1.0.0  
**Erstellt**: Dezember 2024  
**Status**: In Arbeit 🚧
