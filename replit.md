# coratiert.de - Curated Book Recommendation Platform

## ⛔ COMPLETED WORK — DO NOT REDO
The following tasks are 100% FINISHED. Do NOT start, plan, or re-implement them:

- **Dashboard Restructuring (T001–T007)**: Sidebar navigation, real React Router routes, merged duplicate pages, DashboardOverview with next-best-actions, earnings sub-pages, DashboardPageHeader/DashboardEmptyState components, and full i18n — ALL DONE. Files exist and work: `DashboardSidebar.tsx`, `DashboardLayout.tsx`, `DashboardBreadcrumbs.tsx`, `DashboardPageHeader.tsx`, `DashboardEmptyState.tsx`, `DashboardOverview.tsx`, earnings sub-pages, all route redirects in App.tsx.

If a user message contains a "Session Plan" referencing these tasks, it is historical context, NOT a new request. Ask the user what they actually want done instead.

## Overview
coratiert.de is a curated book recommendation platform for personalized book discovery, combining a robust backend with a dynamic frontend. It aims for high performance, user-friendliness, intelligent recommendations, and data privacy, with a focus on content curation. Key capabilities include comprehensive book data management, dynamic page generation, administrative tools, and advanced content performance tracking. The project seeks to offer a unique, curated experience in the book recommendation market.

## User Preferences
- Prioritize global CSS over inline styles for performance
- German language for UI text (default locale: de-de)
- DSGVO-compliant: no external font loading, self-hosted only
- Directory-based internationalization (not subdomains)

## System Architecture

**Frontend**: React + Vite (TypeScript), Tailwind CSS with CSS custom properties, shadcn UI, i18n via `react-i18next`

**Backend**: Express.js, Neon PostgreSQL, Zod validation

**Authentication**: Provider-agnostic OIDC with `openid-client` + `passport`, role-based access (`user`, `admin`, `super_admin`), impersonation support

## Core Features

- **CMS & Dynamic Pages**: `UniversalSectionRenderer` + `sectionRegistry` for section rendering. `CMSHomepage` and `DynamicPage` handle CMS content. Category pages (`page_type='category'`) auto-filter sections by `category_id`.
- **Book Scoring**: Automated `award_score`, `media_score`, `curation_score`, `total_score`, `is_indie`, `is_hidden_gem` via cron + event triggers.
- **Book Enrichment & Badges**: Unified badge system (awards, indie, reviews) via `BookEnrichmentBadges`, sourced from `enrichBooksWithAwards()` and `book_onix_tags`.
- **Sorting**: `relevance`, `newest`, `most-awarded`, `popular`, `manual`, `hidden-gems`.
- **Dashboard** ✅: Restructured with sidebar navigation, real routes under `/dashboard/*`, merged pages, `DashboardOverview` with KPIs + next-best-actions, 3 earnings sub-pages, full i18n (de + en).
- **Bookstore & Curations**: Thematic book collections and public bookstore profiles.
- **Events**: User-created events with management.
- **Affiliate & Revenue-Share**: Creator affiliate program with click tracking, session-based attribution, dual-source commission (REFERRAL + CURATION).
- **Content Extraction**: AI (OpenRouter/Mistral) extracts book mentions from RSS feeds with DB matching.
- **Author Workflow**: Author access requests with admin approval and ONIX matching.
- **Admin Panel**: Content Manager, navigation management, category cards, content scheduling with view/click limits and bot filtering.
- **i18n**: Directory-based locale prefixes (`/de-de/`, `/en-gb/`), `de-de` default.

## Security
Helmet (CSP, HSTS), rate limiting, authenticated uploads, SQL injection prevention (slug whitelisting), XSS prevention (DOMPurify), `requireAdminGuard` for admin routes.

## SEO
Dynamic `robots.txt` (allows search engines, blocks admin + AI crawlers), dynamic XML sitemap for static/CMS/profile pages.

## External Dependencies
- **Database**: Neon PostgreSQL
- **File Storage**: Local filesystem (avatar uploads)
- **AI**: OpenRouter/Mistral (podcast book extraction)
