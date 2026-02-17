# coratiert.de - Curated Book Recommendation Platform

## Overview
coratiert.de is a curated book recommendation platform offering personalized and enriched book discovery. It combines a robust backend for content management with a dynamic frontend for showcasing books, curators, and editorial content. The platform aims for high performance and user-friendliness, focusing on content curation, intelligent recommendations, and data privacy. Key capabilities include comprehensive book data management, dynamic page generation, administrative tools for content and user management, and advanced content performance tracking.

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
-   **Styling**: Tailwind CSS with a custom theme and self-hosted fonts (Fjalla One, Inter) for DSGVO compliance. Fluid responsive typography is implemented.
-   **Core Components**: `UniversalSectionRenderer` and `sectionRegistry` for dynamic content rendering (supporting 8 section types: hero, category_grid, book_carousel, recipient_category_grid, storefronts, events, genre_categories, supporters). `CMSHomepage` and `DynamicPage` handle CMS-driven content.

**Backend (server/)**:
-   **Framework**: Express.js, serving on port 5000.
-   **Database Integration**: `pg` Pool for PostgreSQL.
-   **API**: Over 80 routes prefixed with `/api/` for public data access, admin functionalities (CRUD for various content types), and content tracking.
-   **Authentication**: Token-based admin authentication using `X-Admin-Token`.

**Core Features & Design Patterns**:
-   **Dynamic Content Management**: Pages and sections are dynamically rendered based on database configurations, driven by `UniversalSectionRenderer`.
-   **Book Enrichment**: System for detecting indie/self-published books and displaying award badges.
-   **Section Scheduling & Tracking**: Content sections can be scheduled, have view/click limits, and include bot/crawler filtering for accurate tracking.
-   **Visibility Management**: Granular control over the display of tags and awards.
-   **Curator Management**: Integrated curator selection with avatar uploads and verified badges.
-   **Robust Type Safety**: Extensive use of TypeScript with Zod schemas for API validation.
-   **Admin Panel**: `/sys-mgmt-xK9/content-manager` for comprehensive content management, with login at `/sys-mgmt-xK9/login`.
-   **Navigation Management**: Admin UI (`AdminNavigationV2.tsx`) allows managing navigation items with location-based filtering (Header/Footer/Mobile/Sidebar), powered by `menu_items` table and `/api/navigation/footer` endpoint.
-   **Author Verification Workflow**: Users request author access; admins approve, creating author profiles and enabling author modules. Integrates with ONIX database matching.
-   **Mobile Navigation**: Unified dark-themed bottom navigation bar (`.nav-mobile`) with sections like Favoriten, Bewertungen, Bookstore, Neuigkeiten, Hell/Dunkel toggle, and Mehr (dashboard).
-   **Internationalization (i18n)**: Directory-based locale prefixes (e.g., `/de-de/`) with `de-de` as default. Handled by `LocaleProvider`, `LocaleLayout`, `i18next`, and locale-aware utilities. `regions` table stores per-region configurations.
-   **Dashboard & Feed System**: Personalized user dashboard with a feed-first design (`DashboardFeed.tsx`). Users can customize (reorder, toggle visibility/public status) 9 feed section types (e.g., reading_list, favorites, followed_authors). Persistence is handled via localStorage.
-   **User Bookstore & Curations System**: Users create thematic book collections (Kurationen) and set up public bookstore profiles with details and social links. Public profiles are accessible at `/bookstore/:slug`. Includes content reporting functionality.
-   **Events System**: Users create and manage events (lesung, buchclub, etc.) via the dashboard (`UserEvents.tsx`). Events are displayed in the dashboard feed and public bookstore profiles. Admins can manage all events via a dedicated tab.
-   **Category Cards System**: Admin-managed category cards with images, titles, links, colors, and display ordering. Stored in `category_cards` table. Public API at `/api/category-cards?location=homepage`, admin CRUD at `/api/admin/category-cards`. Displayed on homepage via `CategoryCardsGrid` component using `DSGenreCard` in a carousel. Admin UI in ContentManager "category-cards" tab (`CategoryCardsManager.tsx`) with Unsplash search integration.

## External Dependencies
-   **Database**: Neon PostgreSQL (via `NEON_DATABASE_URL`).
-   **File Storage**: Local filesystem for avatar uploads, served via `/uploads` static route.