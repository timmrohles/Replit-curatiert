# API v1130 Production Migration Guide

**Ziel:** Migration von Legacy Edge Function (`make-server-6e4a36b4`) zur neuen modularen Production API (`/api`)

## 🎯 Warum diese Migration?

**Vorher:**
- Monolith: 4900+ Zeilen in einer Datei
- Deployment-Name triggert Auto-Provisioning
- Schwer wartbar

**Nachher:**
- Modular: routes/ + lib/ Struktur
- Production-stabiler Name: `/api`
- Klar getrennte Verantwortlichkeiten

---

## 📋 Pre-Flight Checklist

Vor dem Deployment sicherstellen:

- [ ] Supabase CLI installiert: `supabase --version`
- [ ] Eingeloggt: `supabase login`
- [ ] Alte Function läuft noch: Test `/functions/v1/make-server-6e4a36b4/health`
- [ ] Alle Route-Files existieren in `/supabase/functions/api/routes/`
- [ ] Alle Lib-Files existieren in `/supabase/functions/api/lib/`

---

## 🚀 Deployment (3 Schritte)

### Step 1: Deploy neue Function

```bash
bash DEPLOY_API_V1130.sh
```

**Was passiert:**
1. Struktur-Check (/api/routes, /api/lib)
2. Import-Validation (keine .tsx imports)
3. Deploy nach Supabase
4. Health-Check
5. Nächste Schritte angezeigt

**Erwartete Ausgabe:**
```
✅ DEPLOYMENT COMPLETE!
Health check: {"status":"ok","version":"v1130-production-api"}
```

---

### Step 2: Frontend umschalten

**NUR wenn Health-Check OK!**

Manuell in `/config/apiClient.ts` ändern:

```typescript
// ALT (Legacy):
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-6e4a36b4`;

// NEU (Production):
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/api`;
```

**Testen:**
1. Content Manager öffnen
2. Books Tab laden
3. Navigation rendern
4. Page Composer öffnen
5. Awards Admin testen

**Kritische Flows:**
- ✅ Books API: `/api/books`
- ✅ Navigation V2: `/api/v2/navigation/items`
- ✅ Awards CRUD: `/api/awards`
- ✅ Pages Resolve: `/api/pages/resolve`

---

### Step 3: Cleanup (optional)

**NUR wenn Frontend 100% funktioniert!**

```bash
bash CLEANUP_OLD_DEPLOYMENT.sh
```

**Was passiert:**
1. Archiviert alte Codebase nach `/archive/`
2. Löscht alte Edge Function `make-server-6e4a36b4`
3. Löscht lokale Verzeichnisse

**⚠️ ACHTUNG:** Nach diesem Schritt gibt es kein Rollback mehr!

---

## 🔙 Rollback (Emergency)

Falls IRGENDWAS nicht funktioniert:

```bash
bash ROLLBACK_API_V1130.sh
```

**Was passiert:**
1. Revertiert `/config/apiClient.ts` zu alter Function
2. Optional: Löscht neue Function

**Wann Rollback?**
- Health-Check fehlschlägt
- Frontend-API-Calls returnen 500
- Content Manager lädt nicht
- Navigation bricht ab

---

## 🐛 Troubleshooting

### Problem: "Module not found: tags.ts"

**Ursache:** Fehlende Import-Signatur in `/api/index.tsx`

**Fix:**
```typescript
// FALSCH:
registerTagsRoutes(app, queryDB, log);

// RICHTIG:
registerTagsRoutes(app, queryDB, generateUniqueSlug, log);
```

---

### Problem: "user-modules.tsx not found"

**Ursache:** user-modules.tsx existiert nicht in `/api/`

**Fix:** Route ist bereits auskommentiert in `index.tsx`

---

### Problem: Health-Check gibt 404

**Ursache:** Function wurde nicht deployed oder falscher Name

**Checken:**
1. Supabase Dashboard: https://supabase.com/dashboard/project/blmyuoiedpdpvxoeciyh/functions
2. Sollte `api` als Function Name zeigen

**Fix:**
```bash
cd /supabase/functions/api
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh
```

---

### Problem: Frontend gibt "Network Error"

**Ursache:** API_BASE_URL zeigt auf nicht-existierende Function

**Checken:**
```bash
# Test OLD function:
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/make-server-6e4a36b4/health

# Test NEW function:
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health
```

**Fix:** Stelle sicher dass mindestens EINE Function funktioniert, dann API_BASE_URL entsprechend setzen.

---

## 📊 Status-Tracking

**Current State:**

```
[x] Routes erstellt (14/14)
[x] Lib Utils erstellt (4/4)
[x] index.tsx konfiguriert
[x] User-Modules auskommentiert (fehlende Dependency)
[ ] Function deployed
[ ] Health-Check passed
[ ] Frontend migrated
[ ] Old function deleted
```

**Letzte Änderung:** 2026-02-03 (v1130)

---

## 🎓 Learnings

**Import-Signaturen:**
- Jede Route-Funktion hat spezifische Dependencies
- Tags/Categories/Curators brauchen `generateUniqueSlug`
- Awards/Curators brauchen `verifyAdminToken`
- IMMER in Route-Datei Header checken: `Dependencies: ...`

**Deployment-Pattern:**
- Alte Function BEHALTEN bis neue bestätigt
- Health-Check VOR Frontend-Migration
- Rollback-Plan IMMER bereit

**File-Extensions in Deno:**
- .ts für Backend (kein JSX)
- .tsx nur wenn JSX verwendet wird
- Imports MÜSSEN Extension haben: `from './lib/db.ts'`

---

## 📚 Related Docs

- `/guidelines/Guidelines.md` → Abschnitt 2.0 (Deployment-Name-Protection)
- `/NEON_SCHEMA_READER.md` → DB-Schema
- `/docs/BACKEND_GOVERNANCE.md` → Code-Regeln
