# 🔧 ROUTE PREFIX FIX - Batch Instructions

## Problem:

Alle Routes definieren Pfade mit `/api/` Prefix:
```typescript
app.get('/api/awards', ...)  ❌ FALSCH
```

Aber index.ts registriert sie direkt auf `app` (ohne basePath):
```typescript
registerAwardsRoutes(app, queryDB, log);
```

**Ergebnis:**
- Frontend ruft: `https://.../functions/v1/api/awards`
- Supabase routet zu: `/awards` (stripped `/functions/v1/api`)
- Route erwartet: `/api/awards`
- **404 Not Found!**

---

## Lösung:

**Entferne `/api/` aus ALLEN Route-Definitionen:**

```typescript
// ❌ ALT
app.get('/api/awards', ...)

// ✅ NEU
app.get('/awards', ...)
```

---

## 📋 Files zu fixen (10 Remaining):

### 1. awards.ts (~14 routes)
**Suchen:** `/api/awards`  
**Ersetzen:** `/awards`

**Routes:**
- `/api/awards` → `/awards`
- `/api/awards/:id` → `/awards/:id`
- `/api/book-awards/:bookId` → `/book-awards/:bookId`
- etc.

---

### 2. navigation_legacy.ts (~3 routes)
**Suchen:** `/api/navigation`  
**Ersetzen:** `/navigation`

---

### 3. navigation_v2.ts (~10 routes)
**Suchen:** `/api/v2/navigation`  
**Ersetzen:** `/v2/navigation`

**WICHTIG:** V2 behält `/v2/` aber verliert `/api/`!

---

### 4. site-config.ts (~5 routes)
**Suchen:** `/api/site-config`  
**Ersetzen:** `/site-config`

---

### 5. tags.ts (~4 routes)
**Suchen:** `/api/tags`  
**Ersetzen:** `/tags`

---

### 6. categories.ts (~1 route)
**Suchen:** `/api/categories`  
**Ersetzen:** `/categories`

---

### 7. persons.ts (~3 routes)
**Suchen:** `/api/persons`  
**Ersetzen:** `/persons`

---

### 8. curators.ts (~4 routes)
**Suchen:** `/api/curators`  
**Ersetzen:** `/curators`

---

### 9. affiliates.ts (mehrere routes)
**Suchen:** `/api/affiliates`  
**Ersetzen:** `/affiliates`

---

### 10. pages.ts (unbekannt)
**Suchen:** `/api/pages`  
**Ersetzen:** `/pages`

---

### 11. sections.ts (unbekannt)
**Suchen:** `/api/sections`  
**Ersetzen:** `/sections`

---

## ⚠️ AUSNAHMEN (NICHT fixen!):

### health.ts
**Bereits korrekt:**
```typescript
app.get('/health', ...)  ✅ Kein /api/ Prefix
```

### books.ts
**Bereits gefixt:**
```typescript
app.get('/books', ...)  ✅ Kein /api/ Prefix
```

### admin-auth.ts
**Bereits gefixt:**
```typescript
app.post('/admin/auth/login', ...)  ✅ Kein /api/ Prefix
```

---

## 🚀 Nach dem Fix:

**Deploy:**
```bash
cd supabase/functions/api
supabase functions deploy api --project-ref blmyuoiedpdpvxoeciyh
```

**Test:**
```bash
# Health Check
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health

# Login Test
curl -X POST https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test"}'
```

---

## 📊 Erwartete Ergebnisse:

### ✅ VORHER (404):
```
Frontend: GET /functions/v1/api/awards
→ Supabase strips: /functions/v1/api
→ Hono receives: /awards
→ Route expects: /api/awards
→ 404 Not Found ❌
```

### ✅ NACHHER (200):
```
Frontend: GET /functions/v1/api/awards
→ Supabase strips: /functions/v1/api
→ Hono receives: /awards
→ Route expects: /awards
→ 200 OK ✅
```
