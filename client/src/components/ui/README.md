# UI Core System - Architecture Standards

## 🚨 STOPP: ARCHITEKTUR-RICHTLINIE (KI-PFLICHTLEKTÜRE!)

**DIESE REGELN SIND NICHT VERHANDELBAR:**

1. **VERBOT: Inline-Styles für Typografie**
   - ❌ NIEMALS `style={{ fontSize: '...' }}`
   - ❌ NIEMALS `className="text-xs text-sm text-base"` (wird von globals.css überschrieben!)
   - ✅ IMMER `<Text variant="xs">` oder `<Heading variant="h3">`

2. **DIAGNOSE: Wenn die Schrift auf der Startseite zu groß ist**
   - ❌ NICHT die Schriftgröße in der Komponente "flicken"
   - ❌ NICHT `!important` verwenden
   - ✅ Prüfe, ob ein `.content-area` Div den Container umschließt
   - ✅ Entferne `.content-area` vom Parent-Element der Startseite

3. **LÖSUNG: Immer die UI-Komponenten verwenden**
   - ✅ Für Headers: `<Heading as="h3" variant="h6">` (semantisch h3, visuell h6)
   - ✅ Für Text: `<Text as="span" variant="xs">` (klein)
   - ✅ Für Text: `<Text as="span" variant="small">` (etwas größer)
   - ✅ Für Text: `<Text as="div" variant="body">` (Standard)

4. **ISOLATION: Der `text-base` Reset funktioniert**
   - ✅ Root-div mit `text-base` kappt Vererbung
   - ✅ Dann `<Text>` Komponenten verwenden
   - ✅ KEINE Tailwind `text-*` Klassen zusätzlich!

## 🎯 Die "Drei Wächter" des UI Systems

Diese drei Komponenten kontrollieren **alles**:

1. **`<Container>`** - Layout & Spacing
2. **`<Section>`** - Sektions-Wrapper mit Background
3. **`<Heading>` & `<Text>`** - Typography (aus `typography.tsx`)

## 📐 Typography Variants

### Heading Variants
- `h1` → `--fluid-h1` (30px - 48px)
- `h2` → `--fluid-h2` (24px - 30px)
- `h3` → `--fluid-h3` (20px - 24px)
- `h4` → `--fluid-h4` (18px - 20px)
- `h5` → `--fluid-h5` (16px - 18px)
- `h6` → `--fluid-h6` (14px - 16px)

### Text Variants
- `body` → `--fluid-body` (16px - 18px)
- `small` → `--fluid-body-small` (14px - 15px) - **FLACHER** ✅
- `xs` → `--fluid-body-xs` (12px - 13px) - **FLACHER** ✅
- `content` → `--fluid-body` (16px - 18px)

**Warum "FLACHER"?**
Die `xs` und `small` Varianten skalieren jetzt weniger stark mit der Viewport-Breite, um **stabilere Größen** auf verschiedenen Seiten zu gewährleisten.

## 🧹 Die "Entgiftung" der globals.css

### VOR dem Hausputz (❌ GIFTIG):
```css
h1 { 
  font-size: var(--fluid-h1);  /* ⚠️ Überschreibt ALLES! */
  font-family: var(--font-family-headline);
}

p {
  font-size: var(--fluid-body);  /* ⚠️ Überschreibt ALLES! */
  font-family: var(--font-family-sans);
}
```

### NACH dem Hausputz (✅ SAUBER):
```css
h1, h2, h3, h4, h5, h6 { 
  font-family: var(--font-family-headline);
  line-height: var(--line-height-snug);
  letter-spacing: 0.02em;
  color: var(--color-foreground);
  /* ⚠️ KEINE font-size mehr! Wird durch <Heading> gesteuert */
}

p {
  font-family: var(--font-family-sans);
  line-height: var(--line-height-relaxed);
  color: var(--color-foreground);
  /* ⚠️ KEINE font-size mehr! Wird durch <Text> gesteuert */
}
```

## 🎨 Verwendungsbeispiele

### CreatorHeader (Clean Sweep)
```tsx
<div className="w-full text-base leading-normal text-left">
  <Heading as="h3" variant="h6" className="text-blue">
    Creator Name
  </Heading>
  
  <Text as="span" variant="xs" className="font-semibold">
    Focus & Website
  </Text>
  
  <Text as="div" variant="small" className="line-clamp-3">
    Bio oder Beschreibung
  </Text>
</div>
```

### BookCard
```tsx
<Container maxWidth="7xl">
  <Section background="surface" padding="lg">
    <Heading as="h2" variant="h3">
      Buchtitel
    </Heading>
    <Text variant="small" color="muted">
      Autor
    </Text>
  </Section>
</Container>
```

## ⚠️ content-area Warnung

Die `.content-area` Klasse ist **NUR** für Long-Form Content (Blogposts, Artikel)!

**NIEMALS** UI-Komponenten wie `CreatorHeader`, `BookCard` etc. darin platzieren!

```css
/* ⚠️ Diese Klasse macht ALLE Texte 1.5x größer! */
.content-area p {
  font-size: var(--content-text-body);  /* 1.5rem = 24px! */
}
```

## 🔧 Migration Checklist

Für jede Komponente:

1. [ ] Alle `<span>`, `<p>`, `<div>` durch `<Text>` ersetzen
2. [ ] Alle `<h1>` bis `<h6>` durch `<Heading>` ersetzen
3. [ ] Alle `style={{ fontSize: ... }}` entfernen
4. [ ] Alle Tailwind `text-xs`, `text-sm` etc. entfernen
5. [ ] Root-div mit `text-base` Reset ausstatten
6. [ ] Testen: Komponente auf verschiedenen Seiten prüfen

## 📚 Weitere Ressourcen

- `/components/ui/typography.tsx` - Typography Komponenten
- `/components/ui/container.tsx` - Layout Container
- `/components/ui/section.tsx` - Section Wrapper
- `/styles/globals.css` - Fluid Typography System (entgiftet)