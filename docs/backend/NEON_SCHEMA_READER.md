# NEON_SCHEMA_READER.md
Version: v3 (verified, semi-technical)
Scope: public schema (Neon PostgreSQL)
Audience: Developers, Figma AI, future Chat contexts

---

## Purpose of this document

This file is the **canonical schema reader** for the coratiert project.

It is designed to:
- give instant orientation without pgAdmin or schema dumps
- explain *why* tables exist, not just *that* they exist
- make Admin / Publish behavior predictable
- serve as a stable handover artifact for new chats or tools (incl. Figma AI)

If behavior is unclear, **the database constraints in this document are the source of truth**.

---

## Core CMS (Pages & Sections)

### pages
Represents any routable page (static, category-driven, tag-driven, template-based).

Key fields:
- id (PK)
- slug
- type
- template_key

Publish logic:
- status
- visibility
- publish_at / unpublish_at

Notes:
- Pages can exist without sections
- Pages can reference templates via template_key

---

### page_sections
Defines *which sections appear on a page* and *where*.

Key fields:
- id (PK)
- page_id → pages.id
- zone (header | above_fold | main | footer)
- section_type
- config (jsonb)

Critical constraints:
- zone is strictly validated
- ordering is explicit via sort_order

Meaning:
A page is a layout shell; **sections are the real content units**.

---

### section_items
Atomic items inside a section (books, tags, categories, links, etc.).

Key fields:
- page_section_id → page_sections.id
- item_type
- sort_order
- data (jsonb)

Critical constraints (very important):
- Exactly ONE target is allowed:
  - target_category_id
  - target_tag_id
  - target_page_id
  - target_template_key
- target_type must match the chosen target

Why this matters:
Many Admin save errors are caused by violating these rules.
The DB will reject invalid combinations even if the UI allows them.

---

## Navigation System

### menu_items
Unified navigation model (header, mega menu, footer).

Key fields:
- label
- href / target_*
- parent_id (self-reference)
- location
- kind

Critical constraints:
- Parent required for non-root items
- Target consistency enforced
- Visibility & publish timing enforced

Rule of thumb:
If a menu item does not appear, check:
status → visibility → publish_at → target consistency

---

### mega_menu_columns
Layout helper for complex mega menus.

Defines:
- column structure
- width classes
- ordering

Purely presentational, but strictly validated.

---

## Books & Catalog

### books
Canonical book entity.

Key fields:
- title
- isbn / isbn13
- publisher_id
- status / visibility

Used by:
- offers
- tags
- awards
- curations

---

### offers
Price & availability snapshots from affiliates.

Notes:
- Multiple offers per ISBN
- Best offer resolved via views

Never query offers directly in UI — use views.

---

### v_books_with_best_offer(_public)
Resolved, denormalized read models.

Purpose:
- UI-safe
- publish-safe
- performance-safe

---

## Tags & Classification

### tags
Unified tagging system (manual, ONIX-derived, awards, themes).

Important fields:
- slug
- tag_type
- onix_scheme_id / onix_code

Critical constraint:
- ONIX tags must have exactly one ONIX identifier

---

### book_tags
Many-to-many relation between books and tags.

Tracks:
- origin (manual | onix | derived)
- confidence
- mapping lineage

---

## Awards System

### awards
Award definition (e.g. Deutscher Buchpreis).

### award_editions
Yearly editions of an award.

### award_outcomes / award_outcome_recipients
Results per edition (winner, shortlist, etc.).

### award_instances
Denormalized runtime state:
- publication phases
- scheduling
- current status

Important:
There are legacy / unused award tables prefixed with `_z_unused_`.
They are intentionally ignored.

---

## Curations & Creators

### curators
Human or brand curators.

### curations
Editorial groupings of books.

### curation_books
Ordered mapping of books inside a curation.

---

## Follow System

### followables
Generic follow target abstraction.

### user_follows
User → followable relation.

Legacy tables still exist but should not be extended.

---

## Publishing Rules (Global)

Almost all content tables share:
- status
- visibility
- publish_at
- unpublish_at
- deleted_at

Interpretation:
- status=draft → never visible
- visibility=hidden → admin-only
- publish_at in future → scheduled
- unpublish_at passed → auto-hidden

Most "it doesn't show up" bugs are explained here.

---

## Red Flags (Common Pitfalls)

- Admin UI allows invalid target combinations → DB rejects save
- Forgetting publish_at on visible content
- Mixing legacy follow tables with new followables
- Querying base tables instead of views
- Assuming NULL == optional (often forbidden by CHECKs)

---

## Final Note

This schema is **intentionally strict**.
It is designed to protect content integrity, even at the cost of stricter Admin behavior.

When in doubt:
👉 trust the constraints, not the UI.
