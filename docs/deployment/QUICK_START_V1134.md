# 🚀 QUICK START - Backend Deployment v1134

> **TL;DR:** Backend-Fix ist fertig. Deployment in 3 Minuten.

---

## ⚡ 3-Minuten-Deployment

```bash
# 1. Scripts ausführbar machen
chmod +x VERIFY_BACKEND_V1134.sh DEPLOY_BACKEND_V1134.sh

# 2. Pre-Deployment Check
bash VERIFY_BACKEND_V1134.sh
# Erwarte: ✅ DEPLOYMENT READY

# 3. Deploy Backend
bash DEPLOY_BACKEND_V1134.sh
# Bestätige mit 'y'
# Erwarte: ✅ Health check passed!

# 4. Test Admin UI
# Öffne: https://coratiert.de/admin/content
# Teste: Persons, Curators, Pages, Navigation Tabs
# Erwarte: Keine "disconnected from Neon" Errors
```

---

## ✅ Was wurde gefixt?

**Problem:** Admin Tabs zeigten "disconnected from Neon"  
**Root Cause:** Route Parameter-Übergabe falsch  
**Fix:** `verifyAdminToken` Parameter hinzugefügt

**Betroffene Routes:**
- ✅ Navigation V2/Legacy
- ✅ Curators
- ✅ Persons  
- ✅ Pages

---

## 🔍 Quick Verification

### Schritt 1: Health Check
```bash
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health | jq
```

**Erwarte:**
```json
{
  "status": "ok",
  "version": "v1134-admin-auth-fix",
  "db_connected": true
}
```

### Schritt 2: Test Admin Tab
1. Öffne https://coratiert.de/admin/content
2. Klicke auf **"Persons"** Tab
3. Erwarte: Liste von Personen, **KEINE** Fehler

### Schritt 3: Test CRUD
1. Erstelle neue Person
2. Speichere
3. Erwarte: Erfolg-Meldung, **KEINE** "Name and slug are required" Fehler

---

## 🐛 Falls Probleme auftreten

### Problem: Verification Script zeigt Fehler
```bash
# Zeige exakte Fehler-Meldung
bash VERIFY_BACKEND_V1134.sh

# Suche nach:
❌ FEHLER: ...
```
→ Siehe [DEPLOYMENT_GUIDE_V1134.md](DEPLOYMENT_GUIDE_V1134.md) Debugging Section

### Problem: "disconnected from Neon" bleibt
```bash
# Check Backend Logs
# Supabase Dashboard → Edge Functions → api → Logs

# Suche nach:
# - Auth Errors
# - SQL Errors  
# - 500 Status Codes
```
→ Siehe [DEPLOYMENT_GUIDE_V1134.md](DEPLOYMENT_GUIDE_V1134.md) "Problem: disconnected from Neon kommt zurück"

### Problem: Deployment fehlgeschlagen
```bash
# Re-login Supabase
supabase login

# Retry Deployment
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh
```

---

## 🚨 Rollback (falls nötig)

```bash
# Revert zu vorheriger Version
git revert HEAD~1

# Re-deploy
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh

# Test
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health | jq
```

---

## 📝 Nach dem Deployment

1. ✅ Update Guidelines.md mit v1134 Changelog
2. ✅ Commit Deployment-Scripts
3. ✅ Monitor Logs für 24h

**Guidelines Update:**
```markdown
- **v1134 (2026-02-04 - ADMIN AUTH PARAMETER FIX):** Backend Route Parameter-Übergabe korrigiert -
  Navigation V2/Legacy, Curators, Persons, Pages Routes erhalten jetzt `verifyAdminToken` Parameter;
  Alle Route-Registrierungen in index.ts haben korrekte Parameter-Übergabe;
  Auth Guards für Admin-Endpoints implementiert;
  Function Signatures in allen Route-Files aligned mit index.ts;
  Behebt "disconnected from Neon" in Admin Tabs (war Parameter-Fehler, nicht DB-Problem);
  Health-Check Version: v1134-admin-auth-fix.
```

---

## 📚 Detaillierte Docs

- [DEPLOYMENT_GUIDE_V1134.md](DEPLOYMENT_GUIDE_V1134.md) - Vollständiger Guide
- [DEPLOYMENT_CHECKLIST_V1134.md](DEPLOYMENT_CHECKLIST_V1134.md) - Detaillierte Checklist
- [/guidelines/Guidelines.md](/guidelines/Guidelines.md) - Build-Regeln

---

## 🎯 Success Checklist

Nach Deployment sollte gelten:

- ☐ Health Check returnt `"status": "ok"`
- ☐ Alle 9 Admin Tabs laden ohne Fehler
- ☐ CRUD Operations funktionieren
- ☐ Keine Errors in Browser Console
- ☐ Backend Logs zeigen keine 500 Errors

**Falls ALLE ✅:** 🎉 Deployment erfolgreich!
