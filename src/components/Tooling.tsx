import type { ReactNode } from "react";
import { ROLES, SKILLS, TOOL_GROUPS } from "../data";
import { useReveal } from "../hooks";
import { Reveal, SectionShell } from "./ui";
import { IconBranch, IconCart, IconGlobe, IconPhone, IconShield } from "./Icons";

const GROUP_ICONS: Record<string, (p: { size?: number; className?: string }) => ReactNode> = {
  phone: IconPhone,
  globe: IconGlobe,
  shield: IconShield,
  cart: IconCart,
  branch: IconBranch,
};

function SkillBar({ name, level, note, tone, delay }: { name: string; level: number; note: string; tone: string; delay: number }) {
  const { ref, inView } = useReveal<HTMLDivElement>(0.3);
  const toneBg: Record<string, string> = {
    mint: "bg-mint",
    amber: "bg-amber",
    wire: "bg-wire",
    coral: "bg-coral",
  };
  const toneText: Record<string, string> = {
    mint: "text-mint",
    amber: "text-amber",
    wire: "text-wire",
    coral: "text-coral",
  };
  return (
    <div ref={ref} className="group">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[14px] font-medium">{name}</p>
        <p className={`font-mono text-[12px] ${toneText[tone]}`}>{level}</p>
      </div>
      <div className="mt-1.5 h-[7px] w-full border border-line bg-bg/60">
        <div
          className={`bar-fill h-full ${toneBg[tone]}`}
          style={{ width: inView ? `${level}%` : "0%", transitionDelay: `${delay}ms` }}
        />
      </div>
      <p className="mt-1 text-[11.5px] text-faint group-hover:text-dim transition-colors">{note}</p>
    </div>
  );
}

export function Tooling() {
  return (
    <SectionShell
      id="sheet-01"
      sheet="Sheet 01"
      kicker="Tooling & skill sets"
      title="The kit this build runs on"
      intro="One TypeScript ecosystem end-to-end, so contracts, types and people move freely between surfaces. The skill matrix marks where the crew is strong and where reviews should be stricter."
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
        {/* tool groups */}
        <div className="space-y-4">
          {TOOL_GROUPS.map((g, gi) => {
            const Icon = GROUP_ICONS[g.icon] ?? IconBranch;
            return (
              <Reveal key={g.group} delay={gi * 70}>
                <div className="corners group border border-line bg-panel/70 transition-colors duration-300 hover:border-wire/50">
                  <div className="flex items-center gap-3 border-b border-dashed border-line px-5 py-3">
                    <span className="text-wire transition-transform duration-300 group-hover:scale-110 group-hover:text-amber">
                      <Icon size={17} />
                    </span>
                    <h3 className="font-display text-[15px] font-bold tracking-tight">{g.group}</h3>
                    <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-faint">
                      {String(gi + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <ul className="grid sm:grid-cols-2">
                    {g.tools.map((t, ti) => (
                      <li
                        key={t.name}
                        className={`flex flex-col gap-0.5 px-5 py-3 transition-colors hover:bg-panel2 ${
                          ti % 2 === 0 ? "sm:border-r" : ""
                        } ${ti > 0 ? "border-t sm:border-t" : ""} ${
                          ti === 1 ? "sm:border-t-0" : ""
                        } border-line`}
                      >
                        <span className="text-[13.5px] font-medium">{t.name}</span>
                        <span className="font-mono text-[11px] text-faint">{t.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* skills + roles */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <Reveal delay={100}>
            <div className="corners border border-line bg-panel p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-lg font-extrabold">Required skill sets</h3>
                <span className="font-mono text-[10px] tracking-[0.2em] text-faint">/ 100</span>
              </div>
              <div className="mt-5 space-y-4">
                {SKILLS.map((s, i) => (
                  <SkillBar key={s.name} {...s} delay={i * 90} />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="border border-dashed border-line p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-wire">Crew roles this implies</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                  <span
                    key={r}
                    className="cursor-default border border-line bg-panel px-2.5 py-1 text-[12px] text-dim transition-colors hover:border-wire/60 hover:text-ink"
                  >
                    {r}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
                Under-70 bars get a second reviewer: WooCommerce domain quirks and security passes are where
                commerce builds actually leak.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
