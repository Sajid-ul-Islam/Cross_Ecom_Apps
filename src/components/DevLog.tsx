import { CURRENT_CONTEXT, DEV_LOG, FUTURE_SCOPE, NEXT_SKILLS, NEXT_UP } from "../data";
import { Bar, Reveal, SectionShell, Stamp } from "./ui";
import { IconBranch, IconFile, IconFlame, IconRocket } from "./Icons";

export function DevLog() {
  return (
    <SectionShell
      id="sheet-05"
      sheet="Sheet 05"
      kicker="Living document"
      title="Done · next · context · horizon"
      intro="Updated after every build batch — that's rule six now. This sheet answers the four questions every returning agent asks: what shipped, what's next, what do I know right now, and where does this grow."
    >
      {/* current context snapshot */}
      <Reveal>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] items-start">
          <div className="corners border border-line bg-panel/70">
            <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
              <h3 className="font-display text-[15px] font-bold">Current context · what the crew knows now</h3>
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-mint" />
            </div>
            <div className="p-5">
              <div className="border border-linesoft bg-bg/80 p-4 font-mono text-[11.5px] leading-[1.85]">
                <p className="text-faint">$ agent boot --context</p>
                <p>
                  <span className="text-wire">focus&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  <span className="text-ink">{CURRENT_CONTEXT.focus}</span>
                </p>
                <p>
                  <span className="text-mint">done&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  <span className="text-dim">{CURRENT_CONTEXT.done}</span>
                </p>
                <p>
                  <span className="text-amber">in-flight&nbsp;</span>
                  <span className="text-dim">{CURRENT_CONTEXT.inFlight}</span>
                </p>
                <p>
                  <span className="text-coral">next&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  <span className="text-ink">{CURRENT_CONTEXT.nextMilestone}</span>
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-linesoft bg-panel2/60 p-3.5">
                  <p className="flex items-center gap-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-coral">
                    <IconFlame size={12} /> Open risks
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {CURRENT_CONTEXT.risks.map((r) => (
                      <li key={r} className="flex gap-2 text-[11.5px] leading-snug text-dim">
                        <span className="text-coral/70">▸</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-linesoft bg-panel2/60 p-3.5">
                  <p className="flex items-center gap-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-wire">
                    <IconFile size={12} /> Boot files, in order
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {CURRENT_CONTEXT.bootFiles.map((f, i) => (
                      <li key={f} className="flex items-center gap-2 font-mono text-[11px] text-dim">
                        <span className="text-faint">{String(i + 1).padStart(2, "0")}</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* next-up */}
          <div className="corners border border-line bg-panel/70">
            <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
              <h3 className="font-display text-[15px] font-bold">Next to-do list</h3>
              <span className="font-mono text-[10px] tracking-[0.2em] text-faint">{NEXT_UP.reduce((s, g) => s + g.items.length, 0)} ITEMS</span>
            </div>
            <div className="space-y-5 p-5">
              {NEXT_UP.map((g) => {
                const toneText: Record<string, string> = { amber: "text-amber", wire: "text-wire", coral: "text-coral", mint: "text-mint" };
                const toneBorder: Record<string, string> = {
                  amber: "border-amber/50",
                  wire: "border-wire/50",
                  coral: "border-coral/50",
                  mint: "border-mint/50",
                };
                return (
                  <div key={g.group}>
                    <p className={`flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] ${toneText[g.tone]}`}>
                      <span className={`inline-block h-2 w-2 border ${toneBorder[g.tone]}`} />
                      {g.group}
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {g.items.map((it) => (
                        <li key={it.ref} className="group flex items-center gap-3 text-[12.5px] leading-snug text-dim transition-colors hover:text-ink">
                          <span className="h-[13px] w-[13px] shrink-0 border border-line transition-colors group-hover:border-faint" />
                          <span className="flex-1">{it.label}</span>
                          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-faint opacity-0 transition-opacity group-hover:opacity-100">
                            {it.ref}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>

      {/* dev log */}
      <Reveal delay={100}>
        <div className="mt-10">
          <div className="mb-5 flex items-baseline justify-between flex-wrap gap-3">
            <h3 className="font-display text-xl font-extrabold">Development log · what has shipped</h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">newest batch last · append, never rewrite</p>
          </div>
          <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {DEV_LOG.map((e, i) => (
              <Reveal key={e.title} delay={Math.min(i * 60, 300)}>
                <div className="group relative h-full border border-line bg-panel/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-wire/50 hover:bg-panel">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-faint">{e.date}</span>
                    <Stamp tone={e.tag.includes("✓") ? "mint" : e.tag === "MERGED" ? "wire" : "amber"}>{e.tag}</Stamp>
                  </div>
                  <h4 className="mt-2.5 font-display text-[16px] font-bold leading-tight">{e.title}</h4>
                  <ul className="mt-3 space-y-1.5">
                    {e.shipped.map((s) => (
                      <li key={s} className="flex gap-2 text-[12px] leading-snug text-dim">
                        <span className="mt-[3px] text-mint">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                  <span className="pointer-events-none absolute bottom-3 right-4 font-display text-[42px] font-extrabold leading-none text-line/40 transition-colors group-hover:text-wire/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      {/* horizon */}
      <Reveal delay={120}>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-wire"><IconRocket size={20} /></span>
              <h3 className="font-display text-xl font-extrabold">Future scope · where this grows</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FUTURE_SCOPE.map((s, i) => {
                const toneText: Record<string, string> = { mint: "text-mint", amber: "text-amber", wire: "text-wire", coral: "text-coral" };
                return (
                  <Reveal key={s.title} delay={Math.min(i * 50, 250)}>
                    <div className="group h-full border border-line bg-panel/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line hover:bg-panel">
                      <p className={`font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] ${toneText[s.tone]}`}>
                        {String(i + 1).padStart(2, "0")} · expansion
                      </p>
                      <h4 className="mt-1.5 font-display text-[15px] font-bold leading-tight">{s.title}</h4>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-dim">{s.note}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.skills.map((sk) => (
                          <span key={sk} className="border border-linesoft bg-bg/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors group-hover:border-line group-hover:text-dim">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          <div className="corners border border-line bg-panel/70">
            <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
              <h3 className="font-display text-[15px] font-bold">Skill sets needed next</h3>
              <span className="text-faint"><IconBranch size={14} /></span>
            </div>
            <div className="space-y-4 p-5">
              {NEXT_SKILLS.map((s) => (
                <div key={s.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[12.5px] font-semibold">{s.name}</p>
                    <span className="font-mono text-[10px] text-faint">{s.level}</span>
                  </div>
                  <p className="font-mono text-[9.5px] text-faint">{s.note}</p>
                  <div className="mt-1.5">
                    <Bar value={s.level} tone={s.tone} height="h-[5px]" />
                  </div>
                </div>
              ))}
              <p className="border-t border-dashed border-line pt-3.5 font-mono text-[10px] leading-relaxed text-faint">
                Levels are crew self-assessment against the next phase — the gap is the hiring / learning list.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
