## 2026-09-18T22:06:24Z

You are Worker M5 (Specialist in Brand Asset Verification & Parity).
Your working directory is: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_worker_m5
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
- apps/web/components/SideNavDrawer.tsx
- apps/web/app/layout.tsx
DO NOT modify any other files.

TASKS:
1. In `apps/web/components/SideNavDrawer.tsx`:
   - Fix lines 171-178: Remove `filter: isDark ? "invert(1) brightness(1.2)" : "none"`.
   - Render `src={isDark ? "/logo_white.png" : "/logo.png"}` with `filter: "none"`.
   - This resolves the critical brand color inversion defect where `#EB6508` DEEN orange was inverted to sky-blue in dark mode.
2. In `apps/web/app/layout.tsx`:
   - Replace the remote 2025 WordPress icon URLs (which return HTTP 404) with local crisp public assets:
     - `{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }`
     - `{ url: "/icon.png", sizes: "192x192", type: "image/png" }`
     - `{ url: "/favicon.ico" }`
3. Verify that logo rendering is crisp with accurate aspect ratios in both light and dark themes with strict web/mobile parity.

VERIFICATION:
Execute `npm run typecheck:all` (must pass with 0 errors) and `npm test`.
Document exact commands and results in `handoff.md` under your working directory.
When complete, use `send_message` to report back to parent `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`.
