# coratiert.de - Curated Book Recommendation Platform

## Overview
A curated book recommendation platform (coratiert.de) migrated from Supabase Edge Functions to Express.js on Replit. The app uses React with React Router for the frontend and Express.js for the backend, connected to a Neon PostgreSQL database with 188,854 books and 60+ tables.

## Architecture
- **Frontend**: React + Vite (TypeScript), React Router v6, TanStack Query
- **Backend**: Express.js with 80+ API routes, serving on port 5000
- **Database**: Neon PostgreSQL (external, connected via NEON_DATABASE_URL secret)
- **Auth**: Admin token-based auth (X-Admin-Token header, stored in localStorage)
- **Styling**: Tailwind CSS with custom theme, global CSS utility classes in index.css

## Project Structure
```
client/src/
├── App.tsx              # Main app with React Router routes (lazy-loaded)
├── index.css            # Global styles, CSS variables, utility classes
├── config/apiClient.ts  # Central API client (base: /api)
├── components/
│   ├── admin/           # Admin dashboard components
│   ├── book/            # Book detail, cards, carousel
│   ├── cms/             # CMS homepage (CMSHomepage), dynamic pages (DynamicPage)
│   ├── creator/         # Curator/author storefronts
│   ├── favorites/       # Favorites context/provider
│   ├── homepage/        # Homepage sections
│   ├── layout/          # Header, Footer, InfoBar
│   ├── sections/        # Section renderers (UniversalSectionRenderer, sectionRegistry)
│   ├── seo/             # SEO head, structured data
│   ├── shop/            # Shop/cart functionality
│   └── tags/            # Tag routing, categories
├── lib/
│   └── normalizeNavigation.ts  # Navigation V2 normalizer (defensive)
├── pages/               # Route pages (admin, sections, etc.)
├── types/
│   ├── normalize.ts     # Type normalization helpers
│   └── page-resolve.ts  # PageSection types
└── utils/
    ├── api/             # API module (index.ts, curators.ts, pages.ts, etc.)
    ├── apiSchemas.ts    # Zod schemas for Curator, Book, Page, etc.
    └── routing.ts       # Safe navigation utilities

server/
├── index.ts             # Express server entry
├── routes.ts            # All API routes (80+), admin auth guards
├── db.ts                # Database connection (pg pool)
└── vite.ts              # Vite dev server integration
```

## Key Files
- `server/routes.ts` - All Express API routes with admin auth guards
- `server/db.ts` - Database connection using pg Pool
- `client/src/components/sections/sectionRegistry.tsx` - SINGLE SOURCE OF TRUTH for section types
- `client/src/components/sections/UniversalSectionRenderer.tsx` - Renders sections from registry
- `client/src/components/cms/CMSHomepage.tsx` - CMS-driven homepage (root path /)
- `client/src/components/cms/DynamicPage.tsx` - Dynamic CMS pages (/:slug, /:slug/:subslug)
- `client/src/lib/normalizeNavigation.ts` - Navigation V2 data normalizer
- `client/src/App.tsx` - React Router setup with lazy-loaded pages

## Section Rendering
- **UniversalSectionRenderer** is the correct renderer (uses sectionRegistry)
- **SectionRenderer** (legacy) only supports 5 types - DO NOT USE
- Supported section types: category_grid, recipient_category_grid, topic_tags_grid, hero, creator_carousel, book_carousel, book_grid, book_list_row, book_featured, text_block, image_gallery, video_gallery, image, video

## API Routes
All routes prefixed with `/api/`:
- `/api/health` - Health check with DB schema info
- `/api/navigation` - Public navigation menu (V2 schema)
- `/api/books`, `/api/books/search` - Book listing and search
- `/api/pages/resolve?path=/` - CMS page resolver
- `/api/admin/auth/login`, `/verify`, `/change-password` - Admin auth
- `/api/curators`, `/api/awards`, `/api/tags`, `/api/persons` - Content CRUD
- `/api/admin/pages`, `/api/admin/sections` - Admin CMS management
- `/api/site-config/banner` - Site banner configuration
- All admin routes protected with `requireAdminGuard`

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
- **CSS Utility Classes** (in index.css): text-cerulean, bg-coral, tag-pill, favorite-badge, btn-admin-login, logo-spine-*, etc.

## Recent Changes (2026-02-11)
- **Section Scheduling & Tracking**: Moved publish_at/unpublish_at from pages to sections level
  - page_sections now has: publish_at, unpublish_at, max_views, max_clicks, current_views, current_clicks columns
  - PageComposer section editor: datetime-local pickers for publish/unpublish dates
  - Preset duration buttons: 1 Woche, 2 Wochen, 1 Monat, 3 Monate, 6 Monate + Reset
  - View/click limits (max_views, max_clicks) for paid carousel ad preparation
  - Public page resolve filters sections by scheduling dates and view/click limits
  - POST /api/sections/:id/track endpoint for incrementing views/clicks (no auth)
  - SectionCard badges show "Geplant" and limit progress indicators
  - Backend PATCH /api/admin/sections/:id accepts publish_at, unpublish_at, max_views, max_clicks
- **Tracking Protection System**: Bot, crawler, and admin click filtering for accurate impression tracking
  - tracking_settings table: bot_user_agents array, rate_limit_window_minutes, rate_limit_max_views/clicks, excluded_admin_ips
  - POST /api/sections/:id/track: Bot User-Agent filtering, admin IP exclusion, IP-based rate limiting (in-memory cache)
  - GET/PATCH /api/admin/tracking-settings: Admin CRUD for all tracking filter settings
  - GET /api/admin/my-ip: Shows admin's current IP for easy exclusion
  - AdminSettings UI: Tracking-Schutz section with editable bot list, rate limit controls, admin IP list, "add my IP" button
  - trust proxy enabled, req.ip used for reliable IP detection behind proxies
  - 30+ default bot agents (Googlebot, Bingbot, AhrefsBot, SemrushBot, curl, wget, etc.)
- **LikeButton coral fix**: Changed --vibrant-coral (non-existent) to --color-coral-vibrant with fallback #f25f5c
- **Search bar CSS**: Added --search-bg, --search-text, --search-border, --search-icon variables

## Previous Changes (2026-02-10)
- **Tag & Award Visibility Management**: Full backend-synced visibility system
  - ONIX Tags CRUD: POST/DELETE /api/onix-tags, PATCH /api/onix-tags/:id/visibility with admin auth
  - Tag type mapping (DB English → Frontend German): award→Auszeichnung, topic→Motiv (MVB), genre→Genre (THEMA), audience→Zielgruppe, feature→Ausstattung, publisher_cluster→Herkunft, + 4 more types
  - Reverse mapping for POST/create operations (German → DB English)
  - Awards.tag_id column: auto-created linked tag (tag_type='award') when new award is created
  - Award visibility toggle (PATCH /api/awards/:id/visibility) syncs both awards.visibility and linked tags.visible
  - GET /api/awards maps visibility string to boolean `visible` field for frontend
  - Book card components (BookCard, BookCarouselItem, EditorialBookCard) all filter tags by visible flag
  - AwardsManager: Eye/EyeOff visibility toggle, linked tag_id display
  - Fixed frontend API paths from /api/admin/awards to /api/awards (correcting pre-existing mismatch)
- **Curator Picker in PageComposer**: Replaced generic "Curator Type" dropdown (Redaktion/Community/Extern) with real curator picker that loads from `/api/curators`. Shows avatar, name, focus/theme, verified badge. Stores curatorId, curatorName, curatorAvatar, curatorFocus, curatorBio, isVerified in section config. Applied to both creator_carousel and book_carousel section editors.
- **CreatorCarouselSection**: Now passes curatorBio from section config to CuratedBookSection for biography display
- **Tag pill event isolation**: All tag pills, categories, bio, curation reason, and sort sections use `<button type="button">` with `stopPropagation()` and `select-none` to prevent selection cascade
- **Avatar Upload**: Backend route `/api/admin/upload/avatar` with multer (JPG/PNG/WebP/GIF, max 5MB), stored in `client/src/public/uploads/avatars/`, served via `/uploads` static route. Auth enforced before file acceptance.
- **Verified Curator Badge**: Blue checkmark (BadgeCheck) next to curator name in CreatorHeader, CreatorCarousel, CuratedBookSection, CreatorCarouselSection, AuthorStorefront. DB `visible` column maps to `verified` in frontend.
- **Biography Word Limit**: Max 100 words with real-time counter in CuratorsManager, border turns coral at 90+ words
- CuratorsManager: File upload button + URL fallback for avatar, BadgeCheck icon replaces Star for verified status
- Backend `mapCuratorRow` now returns both `visible` and `verified` fields for compatibility

## Previous Changes (2026-02-09)
- **Achieved zero TypeScript compilation errors** across entire codebase (down from 482)
- Fixed 368+ errors across 82 files using parallel subagents
- Key type fix patterns applied:
  - Zod passthrough schema properties (displayName, onixCode, tagType, visible, silo) cast with `as any`
  - Missing React hook imports added (useState, useRef, useCallback, useMemo, useReducer, memo)
  - Set iteration fixed with `Array.from()` instead of spread
  - FrontendEntityType: added "storefront" and "topic" values
  - navigate() calls fixed for useSafeNavigate (expects string args)
  - Event interface renamed to StorefrontEvent (avoids DOM Event clash)
  - fetchpriority → fetchPriority (React camelCase)
- Fixed featureFlags.ts: replaced Deno reference with process.env, typed FEATURE_FLAGS as Record<string, boolean>
- Fixed Container: added maxWidth prop (deprecated alias for width)
- Fixed Typography: passes through id/href/onClick props to rendered element
- Fixed SectionRenderer: HeroSection wrapped in className div
- Fixed PublicStorefront: StorefrontEvent type, 'autor:innen' tab, non-null assertions
- Installed @types/react-helmet for tag page components
- Fixed all TypeScript type errors in admin components (AdminAwards, AdminBooksNeon_v2, AdminNavigationV2, AwardsManager)
- Fixed AuthorStorefront: StorefrontEvent type, tab union types, Heading/Text props
- Added missing React hook imports (useState, useRef, useEffect) to CreatorEventsSection
- Extended TypographyProps with style prop, passed through Heading and Text components
- Extended Award type with AwardType, saveAward, deleteAward, uploadAwardLogo exports in api/awards.ts
- Added clickable/scope fields to NavigationItem interface for AdminNavigationV2
- Added editorial override fields to AdminBooksNeon_v2 Book interface
- Fixed lucide-react title prop compatibility (wrapped icons in span elements)
- Replaced 3000+ inline styles with global CSS classes in core files (App.tsx, Login.tsx, Header.tsx, Footer.tsx, TopicTagsGrid)
- Added 26+ utility classes to index.css (tag-pill, text-cerulean, bg-coral, etc.)
- Migrated CMSHomepage and DynamicPage from legacy SectionRenderer to UniversalSectionRenderer
- DynamicPage now supports nested paths (/:slug/:subslug) for category navigation
- Added normalizeHref to normalizeNavigation.ts - ensures all hrefs start with /
- Fixed all LSP errors in ContentManager.tsx (Curator type, moveSection, Page type)
- Fixed all 26 LSP errors in server/routes.ts (parseIdParam type signature)
- Added requireAdminGuard to 9 unprotected admin routes (modules, affiliates, book-affiliates)
- Admin session persistence: Login checks existing valid token and auto-redirects
- Admin verify endpoint accepts token via header and body

## Previous Changes (2026-02-06)
- Self-hosted fonts (Fjalla One + Inter) installed, Google Fonts completely removed (DSGVO)
- Design system CSS variables added: brand colors, font families, fluid typography
- Admin navigation panel fixed: corrected API URLs, removed Supabase anonKey remnant
- Migrated backend from Hono/Deno (Supabase Edge Functions) to Express.js
- Replaced all Supabase URL construction with local `/api` endpoints
- Fixed 54+ files importing from supabase/info
- Fixed 100+ broken relative import paths across components

## Admin Access
- Admin panel: `/sys-mgmt-xK9/content-manager`
- Admin login: `/sys-mgmt-xK9/login`
- Uses localStorage keys: `admin_neon_token`, `admin_token`

## User Preferences
- Prioritize global CSS over inline styles for performance
- German language for UI text
- DSGVO-compliant: no external font loading, self-hosted only
