# EMERGENCY FIX - API Routes 404 Error

## Problem
Backend hat 94 Routes mit `/api/` Prefix. Supabase stripped aber automatisch `/functions/v1/api`, deshalb kommen Requests als `/api/...` an statt `/...`

## Quick Fix (1 Minute)

```bash
cd /supabase/functions/server

# Backup
cp index.tsx index_BACKUP_v1133.tsx

# Fix ALL routes (removes /api/ prefix from all app.METHOD definitions)
sed -i "s|app\.get('/api/|app.get('/|g" index.tsx
sed -i "s|app\.post('/api/|app.post('/|g" index.tsx
sed -i "s|app\.put('/api/|app.put('/|g" index.tsx
sed -i "s|app\.patch('/api/|app.patch('/|g" index.tsx
sed -i "s|app\.delete('/api/|app.delete('/|g" index.tsx

# Copy to Edge Function deployment folder
cd /supabase/functions
cp -r server/index.tsx make-server-6e4a36b4/index.tsx

# Deploy
supabase functions deploy make-server-6e4a36b4 --project-ref blmyuoiedpdpvxoeciyh
```

## What it fixes
- ✅ Login 404 → 200
- ✅ Navigation 404 → 200  
- ✅ Banner 404 → 200
- ✅ All Admin routes 404 → 200

## Verification
```bash
curl https://blmyuoiedpdpvxoeciyh.supabase.co/functions/v1/api/health
# Should return: {"status":"ok","version":"v1124-audit-optional",...}
```
