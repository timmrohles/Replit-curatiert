# CORATIERT — Single Source of Truth (SSoT)
**Dateiort:** /guidelines/Guidelines.md  
**Gültig ab:** 31. Januar 2026  
**Ziel:** Diese Datei ist das **verbindliche Regelwerk** für alle Änderungen durch Menschen **und** Figma Make AI.  
**Wichtig:** Zusätzlich gilt **immer** der DB-Vertrag: `/NEON_SCHEMA_READER.md` (Root).

---

## 0) Verbindlichkeit & Reihenfolge (Pflichtlektüre)
Wenn du **irgendetwas** an Code/DB/Struktur änderst, gilt:

1) **Diese Datei lesen**: `/guidelines/Guidelines.md`  
2) **DB/Neon anfassen?** Dann **zusätzlich**: `/NEON_SCHEMA_READER.md`  
3) **Wenn etwas unklar ist:** **Nicht raten.** Änderungen so klein wie möglich halten und in der UI/Logs so instrumentieren, dass Fehler sichtbar werden.

> **Regel:** Wenn etwas im Code dem widerspricht, was in diesem Dokument steht, ist **der Code falsch**.

---

## 1) Projekt-Snapshot (kurz, operativ)
**Produkt:** coratiert — kuratierte Bücher- & Kulturplattform (keine Buchhandlung), mit Admin/Creator Backend.  
**Frontend:** React SPA (Figma Make published)  
**Backend:** Supabase (Edge Functions) + Neon (Postgres)  
**Deployment:**  
- **Figma Make publish** deployt **nur** das Frontend (Browser-Code).  
- Supabase Edge Functions werden **separat** deployed (CLI/Dashboard).  

**Kernprinzip:** Build-Stabilität hat Vorrang vor „nice UX“ (z.B. Drag&Drop nur, wenn Build safe).

---

## 2) Codebase-Regeln (konkret, nicht diskutierbar)

**⚠️ KRITISCHSTER FEHLER - DEPLOYMENT-NAME (MUST READ!):**

**EDGE FUNCTION ORDNER:**
- ✅ **KORREKTER Ordner (PRODUCTION):** `/supabase/functions/api/`
- ❌ **VERALTET (Legacy):** `/supabase/functions/make-server-6e4a36b4/` (wird nicht mehr verwendet)
- ❌ **FALSCHER Ordner:** `/supabase/functions/make-server-62c4b066/` (NIEMALS verwenden!)

**DEPLOYMENT-COMMAND:**
```bash
# ✅ RICHTIG (PRODUCTION):
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh

# ❌ VERALTET (Legacy - nicht mehr verwenden!):
supabase functions deploy make-server-6e4a36b4

# ❌ FALSCH (erstellt falschen Server!):
supabase functions deploy make-server-62c4b066
```

**WARUM DAS KRITISCH IST:**
- Falscher Deployment-Name erstellt eine **NEUE** (leere) Edge Function
- Führt zu "Name and slug are required" Errors (weil Requests ins Leere gehen)
- Schwer zu debuggen, weil Requests scheinbar "funktionieren"
- **MUSS manuell im Supabase Dashboard gelöscht werden**

**DEPLOY-REGEL:**
- Vor jedem Deploy: Prüfe den Ordner-Namen in `/supabase/functions/`
- Nach jedem Deploy: Prüfe im Supabase Dashboard, dass nur `api` existiert
- Wenn falscher Server erscheint: **SOFORT LÖSCHEN** im Dashboard

**MIGRATION HISTORY (v1126 → v1135):**
- **ALTE Struktur (bis v1126):** `/supabase/functions/make-server-6e4a36b4/` mit eigener `deno.json`
- **NEUE Struktur (ab v1135):** `/supabase/functions/api/` - Production-ready modular setup
- Die alte Function kann gelöscht werden nachdem `api` erfolgreich deployed ist

**Struktur (ab v1135):**
```
/supabase/functions/
├── server/               # Development (mit dev tasks) - OPTIONAL
│   ├── index.tsx        # Source Code (Legacy)
│   └── deno.json        # Dev Config (mit "tasks")
└── api/                  # ✅ PRODUCTION Edge Function
    ├── index.ts         # Main Entry (NOT .tsx!)
    ├── deno.json        # Deploy Config
    ├── lib/             # Utilities (db, logger, auth, etc.)
    └── routes/          # Route Modules (< 300 Zeilen each)
```

---

### 2.1 Keine „Zombie“-Dateien / kein Wildwuchs
Figma Make neigt dazu, Test-/Debug-Dateien liegen zu lassen. Das ist **Build-Risiko**.

**Erlaubte Orte:**
- `/components/**`
- `/pages/**`
- `/utils/**`
- `/config/**`
- `/hooks/**`
- `/supabase/functions/**` (Backend, **nicht** Teil Figma-Publish)

**Verboten:**
- ad-hoc `*_test.tsx`, `*_debug.tsx`, `Old/`, `Backup/` im Root oder quer im Projekt  
- Dubletten wie `Component.tsx` + `Component_v2.tsx` **ohne** klare Deps/Exports

**Wenn v2 nötig ist:**  
- **Nur wenn** v1 produktiv weiter genutzt wird.  
- Dann muss es **einen einzigen** Import-Pfad geben (siehe 2.4).

### 2.2 Import-Regeln (Build-Killer vermeiden)

**Router:** Im Frontend **nur** `react-router-dom` verwenden. Niemals `react-router` direkt importieren.  
✅ `import { useNavigate } from 'react-router-dom'`  
❌ `import { useNavigate } from 'react-router'`

**WARUM DAS KRITISCH IST (Bundle-Graph Poisoning):**
- `react-router` ist die Core Library (Low-Level)
- `react-router-dom` ist der Browser Wrapper (High-Level, enthält react-router)
- Gemischte Imports führen zu **esm.sh dependency resolution failures**
- **App.tsx ist besonders kritisch**: Ein falscher Import dort "vergiftet" den gesamten Bundle-Graph
- Führt zu Publishing-Failures in Figma Make / esm.sh CDN

**Faustregel:** `react-router-dom` enthält ALLE Exports von `react-router`. Immer `-dom` verwenden.

**React Hooks & Lucide Icons:**
Wenn du React Hooks (`useState`, `useRef`, `useEffect`, `memo`, etc.) oder Lucide Icons (`Share2`, `ArrowRight`, etc.) nutzt, **MUSST** du sie explizit importieren:

✅ **RICHTIG:**
```tsx
import { useState, useRef, useEffect, memo } from 'react';
import { Share2, ArrowRight, Heart } from 'lucide-react';
```

❌ **FALSCH:**
```tsx
// Hooks/Icons werden benutzt, aber nicht importiert
export function MyComponent() {
  const [state, setState] = useState(0); // ❌ useState nicht importiert!
  return <Share2 />; // ❌ Share2 nicht importiert!
}
```

**WARUM DAS KRITISCH IST:**
- Führt zu Runtime Errors: "X is not defined"
- TypeScript erkennt es nicht immer (besonders bei Copy/Paste)
- Schwer zu debuggen in Production
- Figma Make AI vergisst oft Imports beim Code-Generieren

**Häufig vergessene Imports:**
- React: `useState`, `useRef`, `useEffect`, `useMemo`, `useCallback`, `memo`
- Lucide: `Share2`, `ArrowRight`, `ChevronLeft`, `ChevronRight`, `X`, `Check`

### 2.3 Keine schwergewichtigen Build-Risiken ohne Not
Ein reales Problem war: **react-dnd** (und DndProvider/Backend) → Build/Bundle instabil.

**Regel (Frontend):**
- Kein `react-dnd`, kein `react-dnd-html5-backend` im Frontend, solange Figma Make Build instabil ist.
- Reordering per **Up/Down Buttons** ist Standard.

### 2.4 „Single Import Surface" für kritische Module

**Aktuelle Canonical Imports:**
- API-Base: `import { API_BASE_URL } from '/config/apiClient'`
- Public Key: `import { publicAnonKey } from '/utils/supabase/info'`
- Routing helpers: `import { useSafeNavigate } from '/utils/routing'`
- **API Functions: `import { getAllBooks, ... } from '/utils/api'`** ← NEU

**Backend Edge Function (KRITISCH!):**
- **✅ PRODUCTION Edge Function:** `api`
- **❌ DEPRECATED (nicht verwenden!):** `make-server-6e4a36b4` (Legacy/Provisioning)
- **✅ BASE URL Pattern:** `https://${projectId}.supabase.co/functions/v1/api`
- **MIGRATION (v1130 - 03.02.2026):**
  - ALT: `/functions/v1/make-server-6e4a36b4` → triggered Auto-Provisioning, instabil
  - NEU: `/functions/v1/api` → Production-stable, multi-file modular setup
- **WARUM DAS KRITISCH IST:**
  - Alte Function triggered Auto-Deploy/Provisioning-Workflows bei Tests
  - Führt zu Deploy-Instabilität und Race Conditions
  - MUSS in `/config/apiClient.ts` korrekt konfiguriert sein
  - AI-Assistenten dürfen KEINE Files mehr in `/supabase/functions/make-server-6e4a36b4/` schreiben

**API-Module-Struktur:**
- `/utils/api/` ist in 21 thematische Module aufgeteilt
- **NIEMALS** direkt aus Sub-Modulen importieren (`/utils/api/books.ts`)
- **IMMER** über den zentralen Index: `import { ... } from '/utils/api'`
- Siehe `/utils/api/README.md` für Modul-Struktur

>
 **Learning (31.01.2026):** Wir haben `/utils/api.ts` (2500+ Zeilen) in 21 Module 
> aufgeteilt. Der zentrale Index garantiert Backwards Compatibility.

> Wenn Figma neue Datei-Namen erzeugt (z.B. `_v2`), muss es **einen** re-export geben, so dass alte Imports nicht brechen.

### 2.5 TypeScript-Regeln (Type Safety ist Build-Qualität)

**Verbot von `any`-Types:**

TypeScript `any` deaktiviert die komplette Type-Sicherheit und führt zu Runtime-Fehlern.

❌ **VERBOTEN:**
```typescript
const data: any = await fetch(...);
function process(input: any) { ... }
const items: any[] = [];
```

✅ **RICHTIG:**
```typescript
interface ApiResponse { ... }
const data: ApiResponse = await fetch(...);

function process(input: Book | Person) { ... }

const items: Book[] = [];
```

**Erlaubte Ausnahmen (mit Begründung):**
1. **Temporärer Cast mit TODO:**
   ```typescript
   // TODO: Add proper type for legacy API response
   const data = response as any;
   ```

2. **Externe Libraries ohne Types:**
   ```typescript
   // @ts-ignore - react-slick has incomplete type definitions
   import Slider from 'react-slick';
   ```

3. **Type Assertions (wenn notwendig):**
   ```typescript
   const config = JSON.parse(str) as SectionConfig;
   ```

**WARUM DAS KRITISCH IST:**
- `any` macht TypeScript-Checks nutzlos
- Fehler werden erst zur Runtime sichtbar (wie fehlende Imports)
- Schwer zu debuggen in Production
- Verhindert IDE Auto-Complete und Refactoring-Support

**Pre-Publish-Check:** Siehe Abschnitt 3.1, Punkt 7

### 2.6 Backend Logger-Pattern (Edge Function Stabilität)

**Problem:**
Inkonsistente Logger-Nutzung in Backend-Code führt zu Runtime-Crashes in Supabase Edge Functions:
- Worker boot errors: `"does not provide an export named 'logger'"`
- TDZ errors: `"Cannot access 'log' before initialization"`

**❌ VERBOTEN:**
```typescript
// FALSCH - log ist keine Funktion!
import { log } from "../lib/logger.ts";
const moduleLog = log("module-name"); // ❌ TypeError!

// FALSCH - Variable shadowing
import { log } from "../lib/logger.ts";
const log = log.withContext("module"); // ❌ TDZ!

// FALSCH - Nicht-existierender Export
import { logger } from "../lib/logger.ts"; // ❌ bis v1132
const ctx = logger("module"); // ❌ logger ist kein Function!
```

**✅ RICHTIG:**
```typescript
// KORREKT - log.withContext() Pattern
import { log } from "../lib/logger.ts";
const moduleLog = log.withContext("module-name");

moduleLog.info("Started processing");
moduleLog.error("Failed:", error);

// ALTERNATIV - logger als Alias (ab v1132)
import { logger } from "../lib/logger.ts";
const ctx = logger.withContext("module");
ctx.info("Started");
```

**Exports in `/lib/logger.ts`:**
- `log` - Kanonische Logger-Instanz (bevorzugt)
- `logger` - Alias für Generator-Kompatibilität (ab v1132)

**WICHTIG für Figma Make AI:**
- Niemals `log(...)` als Function Call verwenden
- Niemals Variablen mit gleichem Namen wie Imports definieren
- Immer `.withContext()` für modul-spezifisches Logging

**WARUM DAS KRITISCH IST:**
- Edge Functions crashen beim Boot (503 Errors)
- Schwer zu debuggen (Stack Traces zeigen nicht immer den wahren Grund)
- Führt zu Production Downtime

---

## 3) Build-Stabilität: Pflicht-Checkliste vor jedem Figma-Publish
**Ziel:** Fehler früh finden (nicht erst wenn Browser abstürzt).

### 3.1 Schnelltest (5 Minuten)
1. **Globale Suche:** `from 'react-router'` → muss **0** Treffer geben.  
2. **Globale Suche:** `react-dnd` → muss **0** Treffer geben (Frontend).  
3. **Globale Suche:** `../../utils/apiConfig` → darf nicht existieren (canonical ist `/config/apiClient`).  
4. **React Hooks Import-Check:**  
   - Suche nach `useMemo\(` → alle Dateien müssen `useMemo` aus `'react'` importieren  
   - Suche nach `useCallback\(` → alle Dateien müssen `useCallback` aus `'react'` importieren  
   - Suche nach `memo\(` → alle Dateien müssen `memo` aus `'react'` importieren  
   - **Pattern:** Wenn Hook verwendet wird, MUSS er importiert sein: `import { useState, useMemo, ... } from 'react'`
5. **Lucide Icons Import-Check:**  
   - Suche nach `<Share2` → alle Dateien müssen `Share2` aus `'lucide-react'` importieren  
   - Suche nach `<ArrowRight` → alle Dateien müssen `ArrowRight` aus `'lucide-react'` importieren  
   - **Pattern:** Wenn Icon verwendet wird, MUSS es importiert sein: `import { Share2, ArrowRight, ... } from 'lucide-react'`
6. **Datei-Existenz prüfen:** Alle Imports in `pages/admin/ContentManager.tsx` und deren direkte Imports.
7. **TypeScript Safety Check:**  
   - Suche nach `: any` → sollte minimiert sein (siehe 2.5 für erlaubte Ausnahmen)  
   - Suche nach `as any` → muss TODO-Kommentar oder Begründung haben  
   - **Ziel:** Explizite Types statt `any`, um Runtime-Fehler zu vermeiden

**Häufigste Runtime-Fehler:** `useMemo is not defined`, `Share2 is not defined` → immer fehlende Imports!

### 3.2 Wenn Publishing fehlschlägt (Build-Problem, nicht Runtime)
**Symptom:** App kann laufen, aber Figma Make „Publish“ bricht ab.  
**Standard-Ursache:** Import auf nicht existierende Datei / Pfad-Mismatch / bundling-heavy dependency.

**Debug-Workflow (binary search):**
1. In `ContentManager.tsx` problematische Bereiche **temporär** auskommentieren (z.B. Tab-Komponenten).  
2. Publish testen.  
3. Schrittweise wieder einkommentieren, bis es bricht.  
4. In der zuletzt aktivierten Komponente: **Top-Level Imports** prüfen.  
   - Nicht existierende Dateien  
   - falsche Pfade (`../` vs `./`)  
   - falsche Dateinamen (`_v2` etc.)

**Hard Rule:** Keine neuen Features hinzufügen, solange Publish broken ist.

### 3.3 Browser-Crash beim Build
Wenn der Browser beim Build crasht, ist das oft:
- Bundle zu groß
- zu viele große Dateien in einem Chunk
- heavy libs / überladene Admin Views

**Gegenmaßnahmen (sofort):**
- Große Dateien splitten (siehe 4.2)  
- Admin Tabs lazy load **nur**, wenn alle Import-Pfade stabil sind  
- Keine massiven UI-Libraries zusätzlich einführen

---

## 4) Struktur & Refactoring-Prinzipien

### 4.1 „Small files win“
**Richtwerte:**
- Komponenten: < 250–350 Zeilen
- Utilities: < 300–500 Zeilen
- Alles darüber: aufteilen nach Verantwortlichkeiten

### 4.2 „Monster-Files“: Wie wir sie sauber zerlegen
Wenn eine Datei zu groß wird (z.B. 2500+ Zeilen):
- zuerst in thematische Module extrahieren (CRUD, helpers, business logic)
- **danach** eine zentrale Export-Datei anbieten (Index), damit Imports stabil bleiben

**Wichtig:** Vor dem Löschen alter Dateien immer sicherstellen:
- Es gibt **keine** Imports mehr auf die alte Datei
- Es gibt einen klaren Migrationspfad (Re-exports oder Search&Replace)

> Learning: Große Löschaktionen ohne Import-Scan führen zu Build-Ausfällen.

### 4.3 Einheitliche Fehlerbehandlung (Frontend)
Keine „silent failures“ in kritischen Flows.
- In Admin-Workflows: Fehlermeldung + Konsole + minimaler Kontext (Endpoint, Status).
- Keine catch-Blöcke, die einfach `return []` ohne Logging machen.

### 4.4 Konsistente API-Endpunkte
**Frontend-Pattern:**
- Public endpoints: Authorization via `Bearer ${publicAnonKey}` wenn benötigt
- Admin endpoints: zusätzlich `X-Admin-Token` Header (aktueller Stand)

### 4.5 Wo dokumentiere ich WAS?

**Projekt-Regeln (VERBINDLICH):**
- `/guidelines/Guidelines.md` (diese Datei) - Build-Regeln, Code-Standards
- `/NEON_SCHEMA_READER.md` - DB-Schema, Tabellen, Publishing

**Architektur & Kontext:**
- `/docs/PROJECT_STANDARDS.md` - UI-Layer, Design Tokens
- `/docs/BACKEND_GOVERNANCE.md` - Backend-Code-Regeln
- `/docs/ARCHITECTURE_DIAGRAM.md` - System-Übersicht
- `/docs/API_INTEGRATION_CONTRACT.md` - API-Verträge

**Modul-Dokumentation (für Developer):**
- `/utils/api/README.md` - API-Module Struktur
- `/components/design-system/README.md` - Design System
- Andere Modul-READMEs nach Bedarf

**Architektur-Entscheidungen (ADRs):**
- **NICHT** im Code dokumentieren
- **Changelog in dieser Datei** (Abschnitt 10) für größere Änderungen
- Bei Bedarf: `/docs/decisions/ADR-NNN-titel.md`

**FAUSTREGEL:**
- Regeln → Guidelines.md oder NEON_SCHEMA_READER.md
- Kontext/Erklärung → /docs/
- Implementation-Details → Modul-READMEs

**Verboten:** Version-Mix ohne Plan (`/api/v2/...` vs `/api/...`)  
→ einheitliche Pfade verwenden oder sauber migrieren.

### 4.6 Component-Zonen & Semantic Organization (NEU - 31.01.2026)

**Problem-Analyse:**
`/components/` ist semantisch überladen - es enthält UI Primitives, Domain-Komponenten, Admin-Anwendungen, Feature-Module, Storefront-Logik, SEO, und Routing-nahe Komponenten auf gleicher Ebene.

**➡️ Das führt zu:**
- Falschen Imports (Bundle-Graph Poisoning)
- Impliziten Abhängigkeiten
- Schwer kontrollierbaren Build-Graphen

**🛠️ Lösung: Konzeptionelle Zonen (Evolutionär, NICHT Big Bang!)**

Neue Komponenten sollten nach **App-Zonen** organisiert werden:

```
/components/
├── public/        # Öffentliches Frontend (Shop, Homepage, Book Pages)
├── admin/         # Admin Backend (bleibt wie es ist)
├── shared/        # Übergreifend (BookCard, Header, Footer, ErrorBoundary)
├── sections/      # Wiederverwendbare Section-Komponenten
├── design-system/ # CoRatiert Design System (DS*)
└── ui/            # Low-Level Primitives (shadcn/ui)
```

**WICHTIG - Migrations-Strategie:**
- ✅ **Neue Komponenten:** Gehen in die passende Zone
- 🟡 **Bestehende Komponenten:** Bleiben erstmal liegen
- ❌ **KEIN Big Bang Refactor:** Keine massenhafte Umstrukturierung

**Entscheidungsbaum für neue Komponenten:**

1. **Ist es UI-Primitive?** → `/components/ui/`
2. **Ist es Design System?** → `/components/design-system/`
3. **Ist es Section?** → `/components/sections/`
4. **Ist es Admin?** → `/components/admin/`
5. **Ist es öffentlich?** → `/components/public/`
6. **Wird es überall genutzt?** → `/components/shared/`

**Gesamturteil:**
Die Struktur ist **tragfähig, publish-fähig, professionell**.  
Kein Chaos-Problem, sondern ein **Schärfungs- und Entkopplungsproblem** an wenigen Stellen.

### 4.7 Admin-Komponenten: UI/Logic/Types Trennung (NEU - 31.01.2026)

**Problem:**
Admin-Komponenten in `/components/admin/` sind zu "applikativ":
- Pages + Business Logic + UI + API Calls + State Management gemischt
- Monster-Files entstehen (z.B. `BookSourceBuilder.tsx`)
- Schwer testbar, schwer wartbar

**🛠️ Lösung für NEUE Admin-Komponenten:**

```
/components/admin/AdminX/
├── AdminX.tsx        # UI only (< 300 Zeilen)
├── AdminX.logic.ts   # Daten, State, Hooks
├── AdminX.types.ts   # TypeScript Interfaces
└── AdminX.api.ts     # API Calls (optional)
```

**Beispiel:**

```typescript
// AdminBooks.tsx (UI only)
import { useAdminBooksLogic } from './AdminBooks.logic';

export function AdminBooks() {
  const { books, loading, onSave, onDelete } = useAdminBooksLogic();
  return (/* JSX only */);
}

// AdminBooks.logic.ts (State + Business Logic)
export function useAdminBooksLogic() {
  const [books, setBooks] = useState([]);
  // ... alle Hooks, State, Effects
  return { books, loading, onSave, onDelete };
}

// AdminBooks.types.ts (Types)
export interface AdminBook { ... }
```

**Migrations-Strategie:**
- ✅ **Neue Admin-Komponenten:** Immer nach diesem Pattern
- 🟡 **Alte Monster-Files:** Nur anfassen wenn ohnehin geändert
- ❌ **KEIN sofortiger Refactor:** Keine Zwangs-Migration

**Vorteile:**
- Kleinere Files (< 300 Zeilen)
- Klare Verantwortlichkeiten
- Bessere Testbarkeit
- Figma-Make-Build-sicher

### 4.8 Section-Organisation: Modular & Explizit (NEU - 31.01.2026)

**Problem:**
Section-Logik ist teils zu "magisch":
- `SectionRenderer`, `sectionRegistry`, `SectionItemsManager` greifen auf gleiche Konzepte zu
- Admin + Frontend nutzen gleiche Definitionen
- Implizite Abhängigkeiten

**🛠️ Lösung für NEUE Sections:**

```
/components/sections/book-carousel/
├── BookCarousel.section.tsx   # Frontend Render (Public)
├── BookCarousel.admin.tsx     # Admin UI (Config/Preview)
├── BookCarousel.schema.ts     # Props/Contract/Types
└── index.ts                   # Exports
```

**Beispiel:**

```typescript
// BookCarousel.schema.ts
export interface BookCarouselConfig {
  title: string;
  bookIds: string[];
  maxItems?: number;
}

// BookCarousel.section.tsx (Public Render)
import type { BookCarouselConfig } from './BookCarousel.schema';

export function BookCarouselSection({ config }: { config: BookCarouselConfig }) {
  // Rendering Logic
}

// BookCarousel.admin.tsx (Admin Config)
export function BookCarouselAdmin() {
  // Admin Form für Config
}
```

**Migrations-Strategie:**
- ✅ **Neue Sections:** Immer modular aufbauen
- 🟡 **Bestehende Sections:** Funktionieren weiter (kein Breaking Change!)
- ❌ **KEIN Rewrite:** Bestehende nur bei Bedarf migrieren

**Vorteile:**
- Reduziert Cross-Imports
- Explizite Contracts (Schema)
- Klare Trennung Frontend/Admin
- Weniger Build-Überraschungen

**Registrierung bleibt zentral:**
`/components/sections/sectionRegistry.tsx` bleibt Single Source of Truth für Section-Types.

---

## 5) Datenbank / Neon (nur Verweis, aber verbindlich)
**DB-Single-Source:** `/NEON_SCHEMA_READER.md`  
Dort stehen u.a.:
- Tabellen, Ownership-Regeln (created_by, status/visibility, soft delete)
- Follow-System (followables + user_follows + Views/Constraints)
- Publishing- und CRUD-Patterns

**Regel:** Wenn Frontend Backend-Tabellen nutzt, müssen die Spalten/Constraints exakt dem Contract entsprechen.

---

## 6) Rollenmodell (User, Creator, Author, Publisher, Affiliate) — Canonical Interpretation
**Prinzip:** `users` ist die Basis (Supabase Auth). Rollen sind additive Fähigkeiten.

- **Creator/Curator**: Rolle/Fähigkeit innerhalb des Systems (nicht eigener Auth-Typ).  
- **Author (Person)** & **Publisher**: werden aus ONIX ingestiert und können von einem User „claimed“ werden.  
- **Affiliate**: zusätzlicher Role-Flag / user_role Eintrag (User kann Affiliate werden).

**Regel für Claims:**
- entity exists unabhängig (ONIX/ingest)
- claim erzeugt eine Verbindung zu `users(id)` (Details im Neon Contract / durch Tabellen wie `publishers.user_id` / `persons.user_id` bzw. Claim-Table)

> Wenn die aktuelle DB davon abweicht: nicht im Frontend „hinbiegen“, sondern DB-Contract anpassen und migrieren.

---

## 7) Follow-System (Front-End/Back-End Contract Summary)
Wir nutzen:
- `followables` als polymorphe Ziel-Tabelle (book/person/publisher/tag/…)
- `user_follows` als relation user → followable
- (Optional) Views: `user_book_follows`, `user_person_follows`, `user_publisher_follows`

**Regeln:**
- followables braucht `created_at`, `updated_at`, `deleted_at`, `status` + Unique Constraint für entity (z.B. `(entity_type, entity_id)` oder `(entity_type, entity_uuid)` je nach Typ).  
- user_follows soft delete per `deleted_at` (keine hard deletes in normalen Flows).  
- Views dürfen **nur** erstellt werden, wenn der Name nicht bereits als Table existiert.

---

## 8) Figma Make AI — Arbeitsanweisung

Diese Guidelines.md wird automatisch im System-Prompt geladen.

**Zusätzlich bei spezifischen Tasks:**
- Backend/DB-Arbeit: "Lies zusätzlich `/NEON_SCHEMA_READER.md`"
- UI-Arbeit: "Beachte `/docs/PROJECT_STANDARDS.md` für Design Tokens"

**Wenn du User bist und Figma Make AI verwendest, füge bei Bedarf am Ende deines Prompts an:**

> **Figma AI: Zusätzliche Erinnerung**  
> 1) Diese Guidelines.md ist bereits geladen - du hast sie gelesen.
> 2) Keine neuen Dateien außerhalb der erlaubten Ordner.  
> 3) Keine `react-dnd` Dependencies im Frontend.  
> 4) Nur `react-router-dom`, nie `react-router`.  
> 5) Import-Pfade müssen existieren; wenn `_v2` genutzt wird, stelle sicher, dass Imports konsistent sind (ggf. Re-export).  
> 6) Keine Debug/Test-Dateien liegen lassen. Wenn du welche erzeugst: am Ende entfernen.  
> 7) Wenn Publish fehlschlägt: Binary Search per Auskommentieren und Import-Pfade prüfen.

### 8.1 🔵 Phase 1: "Planning & Architecture" Prompt

**Rolle:** Senior Software Architekt, Security & Privacy Officer.  
**Aufgabe:** Plane die Implementierung von [FEATURE] unter strikter Einhaltung unserer System-Architektur 2026.

#### 1. UI-System & Konsistenz (Anti-Müll):

- **UI-Core Pflicht:** Nutze ausschließlich `<Container>`, `<Section>`, `<Heading>` und `<Text>` aus `/components/ui/`.
- **Kein manuelles Styling:** Keine Schriftgrößen-Klassen (`text-xl`) oder Margin/Padding-Ketten in der Page-Datei. Nutze das globale Design-System.
- **Single Source of Truth:** Beziehe dich nur auf `PROJECT_STANDARDS.md`. Keine neuen Dateien im Root.

#### 2. Performance & Code-Qualität:

- **Eisberg-Regel:** Logik strikt von UI trennen. Max. 200 Zeilen JSX pro Datei.
- **Optimierung:** Plane `useMemo` für Listen-Transformationen und Lazy-Loading für Assets/schwere Komponenten.

#### 3. Sicherheit & DSGVO (Privacy by Design):

- **Datensparsamkeit:** Plane nur die Erhebung von Daten, die absolut notwendig sind.
- **Input-Sanitization:** Plane Validierung (Zod/Server Actions) für alle User-Inputs ein.
- **ONIX & Schema.org:** Sind alle notwendigen ONIX-Felder deklariert und macht eine Schema.org Angabe Sinn? Implementiere sie.
- **External Resources:** Keine Google Fonts oder externe Skripte ohne lokale Einbindung oder Proxy (DSGVO-konform).
- **Compliance:** Stelle sicher, dass für Tracking oder Affiliate-Cookies die Logik aus `BUSINESS_LOGIC.md` (Consent-Handling) eingeplant ist.

**Ziel:** Ein technisches Konzept, das visuell konsistent, performant und rechtssicher ist.

### 8.2 🔴 Phase 2: "Audit, Cleanup & Hardening" Prompt

**Rolle:** Senior Frontend Engineer & Privacy Auditor.  
**Aufgabe:** Reviewe und refactore den Code auf Production-Niveau (Januar 2026).

#### 1. Design-System & A11y Audit:

- **UI-Core Check:** Ersetze alle manuellen Layout-Ketten durch UI-Core Komponenten.
- **Parent-Reset:** Prüfe auf Vererbungskonflikte (z.B. doppelt große Schriften) und entferne störende Wrapper-Styles.
- **Accessibility:** Prüfe `aria-labels`, Skip-Links und Alt-Texte.

#### 2. Performance & Technical Health:

- **Type Safety:** Ersetze alle `any`-Typen durch explizite Interfaces.
- **Cleanup:** Entferne alle `console.log` und Debug-Kommentare.
- **Memoization:** Prüfe, ob `React.memo` oder `useMemo` an kritischen Stellen (Listen/Filter) fehlen.

#### 3. Security & DSGVO Audit:

- **Privacy:** Werden IP-Adressen oder PII (Personally Identifiable Information) versehentlich geloggt oder ungefiltert an Drittanbieter (z.B. Affiliate-Partner) gesendet?
- **Error Messages:** Sind Fehlermeldungen generisch (sicher) statt systementhüllend?
- **Validation:** Ist der Email-Input/Form-Input gegen Injections abgesichert?

#### 4. Dokumentation:

- Wurden neue Erkenntnisse in die `PROJECT_STANDARDS.md` oder `BUSINESS_LOGIC.md` übertragen?

**Ziel:** Ein absolut sauberer, wartbarer und DSGVO-konformer Code-Stand.

---

## 9) Cleanup-Plan vor Replit-Migration (kostenbewusst)
1) **Datei-Inventur**: Delete/merge `*_debug*`, `*_test*`, Duplikate, „Old/Backup“.  
2) **Imports normalisieren**: canonical surfaces (2.4), keine toten Pfade.  
3) **Große Dateien splitten**: besonders Admin Tabs, utils Monster.  
4) **Minimal build-safe baseline**: „Publish muss gehen“ als Gate.  
5) **Nur dann** Replit: erst wenn Struktur stabil und nachvollziehbar ist.

---

## 10) Changelog-Regel (minimal, aber Pflicht)
Jede größere Änderung (Refactor, Pfad-Normalisierung, Migration) bekommt:
- eine kurze Notiz **am Ende dieser Datei** unter „Change Log"
- Datum + **Versionsnummer (vXXXX)** + 3 Bulletpoints (was, warum, risk)

**Versionierungs-Schema:**
- **DB-Migrationen:** `v1125`, `v1126`, ... (Neon Migration-Nummer)
- **Guidelines/Code-Änderungen:** `v1126`, `v1127`, ... (fortlaufend, keine Kollision mit Migrations-Nummern)
- **Regel:** Neue Version = höchste existierende Nummer + 1

### Change Log

- **v1137 (2026-02-05 - SAFE LOGGER & GLOBAL ERROR HANDLER):** Backend Error Handling stabilisiert gegen "log.error is not a function" Crashes -
  Neue `createSafeLogger()` Funktion in `/lib/logger.ts` mit defensive try-catch für alle Log-Calls;
  Navigation Legacy und Pages Routes migriert auf `safeLog` statt direktes `log` (verhindert TypeError bei falschem Logger-Object);
  Globaler `app.onError()` Handler in index.ts für konsistente JSON Error-Responses (keine Plaintext 500s mehr);
  Behebt "Unexpected token 'I'" Frontend-Fehler (war 500 Internal Server Error als Text statt JSON);
  Health-Check Version: `v1137-safe-logger-error-handler`;
  Deploy-Command: `supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh`.

- **v1136 (2026-02-05 - COMPAT LAYER DOUBLE MOUNT):** Routes doppelt gemountet für volle Backward Compatibility -
  Problem: Manche Routes haben `/api/` Prefix, andere nicht (inkonsistente Migration);
  Lösung: Routes werden 2x registriert - einmal unter `/api` mount, einmal direkt auf root app;
  Ermöglicht dass `/navigation` UND `/api/books` gleichzeitig funktionieren;
  Temporäre Lösung während Migration aller Route-Files auf konsistente Prefixes;
  Kein Breaking Change für Frontend oder bestehende API-Calls.

- **v1135 (2026-02-04 - MODULAR BACKEND MIGRATION COMPLETE):** Edge Function komplett auf modulare Architektur migriert -
  Neue Production Function: `/supabase/functions/api/` mit sauberer Modulstruktur;
  index.ts (NICHT .tsx - Backend hat kein JSX!) importiert alle Route-Module aus `routes/`;
  Utilities separiert in `lib/` (db.ts, logger.ts, slug-generator.ts, security.ts);
  Jede Route < 300 Zeilen, single responsibility per module;
  KEINE `/api/` Prefixes in Route-Definitionen (Supabase stripped `/functions/v1/api` automatisch);
  Deploy-Command: `supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh`;
  Alte monolithische `/supabase/functions/server/index.tsx` (4452 Zeilen) ist obsolet;
  Frontend API_BASE_URL bleibt: `https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api`.

- **v1133 (2026-02-04 - ROUTE PREFIX CLEANUP & COMPAT-LAYER):** Backend Route-Prefixes bereinigt für konsistentes Routing -
  Alle Route-Definitionen entfernen `/api/` Prefix (Routes: /health, /books, /tags statt /api/health);
  Navigation V2 behält `/v2/` Prefix (Migration-Pfad: /v2/navigation/items);
  Supabase strippt automatisch /functions/v1/api → Hono empfängt saubere Pfade;
  Compat-Layer deployed: Server unterstützt BEIDE Varianten (/health UND /api/health);
  Behebt "disconnected from Neon" Admin-Tab-Fehler (war Routing-404, kein DB-Problem);
  Health-Check Version: v1133-prefix-cleanup;
  FIGMA_KOMMUNIKATION_FINALE.md erstellt mit vollständiger Dokumentation der Änderungen.

- **v1132 (2026-02-04 - LOGGER CONSISTENCY & GENERATOR RESILIENCE):** Backend Logger-Pattern standardisiert und gegen Generator-Fehler abgesichert -
  Logger-Library exportiert jetzt `logger` als Alias zu `log` für Generator-Kompatibilität;
  Neue Guidelines 2.6 dokumentiert verbotene Logger-Patterns (log(), Variable Shadowing, TDZ errors);
  Verhindert Worker boot errors ("does not provide export named 'logger'") und ReferenceErrors;
  Kanonisches Pattern: `log.withContext("module")` für modul-spezifisches Logging;
  Edge Functions sind jetzt generator-resistent gegen inkonsistente Logger-Nutzung.

- **v1131 (2026-02-03 - PRODUCTION API MIGRATION COMPLETE):** Edge Function Codebase vollständig nach `/api` migriert -
  Neuer Ordner `/supabase/functions/api/` mit kompletter modularer Struktur (lib/ + routes/ + index.tsx + deno.json);
  Alle 7 Route-Files korrekt als `.ts` angelegt (NICHT `.tsx` - Backend hat kein JSX);
  copy-server-to-edge.sh aktualisiert (TARGET_DIR: `/api` statt `/make-server-6e4a36b4`);
  Deploy-Command: `supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh`;
  Alter Ordner `/supabase/functions/make-server-6e4a36b4/` kann nach erfolgreichem Deploy gelöscht werden (CLEANUP_OLD_DEPLOYMENT.sh);
  Health-Check Version String: "v1130-production-api";
  index.tsx Deno.serve ohne PATH_REWRITE (Supabase stripped `/functions/v1/api` automatisch).

- **v1130 (2026-02-03 - API BASE URL MIGRATION):** Edge Function Base URL von Legacy zu Production migriert -
  Frontend API_BASE_URL in /config/apiClient.ts geändert von `/functions/v1/make-server-6e4a36b4` zu `/functions/v1/api`;
  Guidelines Abschnitt 2.4 aktualisiert mit neuer Production Edge Function `api` (alt: `make-server-6e4a36b4` DEPRECATED);
  Alte Function triggered Auto-Provisioning/Deploy-Workflows bei Tests (Race Conditions);
  Neue Function ist multi-file modular setup (lib/ + routes/) - stabiler und wartbarer;
  AI-Assistenten dürfen ab jetzt KEINE Files mehr in `/supabase/functions/make-server-6e4a36b4/` schreiben;
  Breaking Change nur für Backend-URLs - Frontend automatisch migriert via API_BASE_URL Import.

- **v1129 (2026-02-03 - MODULAR DEPLOYMENT MIGRATION):** Backend auf modulare Architektur migriert -
  Site Banner Routes doppelt definiert in index.tsx (Zeile 316-490 + 4757-4921) - Duplikate entfernt;
  /supabase/functions/server/routes/site-config.ts erstellt mit allen CRUD-Operationen;
  index_v2.tsx um registerSiteConfigRoutes erweitert (vollständig modular);
  DEPLOY_MODULAR.sh deployed index_v2.tsx → index.tsx (4900+ Zeilen → 130 Zeilen);
  index.tsx Monolith archiviert als index_v1_monolith_backup.tsx;
  Alle Routes bleiben API-kompatibel (kein Breaking Change);
  Rollback via ROLLBACK_MODULAR.sh verfügbar falls Deployment-Issues auftreten.

- **v1128 (2026-02-03 - SITE BANNER FEATURE):** InfoBar Admin-Backend Feature implementiert -
  InfoBar von unter nach über Header verschoben in CMSHomepage.tsx;
  Backend Routes für Site Banner erstellt (GET/POST/PUT/DELETE /api/site-config/banner);
  Admin Tab "Site Banner" in ContentManager.tsx registriert (SiteBannerTab.tsx);
  Neon-Tabelle site_banners Schema aligned (name, message, badge_text, button_text, button_url, visible, status, position, display_order);
  Admin Token Key Fix (admin_neon_token statt adminToken in SiteBannerTab.tsx);
  Routes in /supabase/functions/server/index.tsx und routes/site-config.ts registriert.

- **v1127 (2026-02-03 - MODULAR REFACTOR FOUNDATION):** Edge Function defensiv modularisiert -
  lib/ Utilities erstellt (db.ts, auth.ts, logger.ts, slugify.ts, security.ts, validation-awards.ts);
  routes/ Module erstellt (health.ts, admin-auth.ts, books.ts);
  index_v2.tsx als experimentelle modulare Version (< 150 Zeilen vs 4452 Zeilen monolith);
  index.tsx bleibt unverändert (Production Safety - kein Breaking Change);
  copy-server-to-edge.sh erweitert um lib/ und routes/ Ordner zu kopieren;
  Navigation V2 PREFIX-Pattern identifiziert (muss in Phase 2 gefixt werden).

- **v1126 (2026-02-03 - AUTO-DEPLOY PROTECTION FIX):** deno.json Auto-Deploy Problem behoben -
  Edge Function `/supabase/functions/make-server-6e4a36b4/` erhält eigene deployment-spezifische `deno.json`;
  Verhindert dass Supabase auto-deploy falsche Function-Namen erzeugt (make-server-62c4b066);
  Copy-Script erweitert um deno.json zu respektieren (behält deployment config bei);
  Guidelines Abschnitt 2.0 erweitert mit deno.json Struktur-Erklärung und Auto-Deploy Protection;
  Root Cause identifiziert: Fehlende deployment config in Edge Function Ordner führte zu Name Collisions.

- **v1125 (2026-02-03 - NAVIGATION V2 FIELDS MIGRATION):** menu_items table erweitert mit Navigation V2 Feldern -
  Migration v1125_add_menu_items_fields.sql fügt kind, location, panel_layout, target_type, target_page_id, target_category_id, target_tag_id hinzu;
  Backend INSERT/UPDATE/SELECT Queries aktualisiert um neue Felder zu unterstützen;
  Frontend NavigationItem Interface aligned mit DB schema (Felder nicht mehr optional);
  Behebt "PostgresError: inconsistent types deduced for parameter $5" beim Speichern von Navigation Items (href Column entfernt aus Queries - existiert nicht in v1125);
  Ermöglicht Mega Menu Feature, flexible Content-Verlinkung und visuelle Trenner (heading/divider);
  Single-target Constraint stellt sicher dass nur EIN target_* gesetzt ist (wie bei section_items).

- **v1124 (2026-02-02 - DEPLOYMENT NAME PROTECTION):** Kritische Edge Function Deployment-Regel hinzugefügt -
  Neuer prominenter Abschnitt 2.0 dokumentiert das Deployment-Name-Problem (make-server-62c4b066 vs make-server-6e4a36b4);
  Führt zu "Name and slug are required" Errors wenn falscher Name deployed wird;
  Erklärt warum Supabase automatisch neue (leere) Edge Functions erstellt bei falschem Namen;
  Deploy-Regel: Vor/Nach Deploy Prüfung im Dashboard dass nur korrekter Server existiert;
  Verhindert zukünftige Deployment-Failures und Backend-Outages.

- **v1123 (2026-02-02 - NEON SCHEMA DOCUMENTATION REFRESH):** NEON_CANONICAL_CONTRACT.md durch NEON_SCHEMA_READER.md ersetzt -
  Neue v3 Schema-Dokumentation mit verbesserter Struktur und Developer-Fokus;
  Erklärt "warum" Tabellen existieren, nicht nur "dass" sie existieren;
  Enthält kritische DB-Constraints und häufige Pitfalls für Admin UI;
  Guidelines.md Abschnitt 0, 4.5 und 5 aktualisiert mit neuem Dateinamen;
  Verbesserte Lesbarkeit für Figma AI und neue Chat-Kontexte.

- **v1122 (2026-02-02 - NAVIGATION MENU ITEM FIX):** HTTP 500 "label NOT NULL" Fehler behoben -
  Backend V2 Route (`/api/v2/navigation/items`) mit expliziter Validierung und String-Trimming;
  Backend V1 Legacy Route (`/api/navigation/admin/items`) ebenfalls gefixt für Backward Compatibility;
  Frontend (`AdminNavigationV2.tsx`) validiert jetzt `name` und `label` mit `.trim()` vor API-Calls;
  Alle Payloads garantieren non-null `label` Werte durch Fallback zu `name`;
  Fehler-Logging für besseres Debugging bei Invalid Requests.

- **v1121 (2026-02-01 - TYPESCRIPT SAFETY RULES):** TypeScript `any`-Verbot zu Guidelines hinzugefügt - 
  Neue Regel 2.5 definiert Verbot von `any`-Types mit erlaubten Ausnahmen (temporäre Casts, externe Libs);
  Pre-Publish-Check 3.1 Punkt 7 ergänzt (`: any` und `as any` Suche);
  Verhindert Runtime-Fehler durch fehlende Type-Safety analog zu fehlenden Imports.

- **v1120 (2026-02-01 - IMPORT-CHECK AUTOMATION):** Pre-Publish Import-Checks zu Guidelines 3.1 hinzugefügt - 
  Automatische Prüfung auf fehlende React Hooks Imports (useMemo, useCallback, memo);
  Automatische Prüfung auf fehlende Lucide Icons Imports (Share2, ArrowRight, etc.);
  Verhindert häufigste Runtime-Fehler ("X is not defined") bereits vor Publishing;
  Pattern-basierte Regex-Suchen für alle Hook- und Icon-Verwendungen dokumentiert.

- **v1119 (2026-02-01 - API IMPORT FIX):** Canonical Import-Pfade für API_BASE_URL korrigiert - 
  5 Admin-Komponenten (PagesTabContent, PageComposer, SectionItemsManager, NavigationPageLinker, BookSourceBuilder) verwendeten `/utils/apiConfig` statt `/config/apiClient`;
  Alle Imports auf kanonischen Pfad `/config/apiClient` migriert (Guidelines 2.4);
  Behebt "Netzwerkfehler beim Laden der Menüpunkte" und JSON-Parse-Fehler im Page Composer;
  Content Manager Pages Tab Button auf URL-basierte Navigation gefixt (`setSearchParams`).

- **v1118 (2026-02-01 - AI PROMPT TEMPLATES):** Strukturierte Prompt-Templates für Figma Make AI hinzugefügt - 
  Phase 1 (Planning & Architecture) definiert UI-System, Performance & DSGVO-Requirements;
  Phase 2 (Audit, Cleanup & Hardening) definiert Production-Review-Prozess mit A11y, Security & Type Safety;
  Neue Abschnitte 8.1 und 8.2 dokumentieren verbindliche Qualitätsstandards für Feature-Entwicklung.

- **v1117 (2026-01-31 - SECTION LIBRARY COMPLETION):** 4 fehlende Sections zur Library hinzugefügt - 
  GenreCategoriesSection (Medien & Buch), StorefrontsCarousel, Events, CuratedLists in SectionIndex.tsx registriert;
  React Hooks & Lucide Icons Import-Regel zu Guidelines 2.2 hinzugefügt (häufig vergessene Imports dokumentiert);
  Alle 16 Homepage-Sections jetzt in Section Library verfügbar und geroutet.

- **v1116 (2026-01-31 - STRUCTURE SHARPENING):** Evolutionäre Struktur-Guidelines hinzugefügt - 
  3 neue Abschnitte (4.6 Component-Zonen, 4.7 Admin UI/Logic Trennung, 4.8 Section-Modularität);
  Routing-Wrapper PFLICHT (useSafeNavigate statt direkter useNavigate);
  Keine Big-Bang-Refactors - nur neue Komponenten folgen neuen Patterns;
  Gesamturteil: Struktur ist tragfähig & professionell, kein Chaos-Problem.

- **v1115 (2026-02-01 - RUNTIME FIXES):** useSafeNavigate Migration Cleanup abgeschlossen - 
  3 finale Files gefixt (CuratorMatchmaking, BookDetailPage, QuickLogin);
  React-Imports korrigiert (memo, useState, useRef, useEffect in CreatorHeader);
  100% Guidelines 2.2 konform - 0 direkte useNavigate Aufrufe auerhalb Wrapper;
  App jetzt runtime-stabil ohne Bundle-Graph oder Navigation-Fehler.

- **v1114 (2026-01-31 - CRITICAL FIX):** react-router → react-router-dom Migration abgeschlossen - 
  65 Dateien gefixt (App.tsx, alle Components, Utils, Pages, Hooks); 
  0 Treffer für 'react-router' im Frontend; 
  Bundle-Graph Poisoning behoben (esm.sh Issue #1294); 
  Guidelines Abschnitt 2.2 erweitert mit Bundle-Graph Learning.
  
- **v1113 (2026-01-31 - SSOT FOUNDATION):** SSoT eingeführt; Build-Stabilitätsregeln formalisiert; Figma Prompt-Block standardisiert.