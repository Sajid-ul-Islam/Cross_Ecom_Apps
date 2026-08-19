import { PHASES, type TaskStatus } from "../data";
import { Bar, ConfirmModal, Reveal, SectionShell, StatusChip } from "./ui";
import { IconRefresh } from "./Icons";

const CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "active",
  active: "done",
  done: "todo",
};

export function Timeline({
  overrides,
  onCycle,
  onReset,
}: {
  overrides: Record<string, TaskStatus>;
  onCycle: (id: string) => void;
  onReset: () => void;
}) {
  const statusOf = (id: string, base: TaskStatus): TaskStatus => overrides[id] ?? base;

  return (
    <SectionShell
      id="sheet-03"
      sheet="Sheet 03"
      kicker="Timeline & tracking"
      title="What's shipped, what's in flight"
      intro="Six phases from foundations to iOS. Click any status chip to cycle it — PENDING → IN PROGRESS → DONE — and the change is written to local tracking immediately, exactly like a STATE.md checkpoint."
    >
      {/* legend + reset */}
      <Reveal>
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 border border-line" /> pending
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 bg-amber" /> in progress
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 bg-mint" /> done
            </span>
          </div>
          <button
            onClick={onReset}
            className="ml-auto flex cursor-pointer items-center gap-2 border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint transition-colors hover:border-coral/60 hover:text-coral"
          >
            <IconRefresh size={13} /> reset ledger
          </button>
        </div>
      </Reveal>

      <div className="space-y-6">
        {PHASES.map((p, pi) => {
          const done = p.tasks.filter((t) => statusOf(t.id, t.status) === "done").length;
          const active = p.tasks.some((t) => statusOf(t.id, t.status) === "active");
          const pct = Math.round((done / p.tasks.length) * 100);
          const phaseTone = pct === 100 ? "mint" : active ? "amber" : "wire";
          return (
            <Reveal key={p.code} delay={Math.min(pi * 60, 240)}>
              <div
                className={`border bg-panel/70 transition-colors duration-300 ${
                  active ? "border-amber/50" : "border-line hover:border-wire/40"
                }`}
              >
                {/* phase header */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-dashed border-line px-5 py-4 sm:px-7">
                  <span
                    className={`font-display text-3xl font-extrabold tracking-tight ${
                      pct === 100 ? "text-mint" : active ? "text-amber" : "text-line"
                    }`}
                    style={pct < 100 && !active ? { WebkitTextStroke: "1px #33587c", color: "transparent" } : undefined}
                  >
                    {p.code}
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-display text-lg font-bold tracking-tight">{p.name}</h3>
                      <span className="font-mono text-[10px] tracking-[0.2em] text-faint">{p.weeks}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-faint">{p.blurb}</p>
                  </div>
                  <div className="flex w-full sm:w-56 items-center gap-3">
                    <Bar value={pct} tone={phaseTone} />
                    <span className="w-16 shrink-0 text-right font-mono text-[12px] text-dim">
                      {done}/{p.tasks.length}
                    </span>
                  </div>
                </div>

                {/* tasks */}
                <ul>
                  {p.tasks.map((t) => {
                    const st = statusOf(t.id, t.status);
                    return (
                      <li
                        key={t.id}
                        className="group flex items-center gap-3 sm:gap-4 border-t border-linesoft px-5 py-2.5 transition-colors first:border-t-0 hover:bg-panel2 sm:px-7"
                      >
                        <span className="hidden w-12 shrink-0 font-mono text-[10px] uppercase text-faint sm:block">
                          {t.id}
                        </span>
                        <StatusChip
                          status={st}
                          onClick={() => onCycle(t.id)}
                          title={`Cycle status — currently ${st.toUpperCase()}`}
                        />
                        <span
                          className={`flex-1 text-[13.5px] leading-snug transition-colors ${
                            st === "done" ? "text-faint line-through decoration-line" : st === "active" ? "text-ink" : "text-dim"
                          }`}
                        >
                          {t.label}
                        </span>
                        {t.tag && (
                          <span className="hidden shrink-0 font-mono text-[9px] tracking-[0.18em] text-faint opacity-0 transition-opacity group-hover:opacity-100 md:block">
                            {t.tag}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function TimelineResetModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Reset the tracking ledger?"
      body="All local status changes and the session ledger return to the blueprint defaults. Committed docs in the real repo are untouched — this only affects this console."
      confirmLabel="Reset ledger"
    />
  );
}
