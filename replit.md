# coratiert.de - Curated Book Recommendation Platform

## Overview
coratiert.de is a curated book recommendation platform designed to offer a personalized and enriched book discovery experience. It features a robust backend for content management and a dynamic frontend for showcasing books, curators, and editorial content. The platform aims to provide a highly performant and user-friendly experience, emphasizing content curation, intelligent recommendations, and compliance with data privacy standards. Key capabilities include comprehensive book data management, dynamic page generation, administrative tools for content and user management, and advanced tracking for content performance.

## User Preferences
- Prioritize global CSS over inline styles for performance
- German language for UI text (default locale: de-de)
- DSGVO-compliant: no external font loading, self-hosted only
- Directory-based internationalization (not subdomains)

## System Architecture
The platform is built with a modern web stack, featuring a React frontend and an Express.js backend.

**Frontend (client/)**:
-   **Framework**: React + Vite (TypeScript)
-   **Routing**: React Router v6
-   **Data Fetching**: TanStack Query
-   **Styling**: Tailwind CSS with a custom theme, global CSS utility classes, and self-hosted fonts (Fjalla One for headlines, Inter for body text) to ensure DSGVO compliance. Fluid responsive typography is implemented using `clamp()`.
-   **Core Components**:
    -   `App.tsx`: Main application entry with lazy-loaded routes.
    -   `UniversalSectionRenderer.tsx` and `sectionRegistry.tsx`: Central to dynamic content rendering. **8 valid section types**: hero (Above Fold), category_grid (Above Fold/Main), book_carousel, recipient_category_grid, storefronts, events, genre_categories, supporters (all Main only).
    -   `CMSHomepage.tsx` and `DynamicPage.tsx`: Handle CMS-driven content for the homepage and dynamic pages with nested paths.
    -   `apiClient.ts`: Centralized API client.

**Backend (server/)**:
-   **Framework**: Express.js, serving on port 5000.
-   **Database Integration**: `pg` Pool for connecting to PostgreSQL.
-   **API**: Over 80 API routes, all prefixed with `/api/`, covering:
    -   Public data access (books, navigation, page resolution).
    -   Admin functionalities (auth, CRUD operations for content types like curators, awards, tags, pages, sections).
    -   Content enrichment and tracking endpoints.
-   **Authentication**: Token-based admin authentication using `X-Admin-Token` header.
-   **Key Files**: `index.ts` (server entry), `routes.ts` (all API routes with admin guards), `db.ts` (database connection).

**Core Features & Design Patterns**:
-   **Dynamic Content Management**: Utilizes a CMS approach where pages and sections are dynamically rendered based on database configurations. `UniversalSectionRenderer` is the single source of truth for section types.
-   **Book Enrichment**: Implements a system for detecting indie publishers, self-published books, and displaying award badges based on configurable rules and data.
-   **Section Scheduling & Tracking**: Sections can be scheduled for publication/unpublication and have view/click limits, enabling targeted content delivery and impression tracking. Includes bot/crawler filtering and rate limiting for accurate tracking.
-   **Visibility Management**: Granular control over the visibility of tags and awards, syncing backend state with frontend display.
-   **Curator Management**: Integrated curator selection for content sections, including avatar uploads and verified badges.
-   **Robust Type Safety**: Extensive use of TypeScript with Zod schemas for API validation, ensuring data integrity and reducing runtime errors.
-   **Admin Panel**: `/sys-mgmt-xK9/content-manager` for managing all content, including login at `/sys-mgmt-xK9/login`.

## Navigation Management
-   **Admin UI**: `AdminNavigationV2.tsx` - Streamlined admin panel for managing navigation items with location filter tabs (Header/Footer/Alle).
-   **Location-based filtering**: Navigation items have a `location` field (header/footer/mobile/sidebar). Admin can filter and manage items per location.
-   **Footer API**: `GET /api/navigation/footer` returns footer navigation groups with children, consumed by the `Footer.tsx` component.
-   **API-driven Footer**: The Footer component renders dynamically from the `/api/navigation/footer` endpoint with a hardcoded `FALLBACK_FOOTER_GROUPS` constant for graceful degradation.
-   **Seed endpoint**: `POST /api/navigation/admin/seed-footer` (admin-guarded) initializes footer navigation items in the database.
-   **Fallback export**: Admin panel includes a "Fallback exportieren" button that copies current navigation JSON to clipboard.
-   **Database table**: `menu_items` on Neon DB stores all navigation items with columns: id, parent_id, name, label, slug, path, href, icon, kind, location, scope, panel_layout, clickable, level, display_order, visible, status, etc.

## Author Verification Workflow
-   **Author Request Flow**: Users can request author access from their dashboard ("Autor werden" in the sidebar). They search for their name in the ONIX book database, select a match (or indicate they're new), and submit a request.
-   **Admin Approval**: Admins review requests in the Content Manager under "Autoren-Anträge" tab. Approving creates an author profile and enables all author modules (`author_storefront`, `author_books`, etc.) via the `user_modules` table.
-   **ONIX Matching**: If the author exists in the books DB, the match name is stored in `author_profiles.onix_match_name`. If not yet in the DB, matching happens later when a book is published via ONIX.
-   **Database Tables**: `author_profiles` (user-linked author data), `author_requests` (request workflow with status tracking), `user_modules` (per-user feature access).
-   **Security Note**: Author request endpoints currently accept userId from the client; proper user authentication is needed before production use.

## Mobile Navigation
-   **Unified Bottom Nav**: A single dark-themed mobile bottom navigation bar (`.nav-mobile` CSS class) is rendered globally in `Header.tsx` for all pages.
-   **Nav Items (in order)**: Favoriten (with badge counter), Bewertungen, Bookstore, Neuigkeiten, Hell/Dunkel toggle, Mehr (links to /dashboard).
-   **Active State**: Route-based highlighting using `location.pathname` checks.
-   **FavoritesPanel**: Opens from the Favoriten nav button. Includes "Favoriten für Bookstore übernehmen" action button.
-   **Terminology**: UI displays "Bookstore" instead of "Storefront" (internal code still uses storefront naming).
-   **CSS**: `.nav-mobile` uses CSS variables (`--nav-bg: #2a2a2a`, `--nav-text: #ffffff`). `.favorites-panel-container` has `bottom: 56px` on mobile to keep nav visible.
-   **Z-index**: Nav at `z-[210]`, FavoritesPanel overlay at `z-[200]`, panel content at `z-[201]`.

## Internationalization (i18n) & Regionalization

### URL Structure
-   **Pattern**: Directory-based locale prefixes: `/de-de/`, `/de-at/`, `/de-ch/`
-   **Default**: `de-de` (Deutschland). Root `/` redirects to `/de-de/`.
-   **Admin Routes**: No locale prefix (`/sys-mgmt-xK9/*` stays unchanged).
-   **Route Structure**: All public routes are nested under `/:locale` in `App.tsx` via `LocaleLayout`.

### Key Files
-   `client/src/utils/LocaleContext.tsx`: `LocaleProvider`, `useLocale()` hook, `prefixWithLocale()`, region configs
-   `client/src/components/layout/LocaleLayout.tsx`: Route wrapper that extracts `:locale` param and provides `LocaleProvider`
-   `client/src/i18n/i18n.ts`: i18next configuration
-   `client/src/i18n/locales/de.json`: German translations
-   `client/src/i18n/locales/en.json`: English translations (template)
-   `client/src/utils/formatting.ts`: Locale-aware date, number, currency formatting
-   `client/src/components/layout/RegionSwitcher.tsx`: Region switcher UI component
-   `client/src/components/common/LocaleLink.tsx`: Locale-aware `<Link>` wrapper

### Navigation
-   `useSafeNavigate()` (both `utils/routing.tsx` and `hooks/useSafeNavigate.tsx`) auto-prefix paths with current locale
-   Admin paths (`/sys-mgmt-xK9/*`) are excluded from locale prefixing
-   `LocaleLink` component wraps `<Link>` with auto locale prefixing for any remaining Link usages

### Database
-   `regions` table stores per-region configuration (locale, currency, affiliate partners, ONIX feed config, legal page references)
-   Currently 3 regions: de-de (active, default), de-at, de-ch (both inactive, ready for activation)
-   API endpoint: `GET /api/regions` (list), `GET /api/regions/:locale` (single)
-   Affiliates endpoint supports `?region=de-de` parameter for region-specific partner filtering

### Translation Pattern
-   Use `useTranslation()` hook from `react-i18next` in components
-   Keys are namespaced: `header.*`, `footer.*`, `mobileNav.*`, `dashboard.*`, `favorites.*`, `common.*`, etc.
-   Components already converted: Header, Footer, FavoritesPanel, ModularUserDashboard, DashboardLanding

### Adding a New Region
1. Insert row in `regions` table with locale, affiliate_config, onix_feed_config
2. Add region config in `LocaleContext.tsx` SUPPORTED_LOCALES
3. Set `is_active = true` in regions table
4. Region switcher auto-displays active regions

## External Dependencies
-   **Database**: Neon PostgreSQL (connected via `NEON_DATABASE_URL` secret).
-   **File Storage**: Local filesystem for avatar uploads (`client/src/public/uploads/avatars/`), served via a static route `/uploads`.