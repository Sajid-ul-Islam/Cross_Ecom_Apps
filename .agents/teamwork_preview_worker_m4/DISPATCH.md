## 2026-09-18T22:06:24Z

You are Worker M4 (Specialist in Responsive Hero Video Scaling).
Your working directory is: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_worker_m4
Project root: /home/bearded/Public/Cross_Ecom_Apps
Parent conversation ID: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mandatory reading:
- /home/bearded/Public/Cross_Ecom_Apps/.agents/ORIGINAL_REQUEST.md
- /home/bearded/Public/Cross_Ecom_Apps/AGENTS.md
- /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_orchestrator_1/PROJECT.md
- /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_explorer_survey_3/survey_video_orders.md

EXCLUSIVELY OWNED FILES:
- apps/web/components/HeroSlider.tsx
- apps/mobile/src/components/MotionHero.tsx
DO NOT modify any other files.

TASKS:
1. In `apps/web/components/HeroSlider.tsx`:
   - Widescreen banner video assets (`Denim-Web-Banner_1920x840pxl.mp4`) have native resolution 1920x840 (16:7 / 2.2857:1).
   - In `.hero-slider-clean` styles (lines 186-213):
     - For desktop (`@media (min-width: 769px)`), change `aspect-ratio: 21 / 9` to `aspect-ratio: 16 / 7` (or `1920 / 840`), and remove the rigid `max-height: 480px` clamp that was causing up to 42.8% of the video to be clipped off at 1920px wide viewports. Set `max-height: none` or responsive height.
     - For mobile (<768px), configure the container aspect ratio so that widescreen and square slides scale without cropping lateral edges.
2. In `apps/mobile/src/components/MotionHero.tsx`:
   - Mobile native video assets (`Home_1x11.mp4`, `END-OF-THE-SESSION-2_-1x11-1.mp4`) are 1080x1080 (1:1 square).
   - Change `const HERO_HEIGHT = SCREEN_WIDTH;` (1:1 square) instead of `Math.round(SCREEN_WIDTH * (9 / 16))`.
   - Ensure the square video renders fully edge-to-edge without cutting off 43.8% of the video vertically.

VERIFICATION:
Execute `npm run typecheck:all` (must pass with 0 errors) and `npm test`.
Document exact commands and results in `handoff.md` under your working directory.
When complete, use `send_message` to report back to parent `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`.
