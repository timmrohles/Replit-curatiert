# coratiert.de - Curated Book Recommendation Platform

## Overview
coratiert.de is a curated book recommendation platform designed for personalized and enriched book discovery. It combines a robust backend for content management with a dynamic frontend for showcasing books, curators, and editorial content. The platform aims for high performance, user-friendliness, intelligent recommendations, and data privacy, with a focus on content curation. Key capabilities include comprehensive book data management, dynamic page generation, administrative tools, and advanced content performance tracking. The project envisions significant market potential by offering a unique, curated experience in the book recommendation space.

## User Preferences
- Prioritize global CSS over inline styles for performance
- German language for UI text (default locale: de-de)
- DSGVO-compliant: no external font loading, self-hosted only
- Directory-based internationalization (not subdomains)

## System Architecture
The platform is built with a modern web stack, featuring a React frontend and an Express.js backend.

**Frontend (client/)**:
-   **Framework**: React + Vite (TypeScript)
-   **Styling**: Tailwind CSS with a custom theme and self-hosted fonts. Fluid responsive typography is implemented. Design system uses CSS custom properties for all tokens (spacing `--space-1` to `--space-16`, radius `--radius-none/sm/md/lg/xl/2xl/full`, typography `--text-xs` to `--text-3xl` with line-heights, fluid `--fluid-h1` to `--fluid-h6`/`--fluid-body`/`--fluid-body-small`/`--fluid-body-xs`, avatars `--avatar-sm/md/lg`, shadows `--shadow-2xs` to `--shadow-2xl` with dark mode overrides, semantic text colors `--ds-text-primary/secondary/tertiary/inverse`, match badges `--match-*`, badge semantics `--badge-*`, button sizes `--button-size-*`). Tailwind config maps all token scales (spacing, radius, shadows, colors, fonts, fluid font sizes). All card/section components use token-based colors with proper dark mode overrides — no hardcoded shadow or color values in component CSS classes. DS components in `client/src/components/design-system/` (37+ components) wrap shadcn `ui/` primitives. Microcopy constants in `client/src/constants/copy.ts` map to i18n keys with `COPY_TONE` style guide.
-   **Dynamic Content**: `UniversalSectionRenderer` and `sectionRegistry` enable dynamic rendering of various content sections (e.g., hero, category grids, carousels). `CMSHomepage` and `DynamicPage` handle CMS-driven content.

**Backend (server/)**:
-   **Framework**: Express.js
-   **Database Integration**: `pg` Pool for PostgreSQL.
-   **API**: Extensive API for public data, admin functionalities (CRUD), and content tracking.
-   **Authentication**: Provider-agnostic OIDC system using `openid-client` and `passport`, with session management via `connect-pg-simple`. Supports multiple OIDC providers (Replit Auth, Auth0, custom) and normalizes user claims. Role-based access control (`user`, `admin`, `super_admin`) is implemented, including an impersonation system for super-admins.

**Core Features & Design Patterns**:
-   **Dynamic Content Management**: Pages and sections are rendered dynamically based on database configurations. Page resolve endpoint supports both explicit `section_items.book_id` references and query-based book resolution (by tag IDs, category IDs, award definition IDs) for `book_carousel`/`horizontal_row` sections.
-   **Book Enrichment & Badge System**: Unified badge system across ALL book displays (BookCard, BookCarouselItem, EditorialBookCard, Kurationen, etc.). Single source of truth: `BookEnrichmentBadges` component (`client/src/components/book/BookEnrichmentBadges.tsx`). Every book list/card that shows books MUST use this component for consistent enrichment display.
    -   **Badge Design**: Black semi-transparent circles (`rgba(0,0,0,0.75)`), white icons, `shadow-md`, click-to-open modals with full details.
    -   **Badge Types & Icons**:
        -   Award Wins (outcome = `winner` | `special`): Custom `LaurelWreathIcon` (laurel wreath SVG)
        -   Nominations (outcome = `shortlist` | `longlist` | `nominee` | `finalist`): `Gem` icon from lucide-react
        -   Indie Publisher (`is_indie=true`, `indie_type='indie-verlag'`): `Bird` icon
        -   Self-Published (`is_indie=true`, `indie_type='selfpublisher'`): `PenLine` icon
        -   Pressestimmen (reviews): `Quote` icon — supports both `string` and `Array<{source, quote}>` formats
    -   **Data Source**: `enrichBooksWithAwards()` function in `server/routes.ts` — queries `award_outcome_recipients` table joined with `award_outcomes`, `award_editions`, `awards`. Returns `award_details[]` array with `{name, year, outcome}` per book. Also enriches with `onix_tag_ids` from `book_onix_tags`.
    -   **Outcome Labels**: `winner` → "Gewinner", `shortlist` → "Shortlist", `longlist` → "Longlist", `nominee` → "Nominiert", `finalist` → "Finalist", `special` → "Sonderpreis".
    -   **ONIX Award Tags**: Separate `Award` icon button for ONIX database tag badges (distinct from enrichment badges). Shows tag overlay with like buttons.
    -   **Rule**: All Kurationen, carousels, book lists, and card components MUST use `BookEnrichmentBadges` for awards/indie/reviews. No inline badge implementations allowed.
-   **Book Score Calculation** (`server/scoreCalculation.ts`): Automated scoring system that calculates `award_score`, `media_score`, `curation_score`, `structure_bonus`, `base_score`, `total_score`, `is_indie`, `indie_type`, and `is_hidden_gem` for all books. Runs via: (1) `startScoreCron()` called at server startup — initial recalculation after 5s, then every 24h; (2) Event-based triggers for single-book recalc on award add/delete and curation book add; (3) Admin endpoint `POST /api/admin/books/recalculate-scores` for manual trigger. Award data from `award_recipients` + `award_outcomes` tables with `result_status` field. Media mentions from `extracted_books.book_id`. Curation count from `curation_books`. All queries wrapped in try/catch for graceful handling of missing tables.
-   **Book Sorting Modes**: Backend sort modes applied to section book queries and book lists. Used in page resolve endpoint (`/api/pages/:slug/resolve`) and `/api/books`:
    -   `relevance` (default): Sort by `base_score` descending
    -   `newest`: Sort by `created_at` descending
    -   `most-awarded` / `awarded`: Sort by `award_score` descending (books with most awards first)
    -   `popular`: Sort by `user_score` descending
    -   `manual`: Sort by `sort_order` ascending (admin-defined order)
    -   `hidden-gems`: Filter for books with `is_hidden_gem=true` and high enrichment but low visibility
-   **Content Scheduling & Tracking**: Features for scheduling content sections, setting view/click limits, and bot filtering for accurate analytics.
-   **Curator Management**: Integrated curator selection with profile management.
-   **Type Safety**: Extensive use of TypeScript with Zod for API validation.
-   **Admin Panel**: Comprehensive Content Manager for all administrative tasks.
-   **Navigation Management**: Admin UI for managing navigation items with location-based filtering.
-   **Author Verification Workflow**: User-initiated author access requests with admin approval and integration with ONIX database matching.
-   **Mobile Navigation**: Unified dark-themed bottom navigation bar.
-   **Internationalization (i18n)**: Directory-based locale prefixes (`/de-de/`, `/en-gb/`) with `de-de` as default. Translation files in `client/src/i18n/locales/de.json` and `en.json` with 20+ namespaces (common, header, footer, hero, homepage, cookies, matching, bookDetail, review, cms, bookComponents, subscription, curators, curations, creator, storefront, latestReviews, etc.). All public-facing components use `useTranslation()` / `t()` from `react-i18next`. Admin components remain German-only.
-   **Dashboard & Feed System**: Restructured user dashboard with hierarchical sidebar navigation (5 groups: Übersicht, Meine Inhalte, Community, Einnahmen, Einstellungen + optional Autor:in). Uses `DashboardLayout` (auth check, module loading, sidebar + Outlet) with real React Router nested routes under `/:locale/dashboard/*`. Each section has its own URL for deep-linking and browser history. Old pseudo-routing (ModularUserDashboard) removed; redirects preserved for backward compatibility. Components: `DashboardSidebar.tsx`, `DashboardLayout.tsx`, `DashboardPageHeader.tsx`, `DashboardEmptyState.tsx`, `DashboardOverview.tsx`. Earnings section split into 3 sub-pages under `client/src/pages/dashboard/earnings/`. Profile split into "Meine Daten" (`/dashboard/profil`, private account settings) and "Öffentliches Profil" (`/dashboard/oeffentliches-profil`, public curator profile). Follower page (`/dashboard/follower`) under Community group. Duplicate creator/author pages consolidated — single source of truth per object. i18n keys in `dashboardNav` and `dashboardOverview` namespaces.
-   **User Bookstore & Curations System**: Users create thematic book collections (Kurationen) and public bookstore profiles.
-   **Events System**: Users create and manage events, displayed in dashboards and public profiles.
-   **Category Cards System**: Admin-managed category cards for homepage display.
-   **Affiliate Creator Program**: Users register for an affiliate program, including identity, tax, and payout details. Creator analytics are provided.
-   **Content/Podcast Book Extraction System**: Users add RSS feeds, and an AI (OpenRouter/Mistral) extracts book mentions from episode descriptions with sentiment analysis. A book matching system links extracted books to existing database entries.
-   **Affiliate Tracking System**: Platform-internal creator links with click tracking and session-based attribution (48h TTL).
-   **Revenue-Share Attribution System**: Dual-source attribution for curator commissions (REFERRAL and CURATION) with strict priority rules (REFERRAL always wins).

**Security**:
-   **Security Headers**: Helmet middleware for CSP, X-Frame-Options, HSTS, etc.
-   **Rate Limiting**: Implemented on login and API endpoints.
-   **Upload Protection**: Authenticated uploads for avatars.
-   **SQL Injection Prevention**: Whitelisting for table names in slug generation.
-   **XSS Prevention**: DOMPurify for sanitizing `dangerouslySetInnerHTML` content.
-   **Admin Route Protection**: `requireAdminGuard` for administrative endpoints.

**SEO**:
-   **robots.txt**: Dynamically served, allowing major search engines and blocking admin paths and AI crawlers.
-   **Sitemap**: Dynamic XML sitemap including static pages, CMS pages, and profiles.

## External Dependencies
-   **Database**: Neon PostgreSQL
-   **File Storage**: Local filesystem for avatar uploads