import { DOC_TREE, GOLDEN_RULES, PROTOCOL } from "../data";
import { Reveal, SectionShell } from "./ui";
import { IconFile, IconFlame, IconFolder } from "./Icons";

export function ContextStrategy() {
  return (
    <SectionShell
      id="sheet-02"
      sheet="Sheet 02"
      kicker="Context management"
      title="Files are memory, chat is not"
      intro="Long builds outlive any single session — human or AI. Context lives in committed markdown with a strict read/write protocol, so any agent can boot cold and be dangerous in five minutes."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr] items-start">
        {/* doc tree */}
        <Reveal>
          <div className="corners border border-line bg-panel/70">
            <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
              <h3 className="font-display text-[15px] font-bold">Context suite · repo layout</h3>
              <span className="font-mono text-[10px] tracking-[0.2em] text-faint">READ ORDER ↓</span>
            </div>
            <div className="p-5 font-mono text-[12.5px] leading-[1.9]">
              {DOC_TREE.map((d) => (
                <div
                  key={d.path}
                  className={`group flex items-baseline gap-3 transition-colors hover:bg-panel2 ${
                    d.kind === "hot" ? "text-amber" : d.kind === "dir" ? "text-wire" : "text-dim"
                  }`}
                  style={{ paddingLeft: `${d.depth * 18}px` }}
                >
                  <span className="shrink-0 text-faint">
                    {d.kind === "dir" ? <IconFolder size={13} /> : d.kind === "hot" ? <IconFlame size={13} /> : <IconFile size={13} />}
                  </span>
                  <span className={d.kind === "dir" ? "font-semibold" : ""}>{d.path}</span>
                  <span className="ml-auto hidden text-right text-[10.5px] text-faint opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                    {d.note}
                  </span>
                </div>
              ))}
              <div className="mt-4 border-t border-dashed border-line pt-3 text-[10.5px] text-faint">
                <span className="text-amber">▮ hot</span> — loaded every session · hover a line for its purpose
              </div>
            </div>
          </div>

          <Reveal delay={120}>
            <div className="mt-4 border border-coral/40 bg-coral/[0.04] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-coral">Golden rules</p>
              <ul className="mt-3 space-y-2">
                {GOLDEN_RULES.map((r, i) => (
                  <li key={r} className="flex gap-3 text-[13px] leading-snug text-dim">
                    <span className="font-mono text-[11px] text-coral/80">{String(i + 1).padStart(2, "0")}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Reveal>

        {/* protocol rail */}
        <Reveal delay={80}>
          <div className="corners border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-extrabold">Session protocol · every agent, every time</h3>
              <span className="font-mono text-[10px] tracking-[0.2em] text-faint">5 STEPS</span>
            </div>
            <ol className="mt-7 space-y-0">
              {PROTOCOL.map((p, i) => (
                <li key={p.step} className="relative flex gap-5 pb-7 last:pb-0">
                  {i < PROTOCOL.length - 1 && (
                    <span className="absolute left-[19px] top-11 bottom-0 w-px border-l border-dashed border-line" />
                  )}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-wire/60 bg-bg font-mono text-[12px] text-wire">
                    {p.step}
                  </span>
                  <div className="group">
                    <h4 className="font-display text-[15px] font-bold tracking-wide text-wire transition-colors group-hover:text-amber">
                      {p.name}
                    </h4>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-dim">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}
