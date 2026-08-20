import { useEffect, useState } from "react";
import { useScrollSpy } from "../hooks";
import { Stamp } from "./ui";

const TABS = [
  { id: "cover", label: "COVER" },
  { id: "sheet-00", label: "00 · TOPOLOGY" },
  { id: "sheet-01", label: "01 · TOOLING" },
  { id: "sheet-02", label: "02 · CONTEXT" },
  { id: "sheet-03", label: "03 · TIMELINE" },
  { id: "sheet-04", label: "04 · SESSIONS" },
];

export const SECTION_IDS = TABS.map((t) => t.id);

function ProgressRing({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[110px] w-[110px]">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--color-line)" strokeWidth="7" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="var(--color-mint)"
          strokeWidth="7"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,0.8,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold leading-none">{Math.round(pct)}%</span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-faint">complete</span>
      </div>
    </div>
  );
}

export function Header({
  pct,
  counts,
  latestSession,
}: {
  pct: number;
  counts: { done: number; active: number; todo: number };
  latestSession: string;
}) {
  const active = useScrollSpy(SECTION_IDS);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const nav = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* sticky drawing nav */}
      <nav className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => nav("cover")}
            className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
              <rect width="32" height="32" fill="var(--color-panel)" stroke="var(--color-line)" />
              <path d="M6 22 L14 10 L18 16 L26 6" stroke="var(--color-wire)" strokeWidth="2.4" fill="none" />
              <circle cx="26" cy="6" r="2.6" fill="var(--color-amber)" />
            </svg>
            <span className="font-display text-[15px] font-extrabold tracking-tight hidden xs:inline sm:inline">
              BRIDGEWORK
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => nav(t.id)}
                className={`relative shrink-0 cursor-pointer px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors duration-200 ${
                  active === t.id ? "text-ink" : "text-faint hover:text-dim"
                }`}
              >
                {t.label}
                <span
                  className={`absolute inset-x-2 -bottom-[1px] h-[2px] transition-all duration-300 ${
                    active === t.id ? "bg-amber opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-line pl-4">
            <span className="pulse-dot inline-block h-2 w-2 bg-mint" />
            <span className="font-mono text-[11px] text-dim">
              {Math.round(pct)}% · {counts.done}✓
            </span>
          </div>
        </div>
      </nav>

      {/* ------- cover sheet: drawing title block ------- */}
      <header id="cover" className="relative mx-auto w-full max-w-6xl scroll-mt-20 px-5 sm:px-8 pt-12 sm:pt-16 pb-8">
        <div className="corners border border-line bg-panel/70">
          {/* drawing header strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-line px-6 py-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] text-faint uppercase">
                Omnichannel commerce build · drawing set BW-2025
              </p>
              <p className="mt-1 font-mono text-[9px] tracking-[0.18em] text-mint/80 uppercase">
                ⎇ main · merged from full-stack-project-blueprint-4a182 ✓ · branch deleted · apps/* in development
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Stamp tone="amber" pop>
                In progress
              </Stamp>
              <Stamp tone="wire">Rev C</Stamp>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.6fr_1fr]">
            {/* left — identity */}
            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:border-r border-line">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-wire flex items-center gap-3">
                <span className="inline-block h-px w-10 bg-wire/70" />
                Project blueprint · multi-agent build atlas
              </p>
              <h1 className="mt-4 font-display font-extrabold tracking-tight leading-[0.98] text-[2.6rem] sm:text-6xl">
                One storefront.
                <br />
                Two apps. <span className="text-wire">One bridge.</span>
              </h1>
              <p className="mt-5 max-w-xl text-dim text-[15px] leading-relaxed">
                Expo for <span className="text-ink font-medium">Android</span> ships first — Expo for{" "}
                <span className="text-ink font-medium">iOS</span> is initialized now and developed later. A{" "}
                <span className="text-ink font-medium">Next.js</span> customer website carries the public
                storefront plus a guarded <span className="font-mono text-[13px] text-amber">/admin</span>{" "}
                panel. Every surface talks to{" "}
                <span className="text-amber font-medium">WooCommerce</span> exclusively through a secure{" "}
                <span className="text-ink font-medium">middle API layer</span> — keys, webhooks and business
                rules never touch the clients.
              </p>

              {/* mini platform manifest */}
              <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
                {[
                  { k: "ANDROID", v: "Expo SDK 53", tone: "text-mint", live: true },
                  { k: "IOS", v: "init only · later", tone: "text-faint", live: false },
                  { k: "WEB + /ADMIN", v: "Next.js 15", tone: "text-wire", live: false },
                  { k: "COMMERCE", v: "Woo REST v3", tone: "text-coral", live: false },
                ].map((p) => (
                  <div key={p.k} className="bg-panel px-3.5 py-3 transition-colors hover:bg-panel2">
                    <p className={`font-mono text-[10px] tracking-[0.2em] ${p.tone}`}>{p.k}</p>
                    <p className="mt-1 text-[12px] text-dim flex items-center gap-1.5">
                      {p.live && <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />}
                      {p.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* right — title block table */}
            <div className="border-t lg:border-t-0 border-line">
              <div className="grid grid-cols-2 h-full">
                <div className="flex flex-col justify-between border-r border-line p-5">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">Drawn by</p>
                    <p className="mt-1 text-[13px] font-medium">Multi-agent crew</p>
                    <p className="font-mono text-[10px] text-faint">A0–A5 · orchestrator on duty</p>
                  </div>
                  <div className="mt-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">Date</p>
                    <p className="mt-1 font-mono text-[12px] text-dim">
                      {now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-5">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">Scale</p>
                    <p className="mt-1 text-[13px] font-medium">1 : Sprint</p>
                    <p className="font-mono text-[10px] text-faint">12 weeks · 6 phases</p>
                  </div>
                  <div className="mt-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">Sheets</p>
                    <p className="mt-1 font-mono text-[12px] text-dim">05 · topology → sessions</p>
                  </div>
                </div>
                <div className="col-span-2 border-t border-line p-5 flex items-center justify-between gap-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="font-display text-2xl font-extrabold text-mint leading-none">{counts.done}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">done</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl font-extrabold text-amber leading-none">{counts.active}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">in flight</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl font-extrabold text-faint leading-none">{counts.todo}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">pending</p>
                    </div>
                  </div>
                  <ProgressRing pct={pct} />
                </div>
              </div>
            </div>
          </div>

          {/* context pulse strip */}
          <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-line px-6 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wire">Context pulse</span>
            <span className="hidden sm:inline h-px flex-1 bg-line" />
            <span className="font-mono text-[11px] text-dim truncate max-w-full">{latestSession}</span>
          </div>
        </div>

        {/* scroll cue */}
        <div className="mt-8 flex items-center gap-3 text-faint">
          <svg width="14" height="22" viewBox="0 0 14 22" className="text-wire" aria-hidden>
            <path d="M7 1v16M2 12l5 6 5-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase">Unroll the drawing set</span>
        </div>
      </header>
    </>
  );
}
