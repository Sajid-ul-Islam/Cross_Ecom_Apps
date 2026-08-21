import { useState } from "react";
import { useCopy, useReveal } from "../hooks";

type Cause = {
  n: string;
  title: string;
  likelihood: "prime suspect" | "likely in CI" | "situational";
  tone: "fatal" | "amber" | "azure";
  body: React.ReactNode;
  verifyLabel: string;
  verify: string;
  verifyNote: string;
};

const CAUSES: Cause[] = [
  {
    n: "01",
    title: "No `--` between revisions and the path",
    likelihood: "prime suspect",
    tone: "fatal",
    body: (
      <>
        Without the separator, <code className="mono-chip">./apps/web/</code> sits in the revision
        slot. Git tries to resolve it as a ref — no branch or tag by that name — then as a
        working-tree path — no directory under the current cwd — and since it could be neither,
        it declares the argument <em>ambiguous</em> and dies. The error message literally
        prescribes the fix: put <code className="mono-chip">--</code> after your revisions.
      </>
    ),
    verifyLabel: "prove it — same command, separator added",
    verify: "git diff --quiet HEAD^ HEAD -- ./apps/web/",
    verifyNote: "If the directory exists relative to your cwd, this now exits 0 (clean) or 1 (changed) — never 128.",
  },
  {
    n: "02",
    title: "The script ran from the wrong directory",
    likelihood: "likely in CI",
    tone: "amber",
    body: (
      <>
        Pathspecs are resolved against your <em>current working directory</em>, not the repo root.
        In a monorepo CI job with <code className="mono-chip">working-directory: apps/api</code>,
        the pathspec <code className="mono-chip">./apps/web/</code> points at{" "}
        <code className="mono-chip">apps/api/apps/web/</code> — which doesn't exist. No revision,
        no path → same ambiguity, same exit 128. The directory may be perfectly present at the
        repo root and the command still fatal.
      </>
    ),
    verifyLabel: "prove it — where does git think you are?",
    verify: "pwd && git rev-parse --show-toplevel && git ls-files -- ':(top)apps/web' | head -5",
    verifyNote: "If pwd isn't the toplevel, your relative pathspec is aiming at the wrong subtree. ls-files shows whether git tracks anything under apps/web at all.",
  },
  {
    n: "03",
    title: "`HEAD^` has no parent to point at",
    likelihood: "situational",
    tone: "azure",
    body: (
      <>
        A repo with a single commit, or a shallow clone (<code className="mono-chip">fetch-depth: 1</code>{" "}
        — the GitHub Actions default), has no <code className="mono-chip">HEAD^</code>. Usually
        that fatal names <code className="mono-chip">HEAD^</code> itself, but on a shallow clone
        both problems stack: the missing pathspec and the missing parent. Even after fixing the
        separator, CI will still exit 128 until history is deep enough.
      </>
    ),
    verifyLabel: "prove it — does the parent commit exist?",
    verify: "git rev-parse --verify HEAD^ && git rev-list --count HEAD",
    verifyNote: "rev-list prints 1 on a root/shallow clone — in that case HEAD^ can never resolve.",
  },
];

const TONE_CHIP: Record<Cause["tone"], string> = {
  fatal: "border-fatal/40 bg-fatal/10 text-fatal",
  amber: "border-amber/40 bg-amber/10 text-amber",
  azure: "border-azure/40 bg-azure/10 text-azure",
};

const TONE_NUM: Record<Cause["tone"], string> = {
  fatal: "text-fatal/30",
  amber: "text-amber/30",
  azure: "text-azure/30",
};

function VerifyBlock({ label, cmd, note }: { label: string; cmd: string; note: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="mt-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">{label}</p>
      <div className="mt-2 flex items-start gap-3 rounded-lg border border-line bg-ink/80 px-4 py-3 transition-colors hover:border-line2">
        <code className="codeblock flex-1 break-all text-mint">{cmd}</code>
        <button
          onClick={() => copy(cmd)}
          className={`shrink-0 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-all active:scale-90 ${
            copied
              ? "border-mint/60 bg-mint/10 text-mint"
              : "border-line text-fog hover:border-amber/60 hover:text-amber"
          }`}
          aria-label="Copy verification command"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-fog">{note}</p>
    </div>
  );
}

export default function Causes() {
  const [open, setOpen] = useState(0);
  const head = useReveal();
  const list = useReveal();

  return (
    <section id="causes" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <div ref={head.ref} className={`reveal ${head.on ? "on" : ""} grid gap-8 lg:grid-cols-[1fr_1.4fr]`}>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">02 · suspects</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.02] text-paper sm:text-5xl lg:text-6xl">
            Three ways
            <br />
            this <span className="text-amber">fatals</span>.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-fog">
            The message blames the pathspec, but three different failures produce it. Work the
            list top-down — each suspect ships with the one command that convicts or clears it.
          </p>
        </div>

        <div ref={list.ref} className={`reveal-r ${list.on ? "on" : ""} space-y-3`}>
          {CAUSES.map((c, i) => {
            const isOpen = open === i;
            return (
              <div
                key={c.n}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isOpen ? "border-line2 bg-panel" : "border-line bg-panel/50 hover:border-line2"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6"
                  aria-expanded={isOpen}
                >
                  <span className={`font-display text-3xl font-extrabold tabular-nums sm:text-4xl ${TONE_NUM[c.tone]}`}>
                    {c.n}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-lg font-bold text-paper sm:text-xl">
                      {c.title}
                    </span>
                    <span
                      className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${TONE_CHIP[c.tone]}`}
                    >
                      {c.likelihood}
                    </span>
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={`shrink-0 text-fog transition-transform duration-300 ${isOpen ? "rotate-180 text-amber" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <div className={`acc-body ${isOpen ? "open" : ""}`}>
                  <div className="acc-inner">
                    <div className="border-t border-line/70 px-5 py-5 sm:px-6">
                      <p className="max-w-2xl text-[15px] leading-relaxed text-mist">{c.body}</p>
                      <VerifyBlock label={c.verifyLabel} cmd={c.verify} note={c.verifyNote} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
