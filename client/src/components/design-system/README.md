# Creator Dashboard Design System

Ein vollständiges, wiederverwendbares Design System für coratiert.de - die digitale kuratierte Buchhandlung.

## 🎨 Design-Prinzipien

- **Modern & Minimal**: Klare Hierarchien, editorial fokussiert
- **Community-First**: Für Creator und Kunden gleichermaßen
- **Responsive**: Desktop 1440px optimiert mit Mobile Support
- **Konsistent**: Alle UI-Elemente folgen der Brand Identity

## 📐 Design Tokens

### Farben (4-Farben-Palette)
- **Dark Text**: `#3A3A3A` - Hauptfarbe für alle Texte
- **Vibrant Coral**: `#f25f5c` - CTAs und Highlights
- **Royal Gold**: `#ffe066` - Akzentfarbe (sekundär)
- **Cerulean**: `#247ba0` - Links und Buttons
- **Tropical Teal**: `#70c1b3` - Hover-States

### Typography
- **Headlines**: Fjalla One (alle Überschriften, Buttons)
- **Body Text**: Inter (Regular für Fließtext)
- **No Font Size/Weight Classes**: Tailwind font-Klassen vermeiden, nur in /styles/globals.css definieren

### Spacing
- **Scale**: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px

### Radius
- **Small** (Inputs): 4px
- **Medium** (Buttons): 8px
- **Large** (Cards): 12px
- **XL** (Modals): 16px

## 🧱 Komponenten-Übersicht

### 1. Layout & Navigation
- **DSSidebar** - Sidebar-Navigation
- **DSTopNav** - Top-Navigation mit Suche
- **DSBreadcrumb** - Breadcrumb-Navigation
- **DSSectionHeader** - Section Headers mit Fjalla One ✨ NEU

### 2. Typography
- **DSTypography** - Heading & Text Komponenten

### 3. Buttons
- **DSButton** - Primary (weiß), Secondary, Tertiary, Destructive
- **Sizes**: Small, Medium, Large
- **Icons**: iconLeft, iconRight (Icons immer rechts bei CTAs)

### 4. Form Elements
- **DSInput** - Text Input (immer weiß)
- **DSTextarea** - Mehrzeilige Texteingabe
- **DSSearchInput** - Suche mit Icon
- **DSSelect** - Dropdown-Auswahl
- **DSDatePicker** - Datumswahl
- **DSCheckbox** - Checkbox
- **DSRadio** - Radio Buttons
- **DSToggle** - Toggle Switch
- **DSFormField** - Wrapper mit Label, Helper, Error

### 5. Data Display
- **DSTable** - Tabelle mit Sorting, Selection, Pagination
- **DSCard** - Karten-Container
- **DSBadge** - Status-Badges
- **DSTag** - Filter-Tags (schwarzer Hintergrund, weiße Schrift)
- **DSTopicTag** - Topic/Genre Tags mit Varianten ✨ NEU

### 6. Cards
- **DSCreatorCard** - Creator-Profil-Karte
- **DSBookCard** - Buchkarte (Format: Titel → Autor → Verlag, Jahr → Verfügbarkeit → Preis → Icons)
- **DSEventCard** - Event-Karte
- **DSStorefrontCard** - 3D Book-Style Storefront Card ✨ NEU
- **DSCuratedListCard** - Kuratierte Listen Card ✨ NEU
- **DSGenreCard** - Genre Category Card ✨ NEU

### 7. Carousel & Scroll
- **DSCarousel** - Universelle Carousel Komponente mit Pfeilen ✨ NEU

### 8. Feedback & States
- **DSModal** - Center Modal
- **DSDrawer** - Side Drawer
- **DSToast** - Toast-Benachrichtigungen
- **DSEmptyState** - Leerzustände
- **DSSkeleton** - Loading Skeletons
- **DSTooltip** - Tooltips
- **DSConfirmDialog** - Bestätigungs-Dialog

### 9. Micro-Components
- **DSPagination** - Pagination Controls
- **DSFilterBar** - Filter mit Chips

## 🚀 Usage

### Import CSS
```tsx
import './styles/design-system.css';
```

### Basic Example
```tsx
import { DSButton } from './components/design-system/DSButton';
import { DSFormField } from './components/design-system/DSFormField';
import { DSInput } from './components/design-system/DSInput';

function MyForm() {
  return (
    <form>
      <DSFormField 
        label="Buchtitel" 
        required 
        helperText="Vollständiger Titel des Buches"
      >
        <DSInput placeholder="z.B. Das Kapital" />
      </DSFormField>
      
      <DSButton variant="primary" type="submit">
        Speichern
      </DSButton>
    </form>
  );
}
```

### Tags Example
```tsx
import { DSTag } from './components/design-system/DSTag';

function FilterSection() {
  return (
    <div className="flex gap-2 flex-wrap">
      <DSTag label="Wirtschaft" />
      <DSTag label="Politik" selected />
      <DSTag label="Gesellschaft" removable onRemove={() => {}} />
      <DSTag label="Veröffentlicht" variant="success" />
    </div>
  );
}
```

**Tag Styling (NEU - Nov 2024):**
- Hintergrund: var(--creator-dark-bg) = #3A3A3A (Dunkles Grau)
- Text: Weiß (#FFFFFF)
- Border: Transparent (Hover: #A0CEC8)
- Konsistent auf allen Hintergründen

### Cards Example
```tsx
import { DSBookCard } from './components/design-system/DSBookCard';

function BookGrid() {
  return (
    <div className="grid grid-cols-4 gap-6">
      <DSBookCard
        cover="https://example.com/cover.jpg"
        title="Das Kapital im 21. Jahrhundert"
        author="Thomas Piketty"
        price="24,90 €"
        rating={5}
        onToggle={(added) => console.log('Added:', added)}
      />
    </div>
  );
}
```

### Modal Example
```tsx
import { DSModal } from './components/design-system/DSModal';
import { DSButton } from './components/design-system/DSButton';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <DSButton onClick={() => setOpen(true)}>
        Open Modal
      </DSButton>
      
      <DSModal
        open={open}
        onClose={() => setOpen(false)}
        title="Neue Buchreihe"
        subtitle="Erstellen Sie eine neue kuratierte Buchreihe"
        footer={
          <>
            <DSButton variant="secondary" onClick={() => setOpen(false)}>
              Abbrechen
            </DSButton>
            <DSButton variant="primary" onClick={handleSave}>
              Erstellen
            </DSButton>
          </>
        }
      >
        {/* Modal content */}
      </DSModal>
    </>
  );
}
```

## 📱 Responsive Behavior

Das Design System ist für verschiedene Bildschirmgrößen optimiert:
- **Desktop**: Vollständige Sidebar + alle Features
- **Tablet**: Collapsible Sidebar
- **Mobile**: Hamburger-Menü

## ♿ Accessibility

Alle Komponenten sind barrierefrei:
- Keyboard-Navigation (Tab, Enter, ESC)
- ARIA-Labels und Roles
- Focus States
- Screen Reader Support

## 🎯 Best Practices

1. **Konsistenz**: Verwenden Sie immer DS-Komponenten
2. **Spacing**: Nutzen Sie CSS-Variablen (`var(--ds-space-4)`)
3. **Colors**: Verwenden Sie Token (`var(--ds-brand-deep-blue)`)
4. **Typography**: Nutzen Sie DSHeading und DSText
5. **States**: Zeigen Sie Loading, Error und Empty States

## 📦 Komponenten-Struktur

```
/components/design-system/
├── DSButton.tsx              # Button-Komponente
├── DSInput.tsx               # Input-Komponente
├── DSTextarea.tsx            # Textarea-Komponente
├── DSSelect.tsx              # Select-Komponente
├── DSCheckbox.tsx            # Checkbox-Komponente
├── DSRadio.tsx               # Radio-Komponente
├── DSToggle.tsx              # Toggle-Komponente
├── DSBadge.tsx               # Badge-Komponente
├── DSCard.tsx                # Card-Komponente
├── DSTable.tsx               # Table-Komponente
├── DSTypography.tsx          # Heading & Text
├── DSSidebar.tsx             # Sidebar-Navigation
├── DSTopNav.tsx              # Top-Navigation
├── DSBreadcrumb.tsx          # Breadcrumb
├── DSFormField.tsx           # Form Field Wrapper
├── DSSearchInput.tsx         # Search Input
├── DSDatePicker.tsx          # Date Picker
├── DSTag.tsx                 # Tag/Chip
├── DSModal.tsx               # Modal Dialog
├── DSDrawer.tsx              # Side Drawer
├── DSToast.tsx               # Toast Notifications
├── DSEmptyState.tsx          # Empty State
├── DSSkeleton.tsx            # Loading Skeleton
├── DSTooltip.tsx             # Tooltip
├── DSConfirmDialog.tsx       # Confirm Dialog
├── DSPagination.tsx          # Pagination
├── DSCreatorCard.tsx         # Creator Card
├── DSBookCard.tsx            # Book Card
├── DSEventCard.tsx           # Event Card
├── DSFilterBar.tsx           # Filter Bar
└── DesignSystemShowcase.tsx  # Demo Page
```

## 🎨 Showcase

Um alle Komponenten zu sehen, öffnen Sie die `DesignSystemShowcase` Komponente:

```tsx
import { DesignSystemShowcase } from './components/design-system/DesignSystemShowcase';

// Zeigt alle Komponenten in verschiedenen Varianten
<DesignSystemShowcase />
```

## 📝 Lizenz

Internes Design System für Creator Dashboard

---

**Version**: 1.0.0  
**Erstellt**: November 2024  
**Letzte Aktualisierung**: November 2024