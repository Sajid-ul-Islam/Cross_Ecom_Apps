# BRIEFING — 2026-09-19T04:06:50+06:00

## Mission
Enhance Category Presentation & Authentic Photography across Web and Mobile: update category metadata with authentic DEEN WordPress uploads CDN assets and poetic descriptions, group 'ALL' products category-wise, show category banners with descriptions on web & mobile, and verify typecheck & tests pass.

## 🔒 My Identity
- Archetype: Worker M1
- Roles: implementer, qa, specialist
- Working directory: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_worker_m1
- Original parent: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e
- Milestone: Category Presentation & Authentic Photography

## 🔒 Key Constraints
- EXCLUSIVELY OWNED FILES:
  - apps/web/lib/categories.ts
  - apps/web/components/ShopClient.tsx
  - apps/mobile/src/data/categories.ts
  - apps/mobile/app/(tabs)/shop.tsx
  - apps/mobile/app/category/[slug].tsx
- DO NOT modify any other files.
- Mandatory integrity: No cheating, real implementations, real state and behavior.
- WCAG 2.2 AA compliance, dark/light contrast, hit targets >= 44dp.
- Type safety: `npm run typecheck:all` must pass with 0 errors.
- Unit tests: `npm test` must pass.

## Current Parent
- Conversation ID: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e
- Updated: not yet

## Task Summary
- **What to build**:
  1. `apps/web/lib/categories.ts`: Add `POLO` and `DEEN_COLLECTION` to `CATEGORY_DETAILS` using authentic photos and descriptions from survey report §3.1. Replace legacy Unsplash URLs with authentic DEEN CDN URLs.
  2. `apps/web/components/ShopClient.tsx`: When `category === "ALL"`, group & display products category-wise with cover photos, titles, and poetic descriptions. When specific category selected, display cover banner with title and poetic description.
  3. `apps/mobile/src/data/categories.ts`: Verify authentic cover images, replace any legacy Unsplash fallback at line 150.
  4. `apps/mobile/app/(tabs)/shop.tsx`: When `selectedCategory === "ALL"`, render categorized sections showing cover photo, title, poetic description, and preview grid of products. When specific category selected, render category cover, title, poetic description above products.
  5. `apps/mobile/app/category/[slug].tsx`: Render `categoryInfo.description` prominently in header banner.
- **Success criteria**: All tasks implemented cleanly, zero regressions, typecheck:all 0 errors, npm test passing.
- **Interface contracts**: PROJECT.md, survey_catalog_brand.md, AGENTS.md

## Key Decisions Made
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: 0
- **Tests added/modified**: Pending

## Loaded Skills
- None requested in prompt

## Artifact Index
- DISPATCH.md — Dispatch assignment from parent
- BRIEFING.md — Situational awareness working memory
- progress.md — Liveness heartbeat
- handoff.md — Final handoff report
