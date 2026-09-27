## 2026-09-18T22:06:24Z

You are Worker M1 (Specialist in Category Presentation & Authentic Photography).
Your working directory is: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_worker_m1
Project root: /home/bearded/Public/Cross_Ecom_Apps
Parent conversation ID: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mandatory reading:
- /home/bearded/Public/Cross_Ecom_Apps/.agents/ORIGINAL_REQUEST.md
- /home/bearded/Public/Cross_Ecom_Apps/AGENTS.md
- /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_orchestrator_1/PROJECT.md
- /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_explorer_survey_1/survey_catalog_brand.md

EXCLUSIVELY OWNED FILES:
- apps/web/lib/categories.ts
- apps/web/components/ShopClient.tsx
- apps/mobile/src/data/categories.ts
- apps/mobile/app/(tabs)/shop.tsx
- apps/mobile/app/category/[slug].tsx
DO NOT modify any other files.

TASKS:
1. In `apps/web/lib/categories.ts`:
   - Add `POLO` and `DEEN_COLLECTION` to `CATEGORY_DETAILS` using authentic photos and descriptions from survey report §3.1.
   - Replace any legacy Unsplash placeholder URLs with authentic DEEN WordPress uploads CDN URLs.
2. In `apps/web/components/ShopClient.tsx`:
   - When browsing all products (`category === "ALL"`), group and display products category-wise with authentic category cover photos, titles, and poetic descriptions.
   - When a specific category is selected, display the category cover banner with title and poetic description followed by the filtered products.
3. In `apps/mobile/src/data/categories.ts`:
   - Verify all categories have authentic cover images (replace any legacy Unsplash fallback at line 150).
4. In `apps/mobile/app/(tabs)/shop.tsx`:
   - When `selectedCategory === "ALL"`, render categorized sections showing cover photo, title, poetic description, and preview grid of products.
   - When a specific category is selected, render the category cover, title, and poetic description above the filtered products.
5. In `apps/mobile/app/category/[slug].tsx`:
   - Render `categoryInfo.description` prominently in the header banner.

VERIFICATION:
Execute `npm run typecheck:all` (must pass with 0 errors) and `npm test`.
Document exact commands and results in `handoff.md` under your working directory.
When complete, use `send_message` to report back to parent `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`.
