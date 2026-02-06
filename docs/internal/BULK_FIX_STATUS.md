# BULK ROUTE PREFIX FIX - STATUS

**Target:** Remove `/api/` prefixes from all route definitions  
**Strategy:** Keep `/v2/` prefix in navigation_v2.ts intact

---

## ✅ ALREADY FIXED:

1. ✅ health.ts - No prefix (already correct)
2. ✅ admin-auth.ts - No prefix (already correct)
3. ✅ books.ts - FIXED (2 routes)
4. ✅ awards.ts - FIXED (14 routes)
5. ✅ tags.ts - FIXED (4 routes)

---

## 🔧 REMAINING (9 files):

| File | Routes | Status |
|------|--------|--------|
| navigation_legacy.ts | 3 | ⏳ TODO |
| navigation_v2.ts | 11 | ⏳ TODO (KEEP /v2/!) |
| site-config.ts | 5 | ⏳ TODO |
| categories.ts | 1 | ⏳ TODO |
| persons.ts | 3 | ⏳ TODO |
| curators.ts | 4 | ⏳ TODO |
| affiliates.ts | ? | ⏳ TODO |
| pages.ts | ? | ⏳ TODO |
| sections.ts | ? | ⏳ TODO |

---

## NEXT STEPS:

Ich fixe jetzt die verbleibenden 9 Files systematisch per fast_apply_tool oder write_tool.

**ETA:** 5-10 Minuten für alle 9 Files
