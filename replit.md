# coratiert.de - Curated Book Recommendation Platform

## Overview
A curated book recommendation platform (coratiert.de) migrated from Supabase Edge Functions to Express.js on Replit. The app uses React with React Router for the frontend and Express.js for the backend, connected to a Neon PostgreSQL database with 188,854 books and 60+ tables.

## Architecture
- **Frontend**: React + Vite (TypeScript), React Router v6, TanStack Query
- **Backend**: Express.js with 80+ API routes, serving on port 5000
- **Database**: Neon PostgreSQL (external, connected via NEON_DATABASE_URL secret)
- **Auth**: Admin token-based auth (X-Admin-Token header, stored in localStorage)
- **Styling**: Tailwind CSS with custom theme

## Project Structure
```
client/src/
├── App.tsx              # Main app with React Router routes
├── config/apiClient.ts  # Central API client (base: /api)
├── components/
│   ├── admin/           # Admin dashboard components
│   ├── book/            # Book detail, cards, carousel
│   ├── cms/             # CMS homepage, dynamic pages
│   ├── creator/         # Curator/author storefronts
│   ├── favorites/       # Favorites context/provider
│   ├── homepage/        # Homepage sections
│   ├── layout/          # Header, Footer, InfoBar
│   ├── sections/        # Section renderers
│   ├── seo/             # SEO head, structured data
│   ├── shop/            # Shop/cart functionality
│   └── tags/            # Tag routing, categories
├── pages/               # Route pages (admin, sections, etc.)
└── utils/               # Utilities (routing, API, theme)

server/
├── index.ts             # Express server entry
├── routes.ts            # All API routes (80+)
├── db.ts                # Database connection (pg pool)
└── vite.ts              # Vite dev server integration
```

## Key Files
- `server/routes.ts` - All Express API routes converted from Hono/Deno
- `server/db.ts` - Database connection using pg Pool
- `client/src/config/apiClient.ts` - Frontend API client (base URL: `/api`)
- `client/src/App.tsx` - React Router setup with lazy-loaded pages

## API Routes
All routes prefixed with `/api/`:
- `/api/health` - Health check with DB schema info
- `/api/navigation` - Public navigation menu
- `/api/books`, `/api/books/search` - Book listing and search
- `/api/admin/auth/login`, `/verify`, `/change-password` - Admin auth
- `/api/curators`, `/api/awards`, `/api/tags`, `/api/persons` - Content CRUD
- `/api/pages`, `/api/sections` - CMS pages and sections
- `/api/site-config/banner` - Site banner configuration
- Plus 60+ more admin CRUD endpoints

## Environment
- `NEON_DATABASE_URL` - Neon PostgreSQL connection string (secret)
- `SESSION_SECRET` - Session secret (secret)

## Recent Changes (2026-02-06)
- Migrated backend from Hono/Deno (Supabase Edge Functions) to Express.js
- Replaced all Supabase URL construction with local `/api` endpoints
- Fixed 54+ files importing from supabase/info
- Fixed 100+ broken relative import paths across components
- Installed missing deps: react-helmet, motion, sonner
- Replaced figma:asset imports with placeholder paths
- Made FavoritesContext hook resilient (no-throw on missing provider)

## Admin Access
- Admin panel: `/sys-mgmt-xK9/content-manager`
- Admin login: `/sys-mgmt-xK9/login`
- Uses localStorage keys: `admin_neon_token`, `admin_token`
