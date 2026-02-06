# 🔍 BACKEND STRUKTUR-ANALYSE v1132 (04.02.2026)

## ❌ KRITISCHE PROBLEME (MUSS SOFORT GEFIXT WERDEN)

### 1. **index.tsx → index.ts umbenennen**

**Problem:**
```
/supabase/functions/api/index.tsx  ❌ FALSCH
```

**Warum kritisch:**
- Backend hat KEIN React/JSX
- Guidelines v1131 Changelog: "Alle 7 Route-Files korrekt als `.ts` angelegt (NICHT `.tsx` - Backend hat kein JSX)"
- `.tsx` Extension deutet auf Frontend-Code hin

**Fix:**
```
/supabase/functions/api/index.ts  ✅ RICHTIG
```

**Betroffen:**
- `/supabase/functions/api/deno.json` Zeile 13: `"entrypoint": "index.tsx"` → muss `"index.ts"` werden

---

### 2. **Fehlende Datei: user-modules.tsx**

**Problem:**
```typescript
// /supabase/functions/api/routes/user-modules.ts Zeile 28
import * as userModules from '../user-modules.tsx';  ❌ FILE NOT FOUND
```

**Directory Listing:**
```
/supabase/functions/api/
├── deno.json
├── index.tsx         ❌ (sollte .ts sein)
├── lib/
└── routes/
    └── user-modules.ts  (importiert user-modules.tsx)
```

**Datei existiert nicht!**

**Warum kritisch:**
- Import führt zu Runtime Error beim Server-Start
- Edge Function wird crashen: "Module not found: '../user-modules.tsx'"

**Fix-Optionen:**
1. **Datei erstellen** (falls Logic fehlt)
2. **Import entfernen** (falls Routes nicht benötigt werden)
3. **Prüfen ob Route registration in index.ts kommentiert ist**

---

### 3. **Route Prefixes noch nicht vollständig gefixt**

**Status (laut FIX_ALL_ROUTES_WINDOWS.md):**

✅ **GEFIXT (2):**
- `books.ts` - 2 routes
- `admin-auth.ts` - 3 routes

❌ **NOCH NICHT GEFIXT (12):**
- `awards.ts` - 14 routes
- `navigation_legacy.ts` - 3 routes
- `navigation_v2.ts` - 10 routes
- `site-config.ts` - 5 routes
- `tags.ts` - 4 routes
- `categories.ts` - 1 route
- `persons.ts` - 3 routes
- `curators.ts` - 4 routes
- `affiliates.ts` - mehrere routes
- `pages.ts` - unbekannt
- `sections.ts` - unbekannt
- `user-modules.ts` - unbekannt

**Problem:**
Routes definieren z.B. `app.post('/api/awards/...')` aber index.ts registriert sie direkt auf `app`.

**Ergebnis:**
- Frontend ruft: `https://.../functions/v1/api/awards/...`
- Supabase routet: → `/awards/...` (stripped `/functions/v1/api`)
- Route erwartet: `/api/awards/...`
- **404 Not Found!**

---

## 📁 DATEI-STRUKTUR (Ist-Zustand)

### Backend: `/supabase/functions/api/`

```
/supabase/functions/api/
├── deno.json                  ✅ .json (korrekt)
├── index.tsx                  ❌ MUSS .ts sein!
├── lib/
│   ├── auth.ts               ✅ .ts (korrekt)
│   ├── db.ts                 ✅ .ts (korrekt)
│   ├── logger.ts             ✅ .ts (korrekt)
│   └── slug-generator.ts     ✅ .ts (korrekt)
└── routes/
    ├── admin-auth.ts         ✅ .ts (korrekt, Prefixes gefixt)
    ├── affiliates.ts         ✅ .ts (korrekt, Prefixes TODO)
    ├── awards.ts             ✅ .ts (korrekt, Prefixes TODO)
    ├── books.ts              ✅ .ts (korrekt, Prefixes gefixt)
    ├── categories.ts         ✅ .ts (korrekt, Prefixes TODO)
    ├── curators.ts           ✅ .ts (korrekt, Prefixes TODO)
    ├── health.ts             ✅ .ts (korrekt, Prefixes OK?)
    ├── navigation_legacy.ts  ✅ .ts (korrekt, Prefixes TODO)
    ├── navigation_v2.ts      ✅ .ts (korrekt, Prefixes TODO)
    ├── pages.ts              ✅ .ts (korrekt, Prefixes TODO)
    ├── persons.ts            ✅ .ts (korrekt, Prefixes TODO)
    ├── sections.ts           ✅ .ts (korrekt, Prefixes TODO)
    ├── site-config.ts        ✅ .ts (korrekt, Prefixes TODO)
    ├── tags.ts               ✅ .ts (korrekt, Prefixes TODO)
    └── user-modules.ts       ✅ .ts (korrekt, aber IMPORT BROKEN!)
```

---

## 🔧 IMPORT-ANALYSE

### Alle Imports in index.tsx prüfen:

**Lib Imports (Zeile 30-32):**
```typescript
import { connectDB, queryDB } from './lib/db.ts';              ✅ Existiert
import { verifyAdminToken } from './lib/auth.ts';              ✅ Existiert
import { log } from './lib/logger.ts';                         ✅ Existiert
```

**Route Imports (muss ich checken):**
Lass mich index.tsx vollständig lesen...

---

## 🚨 GUIDELINE-VERSTÖSSE

### Guidelines 2.6 - Backend Logger Pattern:

**Regel:**
```typescript
// ✅ RICHTIG
import { log } from "../lib/logger.ts";
const moduleLog = log.withContext("module-name");

// ❌ FALSCH
import { log } from "../lib/logger.ts";
const log = log.withContext("module"); // Variable Shadowing!
```

**Muss in allen Route-Files geprüft werden!**

---

## 📋 NÄCHSTE SCHRITTE (Priorität)

### 🔴 **KRITISCH (vor Deploy):**

1. ✅ **index.tsx → index.ts umbenennen**
2. ✅ **deno.json: entrypoint von "index.tsx" → "index.ts" ändern**
3. ✅ **user-modules.tsx Problem lösen** (Datei fehlt!)
4. ✅ **Alle Route-Prefixes entfernen** (12 Files)

### 🟡 **WICHTIG (Code-Qualität):**

5. Logger-Pattern in allen Routes prüfen (Guidelines 2.6)
6. Alle Route-Registrations in index.ts prüfen
7. Imports auf tote Pfade prüfen

### 🟢 **NICE TO HAVE:**

8. Route-Dokumentation vervollständigen
9. Error-Handling konsistent machen
10. Type-Safety prüfen (any-Types entfernen)

---

## 🎯 FIX-STRATEGIE

**Option A: Manuell (sicher, langsam)**
1. Index umbenennen
2. Deno.json fixen
3. User-modules Problem lösen
4. Jede Route einzeln fixen (12 Files)

**Option B: Batch-Fix (schnell, riskant)**
1. Script alle Probleme auf einmal fixen lassen
2. Dann deployen & testen

**EMPFEHLUNG:**
- Kritische Probleme 1-3 SOFORT manuell fixen
- Route Prefixes per Script (weniger fehleranfällig)

---

## 📊 ZUSAMMENFASSUNG

**Backend-Struktur grundsätzlich GUT:**
- ✅ Modulare Struktur (routes/ + lib/)
- ✅ Alle Route-Files sind `.ts` (kein JSX)
- ✅ Lib-Files sind `.ts`
- ✅ Klare Separation of Concerns

**3 kritische Blocker:**
- ❌ index.tsx statt index.ts
- ❌ user-modules.tsx fehlt
- ❌ Route-Prefixes noch nicht vollständig entfernt

**Nach Fix:**
- Backend ist deployment-ready
- Alle Routes funktionieren
- Guidelines-konform
