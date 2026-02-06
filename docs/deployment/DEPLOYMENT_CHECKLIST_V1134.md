# BACKEND DEPLOYMENT CHECKLIST v1134

## ✅ Abgeschlossene Fixes

### 1. Route Prefix Cleanup (v1133)
- [x] Alle `/api/` Prefixes aus Route-Definitionen entfernt
- [x] Routes definieren jetzt direkt: `/health`, `/books`, `/tags` etc.
- [x] Supabase Edge Function strippt automatisch `/functions/v1/api`
- [x] Compat-Layer deployed: Server unterstützt BEIDE Varianten

### 2. Parameter Übergabe Fix (v1134)
- [x] **Navigation V2 Routes** (`navigation_v2.ts`): `verifyAdminToken` Parameter hinzugefügt
- [x] **Navigation Legacy Routes** (`navigation_legacy.ts`): `verifyAdminToken` Parameter hinzugefügt
- [x] **Curators Routes** (`curators.ts`): `verifyAdminToken` und `generateUniqueSlug` Parameter hinzugefügt
- [x] **Persons Routes** (`persons.ts`): `verifyAdminToken` und `generateUniqueSlug` Parameter hinzugefügt
- [x] **Pages Routes** (`pages.ts`): `verifyAdminToken` und `generateUniqueSlug` Parameter hinzugefügt
- [x] **Auth Guards** in allen Admin-Endpoints implementiert

### 3. Function Signatures
- [x] Alle Route-Files haben korrekte Function Signatures
- [x] Parameter-Reihenfolge konsistent: `(app, queryDB, [helper], verifyAdminToken, log)`
- [x] index.ts registriert alle Routes mit korrekten Parametern

## 📋 Deployment Steps

### Schritt 1: Pre-Deployment Verification
```bash
# Prüfe dass alle Änderungen committed sind
git status

# Prüfe Route-Registrierungen
grep "registerNavigation" supabase/functions/api/index.ts
grep "registerCurators" supabase/functions/api/index.ts
grep "registerPersons" supabase/functions/api/index.ts
grep "registerPages" supabase/functions/api/index.ts
```

### Schritt 2: Deploy Backend
```bash
# Führe Deployment-Script aus
bash DEPLOY_BACKEND_V1134.sh

# ODER manuell:
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh
```

### Schritt 3: Health Check
```bash
# Test Health Endpoint
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health | jq

# Erwartete Response:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "version": "v1134-admin-auth-fix",
#   "db_connected": true
# }
```

### Schritt 4: Admin UI Testing
1. **Öffne Content Manager** (`/admin/content`)
2. **Teste ALLE Admin Tabs:**
   - ✅ Books (GET /books)
   - ✅ Tags (GET /tags)
   - ✅ Categories (GET /categories)
   - ✅ Persons (GET /persons) ← KRITISCH
   - ✅ Curators (GET /curators) ← KRITISCH
   - ✅ Pages (GET /pages) ← KRITISCH
   - ✅ Navigation (GET /v2/navigation/items) ← KRITISCH
   - ✅ Site Banner (GET /site-config/banner)
   - ✅ Sections (GET /sections)
3. **Teste CRUD Operations:**
   - Create: Neues Item erstellen
   - Update: Existierendes Item bearbeiten
   - Delete: Item löschen (soft delete)
   - Verify: Änderungen in DB sichtbar

## 🔍 Debugging Guide

### Falls "disconnected from Neon" zurückkommt:

**1. Check Backend Logs:**
```bash
# Supabase Dashboard → Edge Functions → api → Logs
# Schaue nach Auth-Fehlern oder SQL-Errors
```

**2. Check Request Headers:**
```javascript
// Browser DevTools → Network Tab
// Prüfe dass Requests enthalten:
// - Authorization: Bearer eyJ...
// - X-Admin-Token: <admin_password>
```

**3. Check Route Registration:**
```bash
# Stelle sicher alle Routes sind registriert:
grep "register.*Routes" supabase/functions/api/index.ts
```

**4. Check Function Signatures:**
```bash
# Prüfe dass Route-Files die Parameter akzeptieren:
grep "export function register" supabase/functions/api/routes/*.ts
```

### Häufige Fehler:

**❌ "Name and slug are required"**
- Ursache: Payload fehlt `name` oder `label` Feld
- Fix: Frontend Validierung in Admin-Komponente

**❌ "column 'href' does not exist"**
- Ursache: Route nutzt alte `href` Column (wurde in v1125 entfernt)
- Fix: Update SQL Query (nutze `target_*` Felder)

**❌ "verifyAdminToken is not a function"**
- Ursache: Route-Registration in index.ts fehlt Parameter
- Fix: Füge `verifyAdminToken` zu registerXxxRoutes() Aufruf hinzu

**❌ "PostgresError: inconsistent types"**
- Ursache: SQL Query Parameter-Types stimmen nicht mit Schema überein
- Fix: Check Field Types in NEON_SCHEMA_READER.md

## 📝 Post-Deployment Tasks

### 1. Guidelines Update
Füge v1134 Changelog zu `/guidelines/Guidelines.md` hinzu:

```markdown
- **v1134 (2026-02-04 - ADMIN AUTH PARAMETER FIX):** Backend Route Parameter-Übergabe korrigiert -
  Navigation V2/Legacy, Curators, Persons, Pages Routes erhalten jetzt `verifyAdminToken` Parameter;
  Alle Route-Registrierungen in index.ts haben korrekte Parameter-Übergabe;
  Auth-Guards für Admin-Endpoints implementiert;
  Function Signatures in allen Route-Files aligned mit index.ts;
  Behebt "disconnected from Neon" in Admin Tabs (war Parameter-Fehler, nicht DB-Problem);
  Health-Check Version: v1134-admin-auth-fix.
```

### 2. Monitor Production
- Schaue Supabase Error Logs für 24h
- Prüfe Admin UI funktioniert ohne Fehler
- Verifiziere keine Performance-Regression

### 3. Documentation Update
Falls neue Erkenntnisse während Deployment:
- Update `/docs/BACKEND_GOVERNANCE.md`
- Update `/docs/API_INTEGRATION_CONTRACT.md`

## 🎯 Success Criteria

✅ **Deployment gilt als erfolgreich wenn:**
1. Health Check returnt `"status": "ok"` und `"db_connected": true`
2. Alle Admin Tabs laden ohne "disconnected from Neon" Fehler
3. CRUD Operations funktionieren (Create, Read, Update, Delete)
4. Keine 500/503 Errors in Browser Console
5. Backend Logs zeigen keine Auth-Errors oder SQL-Errors

## 🚨 Rollback Plan

Falls Deployment fehlschlägt:

```bash
# Option 1: Re-deploy vorherige Version
# (Benötigt Git Tag oder Backup von alter index.ts)

# Option 2: Hotfix direkt auf Server
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh

# Option 3: Revert Git Commit
git revert HEAD
bash DEPLOY_BACKEND_V1134.sh
```

**WICHTIG:** Dokumentiere jedes Rollback in Guidelines.md!
