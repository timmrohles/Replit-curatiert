# 🚀 BACKEND DEPLOYMENT v1134 - COMPLETE GUIDE

## 📋 Übersicht

**Version:** v1134  
**Datum:** 2026-02-04  
**Ziel:** Backend Route Parameter-Übergabe Fix  
**Status:** ✅ Ready for Deployment

### Was wurde gefixt?

1. **Route Prefix Cleanup (v1133):**
   - Alle `/api/` Prefixes aus Route-Definitionen entfernt
   - Routes registrieren jetzt direkt auf Root-Path
   - Supabase strippt automatisch `/functions/v1/api`

2. **Parameter Übergabe Fix (v1134):**
   - Navigation V2/Legacy Routes erhalten `verifyAdminToken`
   - Curators/Persons/Pages Routes erhalten `verifyAdminToken` + `generateUniqueSlug`
   - Alle Function Signatures aligned mit index.ts
   - Auth Guards in Admin-Endpoints implementiert

3. **Root Cause:**
   - "disconnected from Neon" war **KEIN** DB-Problem
   - War ein **Routing/Auth-Problem** (fehlende Parameter)
   - Admin-Routes konnten Admin-Token nicht verifizieren

---

## 🎯 Pre-Deployment Steps

### Schritt 1: Verification Script ausführen
```bash
# Macht das Script ausführbar
chmod +x VERIFY_BACKEND_V1134.sh

# Führe Verification aus
bash VERIFY_BACKEND_V1134.sh
```

**Erwartetes Ergebnis:**
```
✅ DEPLOYMENT READY

Nächster Schritt:
   bash DEPLOY_BACKEND_V1134.sh
```

**Bei Fehlern:**
- Script zeigt exakt welche Checks fehlgeschlagen sind
- Behebe die Fehler und führe Verification erneut aus
- **DEPLOYE NICHT** wenn Errors angezeigt werden

### Schritt 2: Git Status prüfen
```bash
# Stelle sicher alle Änderungen sind committed
git status

# Optional: Erstelle Tag für Rollback
git tag v1134-backend-deployment
```

---

## 🚀 Deployment

### Option A: Automated Deployment (Empfohlen)
```bash
# Macht das Script ausführbar
chmod +x DEPLOY_BACKEND_V1134.sh

# Führe Deployment aus
bash DEPLOY_BACKEND_V1134.sh
```

**Das Script macht:**
1. ✅ Pre-flight checks
2. ✅ Bestätigung vom User einholen
3. ✅ Backend deployen
4. ✅ Health Check durchführen
5. ✅ Erfolg/Fehler anzeigen

### Option B: Manual Deployment
```bash
# Deploy Edge Function
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh

# Test Health Endpoint
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health | jq
```

---

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
# Test Health Endpoint
curl -X GET \
  https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health \
  | jq

# Erwartete Response:
{
  "status": "ok",
  "timestamp": "2026-02-04T...",
  "version": "v1134-admin-auth-fix",
  "db_connected": true
}
```

### 2. Admin UI Testing

**Öffne Content Manager:**
```
https://coratiert.de/admin/content
```

**Teste ALLE Tabs (systematisch):**

| Tab | Endpoint | Status | Notizen |
|-----|----------|--------|---------|
| Books | `GET /books` | ☐ | Sollte Bücher auflisten |
| Tags | `GET /tags` | ☐ | Sollte Tags auflisten |
| Categories | `GET /categories` | ☐ | Sollte Kategorien auflisten |
| **Persons** | `GET /persons` | ☐ | **KRITISCH** - war betroffen |
| **Curators** | `GET /curators` | ☐ | **KRITISCH** - war betroffen |
| **Pages** | `GET /pages` | ☐ | **KRITISCH** - war betroffen |
| **Navigation** | `GET /v2/navigation/items` | ☐ | **KRITISCH** - war betroffen |
| Site Banner | `GET /site-config/banner` | ☐ | Sollte Banner laden |
| Sections | `GET /sections` | ☐ | Sollte Sections auflisten |

**Für JEDEN Tab:**
1. ✅ Tab öffnet ohne "disconnected from Neon"
2. ✅ Daten werden geladen
3. ✅ Keine Errors in Browser Console
4. ✅ Keine 500/503 in Network Tab

### 3. CRUD Operations Testing

**Teste mindestens EINEN kompletten CRUD-Zyklus:**

```javascript
// Im Persons Tab:
1. ✅ CREATE: Neue Person anlegen
   - Name, Slug, Bio ausfüllen
   - Speichern
   - Keine Errors

2. ✅ READ: Person in Liste sehen
   - Neu angelegte Person erscheint
   - Alle Felder korrekt angezeigt

3. ✅ UPDATE: Person bearbeiten
   - Name oder Bio ändern
   - Speichern
   - Änderungen sichtbar

4. ✅ DELETE: Person löschen
   - Soft delete (status = 'deleted')
   - Nicht mehr in Liste sichtbar
   - Aber noch in DB (SELECT * FROM persons WHERE id = '...')
```

### 4. Backend Logs prüfen

**Supabase Dashboard:**
1. Gehe zu: Edge Functions → `api` → Logs
2. Prüfe auf:
   - ❌ Auth Errors
   - ❌ SQL Errors
   - ❌ 500/503 Status Codes
   - ✅ Erfolgreiche Requests (200/201)

**Häufige Log-Patterns:**
```
✅ GOOD:
GET /books - 200 OK
POST /persons - 201 Created
PUT /curators/123 - 200 OK

❌ BAD:
GET /persons - 500 Internal Server Error
Error: verifyAdminToken is not a function
PostgresError: column "href" does not exist
```

---

## 🐛 Debugging Guide

### Problem: "disconnected from Neon" kommt zurück

**Symptom:** Admin Tab zeigt Fehler trotz Deployment

**Diagnose:**
```bash
# 1. Check Health Endpoint
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health | jq

# 2. Check spezifische Route
curl -X GET \
  -H "Authorization: Bearer <publicAnonKey>" \
  -H "X-Admin-Token: <admin_password>" \
  https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/persons \
  | jq

# 3. Check Backend Logs
# Supabase Dashboard → Edge Functions → api → Logs
```

**Mögliche Ursachen:**

1. **Auth Headers fehlen:**
   ```javascript
   // Check in Browser DevTools → Network
   // Request sollte haben:
   Authorization: Bearer eyJ...
   X-Admin-Token: <password>
   ```

2. **Route-Registration fehlt:**
   ```bash
   # Prüfe index.ts
   grep "registerPersonsRoutes" supabase/functions/api/index.ts
   # Sollte enthalten: verifyAdminToken
   ```

3. **Function Signature falsch:**
   ```typescript
   // persons.ts sollte haben:
   export function registerPersonsRoutes(
     app: Hono,
     queryDB: any,
     generateUniqueSlug: any,
     verifyAdminToken: any, // ← MUSS da sein!
     log: any
   )
   ```

4. **DB Connection Problem:**
   ```bash
   # Test direkt in Neon Console
   SELECT COUNT(*) FROM persons;
   ```

### Problem: Deployment fehlgeschlagen

**Symptom:** `supabase functions deploy` Fehler

**Diagnose:**
```bash
# Check für Syntax Errors
deno check supabase/functions/api/index.ts

# Check für Import Errors
grep -r "from './" supabase/functions/api/
# Alle Imports sollten .ts extension haben!
```

**Mögliche Ursachen:**

1. **Deno.json fehlt:**
   ```bash
   ls supabase/functions/api/deno.json
   # Sollte existieren!
   ```

2. **Import Paths falsch:**
   ```typescript
   // ❌ FALSCH:
   import { log } from './lib/logger';
   
   // ✅ RICHTIG:
   import { log } from './lib/logger.ts';
   ```

3. **Supabase CLI nicht eingeloggt:**
   ```bash
   supabase login
   ```

---

## 📝 Post-Deployment Tasks

### 1. Guidelines.md Update

Füge v1134 Changelog hinzu:

```bash
# Öffne Guidelines.md
code /guidelines/Guidelines.md

# Füge unter "Change Log" Abschnitt 10 hinzu:
```

```markdown
- **v1134 (2026-02-04 - ADMIN AUTH PARAMETER FIX):** Backend Route Parameter-Übergabe korrigiert -
  Navigation V2/Legacy, Curators, Persons, Pages Routes erhalten jetzt `verifyAdminToken` Parameter;
  Alle Route-Registrierungen in index.ts haben korrekte Parameter-Übergabe;
  Auth Guards für Admin-Endpoints implementiert;
  Function Signatures in allen Route-Files aligned mit index.ts;
  Behebt "disconnected from Neon" in Admin Tabs (war Parameter-Fehler, nicht DB-Problem);
  Health-Check Version: v1134-admin-auth-fix.
```

### 2. Git Commit

```bash
# Commit Deployment-Scripts
git add DEPLOY_BACKEND_V1134.sh \
        DEPLOYMENT_CHECKLIST_V1134.md \
        VERIFY_BACKEND_V1134.sh \
        DEPLOYMENT_GUIDE_V1134.md

git commit -m "chore(deployment): Add v1134 backend deployment scripts and documentation"

# Optional: Tag erstellen
git tag v1134-deployed
git push --tags
```

### 3. Monitor Production (24h)

**Tag 1 nach Deployment:**
- ☐ Check Supabase Logs alle 4h
- ☐ Check Admin UI funktioniert
- ☐ Check User Reports (falls vorhanden)

**Tag 2-7 nach Deployment:**
- ☐ Check Logs täglich
- ☐ Monitor Performance (Response Times)

---

## 🚨 Rollback Plan

### Wann Rollback?

**SOFORT Rollback wenn:**
- ❌ Health Check returnt nicht "ok"
- ❌ Mehr als 3 Admin Tabs zeigen Errors
- ❌ Backend Logs zeigen konstante 500 Errors
- ❌ CRUD Operations funktionieren nicht

### Rollback durchführen

**Option 1: Git Revert (Empfohlen)**
```bash
# Revert zu letztem Working State
git revert HEAD~1

# Re-deploy alte Version
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh

# Test Health
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health | jq
```

**Option 2: Manueller Hotfix**
```bash
# Checkout alte Version
git checkout <previous-commit-hash> -- supabase/functions/api/

# Deploy
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh
```

**Option 3: Backup aus Git Tag**
```bash
# Falls du v1133 Tag hast
git checkout v1133-backend -- supabase/functions/api/

# Deploy
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh
```

### Nach Rollback

1. ✅ Dokumentiere Rollback-Grund in Guidelines.md
2. ✅ Debug Problem in separatem Branch
3. ✅ Test Fix lokal
4. ✅ Re-deploy wenn Fix verifiziert

---

## ✅ Success Criteria

**Deployment gilt als erfolgreich wenn:**

| Kriterium | Status | Notizen |
|-----------|--------|---------|
| Health Check returnt "ok" | ☐ | |
| Alle 9 Admin Tabs laden | ☐ | |
| CRUD Operations funktionieren | ☐ | |
| Keine 500 Errors in Console | ☐ | |
| Backend Logs clean | ☐ | |
| Performance acceptable | ☐ | < 2s Response Time |

**Falls ALLE Kriterien erfüllt:**
```
🎉 DEPLOYMENT ERFOLGREICH!

v1134 ist jetzt in Production.
```

---

## 📚 Related Documentation

- `/guidelines/Guidelines.md` - Build-Regeln & Standards
- `/NEON_SCHEMA_READER.md` - DB Schema & Contracts
- `/docs/BACKEND_GOVERNANCE.md` - Backend Code-Regeln
- `/docs/API_INTEGRATION_CONTRACT.md` - API Verträge
- `/DEPLOYMENT_CHECKLIST_V1134.md` - Detaillierte Checklist

---

## 🆘 Support

**Bei Problemen:**
1. Check dieses Guide's Debugging Section
2. Check Backend Logs im Supabase Dashboard
3. Check Browser Console für Frontend Errors
4. Document Issue in Guidelines.md
5. Rollback wenn kritisch

**Kontakt:**
- Discord: #coratiert-dev
- Email: dev@coratiert.de
