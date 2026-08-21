import { useState } from "react";
import { SIZE_CHARTS, type FitChart, type SpecChart } from "./data";
import { IcCheck, IcChevron, IcInfo, IcRuler, IcX } from "./icons";

/* Convert a cm cell value to inches (half-inch steps). */
const toIn = (cm: string) => {
  const v = parseFloat(cm);
  if (Number.isNaN(v)) return cm;
  return `${Math.round((v / 2.54) * 2) / 2}\u2033`;
};

function Tips({ tips }: { tips: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-xl border-2 border-line bg-paper">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <IcInfo className="h-4 w-4 text-moss" />
          How to measure
        </span>
        <IcChevron
          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ol className="anim-fadeup space-y-2 border-t-2 border-dashed border-line px-4 py-3.5">
          {tips.map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-ink/75">
              <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-ink bg-sun text-[10px] font-bold">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function FitTable({
  def,
  selected,
  onSelect,
}: {
  def: FitChart;
  selected: string | null;
  onSelect: (s: string | null) => void;
}) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  const cell = (val: string, col: number) =>
    def.unitCols.includes(col) ? (unit === "in" ? toIn(val) : `${val} cm`) : val;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-bold text-ink/65">
          <IcRuler className="h-4 w-4 text-moss" />
          {def.note}
        </p>
        <div className="mono flex rounded-lg border-2 border-ink bg-card p-0.5 text-[11px] font-bold uppercase tracking-wider">
          {(["cm", "in"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`rounded-md px-3 py-1.5 transition ${
                unit === u ? "bg-pine text-[#e9f2e2] shadow-[2px_2px_0_0_var(--color-ink)]" : "text-ink/50 hover:text-ink"
              }`}
              aria-pressed={unit === u}
            >
              {u === "cm" ? "cm" : "inches"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border-2 border-ink bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[430px] text-left">
            <thead>
              <tr className="mono border-b-2 border-ink bg-paper text-[10px] uppercase tracking-[0.16em] text-ink/55">
                {def.head.map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 font-semibold ${i === 0 ? "pl-5" : ""}`}>
                    {h}
                    {def.unitCols.includes(i) && <span className="text-moss"> ({unit})</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {def.rows.map((row, ri) => {
                const isSel = selected === row[0];
                return (
                  <tr
                    key={row[0]}
                    onClick={() => onSelect(isSel ? null : row[0])}
                    className={`cursor-pointer border-b border-line text-sm transition last:border-0 ${
                      isSel
                        ? "bg-sun/45 shadow-[inset_4px_0_0_0_var(--color-tang)]"
                        : ri % 2 === 1
                          ? "bg-paper/60 hover:bg-sun/20"
                          : "hover:bg-sun/20"
                    }`}
                  >
                    {row.map((v, ci) => (
                      <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? "pl-5" : ""}`}>
                        {ci === 0 ? (
                          <span className="flex items-center gap-2 font-display font-bold">
                            {v}
                            {isSel && (
                              <span className="mono anim-pop rounded border border-ink bg-tang px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#fdf6ee]">
                                Your size
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="mono font-semibold text-ink/80">{cell(v, ci)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mono mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink/55">
        <IcCheck className="h-3.5 w-3.5 text-moss" />
        Tap a row to mark your size — we remember it for next time.
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="inline-flex items-center gap-1 rounded border border-ink bg-card px-1.5 py-0.5 text-[10px] font-bold uppercase transition hover:bg-tang hover:text-[#fdf6ee]"
          >
            Clear <IcX className="h-3 w-3" />
          </button>
        )}
      </p>
    </div>
  );
}

function SpecGrid({ def }: { def: SpecChart }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-[13px] font-bold text-ink/65">
        <IcRuler className="h-4 w-4 text-moss" />
        {def.note}
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {def.rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-3 rounded-lg border-2 border-line bg-card px-3.5 py-2.5 transition hover:border-ink"
          >
            <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{k}</dt>
            <dd className="mono text-sm font-bold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SizeChart({
  cat,
  selected,
  onSelect,
}: {
  cat: string;
  selected?: string | null;
  onSelect?: (s: string | null) => void;
}) {
  const def = SIZE_CHARTS[cat];
  if (!def) return null;

  return (
    <div>
      {def.kind === "fit" ? (
        <FitTable def={def} selected={selected ?? null} onSelect={onSelect ?? (() => {})} />
      ) : (
        <SpecGrid def={def} />
      )}
      <Tips tips={def.tips} />
    </div>
  );
}
