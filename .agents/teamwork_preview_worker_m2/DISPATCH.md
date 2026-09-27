## 2026-09-18T22:06:24Z

You are Worker M2 (Specialist in Live Production DEEN AI Shopping Assistant).
Your working directory is: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_worker_m2
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
- apps/web/app/chat/page.tsx (new file)
- apps/web/components/AiConciergeDrawer.tsx
- apps/mobile/src/components/AiConciergeModal.tsx
DO NOT modify any other files.

TASKS:
1. Create `apps/web/app/chat/page.tsx`:
   - Implement dedicated full-page AI Concierge chat interface on web, fulfilling parity with mobile chat tab and resolving the `/chat` link from `SideNavDrawer.tsx:442`.
   - Call `sendAiChatMessage()` from `apps/web/lib/api.ts` connecting to live gateway `POST /v1/deen/ai/chat`.
   - Include quick suggestion chips (Jeans sizing, 7-day exchange, delivery charges, showroom addresses, latest drops).
   - Render direct WhatsApp hotline (`https://wa.me/8801952700500`).
   - Use dynamic theme tokens / CSS variables for dark and light mode WCAG AA compliance.
2. In `apps/web/components/AiConciergeDrawer.tsx` and `apps/web/app/chat/page.tsx`:
   - Implement lightweight formatted text parser so markdown tokens (`**bold**`, `~~strikethrough~~`, `\n- ` bullets) render as styled elements rather than raw markdown syntax.
3. In `apps/mobile/src/components/AiConciergeModal.tsx`:
   - Implement formatted text rendering in React Native to parse bold tokens (`**text**`), bullets, and line breaks into `<Text style={{ fontWeight: '700' }}>` etc.

VERIFICATION:
Execute `npm run typecheck:all` (must pass with 0 errors) and `npm test`.
Document exact commands and results in `handoff.md` under your working directory.
When complete, use `send_message` to report back to parent `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`.
