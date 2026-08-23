import { useState } from "react";
import { useReveal } from "../hooks";

type TokenKind = "prog" | "cmd" | "flag" | "rev" | "amb" | "sep" | "path";

type Token = {
  t: string;
  k: TokenKind;
  name: string;
  note: string;
};

const BROKEN: Token[] = [
  { t: "git", k: "prog", name: "program", note: "The porcelain entry point. Everything after this is subcommand, options, then arguments git must classify." },
  { t: "diff", k: "cmd", name: "subcommand", note: "Compares two commits (here: trees) and reports what changed. With commits but no pathspec, it compares everything." },
  { t: "--quiet", k: "flag", name: "option", note: "Suppress all output and speak only through exit codes: 0 = identical, 1 = differences found. Handy for CI gates — until a 128 shows up." },
  { t: "HEAD^", k: "rev", name: "revision A", note: "“The parent of the current commit.” Needs history depth ≥ 2 — it does not exist on a root commit or a --depth 1 clone." },
  { t: "HEAD", k: "rev", name: "revision B", note: "The commit you have checked out. Two revisions in a row tells diff exactly which trees to compare." },
  { t: "./apps/web/", k: "amb", name: "the culprit", note: "Git tried this as a revision (no ref named ./apps/web/), then as a working-tree path (no such directory under the current cwd). Neither matched → git refuses to guess → fatal." },
];

const FIXED: Token[] = [
  { t: "git", k: "prog", name: "program", note: "Same entry point — nothing wrong with how the command starts." },
  { t: "diff", k: "cmd", name: "subcommand", note: "Same comparison: parent commit vs current commit." },
  { t: "--quiet", k: "flag", name: "option", note: "Still exit-code-only: 0 identical · 1 differences · 128 fatal." },
  { t: "HEAD^", k: "rev", name: "revision A", note: "Parent commit — now unambiguously a revision because the pathspec is fenced off." },
  { t: "HEAD", k: "rev", name: "revision B", note: "Checked-out commit." },
  { t: "--", k: "sep", name: "the separator", note: "The whole fix. Everything after -- is a path, end of debate. Git stops trying to resolve it as a revision and the ambiguity vanishes." },
  { t: "apps/web/", k: "path", name: "pathspec", note: "Repo-root relative. Trailing slash optional; leading ./ dropped — pathspecs resolve against cwd, so root-relative is the safe form in CI." },
];

const STYLES: Record<TokenKind, string> = {
  prog: "border-line2 text-fog hover:border-fog",
  cmd: "border-azure/40 text-azure hover:border-azure",
  flag: "border-amber/40 text-amber hover:border-amber",
  rev: "border-azure/40 text-azure hover:border-azure",
  amb: "border-fatal/60 text-fatal culprit-line hover:border-fatal",
  sep: "border-mint/70 text-mint sep-pulse hover:border-mint",
  path: "border-mint/40 text-mint hover:border-mint",
};

const DOT: Record<TokenKind, string> = {
  prog: "bg-fog",
  cmd: "bg-azure",
  flag: "bg-amber",
  rev: "bg-azure",
  amb: "bg-fatal",
  sep: "bg-mint",
  path: "bg-mint",
};

function CommandRow({
  label,
  tokens,
  active,
  onActive,
  tone,
}: {
  label: string;
  tokens: Token[];
  active: Token | null;
  onActive: (t: Token | null) => void;
  tone: "broken" | "fixed";
}) {
  return (
    <div
      className={`rounded-xl border p-5 sm:p-6 transition-colors ${
        tone === "broken"
          ? "border-fatal/25 bg-fatal/[0.04] hover:border-fatal/40"
          : "border-mint/25 bg-mint/[0.04] hover:border-mint/40"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${tone === "broken" ? "bg-fatal" : "bg-mint"}`}
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-fog">{label}</span>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
            tone === "broken" ? "border-fatal/40 text-fatal" : "border-mint/40 text-mint"
          }`}
        >
          {tone === "broken" ? "exit 128" : "exit 0 / 1"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
        {tokens.map((tok) => (
          <button
            key={tok.t + tok.k}
            onMouseEnter={() => onActive(tok)}
            onMouseLeave={() => onActive(null)}
            onFocus={() => onActive(tok)}
            onBlur={() => onActive(null)}
            className={`tok wiggle rounded-lg border bg-ink/70 px-3 py-1.5 ${STYLES[tok.k]} ${
              active === tok ? "bg-raise" : ""
            }`}
          >
            {tok.t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Anatomy() {
  const [active, setActive] = useState<Token | null>(BROKEN[5]);
  const head = useReveal();
  const body = useReveal();

  return (
    <section id="anatomy" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <div ref={head.ref} className={`reveal ${head.on ? "on" : ""}`}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">01 · anatomy of the failure</p>
        <h2 className="mt-4 font-display text-4xl font-bold leading-[1.02] text-paper sm:text-5xl lg:text-6xl">
          One argument git
          <br />
          couldn't <span className="text-fatal">classify</span>.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fog">
          Git's rule is blunt: every argument that isn't an option is tried as a{" "}
          <span className="text-azure">revision</span> first, then as a{" "}
          <span className="text-mint">path</span>. When it matches neither, git won't guess — it
          aborts. Hover the tokens to see what each one meant.
        </p>
      </div>

      <div ref={body.ref} className={`reveal ${body.on ? "on" : ""} mt-12 space-y-5`}>
        <CommandRow label="what ran" tokens={BROKEN} active={active} onActive={setActive} tone="broken" />
        <CommandRow label="what should have run" tokens={FIXED} active={active} onActive={setActive} tone="fixed" />

        {/* inspector panel */}
        <div className="grid gap-4 rounded-xl border border-line bg-panel/80 p-5 sm:grid-cols-[220px_1fr] sm:p-6">
          <div className="flex items-start gap-3 sm:block">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${active ? DOT[active.k] : "bg-fog"}`} />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fog">token inspector</p>
              <p className="mt-1 font-display text-xl font-bold text-paper">
                {active ? active.name : "hover a token"}
              </p>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed text-mist">
            {active
              ? active.note
              : "Move across the tokens above — each one carries its role in the parse and why it did (or didn't) survive it."}
          </p>
        </div>
      </div>
    </section>
  );
}
