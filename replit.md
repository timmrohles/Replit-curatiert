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
    -   `UniversalSectionRenderer.tsx` and `sectionRegistry.tsx`: Central to dynamic content rendering, enabling flexible page layouts based on predefined section types (e.g., category_grid, hero, book_carousel).
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

## External Dependencies
-   **Database**: Neon PostgreSQL (connected via `NEON_DATABASE_URL` secret).
-   **File Storage**: Local filesystem for avatar uploads (`client/src/public/uploads/avatars/`), served via a static route `/uploads`.