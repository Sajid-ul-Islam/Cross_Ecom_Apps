import { useMemo, useState, type FormEvent } from "react";
import { AGENTS, buildHandoff, PHASES, type SessionEntry, type TaskStatus } from "../data";
import { Reveal, SectionShell, Stamp, useToast } from "./ui";
import { IconArrow, IconCopy, IconPlus, IconTerminal, IconX } from "./Icons";

const AGENT_TONE: Record<string, string> = {
  mint: "text-mint border-mint/60",
  amber: "text-amber border-amber/60",
  wire: "text-wire border-wire/60",
  coral: "text-coral border-coral/60",
  dim: "text-dim border-faint/60",
};

const LIFECYCLE = ["BOOT from files", "SCOPE one task", "WORK in small commits", "CHECKPOINT to STATE.md", "CLOSE with written handoff"];

function timeAgo(ts: number) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function Sessions({
  sessions,
  onAdd,
  onDelete,
  project,
  overrides,
}: {
  sessions: SessionEntry[];
  onAdd: (e: Omit<SessionEntry, "id" | "ts">) => void;
  onDelete: (id: string) => void;
  project: string;
  overrides: Record<string, TaskStatus>;
}) {
  const toast = useToast();
  const [agent, setAgent] = useState("A2 · BACKEND");
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(false);

  const handoff = useMemo(
    () => buildHandoff(project, PHASES, overrides, sessions),
    [project, overrides, sessions]
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!focus.trim()) {
      setErr("Focus line required — name the task ID you touched, e.g. “p1-5 · rate limiting”.");
      return;
    }
    onAdd({ agent, focus: focus.trim(), notes: notes.trim() || "—" });
    setFocus("");
    setNotes("");
    setErr("");
    toast("Session logged · STATE.md would be updated now", "mint");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(handoff);
      toast("Handoff markdown copied to clipboard", "amber");
    } catch {
      setPreview(true);
      toast("Clipboard blocked — preview shown, copy manually", "wire");
    }
  };

  return (
    <SectionShell
      id="sheet-04"
      sheet="Sheet 04"
      kicker="Agent session management"
      title="Many agents, one continuous thread"
      intro="Six agents share the build. Each session opens from committed files, works one task, and closes with a written handoff — so context survives any restart, switch or crash. Log sessions below; the ledger persists locally."
    >
      {/* roster */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a, i) => (
          <Reveal key={a.id} delay={Math.min(i * 60, 300)}>
            <div className="group corners h-full border border-line bg-panel/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-wire/50">
              <div className="flex items-center justify-between">
                <span className={`border px-2 py-0.5 font-mono text-[11px] font-semibold ${AGENT_TONE[a.tone]}`}>
                  {a.id}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">agent</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-extrabold tracking-tight">{a.codename}</h3>
              <p className="text-[12.5px] text-dim">{a.role}</p>
              <div className="mt-4 space-y-2.5 border-t border-dashed border-line pt-3">
                <p className="text-[11.5px] text-faint">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-wire">owns · </span>
                  {a.owns.join(" · ")}
                </p>
                <p className="text-[11.5px] text-faint">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-wire">loads · </span>
                  {a.loads.join(" · ")}
                </p>
                <p className="text-[11.5px] text-faint">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-wire">cadence · </span>
                  {a.cadence}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* lifecycle strip */}
      <Reveal delay={120}>
        <div className="mt-6 border border-dashed border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.22em] text-wire">
              Session lifecycle
            </span>
            {LIFECYCLE.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="border border-line bg-panel px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-dim transition-colors hover:border-amber/60 hover:text-amber">
                  {s}
                </span>
                {i < LIFECYCLE.length - 1 && <IconArrow size={12} className="text-faint" />}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ledger + intake */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Reveal>
          <div className="corners border border-line bg-panel/70">
            <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
              <h3 className="flex items-center gap-2.5 font-display text-[15px] font-bold">
                <IconTerminal size={16} className="text-wire" /> Session ledger
              </h3>
              <span className="font-mono text-[10px] tracking-[0.2em] text-faint">
                {sessions.length} ENTR{sessions.length === 1 ? "Y" : "IES"}
              </span>
            </div>
            {sessions.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-faint">Ledger empty</p>
                <p className="mt-2 text-[13px] text-faint">Log the first session on the right — future agents will thank you.</p>
              </div>
            ) : (
              <ul>
                {sessions.map((s, i) => (
                  <li
                    key={s.id}
                    className={`group flex gap-4 px-5 py-4 transition-colors hover:bg-panel2 ${
                      i > 0 ? "border-t border-linesoft" : ""
                    }`}
                  >
                    <div className="w-16 shrink-0 pt-0.5 text-right font-mono text-[10px] leading-tight text-faint">
                      {new Date(s.ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      <br />
                      {timeAgo(s.ts)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-wire/50 bg-wire/5 px-1.5 py-px font-mono text-[10px] tracking-wider text-wire">
                          {s.agent}
                        </span>
                        <span className="text-[13px] font-semibold">{s.focus}</span>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{s.notes}</p>
                    </div>
                    <button
                      onClick={() => {
                        onDelete(s.id);
                        toast("Session entry removed", "wire");
                      }}
                      className="h-fit shrink-0 cursor-pointer text-faint opacity-0 transition-all hover:text-coral group-hover:opacity-100"
                      aria-label="Delete session entry"
                    >
                      <IconX size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        <div className="space-y-5 lg:sticky lg:top-20">
          {/* intake form */}
          <Reveal delay={100}>
            <form onSubmit={submit} className="corners border border-line bg-panel p-5">
              <h3 className="flex items-center gap-2 font-display text-[15px] font-bold">
                <IconPlus size={15} className="text-mint" /> Log a session
              </h3>
              <label className="mt-4 block">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">Agent</span>
                <select
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className="mt-1.5 w-full cursor-pointer border border-line bg-bg/60 px-3 py-2 font-mono text-[12px] text-ink transition-colors"
                >
                  {AGENTS.map((a) => (
                    <option key={a.id} value={`${a.id} · ${a.codename}`}>
                      {a.id} · {a.codename}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">
                  Focus · task id + headline
                </span>
                <input
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="p1-5 · rate limiting + CORS allowlist"
                  className="mt-1.5 w-full border border-line bg-bg/60 px-3 py-2 text-[13px] text-ink placeholder:text-faint/70 transition-colors"
                />
              </label>
              <label className="mt-3 block">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">
                  Handoff note · what changed, what's next
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Rate limiter wired with Redis backend. Next: CORS allowlist + envelope tests."
                  className="mt-1.5 w-full resize-none border border-line bg-bg/60 px-3 py-2 text-[13px] leading-relaxed text-ink placeholder:text-faint/70 transition-colors"
                />
              </label>
              {err && <p className="mt-2 font-mono text-[11px] text-coral">{err}</p>}
              <button
                type="submit"
                className="mt-4 w-full cursor-pointer border border-mint/70 bg-mint/10 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-mint transition-all hover:bg-mint/20 active:scale-[0.98]"
              >
                Append to ledger
              </button>
            </form>
          </Reveal>

          {/* handoff generator */}
          <Reveal delay={160}>
            <div className="border border-amber/50 bg-amber/[0.04] p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[15px] font-bold">Cold-start handoff</h3>
                <Stamp tone="amber">A0 tool</Stamp>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
                Generates the markdown a fresh agent reads first — live from your task states and latest
                session notes.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={copy}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 border border-amber/70 bg-amber/10 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-amber transition-all hover:bg-amber/20 active:scale-[0.98]"
                >
                  <IconCopy size={14} /> Copy handoff
                </button>
                <button
                  onClick={() => setPreview((p) => !p)}
                  className="cursor-pointer border border-line px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim transition-colors hover:border-wire/60 hover:text-wire"
                >
                  {preview ? "Hide" : "Preview"}
                </button>
              </div>
              {preview && (
                <pre className="tick-in mt-3 max-h-64 overflow-auto border border-line bg-bg/80 p-3 font-mono text-[10.5px] leading-relaxed text-dim whitespace-pre-wrap">
                  {handoff}
                </pre>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
