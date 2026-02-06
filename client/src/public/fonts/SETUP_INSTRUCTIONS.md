# 📥 Font Setup - Anleitung

## ⚠️ WICHTIG: Fonts downloaden!

Die WOFF2-Dateien in `/public/fonts/` sind derzeit **Platzhalter** und müssen ersetzt werden.

---

## 🔧 Schritt-für-Schritt Anleitung

### 1. Download der Fonts von Bunny Fonts

**Öffnen Sie folgende URLs und laden Sie die WOFF2-Dateien herunter:**

```
https://fonts.bunny.net/fjalla-one/files/fjalla-one-latin-400-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-400-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-500-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-600-normal.woff2
https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff2
```

### 2. Umbenennen der Dateien

Nach dem Download benennen Sie die Dateien wie folgt um:

| Original (Bunny Fonts) | Umbenennen zu |
|------------------------|---------------|
| `fjalla-one-latin-400-normal.woff2` | `fjalla-one-v17-latin-regular.woff2` |
| `inter-latin-400-normal.woff2` | `inter-v13-latin-regular.woff2` |
| `inter-latin-500-normal.woff2` | `inter-v13-latin-500.woff2` |
| `inter-latin-600-normal.woff2` | `inter-v13-latin-600.woff2` |
| `inter-latin-700-normal.woff2` | `inter-v13-latin-700.woff2` |

### 3. Ersetzen der Placeholder-Dateien

Ersetzen Sie die vorhandenen Platzhalter-Dateien in `/public/fonts/` mit den heruntergeladenen und umbenannten WOFF2-Dateien.

### 4. Überprüfung

Nach dem Ersetzen sollten Sie 5 echte WOFF2-Dateien haben:

```
/public/fonts/
  ├── fjalla-one-v17-latin-regular.woff2  (~15-20 KB)
  ├── inter-v13-latin-regular.woff2       (~60-80 KB)
  ├── inter-v13-latin-500.woff2           (~60-80 KB)
  ├── inter-v13-latin-600.woff2           (~60-80 KB)
  └── inter-v13-latin-700.woff2           (~60-80 KB)
```

**Dateigröße prüfen:** Jede Datei sollte zwischen 15-80 KB groß sein (nicht nur ein paar Bytes!).

---

## 🧪 Test nach dem Setup

1. **Strg+Shift+R** (Hard Reload) im Browser
2. **DevTools → Network Tab → Filter: "font"**
3. Sie sollten 3-5 Requests zu `/fonts/*.woff2` sehen
4. Status: **200 OK**
5. Die Fonts sollten korrekt angezeigt werden

---

## ❓ Häufige Probleme

### Problem: "404 Not Found" für Fonts
- ✅ Lösung: Prüfen Sie, ob die Dateien korrekt umbenannt wurden
- ✅ Lösung: Stellen Sie sicher, dass die Dateien in `/public/fonts/` liegen (nicht in einem Unterordner!)

### Problem: Fonts sehen anders aus
- ✅ Lösung: Hard Reload mit Strg+Shift+R
- ✅ Lösung: Browser-Cache leeren

### Problem: Layout Shifts nach Font-Laden
- ✅ Sollte nicht passieren dank `font-display: optional` in globals.css
- ✅ Falls doch: Lighthouse-Test durchführen und CLS-Wert prüfen

---

## 🚀 Nächste Schritte

Nach erfolgreichem Setup:

1. **Lighthouse-Test durchführen** → Performance-Score sollte besser sein
2. **CLS-Wert prüfen** → Sollte deutlich unter 0.1 liegen (idealerweise 0)
3. **DSGVO-Check** → Keine Requests mehr zu `fonts.googleapis.com` oder `fonts.gstatic.com`

---

## 📖 Alternative: Google Fonts Helper

Falls Bunny Fonts nicht funktioniert, können Sie auch den **Google Fonts Helper** verwenden:

1. Gehen Sie zu: https://gwfh.mranftl.com/fonts
2. Wählen Sie "Fjalla One" und "Inter"
3. Wählen Sie die gewünschten Font-Weights
4. Laden Sie die Zip-Datei herunter
5. Extrahieren Sie die WOFF2-Dateien nach `/public/fonts/`
6. Benennen Sie die Dateien entsprechend der Tabelle in Schritt 2 um

**Wichtig:** Die CSS-Deklarationen in `/styles/globals.css` müssen ggf. angepasst werden, wenn die Dateinamen abweichen!

---

## ✅ Fertig!

Wenn alles funktioniert, sollten Sie:

- ✅ Fjalla One für Headlines sehen
- ✅ Inter für Body-Text sehen
- ✅ Keine Layout Shifts beim Laden
- ✅ Keine DSGVO-Probleme mehr
- ✅ Bessere Lighthouse-Scores

**Viel Erfolg!** 🎉
