# BRIEFING — 2026-09-19T04:06:45+06:00

## Mission
Implement Customer Profile Analytics KPI Dashboard for Web and Mobile with WCAG 2.2 AA compliance, real metrics calculation from order history, zero-state support, and strict theme token adherence.

## 🔒 My Identity
- Archetype: implementer / specialist / qa
- Roles: implementer, qa, specialist
- Working directory: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_worker_m3
- Original parent: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e
- Milestone: Customer Profile Analytics KPI Dashboard (Worker M3)

## 🔒 Key Constraints
- EXCLUSIVELY OWNED FILES:
  - apps/web/components/CustomerAnalyticsKPIs.tsx (new file)
  - apps/web/app/profile/page.tsx
  - apps/mobile/src/components/profile/CustomerAnalyticsKPIs.tsx (new file)
  - apps/mobile/src/components/profile/AccountHeader.tsx
- DO NOT modify any other files.
- NO CHEATING: Genuine calculation of KPIs (Total Spend, Items Purchased, Completed Orders, Returns/Exchanges).
- WCAG 2.2 AA contrast (>= 4.5:1) in both dark and light modes.
- Mobile must use `useTheme()` dynamic tokens (`colors.card`, `colors.indigo`, `colors.emerald`, `colors.amber`, `colors.ink`, `colors.sub`), never static colors.
- Both mobile and web must support zero state for new/guest users.
- Verification: `npm run typecheck:all` (0 errors) and `npm test`.

## Current Parent
- Conversation ID: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e
- Updated: not yet

## Task Summary
- **What to build**: Customer Profile Analytics KPI Dashboard on web (`CustomerAnalyticsKPIs.tsx` + `profile/page.tsx`) and mobile (`CustomerAnalyticsKPIs.tsx` + `AccountHeader.tsx`).
- **Success criteria**: Genuine computation of 4 KPIs, clean zero state, dark/light WCAG AA contrast, accessibility attributes, typecheck passes, tests pass.
- **Interface contracts**: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_orchestrator_1/PROJECT.md

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: 0
- **Tests added/modified**: TBD

## Loaded Skills
- None requested

## Key Decisions Made
- Starting investigation and reading mandatory files.

## Artifact Index
- DISPATCH.md — Assignment instructions
- BRIEFING.md — Working memory
- progress.md — Liveness tracker
