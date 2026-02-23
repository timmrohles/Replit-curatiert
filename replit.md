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
-   **Book Enrichment**: System for identifying indie/self-published books and displaying award badges.
-   **Content Scheduling & Tracking**: Features for scheduling content sections, setting view/click limits, and bot filtering for accurate analytics.
-   **Curator Management**: Integrated curator selection with profile management.
-   **Type Safety**: Extensive use of TypeScript with Zod for API validation.
-   **Admin Panel**: Comprehensive Content Manager for all administrative tasks.
-   **Navigation Management**: Admin UI for managing navigation items with location-based filtering.
-   **Author Verification Workflow**: User-initiated author access requests with admin approval and integration with ONIX database matching.
-   **Mobile Navigation**: Unified dark-themed bottom navigation bar.
-   **Internationalization (i18n)**: Directory-based locale prefixes (`/de-de/`, `/en-gb/`) with `de-de` as default. Translation files in `client/src/i18n/locales/de.json` and `en.json` with 20+ namespaces (common, header, footer, hero, homepage, cookies, matching, bookDetail, review, cms, bookComponents, subscription, curators, curations, creator, storefront, latestReviews, etc.). All public-facing components use `useTranslation()` / `t()` from `react-i18next`. Admin components remain German-only.
-   **Dashboard & Feed System**: Restructured user dashboard with hierarchical sidebar navigation (5 groups: Übersicht, Meine Inhalte, Community, Einnahmen, Einstellungen + optional Autor:in). Uses `DashboardLayout` (auth check, module loading, sidebar + Outlet) with real React Router nested routes under `/:locale/dashboard/*`. Each section has its own URL for deep-linking and browser history. Old pseudo-routing redirects preserved for backward compatibility. Components: `DashboardSidebar.tsx`, `DashboardLayout.tsx`, `DashboardPageHeader.tsx`, `DashboardEmptyState.tsx`, `DashboardOverview.tsx`. Earnings section split into 3 sub-pages under `client/src/pages/dashboard/earnings/`: `EarningsOverview.tsx` (KPIs + revenue explanation), `EarningsAffiliate.tsx` (registration form with identity/tax/payout/legal accordions), `EarningsStatistics.tsx` (wraps CreatorAnalytics). i18n keys in `dashboardNav` and `dashboardOverview` namespaces.
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