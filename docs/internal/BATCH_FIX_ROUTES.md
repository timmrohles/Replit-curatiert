# BATCH FIX - Route Prefixes v1134

## Problem
Alle Route-Dateien haben noch `/api/` Prefixes hardcoded, was zu 404 Errors führt.

## Lösung
Führe dieses Bash-Command aus um alle Prefixes auf einmal zu fixen:

```bash
# Gehe in das Routes-Verzeichnis
cd /workspace/coratiert-storefront/supabase/functions/api/routes

# Fix ALL route files at once (GNU sed)
for file in *.ts; do
  sed -i \
    -e "s#app\.get('/api/#app.get('/#g" \
    -e "s#app\.post('/api/#app.post('/#g" \
    -e "s#app\.put('/api/#app.put('/#g" \
    -e "s#app\.patch('/api/#app.patch('/#g" \
    -e "s#app\.delete('/api/#app.delete('/#g" \
    "$file"
  echo "✅ Fixed: $file"
done

echo ""
echo "=============================="
echo "✅ All route prefixes fixed!"
echo "=============================="
```

## Verify
```bash
# Should return 0 matches:
grep -r "app\.get('/api/" /workspace/coratiert-storefront/supabase/functions/api/routes/

# Should show routes WITHOUT /api/:
grep -r "app\.get('/" /workspace/coratiert-storefront/supabase/functions/api/routes/ | head -20
```

## Files that will be fixed
- ✅ tags.ts (already done)
- ✅ curators.ts (already done)
- ✅ navigation_v2.ts (already done - /v2/ prefix kept)
- ✅ books.ts (already done)
- ⏳ awards.ts
- ⏳ categories.ts
- ⏳ persons.ts
- ⏳ affiliates.ts
- ⏳ pages.ts
- ⏳ sections.ts
- ⏳ admin-auth.ts
- ⏳ navigation_legacy.ts
- ⏳ site-config.ts
- ⏳ user-modules.ts
- ⏳ health.ts

## Special Cases
- **navigation_v2.ts**: Prefixes `/api/v2/...` → `/v2/...` (DONE manually)
- **health.ts**: May not have `/api/` prefix (check first)

## Next Steps
1. Run the sed command above
2. Verify with grep
3. Update index.ts to pass generateUniqueSlug to curators/tags
4. Deploy: `supabase functions deploy api`
5. Test: `/tags` endpoint should work
