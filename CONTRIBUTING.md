# Contributing to DEEN Commerce

Welcome! Thank you for your interest in contributing to the **DEEN Commerce** cross-platform e-commerce platform.

This monorepo powers the online presence and mobile applications for Bangladesh's premier denim brand:
- `apps/mobile`: Native iOS & Android application built with **Expo SDK 57 / React Native**.
- `apps/web`: Full-featured web storefront and mobile-web built with **Next.js 14 App Router**.
- `apps/api`: High-traffic REST proxy gateway built with **Fastify 4.x** connected to WordPress / WooCommerce.

---

## 1. Prerequisites & Tooling

Before setting up the repository, ensure your environment meets the minimum version matrix:

- **Node.js**: `>= 20.x` LTS (Active LTS recommended)
- **npm**: `>= 10.x`
- **Git**: `>= 2.30`
- **Expo CLI**: `npm install -g eas-cli expo-cli` (for mobile development)

---

## 2. Local Environment Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Sajid-ul-Islam/Cross_Ecom_Apps.git
   cd Cross_Ecom_Apps
   ```

2. **Install Monorepo Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment files for each active workspace:

   - **Web Storefront (`apps/web/.env.local`)**:
     ```bash
     cp apps/web/.env.example apps/web/.env.local
     ```
     Fill in your WooCommerce REST API keys (`WOO_URL`, `WOO_KEY`, `WOO_SECRET`).

   - **API Gateway (`apps/api/.env`)**:
     ```env
     PORT=8807
     GATEWAY_API_KEY=fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973
     WOOCOMMERCE_URL=https://deencommerce.com
     WOOCOMMERCE_KEY=ck_...
     WOOCOMMERCE_SECRET=cs_...
     ```

   - **Mobile App (`apps/mobile/.env`)**:
     ```env
     EXPO_PUBLIC_GATEWAY_URL=http://localhost:8807
     ```

---

## 3. Running Workspaces Locally

You can launch individual workspaces or run all services concurrently:

```bash
# 1. Start the Fastify Gateway API
npm run dev --prefix apps/api

# 2. Start the Next.js Web Storefront
npm run dev --prefix apps/web

# 3. Start the Expo Mobile App bundler
npm run start --prefix apps/mobile
```

---

## 4. Coding Standards & Architectural Guardrails

### A. TypeScript & Type Safety
- **Zero Compilation Errors**: Always ensure `npm run typecheck:all` passes with 0 errors before pushing code.
- **Explicit Typings**: Avoid untyped `any`. Define data models in `types.ts` or reuse schemas from `apps/web/lib/api.ts` and `apps/mobile/src/services/gateway.ts`.

### B. Mandatory Web & Mobile Parity Rules
- **Synchronized Capabilities**: Any UI, business logic, or customer-facing feature added to the mobile app must simultaneously be built on the web app and its mobile viewport (`< 768px`).
- **5 Standard Navigation Tabs**: Both platforms maintain the synchronized standard:
  `[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart (live badge) ]  [ 💬 Chat ]  [ 👤 Profile ]`
- **Hybrid Quick Add**: Single-size products add directly to cart; multi-size products open a stock-filtered modal (`QuickAddModal` on Web / `QuickAddBottomSheet` on Mobile). Out-of-stock sizes must never be selectable.

### C. Chatbot Development Constraint
- **Strictly Zero LLM**: The e-commerce chatbot in `apps/web` must remain 100% deterministic rule-based (regex, phonetic Banglish dictionaries, Fuse.js, finite state machine). Never install or invoke OpenAI, Gemini, Claude, or local models.

### D. UI/UX, Design Tokens & Accessibility
- **WCAG 2.2 AA Contrast**: Dark mode backgrounds (`#000000`, `#101010`) must pair with high-contrast typography ($\ge 4.5:1$).
- **Touch Target Sizing**: All interactive touch areas must satisfy $\ge 44 \times 44\text{ dp}$ with explicit `hitSlop` on mobile.

---

## 5. Git Commit Convention

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature or enhancement (e.g. `feat(chatbot): add trilingual Banglish synonym expander`)
- `fix:` A bug fix (e.g. `fix(checkout): validate 11-digit Bangladeshi mobile numbers`)
- `docs:` Documentation updates (e.g. `docs: update PRD and architecture diagrams`)
- `refactor:` Code restructuring that does not alter behavior
- `test:` Adding or refining automated unit / state machine tests
- `perf:` Performance improvements or cache optimizations

---

## 6. Pre-Pull Request Verification Checklist

Before creating a Pull Request, verify that all automated checks pass locally:

```bash
# 1. Typecheck all workspaces (apps/api + apps/web + apps/mobile)
npm run typecheck:all

# 2. Run backend and pricing unit test suite
npm test

# 3. Run multilingual chatbot automated test suite
npx tsx apps/web/lib/chatbot.test.ts
```

All Pull Requests must:
1. Include a clear description of the problem solved.
2. Maintain 0 TypeScript compilation errors.
3. Pass all automated unit tests.
4. Adhere to the Web ⇄ Mobile parity rules.
