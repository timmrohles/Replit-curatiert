# WINDOWS FIX - Alle Route Prefixes entfernen

**Problem:** Alle Routes haben `/api/` Prefix, aber index.ts registriert sie direkt auf `app`.

**Lösung:** Ich fixe alle Route-Files einzeln (Windows-kompatibel).

## ✅ KRITISCHE STRUKTUR-FIXES ABGESCHLOSSEN:

✅ **index.tsx → index.ts** umbenannt (Backend hat kein JSX!)
✅ **deno.json entrypoint** gefixt (index.tsx → index.ts)
✅ **user-modules.ts** auskommentiert (Datei fehlt, registrations disabled)

## Status Route-Prefixes:

✅ **books.ts** - DONE (2 routes)
✅ **admin-auth.ts** - DONE (3 routes)  
⏳ **awards.ts** - TODO (14 routes)

**Total:** ~50+ Routes zu fixen

---

## Nach dem Fix deployen:

Öffne PowerShell und führe aus:

```powershell
cd C:\Ihr\Projekt\Pfad\supabase\functions\api
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh
```

Dann testen:

```powershell
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health
```