/* ------------------------------------------------------------------ */
/*  BRIDGEWORK — blueprint data model                                  */
/* ------------------------------------------------------------------ */

export type TaskStatus = "todo" | "active" | "done";

export interface Task {
  id: string;
  label: string;
  status: TaskStatus;
  tag?: string;
}

export interface Phase {
  code: string;
  name: string;
  weeks: string;
  blurb: string;
  tasks: Task[];
}

export const PHASES: Phase[] = [
  {
    code: "P0",
    name: "Foundations",
    weeks: "WK 0–1",
    blurb: "Monorepo, contracts of record, sandbox commerce store.",
    tasks: [
      { id: "p0-1", label: "Lock product scope & cross-platform feature matrix", status: "done", tag: "SCOPE" },
      { id: "p0-2", label: "Turborepo monorepo — apps/api · apps/web · apps/mobile · packages/contracts", status: "done", tag: "REPO" },
      { id: "p0-3", label: "GitHub repo, branch policy, CI scaffold (lint · typecheck · build)", status: "done", tag: "CI" },
      { id: "p0-4", label: "Blueprint docs seeded — ARCHITECTURE.md, STATE.md, ADR-000 “middle API layer”", status: "done", tag: "CTX" },
      { id: "p0-5", label: "WooCommerce sandbox store provisioned + test consumer keys vaulted", status: "done", tag: "COMMERCE" },
    ],
  },
  {
    code: "P1",
    name: "Middle API Layer",
    weeks: "WK 1–3",
    blurb: "The secure bridge — every client talks to it, never to WooCommerce directly.",
    tasks: [
      { id: "p1-1", label: "Fastify gateway scaffold — health, readiness, pino structured logs", status: "done", tag: "API" },
      { id: "p1-2", label: "WooCommerce REST v3 client — HMAC-signed, keys live in env vault only", status: "done", tag: "COMMERCE" },
      { id: "p1-3", label: "Auth service — JWT issue/refresh, sessions in Redis, device revocation", status: "active", tag: "AUTH" },
      { id: "p1-4", label: "Typed DTO contracts in packages/contracts (Zod) shared by all apps", status: "active", tag: "CONTRACTS" },
      { id: "p1-5", label: "Rate limiting, CORS allowlist, unified error envelope", status: "todo", tag: "SECURITY" },
      { id: "p1-6", label: "Catalog endpoints — products, categories, search, price rules", status: "todo", tag: "API" },
      { id: "p1-7", label: "Cart + checkout orchestration endpoints (cart → order → payment intent)", status: "todo", tag: "API" },
      { id: "p1-8", label: "Signed webhook receiver — order status, stock, refunds (BullMQ queue)", status: "todo", tag: "WEBHOOKS" },
    ],
  },
  {
    code: "P2",
    name: "Expo · Android",
    weeks: "WK 3–7",
    blurb: "Primary build target. Ships first; iOS reuses ~95% of this code.",
    tasks: [
      { id: "p2-1", label: "expo init — Expo Router shell, design tokens, dark scheme", status: "done", tag: "MOBILE" },
      { id: "p2-2", label: "API client + TanStack Query wiring, offline-safe mutations", status: "done", tag: "MOBILE" },
      { id: "p2-3", label: "Catalog screens — list, search, product detail, gallery", status: "active", tag: "UI" },
      { id: "p2-4", label: "Auth screens — login, register, session persistence (SecureStore)", status: "todo", tag: "AUTH" },
      { id: "p2-5", label: "Cart + checkout flow with address & payment steps", status: "todo", tag: "UI" },
      { id: "p2-6", label: "Order history + push notifications (FCM via Expo Notifications)", status: "todo", tag: "MOBILE" },
      { id: "p2-7", label: "EAS Build — internal-track AAB, real-device matrix test", status: "todo", tag: "RELEASE" },
      { id: "p2-8", label: "Play Console — internal testing → closed → production", status: "todo", tag: "RELEASE" },
    ],
  },
  {
    code: "P3",
    name: "Next.js Web + /admin",
    weeks: "WK 6–10",
    blurb: "Customer storefront (SSR/ISR for SEO) and the admin panel route group.",
    tasks: [
      { id: "p3-1", label: "Next.js App Router scaffold — Tailwind system, route groups, middleware", status: "todo", tag: "WEB" },
      { id: "p3-2", label: "Storefront — catalog, PDP, cart, checkout (all via middle API)", status: "todo", tag: "WEB" },
      { id: "p3-3", label: "SEO layer — SSR/ISR product pages, sitemap, metadata, OG images", status: "todo", tag: "SEO" },
      { id: "p3-4", label: "/admin — guarded route group, role-based access, session middleware", status: "todo", tag: "ADMIN" },
      { id: "p3-5", label: "/admin — orders dashboard, status transitions, refund actions", status: "todo", tag: "ADMIN" },
      { id: "p3-6", label: "/admin — product & inventory management, stock sync view", status: "todo", tag: "ADMIN" },
      { id: "p3-7", label: "/admin — customers, coupons, reports (Recharts)", status: "todo", tag: "ADMIN" },
    ],
  },
  {
    code: "P4",
    name: "Hardening & Launch",
    weeks: "WK 10–12",
    blurb: "Observability, security pass, load, release gates.",
    tasks: [
      { id: "p4-1", label: "Sentry across api · web · mobile, release-bound sourcemaps", status: "todo", tag: "OBS" },
      { id: "p4-2", label: "Redis catalog cache + load test the gateway (k6)", status: "todo", tag: "PERF" },
      { id: "p4-3", label: "Security audit — OWASP pass, secret rotation drill, webhook replay check", status: "todo", tag: "SECURITY" },
      { id: "p4-4", label: "E2E — Playwright (web/admin) + Maestro (Android) critical paths", status: "todo", tag: "QA" },
      { id: "p4-5", label: "Play Store production release", status: "todo", tag: "RELEASE" },
      { id: "p4-6", label: "Web deploy — CDN, analytics, Core Web Vitals budget", status: "todo", tag: "RELEASE" },
    ],
  },
  {
    code: "P5",
    name: "Expo · iOS",
    weeks: "POST-LAUNCH",
    blurb: "Init now, develop after Android ships — shared Expo codebase pays off here.",
    tasks: [
      { id: "p5-1", label: "expo prebuild ios — project init only (scaffold, no feature work)", status: "done", tag: "INIT" },
      { id: "p5-2", label: "Apple Developer account, certificates & provisioning profiles", status: "todo", tag: "RELEASE" },
      { id: "p5-3", label: "iOS polish pass — safe areas, haptics, platform-specific navigation", status: "todo", tag: "UI" },
      { id: "p5-4", label: "APNs push wiring via Expo Notifications", status: "todo", tag: "MOBILE" },
      { id: "p5-5", label: "TestFlight beta → App Store release", status: "todo", tag: "RELEASE" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Topology                                                           */
/* ------------------------------------------------------------------ */

export type NodeKind = "client" | "core" | "external" | "infra";

export interface TopoNode {
  id: string;
  kind: NodeKind;
  title: string;
  sub: string;
  stamp: string;
  tone: "mint" | "amber" | "wire" | "coral" | "dim";
  x: number;
  y: number;
  w: number;
  h: number;
  ghost?: boolean;
  stack: string[];
  duties: string[];
  security: string[];
  env: string[];
}

export const TOPO_NODES: TopoNode[] = [
  {
    id: "android",
    kind: "client",
    title: "Expo · Android",
    sub: "Customer app — primary build target",
    stamp: "IN BUILD",
    tone: "mint",
    x: 44, y: 44, w: 220, h: 96,
    stack: ["Expo SDK 53", "Expo Router", "TanStack Query", "Zustand", "TypeScript"],
    duties: [
      "Catalog, search, product detail",
      "Auth + secure session (SecureStore)",
      "Cart, checkout, order history",
      "FCM push via Expo Notifications",
    ],
    security: ["JWT in SecureStore only", "No commerce secrets on device", "Certificate pinning for gateway"],
    env: ["EXPO_PUBLIC_API_URL"],
  },
  {
    id: "ios",
    kind: "client",
    title: "Expo · iOS",
    sub: "Init only — develops after Android ships",
    stamp: "QUEUED",
    tone: "dim",
    x: 44, y: 172, w: 220, h: 96,
    ghost: true,
    stack: ["Same Expo codebase", "expo prebuild ios (done)", "APNs later"],
    duties: [
      "Project initialized — scaffold only",
      "Shares ~95% of Android code",
      "Feature work begins post-Android-launch",
    ],
    security: ["Keychain for tokens when built", "TestFlight gated beta"],
    env: ["EXPO_PUBLIC_API_URL"],
  },
  {
    id: "web",
    kind: "client",
    title: "Next.js Storefront",
    sub: "Customer website — SSR/ISR for SEO",
    stamp: "PLANNED",
    tone: "wire",
    x: 44, y: 300, w: 220, h: 96,
    stack: ["Next.js 15 App Router", "React 19", "Tailwind", "Server Components"],
    duties: [
      "Public catalog with ISR product pages",
      "Cart & checkout via gateway calls",
      "Sitemap, metadata, OG images",
    ],
    security: ["Server-side fetches only", "No Woo keys in browser bundle"],
    env: ["NEXT_PUBLIC_API_URL", "API_SERVICE_TOKEN"],
  },
  {
    id: "admin",
    kind: "client",
    title: "/admin Panel",
    sub: "Ops console — Next.js route group",
    stamp: "PLANNED",
    tone: "wire",
    x: 44, y: 428, w: 220, h: 96,
    stack: ["Next.js route group (admin)", "Middleware guard", "Recharts", "RBAC roles"],
    duties: [
      "Orders dashboard + status transitions",
      "Product & inventory management",
      "Customers, coupons, reports",
    ],
    security: ["Role-based middleware at /admin", "Admin JWT scope separate from customer", "Audit log on mutations"],
    env: ["NEXT_PUBLIC_API_URL", "ADMIN_GUARD_SECRET"],
  },
  {
    id: "api",
    kind: "core",
    title: "Middle API Layer",
    sub: "Secure bridge — the single choke point",
    stamp: "CORE",
    tone: "amber",
    x: 396, y: 224, w: 232, h: 144,
    stack: ["Node 20 + Fastify", "Zod contracts", "Redis", "BullMQ", "pino"],
    duties: [
      "ONLY path between clients and WooCommerce",
      "Holds consumer keys — never exposed downstream",
      "Auth, rate limits, caching, error envelope",
      "Normalizes Woo payloads into typed DTOs",
      "Receives & verifies signed webhooks",
    ],
    security: ["Woo keys in env vault, server-only", "JWT issue/refresh + revocation", "HMAC verification on webhooks", "CORS allowlist + rate limiting"],
    env: ["WOO_KEY", "WOO_SECRET", "JWT_SECRET", "REDIS_URL", "WEBHOOK_SECRET"],
  },
  {
    id: "woo",
    kind: "external",
    title: "WooCommerce",
    sub: "System of record — REST API v3",
    stamp: "EXTERNAL",
    tone: "coral",
    x: 760, y: 224, w: 200, h: 144,
    stack: ["WordPress + WooCommerce", "REST API v3", "Webhooks w/ secret"],
    duties: [
      "Products, orders, customers, coupons",
      "Source of truth for inventory",
      "Emits signed order/stock webhooks",
    ],
    security: ["Consumer key/secret created for gateway alone", "Least-privilege user scope", "Staging store for dev"],
    env: ["(keys never leave the gateway)"],
  },
  {
    id: "redis",
    kind: "infra",
    title: "Redis",
    sub: "Sessions · cache · queues",
    stamp: "INFRA",
    tone: "dim",
    x: 448, y: 448, w: 152, h: 76,
    stack: ["Redis 7", "BullMQ workers"],
    duties: ["JWT session store", "Catalog cache (TTL)", "Webhook retry queue"],
    security: ["Private subnet, auth required"],
    env: ["REDIS_URL"],
  },
];

export interface TopoEdge {
  id: string;
  d: string;
  label: string;
  lx: number;
  ly: number;
  dashed?: boolean;
  flow?: boolean;
}

export const TOPO_EDGES: TopoEdge[] = [
  { id: "e-and", d: "M 264 92 C 336 92 336 268 396 276", label: "HTTPS · JWT", lx: 302, ly: 168, flow: true },
  { id: "e-ios", d: "M 264 220 C 330 220 348 282 396 292", label: "phase 5 · later", lx: 300, ly: 243, dashed: true },
  { id: "e-web", d: "M 264 348 C 330 348 348 312 396 306", label: "SSR fetch", lx: 312, ly: 341 },
  { id: "e-adm", d: "M 264 476 C 340 476 344 330 396 320", label: "RBAC · JWT", lx: 292, ly: 428 },
  { id: "e-woo", d: "M 628 276 L 760 276", label: "REST v3 · HMAC-signed", lx: 694, ly: 264, flow: true },
  { id: "e-hook", d: "M 760 320 C 706 320 690 300 628 300", label: "signed webhooks", lx: 694, ly: 336, dashed: true },
  { id: "e-red", d: "M 522 368 L 522 448", label: "cache · jobs", lx: 560, ly: 412 },
];

/* ------------------------------------------------------------------ */
/*  Tooling & skills                                                   */
/* ------------------------------------------------------------------ */

export interface ToolGroup {
  group: string;
  icon: string;
  tools: { name: string; note: string }[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    group: "Mobile · Expo",
    icon: "phone",
    tools: [
      { name: "Expo SDK 53 + Expo Router", note: "file-based nav, shared web/native" },
      { name: "EAS Build / Submit", note: "Android AAB now, iOS later" },
      { name: "TanStack Query", note: "server state, retries, offline" },
      { name: "Zustand + SecureStore", note: "client state, safe token storage" },
      { name: "Maestro", note: "mobile E2E flows" },
    ],
  },
  {
    group: "Web · Next.js",
    icon: "globe",
    tools: [
      { name: "Next.js 15 App Router", note: "SSR/ISR storefront + /admin group" },
      { name: "Tailwind CSS", note: "shared design tokens" },
      { name: "Middleware + RBAC", note: "guards every /admin route" },
      { name: "Recharts", note: "admin dashboards & reports" },
      { name: "Playwright", note: "web + admin E2E" },
    ],
  },
  {
    group: "Middle API Layer",
    icon: "shield",
    tools: [
      { name: "Node 20 + Fastify", note: "gateway service" },
      { name: "Zod + packages/contracts", note: "one schema, every client" },
      { name: "Redis + BullMQ", note: "sessions, cache, webhook queue" },
      { name: "pino + Sentry", note: "structured logs, tracing" },
      { name: "Docker + k6", note: "parity envs, load tests" },
    ],
  },
  {
    group: "Commerce · WooCommerce",
    icon: "cart",
    tools: [
      { name: "WooCommerce REST v3", note: "products · orders · coupons" },
      { name: "Consumer key/secret", note: "vaulted, gateway-only" },
      { name: "Webhooks + secret", note: "HMAC-verified inbound events" },
      { name: "WP staging store", note: "sandbox for all dev work" },
    ],
  },
  {
    group: "Ops & Context",
    icon: "branch",
    tools: [
      { name: "Turborepo monorepo", note: "api · web · mobile · contracts" },
      { name: "GitHub Actions", note: "lint · typecheck · build · deploy" },
      { name: "Markdown context suite", note: "STATE.md · ADR/ · SESSIONS/" },
      { name: "ngrok", note: "webhook tunnel for local dev" },
      { name: "Conventional commits", note: "machine-readable history" },
    ],
  },
];

export interface Skill {
  name: string;
  level: number;
  note: string;
  tone: "mint" | "amber" | "wire" | "coral";
}

export const SKILLS: Skill[] = [
  { name: "TypeScript / React ecosystem", level: 90, note: "shared language across all four surfaces", tone: "mint" },
  { name: "Next.js App Router · SSR/ISR", level: 85, note: "storefront SEO + guarded /admin", tone: "wire" },
  { name: "REST design · Node services", level: 85, note: "gateway contracts, error envelope", tone: "amber" },
  { name: "Expo / React Native", level: 80, note: "Android first, iOS by reuse", tone: "mint" },
  { name: "Auth & API security", level: 75, note: "JWT, HMAC webhooks, OWASP", tone: "coral" },
  { name: "WooCommerce domain", level: 70, note: "products, orders, coupons, stock", tone: "amber" },
  { name: "DevOps · CI · EAS", level: 65, note: "Actions, Docker, internal tracks", tone: "wire" },
  { name: "Testing · Playwright/Maestro", level: 60, note: "critical-path E2E per surface", tone: "coral" },
];

export const ROLES = [
  "Mobile engineer (Expo)",
  "Web engineer (Next.js)",
  "API engineer (Node/Fastify)",
  "WooCommerce integrator",
  "Security reviewer",
  "Release manager (EAS/Play/Deploy)",
];

/* ------------------------------------------------------------------ */
/*  Context strategy                                                   */
/* ------------------------------------------------------------------ */

export interface DocNode {
  path: string;
  note: string;
  depth: number;
  kind: "dir" | "file" | "hot";
}

export const DOC_TREE: DocNode[] = [
  { path: "bridgework/", note: "repo root", depth: 0, kind: "dir" },
  { path: "AGENTS.md", note: "agent onboarding rules — read first", depth: 1, kind: "hot" },
  { path: "docs/", note: "context suite", depth: 1, kind: "dir" },
  { path: "PROJECT_BRIEF.md", note: "scope, platforms, non-negotiables", depth: 2, kind: "file" },
  { path: "ARCHITECTURE.md", note: "system map, data flow, contracts", depth: 2, kind: "hot" },
  { path: "STATE.md", note: "living progress ledger — single source of truth", depth: 2, kind: "hot" },
  { path: "ADR/", note: "decision log, one file per decision", depth: 2, kind: "dir" },
  { path: "000-middle-api-layer.md", note: "why clients never touch Woo directly", depth: 3, kind: "file" },
  { path: "001-fastify-gateway.md", note: "runtime + framework choice", depth: 3, kind: "file" },
  { path: "002-jwt-sessions-redis.md", note: "auth model across apps", depth: 3, kind: "file" },
  { path: "SESSIONS/", note: "one log per agent session", depth: 2, kind: "dir" },
  { path: "2025-11-08-A2-gateway-auth.md", note: "what changed · blockers · next", depth: 3, kind: "file" },
  { path: "CONTRACTS/", note: "Zod schemas mirrored as docs", depth: 2, kind: "dir" },
  { path: "apps/ · packages/", note: "code lives with its own READMEs", depth: 1, kind: "dir" },
];

export const PROTOCOL = [
  {
    step: "01",
    name: "OPEN",
    body: "Agent boots from files, never from chat memory: AGENTS.md → STATE.md → latest SESSIONS/ entry. Context budget: ~5 min of reading before any code.",
  },
  {
    step: "02",
    name: "SCOPE",
    body: "Pick exactly one task ID from STATE.md. Restate its goal and acceptance criteria in one line. If the task is ambiguous, write the question into STATE.md before coding.",
  },
  {
    step: "03",
    name: "WORK",
    body: "Small commits, conventional messages. Any architectural choice — however small — lands as an ADR entry the moment it is made, not after.",
  },
  {
    step: "04",
    name: "CHECKPOINT",
    body: "Every ~30 minutes or at any blocker: append status to STATE.md. A killed session must never cost more than the last checkpoint.",
  },
  {
    step: "05",
    name: "CLOSE",
    body: "Write SESSIONS/<date>-<agent>-<topic>.md: what changed, artifacts touched, open risks, next action with owner. Update task status. Handoff is written — never verbal.",
  },
];

export const GOLDEN_RULES = [
  "Files are memory. Chat is not. If it matters, it is committed.",
  "One task per session. A session that touched five tasks finished none.",
  "STATE.md is never more than one session stale.",
  "No decision without an ADR line — even “we kept it simple”.",
  "The next agent is a stranger: write the handoff you would need.",
];

/* ------------------------------------------------------------------ */
/*  Agents & sessions                                                  */
/* ------------------------------------------------------------------ */

export interface Agent {
  id: string;
  codename: string;
  role: string;
  tone: "mint" | "amber" | "wire" | "coral" | "dim";
  owns: string[];
  loads: string[];
  cadence: string;
}

export const AGENTS: Agent[] = [
  {
    id: "A0",
    codename: "ORCHESTRATOR",
    role: "Project memory & handoffs",
    tone: "amber",
    owns: ["STATE.md", "SESSIONS/", "this console"],
    loads: ["STATE.md", "last 3 session logs"],
    cadence: "Every session boundary",
  },
  {
    id: "A1",
    codename: "ARCHITECT",
    role: "Blueprint, ADRs, contracts",
    tone: "wire",
    owns: ["ARCHITECTURE.md", "ADR/", "packages/contracts"],
    loads: ["PROJECT_BRIEF.md", "ARCHITECTURE.md", "ADR index"],
    cadence: "When contracts or topology change",
  },
  {
    id: "A2",
    codename: "BACKEND",
    role: "Middle API layer + Woo bridge",
    tone: "mint",
    owns: ["apps/api", "webhook receiver", "Redis schema"],
    loads: ["ARCHITECTURE.md §gateway", "CONTRACTS/", "ADR 000–002"],
    cadence: "Daily during P1",
  },
  {
    id: "A3",
    codename: "MOBILE",
    role: "Expo Android now, iOS later",
    tone: "coral",
    owns: ["apps/mobile", "EAS config"],
    loads: ["CONTRACTS/", "STATE.md §P2", "device test matrix"],
    cadence: "Daily during P2 · paused P5",
  },
  {
    id: "A4",
    codename: "WEB",
    role: "Next.js storefront + /admin",
    tone: "wire",
    owns: ["apps/web", "/admin route group"],
    loads: ["CONTRACTS/", "STATE.md §P3", "SEO checklist"],
    cadence: "Daily during P3",
  },
  {
    id: "A5",
    codename: "QA · REVIEW",
    role: "Tests, review, release gates",
    tone: "dim",
    owns: ["E2E suites", "release checklist"],
    loads: ["STATE.md", "diff under review", "risk register"],
    cadence: "Every merge + release gate",
  },
];

export interface SessionEntry {
  id: string;
  agent: string;
  focus: string;
  notes: string;
  ts: number;
}

export const SEED_SESSIONS: SessionEntry[] = [
  {
    id: "s-seed-1",
    agent: "A2 · BACKEND",
    focus: "p1-3 · JWT session service",
    notes: "Issued/refresh flow green against Redis. Device revocation list WIP — checkpointed, next: revocation API + tests.",
    ts: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: "s-seed-2",
    agent: "A3 · MOBILE",
    focus: "p2-2 · API client + TanStack Query",
    notes: "Client reads packages/contracts types end-to-end. Retry/backoff tuned. Next: wire catalog screens against sandbox.",
    ts: Date.now() - 1000 * 60 * 60 * 5,
  },
];

/* ------------------------------------------------------------------ */
/*  Handoff builder                                                    */
/* ------------------------------------------------------------------ */

export function buildHandoff(
  project: string,
  phases: Phase[],
  overrides: Record<string, TaskStatus>,
  sessions: SessionEntry[]
): string {
  const status = (t: Task) => overrides[t.id] ?? t.status;
  const lines: string[] = [];
  lines.push(`# HANDOFF — ${project}`);
  lines.push(`Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · by A0 ORCHESTRATOR`);
  lines.push("");
  lines.push("## Bootstrap (read in order)");
  lines.push("1. AGENTS.md  2. docs/STATE.md  3. latest docs/SESSIONS/*.md");
  lines.push("");
  for (const p of phases) {
    const done = p.tasks.filter((t) => status(t) === "done").length;
    const act = p.tasks.filter((t) => status(t) === "active");
    lines.push(`## ${p.code} ${p.name} — ${done}/${p.tasks.length} done`);
    if (act.length) {
      lines.push(`In flight: ${act.map((t) => `\`${t.id}\` ${t.label}`).join(" | ")}`);
    }
    const next = p.tasks.find((t) => status(t) === "todo");
    if (next) lines.push(`Next up: \`${next.id}\` ${next.label}`);
    lines.push("");
  }
  lines.push("## Latest session notes");
  for (const s of sessions.slice(0, 3)) {
    lines.push(`- [${s.agent}] ${s.focus} — ${s.notes}`);
  }
  lines.push("");
  lines.push("_Rule: files are memory. Update STATE.md before you close._");
  return lines.join("\n");
}
