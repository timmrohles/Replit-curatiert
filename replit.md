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

## Design System
- **Headline Font**: Fjalla One (self-hosted WOFF2, DSGVO-konform) - all h1-h6, uppercase, letter-spacing 0.02em
- **Body Font**: Inter (self-hosted WOFF2, weights 400/500/600/700) - all body text, buttons, links
- **Font files**: `client/src/public/fonts/` (no Google Fonts, fully self-hosted)
- **Tailwind**: `font-sans` = Inter (default), `font-headline` = Fjalla One
- **Brand Colors**: Blue Cerulean #247ba0, Coral #f25f5c, Gold #ffe066, Teal #70c1b3, Saffron #f4a261, Charcoal #2a2a2a, Beige #f7f4ef
- **Typography**: Fluid responsive sizes using CSS clamp() for h1-h6
- **CSS Variables**: --font-sans, --font-headline, --color-blue-cerulean, --color-coral-vibrant, etc.

## Recent Changes (2026-02-06)
- Self-hosted fonts (Fjalla One + Inter) installed, Google Fonts completely removed (DSGVO)
- Design system CSS variables added: brand colors, font families, fluid typography
- Admin navigation panel fixed: corrected API URLs, removed Supabase anonKey remnant
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
