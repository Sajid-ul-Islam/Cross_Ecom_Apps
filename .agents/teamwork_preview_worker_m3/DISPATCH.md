## 2026-09-18T22:06:24Z
You are Worker M3 (Specialist in Customer Profile Analytics KPI Dashboard).
Your working directory is: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_worker_m3
Project root: /home/bearded/Public/Cross_Ecom_Apps
Parent conversation ID: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mandatory reading:
- /home/bearded/Public/Cross_Ecom_Apps/.agents/ORIGINAL_REQUEST.md
- /home/bearded/Public/Cross_Ecom_Apps/AGENTS.md
- /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_orchestrator_1/PROJECT.md
- /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_explorer_survey_2/survey_assistant_kpi.md

EXCLUSIVELY OWNED FILES:
- apps/web/components/CustomerAnalyticsKPIs.tsx (new file)
- apps/web/app/profile/page.tsx
- apps/mobile/src/components/profile/CustomerAnalyticsKPIs.tsx (new file)
- apps/mobile/src/components/profile/AccountHeader.tsx
DO NOT modify any other files.

TASKS:
1. Create `apps/web/components/CustomerAnalyticsKPIs.tsx`:
   - Executive 4-card analytics KPI grid:
     1. Total Spend (৳): Sum of order totals for non-cancelled orders, formatted with currency `৳`.
     2. Total Items Purchased: Total item quantities across customer orders.
     3. Total Completed Orders: Count of orders with status `completed` or `delivered`.
     4. Return / Exchange Status: Count of active or processed returns/exchanges.
   - Support clean zero-state for new/guest users (`৳0`, 0 items, 0 orders, 0 returns).
   - Enforce WCAG 2.2 AA contrast (>= 4.5:1) in both dark and light modes.
2. In `apps/web/app/profile/page.tsx`:
   - Import and render `CustomerAnalyticsKPIs` directly beneath the profile header / account summary.
3. Create `apps/mobile/src/components/profile/CustomerAnalyticsKPIs.tsx`:
   - Matching 4-card KPI grid in React Native using `useTheme()` dynamic tokens (`colors.card`, `colors.indigo`, `colors.emerald`, `colors.amber`, `colors.ink`, `colors.sub`).
   - Set accessible `accessibilityRole="summary"` or `accessibilityRole="text"` and hitSlop.
4. In `apps/mobile/src/components/profile/AccountHeader.tsx`:
   - Import and render `CustomerAnalyticsKPIs` beneath the user profile credentials.

VERIFICATION:
Execute `npm run typecheck:all` (must pass with 0 errors) and `npm test`.
Document exact commands and results in `handoff.md` under your working directory.
When complete, use `send_message` to report back to parent `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`.
