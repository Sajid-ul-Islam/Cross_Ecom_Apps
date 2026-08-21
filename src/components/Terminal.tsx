import { useEffect, useRef, useState } from "react";

type Kind = "cmd" | "err" | "hint" | "code";
type Line = { t: Kind; text: string };

const SCRIPT: Line[] = [
  { t: "cmd", text: "git diff --quiet HEAD^ HEAD ./apps/web/" },
  {
    t: "err",
    text: "fatal: ambiguous argument './apps/web/': unknown revision or path not in the working tree.",
  },
  { t: "hint", text: "Use '--' to separate paths from revisions, like this:" },
  { t: "hint", text: "  'git <command> [<revision>...] -- [<file>...]'" },
  { t: "cmd", text: "echo $?" },
  { t: "code", text: "128" },
];

function Prompt() {
  return (
    <span className="select-none text-mint">
      <span className="text-fog">~/monorepo</span> <span className="text-azure">❯</span>{" "}
    </span>
  );
}

export default function Terminal() {
  const [runId, setRunId] = useState(0);
  const [pos, setPos] = useState({ li: 0, ch: 0 });
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let dead = false;
    setDone(false);
    setPos({ li: 0, ch: 0 });
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    (async () => {
      await sleep(500);
      for (let li = 0; li < SCRIPT.length; li++) {
        const line = SCRIPT[li];
        if (line.t === "cmd") {
          for (let ch = 1; ch <= line.text.length; ch++) {
            if (dead) return;
            setPos({ li, ch });
            await sleep(24 + Math.random() * 34);
          }
          await sleep(420);
        } else {
          await sleep(line.t === "err" ? 700 : 260);
          if (dead) return;
          setPos({ li, ch: line.text.length });
        }
      }
      if (!dead) setDone(true);
    })();

    return () => {
      dead = true;
    };
  }, [runId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pos, done]);

  return (
    <div className="group relative">
      {/* frame */}
      <div className="term-scan relative overflow-hidden rounded-xl border border-line bg-deep/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(110,193,255,0.05)]">
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-line bg-panel/80 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-fatal/80" />
          <span className="h-3 w-3 rounded-full bg-amber/80" />
          <span className="h-3 w-3 rounded-full bg-mint/80" />
          <span className="ml-3 font-mono text-[11px] tracking-wider text-fog">
            ci-runner · bash — 80×24
          </span>
          <button
            onClick={() => setRunId((n) => n + 1)}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-fog transition-all hover:border-amber/60 hover:text-amber active:scale-95"
            aria-label="Replay the failing command"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            replay
          </button>
        </div>

        {/* screen */}
        <div ref={scrollRef} className="h-[300px] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed sm:h-[330px] sm:px-6 sm:text-sm">
          {SCRIPT.map((line, li) => {
            if (li > pos.li) return null;
            const partial = li === pos.li && !done ? line.text.slice(0, pos.ch) : line.text;
            const isLast = li === pos.li && !done;

            if (line.t === "cmd")
              return (
                <div key={li} className="whitespace-pre-wrap break-all text-mist">
                  <Prompt />
                  <span className="text-paper">{partial}</span>
                  {isLast && <span className="caret" />}
                </div>
              );
            if (line.t === "err")
              return (
                <div key={li} className="mt-1 whitespace-pre-wrap break-all">
                  <span className="fatal-glow font-semibold text-fatal">✗ {partial}</span>
                  {isLast && <span className="caret" />}
                </div>
              );
            if (line.t === "hint")
              return (
                <div key={li} className="whitespace-pre-wrap break-all text-amber/90">
                  {partial}
                  {isLast && <span className="caret" />}
                </div>
              );
            // exit code reveal
            return (
              <div key={li} className="mt-1">
                <span className="inline-block rounded-md border border-amber/40 bg-amber/10 px-3 py-0.5 text-lg font-bold tracking-[0.2em] text-amber">
                  {partial || "\u00A0"}
                </span>
                <span className="ml-3 text-[11px] text-fog"># not “changed”, not “clean” — fatal</span>
              </div>
            );
          })}

          {done && (
            <div className="mt-2 text-mist">
              <Prompt />
              <span className="caret" />
            </div>
          )}
        </div>
      </div>

      {/* glow under the frame */}
      <div className="pointer-events-none absolute -inset-x-8 -bottom-10 -z-10 h-32 rounded-[100%] bg-fatal/10 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
    </div>
  );
}
