import { useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Topology } from "./components/Topology";
import { Tooling } from "./components/Tooling";
import { ContextStrategy } from "./components/ContextStrategy";
import { Timeline, TimelineResetModal } from "./components/Timeline";
import { Sessions } from "./components/Sessions";
import { ToastProvider, useToast } from "./components/ui";
import { useLocalStorage } from "./hooks";
import { PHASES, SEED_SESSIONS, type SessionEntry, type TaskStatus } from "./data";

const CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "active",
  active: "done",
  done: "todo",
};

function Blueprint() {
  const toast = useToast();
  const [overrides, setOverrides] = useLocalStorage<Record<string, TaskStatus>>("bw.tasks.v1", {});
  const [sessions, setSessions] = useLocalStorage<SessionEntry[]>("bw.sessions.v1", SEED_SESSIONS);
  const [resetOpen, setResetOpen] = useState(false);

  const effective = useMemo(() => {
    let done = 0;
    let active = 0;
    let todo = 0;
    for (const p of PHASES) {
      for (const t of p.tasks) {
        const st = overrides[t.id] ?? t.status;
        if (st === "done") done++;
        else if (st === "active") active++;
        else todo++;
      }
    }
    const total = done + active + todo;
    return { done, active, todo, pct: (done / total) * 100 };
  }, [overrides]);

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => b.ts - a.ts), [sessions]);
  const latest = sortedSessions[0];
  const latestSession = latest
    ? `${latest.agent} · ${latest.focus} — ${latest.notes.split(".")[0]}.`
    : "No sessions logged yet — the ledger is waiting.";

  const cycle = (id: string) => {
    const base = PHASES.flatMap((p) => p.tasks).find((t) => t.id === id);
    if (!base) return;
    const current = overrides[id] ?? base.status;
    setOverrides((prev) => ({ ...prev, [id]: CYCLE[current] }));
  };

  const reset = () => {
    setOverrides({});
    setSessions(SEED_SESSIONS);
    setResetOpen(false);
    toast("Ledger reset to blueprint defaults", "wire");
  };

  return (
    <div className="relative min-h-screen">
      {/* ambient layers */}
      <div className="bg-blueprint" aria-hidden />
      <div className="noise-veil" aria-hidden />
      <div className="radar-sweep" aria-hidden />
      <svg className="drift-cross" style={{ top: "18%", left: "6%" }} width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <path d="M11 1v20M1 11h20" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <svg className="drift-cross b" style={{ top: "64%", right: "8%" }} width="18" height="18" viewBox="0 0 22 22" aria-hidden>
        <path d="M11 1v20M1 11h20" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <Header pct={effective.pct} counts={effective} latestSession={latestSession} />

      <main>
        <Topology />
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-line to-transparent" />
        <Tooling />
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-line to-transparent" />
        <ContextStrategy />
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-line to-transparent" />
        <Timeline overrides={overrides} onCycle={cycle} onReset={() => setResetOpen(true)} />
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-line to-transparent" />
        <Sessions
          sessions={sortedSessions}
          onAdd={(e) =>
            setSessions((prev) => [{ ...e, id: `s-${Date.now()}`, ts: Date.now() }, ...prev])
          }
          onDelete={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
          project="BRIDGEWORK · Omnichannel Commerce Build"
          overrides={overrides}
        />
      </main>

      {/* drawing footer strip */}
      <footer className="border-t border-line bg-panel/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 sm:px-8 py-6">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
            <rect width="32" height="32" fill="var(--color-panel)" stroke="var(--color-line)" />
            <path d="M6 22 L14 10 L18 16 L26 6" stroke="var(--color-wire)" strokeWidth="2.4" fill="none" />
            <circle cx="26" cy="6" r="2.6" fill="var(--color-amber)" />
          </svg>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            <span>
              Drawn by <span className="text-dim">Multi-agent crew</span>
            </span>
            <span>
              Checked <span className="text-dim">A0 Orchestrator</span>
            </span>
            <span>
              Approval <span className="text-amber">Pending launch gate</span>
            </span>
          </div>
          <span className="ml-auto font-mono text-[10px] tracking-[0.22em] text-faint">
            BW-2025 · REV C · SHEET 05/05
          </span>
        </div>
        <div className="border-t border-dashed border-line py-3 text-center font-mono text-[10px] tracking-[0.2em] text-faint/80 uppercase">
          Files are memory · one task per session · handoff is written, never verbal
        </div>
      </footer>

      <TimelineResetModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={reset} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Blueprint />
    </ToastProvider>
  );
}
