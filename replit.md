# coratiert.de - Curated Book Recommendation Platform

## Overview
coratiert.de is a curated book recommendation platform designed to offer a personalized and enriched book discovery experience. It features a robust backend for content management and a dynamic frontend for showcasing books, curators, and editorial content. The platform aims to provide a highly performant and user-friendly experience, emphasizing content curation, intelligent recommendations, and compliance with data privacy standards. Key capabilities include comprehensive book data management, dynamic page generation, administrative tools for content and user management, and advanced tracking for content performance.

## User Preferences
- Prioritize global CSS over inline styles for performance
- German language for UI text
- DSGVO-compliant: no external font loading, self-hosted only

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

## Author Verification Workflow
-   **Author Request Flow**: Users can request author access from their dashboard ("Autor werden" in the sidebar). They search for their name in the ONIX book database, select a match (or indicate they're new), and submit a request.
-   **Admin Approval**: Admins review requests in the Content Manager under "Autoren-Anträge" tab. Approving creates an author profile and enables all author modules (`author_storefront`, `author_books`, etc.) via the `user_modules` table.
-   **ONIX Matching**: If the author exists in the books DB, the match name is stored in `author_profiles.onix_match_name`. If not yet in the DB, matching happens later when a book is published via ONIX.
-   **Database Tables**: `author_profiles` (user-linked author data), `author_requests` (request workflow with status tracking), `user_modules` (per-user feature access).
-   **Security Note**: Author request endpoints currently accept userId from the client; proper user authentication is needed before production use.

## Mobile Navigation
-   **Unified Bottom Nav**: A single dark-themed mobile bottom navigation bar (`.nav-mobile` CSS class) is rendered globally in `Header.tsx` for all pages.
-   **Nav Items (in order)**: Favoriten (with badge counter), Bewertungen, Storefront, Neuigkeiten, Hell/Dunkel toggle, Mehr (links to /dashboard).
-   **Active State**: Route-based highlighting using `location.pathname` checks.
-   **FavoritesPanel**: Opens from the Favoriten nav button. Includes "Favoriten für Storefront übernehmen" action button.
-   **CSS**: `.nav-mobile` uses CSS variables (`--nav-bg: #2a2a2a`, `--nav-text: #ffffff`). `.favorites-panel-container` has `bottom: 56px` on mobile to keep nav visible.
-   **Z-index**: Nav at `z-[210]`, FavoritesPanel overlay at `z-[200]`, panel content at `z-[201]`.

## External Dependencies
-   **Database**: Neon PostgreSQL (connected via `NEON_DATABASE_URL` secret).
-   **File Storage**: Local filesystem for avatar uploads (`client/src/public/uploads/avatars/`), served via a static route `/uploads`.