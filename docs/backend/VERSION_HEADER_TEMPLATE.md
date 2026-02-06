# VERSION HEADER SYSTEM (v1138)

## WARUM VERSIONSNUMMERN?
- Sofort erkennbar welche Version deployed ist vs. lokal
- Debugging: "Welcher Stand läuft gerade?"
- Rollback-Safety: "Zurück zu v1135"
- Guidelines-Referenz: "Diese Änderung war v1138"

---

## TEMPLATE FÜR BACKEND FILES:

```typescript
/**
 * ==================================================================
 * FILENAME.ts - v1138 (SHORT_DESCRIPTION)
 * ==================================================================
 * 
 * Last Updated: 2026-02-05
 * 
 * CHANGES IN THIS VERSION:
 * - Change 1
 * - Change 2
 * 
 * Dependencies:
 * - lib/auth.ts (v1138)
 * - lib/db.ts (v1137)
 * 
 * ==================================================================
 */
```

---

## TEMPLATE FÜR FRONTEND FILES:

```typescript
/**
 * ComponentName.tsx - v1138 (SHORT_DESCRIPTION)
 * 
 * Last Updated: 2026-02-05
 * Changes: Brief description
 */
```

---

## KRITISCHE FILES DIE HEADER BRAUCHEN:

### Backend:
- ✅ /supabase/functions/api/index.ts (v1138) ← DONE
- ⚠️ /supabase/functions/api/lib/auth.ts (v1138) ← NEEDS UPDATE
- ⚠️ /supabase/functions/api/lib/logger.ts (v1137) ← NEEDS UPDATE
- ⚠️ /supabase/functions/api/lib/db.ts (v1137) ← NEEDS UPDATE
- ⚠️ /supabase/functions/api/routes/*.ts (v1138) ← ALL NEED HEADERS

### Frontend:
- ⚠️ /config/apiClient.ts (v1130) ← NEEDS UPDATE
- ⚠️ /components/admin/ContentManager.tsx ← NEEDS UPDATE
- ⚠️ /utils/api/index.ts ← NEEDS UPDATE

---

## VERSION-CHECK SCRIPT:

```bash
#!/bin/bash
# Find all files missing version headers

echo "🔍 FILES WITHOUT VERSION HEADERS:"
echo ""

# Backend
echo "📦 BACKEND:"
grep -L "v[0-9]" /workspace/supabase/functions/api/lib/*.ts || echo "  ✅ All lib/ files have versions"
grep -L "v[0-9]" /workspace/supabase/functions/api/routes/*.ts || echo "  ✅ All routes/ files have versions"

# Frontend
echo ""
echo "🎨 FRONTEND:"
find /workspace/components/admin -name "*.tsx" -exec grep -L "v[0-9]" {} \;
```

---

## NÄCHSTER SCHRITT:

1. **SOFORT:** Emergency redeploy mit fixem index.ts
2. **DANN:** Version headers zu kritischen Files hinzufügen
3. **LANGFRISTIG:** Version-Check als Pre-Deployment Hook

---

## GUIDELINES UPDATE (v1139):

Neue Regel zu Guidelines.md hinzufügen:

**2.7 Version Headers (Pflicht für Backend, empfohlen für Frontend)**

Alle Backend-Files MÜSSEN einen Version-Header haben:
```typescript
/**
 * filename.ts - vXXXX (Short Description)
 * Last Updated: YYYY-MM-DD
 */
```

**WARUM:**
- Deployed vs. Local Version erkennbar
- Debugging: Welcher Stand läuft?
- Rollback-Safety
- Guidelines-Referenz
