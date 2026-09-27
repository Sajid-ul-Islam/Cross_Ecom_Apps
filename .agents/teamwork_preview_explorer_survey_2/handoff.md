# Handoff Report — Explorer 2 (AI Assistant & Customer KPI Survey Specialist)

**Task:** Read-only Survey & Investigation for Requirement R2 (Live Production DEEN AI Shopping Assistant) and Requirement R3 (Customer Profile Analytics KPI Dashboard)  
**Survey Report File:** `/home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_explorer_survey_2/survey_assistant_kpi.md`  
**Date:** 2026-09-19  
**Agent ID:** Explorer 2  
**Parent Conversation ID:** `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`  

---

## 1. Observation

1. **AI Concierge Backend Route & Intent Logic:**
   - In `apps/api/src/routes.ts` (lines 2062–2125), `POST /v1/deen/ai/chat` is defined with request schema `{ message: string; history?: any[]; phone?: string }`. It injects live catalog data via `getCatalog()` (`routes.ts:864`), which queries WooCommerce Store API / REST API (`apps/api/src/woo.ts:464`).
   - In `apps/api/src/ai/agent.ts` (lines 191–777), `processAiCommerceQuery` handles 13 distinct intents:
     - Order tracking with live Pathao consignment resolution (`lines 217–388`)
     - New drops / latest catalog arrivals (`lines 393–415`)
     - Dynamic campaigns, cashback tiers (৳2,500+ -> ৳500, ৳3,000+ -> ৳700), bank offers (`lines 420–450`)
     - 7-day doorstep size exchange policy (`lines 454–464`)
     - 4 retail flagship showrooms (Mirpur 12, Wari, Cumilla, Sylhet) with hotline 01952-700500 (`lines 469–479`)
     - Delivery charges: Inside Dhaka ৳50, Outside Dhaka ৳90, Showroom pickup ৳0 (`lines 484–507`)
     - Selvedge craftsmanship (vintage shuttle loom, 12.5–14.5oz, red-line ticker) (`lines 512–522`)
     - Payment gateways, COD, and 0% EMI (`lines 527–537`)
     - Fabric care & washing instructions (`lines 542–551`)
     - Sizing guides for Jeans (waist 28–38, 32" inseam), Panjabi (S–XXL), Shirts (S–XXL) (`lines 558–580`)
     - Multi-attribute catalog filtering by category, budget, requested size, color, keywords (`lines 585–716`)
     - RAG knowledge retrieval from `COMMERCE_KNOWLEDGE` (`lines 722–733`)
     - Gemini 1.5 Flash fallback when `config.geminiApiKey` is configured (`lines 738–759`)
   - 19 automated tests in `apps/api/src/ai/ai.test.ts` verify all intents; running `npm test` passes all 55 tests in 346ms.

2. **AI Concierge Frontend Rendering Gaps:**
   - In `apps/mobile/src/components/AiConciergeModal.tsx` (lines 252–260):
     ```tsx
     <Text style={[styles.bubbleText, m.sender === "user" ? styles.userBubbleText : styles.aiBubbleText]}>
       {m.text}
     </Text>
     ```
     React Native `<Text>` does not parse markdown syntax; bold markers (`**text**`), strikethroughs (`~~text~~`), and bullet structures are displayed verbatim as raw markdown text.
   - In `apps/web/components/AiConciergeDrawer.tsx` (line 394):
     ```tsx
     <div style={{ maxWidth: "85%", ..., whiteSpace: "pre-wrap" }}>{m.text}</div>
     ```
     HTML `<div>` displays raw markdown without parsing bold or strikethrough tokens.
   - In `apps/web/components/SideNavDrawer.tsx` (line 442):
     ```tsx
     <Link href="/chat" onClick={onClose} ...>
       <span>💬</span>
       <span>Live Support &amp; AI Concierge</span>
     </Link>
     ```
     The `/chat` route does not exist in `apps/web/app/` (`apps/web/app/chat/page.tsx` is missing), resulting in a Next.js 404 page when clicked or accessed directly.

3. **Customer Profile & Order History Architecture:**
   - In `apps/mobile/app/(tabs)/profile.tsx` and `apps/mobile/src/components/profile/AccountHeader.tsx` (lines 173–217), non-admin users only see a 3-pill row (`Orders`, `District`, `Saved`).
   - In `apps/web/app/profile/page.tsx` (lines 393–424), non-admin users only see a 3-button summary row (`Orders`, `District`, `Saved Size`).
   - Customer orders are fetched from `GET /v1/deen/orders?phone=...` (`apps/api/src/routes.ts:2544`) with Bearer token authentication (SEC-4 IDOR protection).
   - Mobile stores orders in `AsyncStorage ("deen_gateway_orders_v1")` via `OrderContext.tsx:27`.
   - Returns and exchanges are handled via `POST /v1/deen/returns` (`routes.ts:3294`) and `GET /v1/deen/returns` (`routes.ts:3390`). Mobile tracks local returns in `ReturnContext.tsx` (`AsyncStorage: "deen_mobile_returns_v1"`).

---

## 2. Logic Chain

1. **Observation 1** shows that `apps/api/src/ai/agent.ts` dynamically filters the live catalog (`getCatalog()`), executes Pathao tracking queries, checks budget constraints, and provides accurate store policies and showroom addresses.  
   **Inference 1:** The backend for Requirement R2 is production-ready, context-aware, and does not use canned mock placeholders.

2. **Observation 2** shows that both mobile and web concierge interfaces render `{m.text}` as raw text strings without a markdown parser, and web lacks `app/chat/page.tsx`.  
   **Inference 2:** To satisfy R2 acceptance criteria ("Concierge responses render correctly across both web and mobile chat interfaces"), an inline text formatting parser must be implemented on both platforms, and `apps/web/app/chat/page.tsx` must be created to maintain parity with mobile's dedicated chat tab.

3. **Observation 3** shows that both mobile and web profiles have access to customer orders (`Order[]` / `OrderResult[]` with `total`, `lines`, `status`) but currently only render 3 basic stat pills.  
   **Inference 3:** The underlying data layer already contains all the metrics required by Requirement R3 (Total Spend ৳, Total Items Purchased, Completed Orders, and Return/Exchange status).

4. **Observation 3** combined with `AGENTS.md` §3 and `docs/design-system.md` shows that UI components must dynamically consume `useTheme()` tokens on mobile and CSS variables on web with contrast ratios $\ge 4.5:1$ (WCAG 2.2 AA).  
   **Inference 4:** A dedicated 4-card Executive Customer Analytics KPI grid (`CustomerAnalyticsKPIs`) can be built and rendered directly under the hero identity card on both mobile and web using tokens (`card`, `cardSecondary`, `indigo`, `emerald`, `amber`, `ink`, `sub`), ensuring 100% web/mobile parity.

---

## 3. Caveats

1. **Gemini LLM Dependency:** Gemini 1.5 Flash operates only when `config.geminiApiKey` is present in the environment. However, the deterministic RAG and rule engine covers all catalog, policy, sizing, delivery, and order tracking requirements independently.
2. **First-Time / Zero-Order State:** For newly created customer accounts or guest shoppers with 0 orders, the KPI cards must render clean zero states (`৳0`, `0 Items`, `0 Orders`, `0 Active (100% Retained)`) rather than blank or crashing layouts.
3. **Web Return Fetching:** While mobile stores return tickets in `ReturnContext.tsx`, `apps/web/lib/api.ts` has `submitReturnRequest()` but lacks `fetchReturns(phone)`. Downstream developers should add `fetchReturns` to sync return status from `GET /v1/deen/returns`.

---

## 4. Conclusion

1. **Requirement R2 (DEEN AI Assistant):**
   - The backend engine is dynamic and verified by 19 automated tests.
   - Required changes for downstream implementer:
     - Add `apps/web/app/chat/page.tsx` for desktop/mobile web parity.
     - Implement lightweight markdown formatting (bold, strikethrough, bullet points) in both `AiConciergeModal.tsx` and `AiConciergeDrawer.tsx`.
2. **Requirement R3 (Customer Profile Analytics KPI Dashboard):**
   - Implement `CustomerAnalyticsKPIs` component on both Mobile (`apps/mobile/src/components/profile/CustomerAnalyticsKPIs.tsx`) and Web (`apps/web/components/CustomerAnalyticsKPIs.tsx`).
   - Compute:
     - **Total Spend (৳)**: $\sum \text{total}$ across non-cancelled orders.
     - **Total Items Purchased**: $\sum \text{qty}$ across item lines.
     - **Completed Orders**: Count of `completed` / `delivered` orders.
     - **Return / Exchange Status**: Count of active/completed returns.
   - Enforce WCAG 2.2 AA contrast using dynamic semantic tokens in both dark and light modes.

---

## 5. Verification Method

To independently verify the facts and findings documented in this report:

1. **AI Assistant Test Suite:**
   ```bash
   npm test
   ```
   *Expected:* 55 tests pass (including 19 tests in `src/ai/ai.test.ts`).

2. **TypeScript Compilation:**
   ```bash
   npm run typecheck:all
   ```
   *Expected:* 0 errors across API, Web, and Mobile.

3. **Verify Web Missing Chat Route:**
   Inspect `apps/web/app/chat` directory. Observe that no `page.tsx` exists, while `SideNavDrawer.tsx:442` points to `/chat`.

4. **Verify Markdown Rendering Gap:**
   Inspect `apps/mobile/src/components/AiConciergeModal.tsx:254` and `apps/web/components/AiConciergeDrawer.tsx:394` to confirm raw `{m.text}` rendering without markdown token parsing.

5. **Verify Customer Profile Stat Rows:**
   Inspect `apps/mobile/src/components/profile/AccountHeader.tsx:173-217` and `apps/web/app/profile/page.tsx:393-424` to confirm that only 3 minimal stat pills currently exist.

---
*Report filed by Explorer 2 at `/home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_explorer_survey_2/handoff.md`.*
