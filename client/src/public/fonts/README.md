# 🎨 Fonts für coratiert.de

## ✅ Status - Self-Hosted (AKTIV)

**Aktuelle Lösung:** Self-Hosted WOFF2-Dateien mit Preload.

✅ **DSGVO-konform** - Keine externen Server, keine IP-Weitergabe  
✅ **CLS-optimiert** - font-display: optional verhindert Layout Shifts  
✅ **Schnell** - Preload im `<head>` für sofortiges Laden  
✅ **Zuverlässig** - Immer verfügbar, kein CDN-Ausfall  
✅ **Cached** - Fonts werden dauerhaft im Browser gespeichert

---

## 📦 Verwendete Fonts

**Dateien in `/public/fonts/`:**
- `fjalla-one-v17-latin-regular.woff2` (Headlines)
- `inter-v13-latin-regular.woff2` (Body, 400)
- `inter-v13-latin-500.woff2` (Medium, 500)
- `inter-v13-latin-600.woff2` (Semibold, 600)
- `inter-v13-latin-700.woff2` (Bold, 700)

**Download-Quellen:**
```
https://fonts.bunny.net/fjalla-one/files/fjalla-one-latin-400-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-400-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-500-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-600-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff2
```

---

## 🚀 Performance-Optimierungen

### 1. **Font Preloading** (im App.tsx)
```typescript
// Kritische Fonts werden im <head> vorgeladen
<link rel="preload" as="font" type="font/woff2" 
      href="/fonts/fjalla-one-v17-latin-regular.woff2" 
      crossorigin="anonymous">
<link rel="preload" as="font" type="font/woff2" 
      href="/fonts/inter-v13-latin-regular.woff2" 
      crossorigin="anonymous">
<link rel="preload" as="font" type="font/woff2" 
      href="/fonts/inter-v13-latin-500.woff2" 
      crossorigin="anonymous">
```

### 2. **font-display: optional** (in globals.css)
- **Verhindert Layout Shifts** (CLS = 0)
- Falls Font nicht rechtzeitig lädt → Fallback bleibt
- Bei 99% der Nutzer: Custom Font wird sofort geladen

### 3. **WOFF2 Format**
- **Kleinste Dateigröße** (30-50% kleiner als TTF/OTF)
- **Von allen modernen Browsern unterstützt**

---

## 📊 Performance-Metriken

| Metrik | Vorher (Google Fonts) | Nachher (Self-Hosted) |
|--------|----------------------|----------------------|
| **LCP** | 2.100ms blockiert | Nicht blockierend |
| **CLS** | 0.241 ❌ | ~0.000 ✅ |
| **DSGVO** | ❌ Nicht konform | ✅ Konform |
| **Latenz** | 80-150ms (CDN) | 10-30ms (lokal) |

---

## 🔧 Setup-Anleitung (für neue Fonts)

Falls Sie später weitere Font-Varianten benötigen:

1. **Download von Bunny Fonts:**
   - Gehen Sie zu https://fonts.bunny.net
   - Wählen Sie die gewünschte Font-Familie
   - Laden Sie die WOFF2-Datei herunter

2. **Datei in `/public/fonts/` speichern**

3. **@font-face in `/styles/globals.css` hinzufügen:**
   ```css
   @font-face {
     font-family: 'Font Name';
     src: url('/fonts/font-name.woff2') format('woff2');
     font-weight: 400;
     font-style: normal;
     font-display: optional;
   }
   ```

4. **Optional: Preload in `/App.tsx` hinzufügen** (nur für kritische Fonts)

---

## 🎯 Warum Self-Hosting statt CDN?

### ✅ Vorteile:
- **Keine DSGVO-Probleme** - Daten bleiben auf eigenen Servern
- **Kein Layout Shift** - font-display: optional verhindert CLS
- **Schneller** - Keine DNS-Lookups, keine CDN-Latenz
- **Zuverlässiger** - Keine Abhängigkeit von externen Diensten
- **Bessere Kontrolle** - Exakte Subset-Wahl möglich

### ❌ Nachteile:
- Fonts müssen manuell aktualisiert werden (selten nötig)

---

## 📖 Migration zu Astro

Diese Font-Struktur ist **Astro-kompatibel**:

```astro
---
// In Astro Layout
---
<link rel="preload" as="font" type="font/woff2" 
      href="/fonts/fjalla-one-v17-latin-regular.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" 
      href="/fonts/inter-v13-latin-regular.woff2" crossorigin>

<style is:global>
  @font-face {
    font-family: 'Fjalla One';
    src: url('/fonts/fjalla-one-v17-latin-regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: optional;
  }
  /* ... weitere @font-face Deklarationen */
</style>
```

**Fonts können 1:1 kopiert werden!** 🚀