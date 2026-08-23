import { useState } from "react";
import { FEES, ZONES_INSIDE, ZONES_OUTSIDE, fmt, isInside } from "./data";
import { CutoffChip, Reveal } from "./ui";
import { IcBolt, IcClock, IcPin, IcSwap, IcTruck } from "./icons";

const RULES = [
  {
    icon: IcClock,
    title: "The noon cutoff is sharp",
    body: "Same-day orders must be placed before 12:00 PM Dhaka time. After that, the slot rolls to tomorrow — the countdown on the desk is live.",
  },
  {
    icon: IcBolt,
    title: "Prepay = priority queue",
    body: "Advance the delivery fee with bKash, Nagad, Rocket or card and a rider is assigned before packing even ends. Faster, every time.",
  },
  {
    icon: IcSwap,
    title: "One exchange fee, both ways",
    body: "৳50 inside / ৳90 outside Dhaka covers picking up the issue item AND delivering your replacement. A photo of the issue is required.",
  },
  {
    icon: IcTruck,
    title: "If we can't swap it",
    body: "Out-of-stock replacements become a full product refund within 48h. Once a rider is dispatched, the delivery fee stands.",
  },
];

export function Fees() {
  const [area, setArea] = useState("");
  const inside = area ? isInside(area) : null;

  return (
    <div className="pt-8">
      <div className="max-w-2xl">
        <p className="overline text-moss">No surprises at the door</p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Delivery &amp; exchange fees
        </h2>
        <p className="mt-3 text-[15px] font-medium leading-relaxed text-ink/70">
          Three numbers to remember: <b className="mono">{fmt(FEES.sameDay)}</b> for
          same-day inside Dhaka, and the exchange fee —{" "}
          <b className="mono">{fmt(FEES.exIn)}</b> inside,{" "}
          <b className="mono">{fmt(FEES.exOut)}</b> outside.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* matrix */}
        <Reveal>
          <div className="overflow-hidden rounded-xl border-2 border-ink bg-card shadow-[6px_6px_0_0_rgba(12,59,46,0.15)]">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-pine px-5 py-4 text-[#e9f2e2]">
              <p className="font-display text-lg font-bold">The fee matrix</p>
              <CutoffChip dark />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left">
                <thead>
                  <tr className="mono border-b-2 border-ink text-[10px] uppercase tracking-[0.16em] text-ink/55">
                    <th className="px-5 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Inside Dhaka</th>
                    <th className="px-4 py-3 font-semibold">Outside Dhaka</th>
                    <th className="px-5 py-3 font-semibold">The deal</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-line transition hover:bg-paper">
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-2 font-bold">
                        <IcTruck className="h-4.5 w-4.5 text-moss" /> Standard delivery
                      </p>
                    </td>
                    <td className="mono px-4 py-4 text-lg font-bold">{fmt(FEES.stdIn)}</td>
                    <td className="mono px-4 py-4 text-lg font-bold">{fmt(FEES.stdOut)}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-ink/65">
                      24–48h inside · 2–4 days outside. COD or prepaid.
                    </td>
                  </tr>
                  <tr className="border-b border-line bg-sun/15 transition hover:bg-sun/25">
                    <td className="px-5 py-4">
                      <p className="flex flex-wrap items-center gap-2 font-bold">
                        <IcBolt className="h-4.5 w-4.5 text-tang" /> Same-day express
                        <span className="mono rounded border border-ink bg-sun px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          Prepaid only
                        </span>
                      </p>
                    </td>
                    <td className="mono px-4 py-4 text-lg font-bold">{fmt(FEES.sameDay)}</td>
                    <td className="mono px-4 py-4 text-lg font-bold text-ink/35">—</td>
                    <td className="px-5 py-4 text-xs font-semibold text-ink/65">
                      Tonight 6–10 PM. Orders placed before 12:00 PM, fee paid online.
                    </td>
                  </tr>
                  <tr className="transition hover:bg-paper">
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-2 font-bold">
                        <IcSwap className="h-4.5 w-4.5 text-tang" /> Exchange pickup + re-delivery
                      </p>
                    </td>
                    <td className="mono px-4 py-4 text-lg font-bold">{fmt(FEES.exIn)}</td>
                    <td className="mono px-4 py-4 text-lg font-bold">{fmt(FEES.exOut)}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-ink/65">
                      Covers both legs. Photo of the issue required to start.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* zone checker */}
        <Reveal delay={120}>
          <div className="flex h-full flex-col rounded-xl border-2 border-ink bg-card p-5 shadow-[6px_6px_0_0_rgba(12,59,46,0.15)]">
            <p className="overline text-moss">Zone checker</p>
            <h3 className="font-display mt-1 text-2xl font-bold">
              Pick an area, see your fees
            </h3>
            <select className="input mt-4" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Select an area…</option>
              <optgroup label="Inside Dhaka">
                {ZONES_INSIDE.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </optgroup>
              <optgroup label="Outside Dhaka">
                {ZONES_OUTSIDE.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </optgroup>
            </select>

            {area && inside !== null ? (
              <div className="anim-fadeup mt-4 flex-1">
                <span
                  className={`mono inline-flex items-center gap-1.5 rounded-md border-2 border-ink px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                    inside ? "bg-moss text-[#f2f7ec]" : "bg-tang text-[#fdf3ea]"
                  }`}
                >
                  <IcPin className="h-3.5 w-3.5" />
                  {inside ? "Inside Dhaka zone" : "Outside Dhaka zone"}
                </span>
                <ul className="mt-4 space-y-2.5">
                  <li className="flex items-center justify-between rounded-lg border border-line bg-paper px-3.5 py-2.5">
                    <span className="text-sm font-bold">Standard delivery</span>
                    <span className="mono font-bold">{fmt(inside ? FEES.stdIn : FEES.stdOut)}</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg border border-line bg-paper px-3.5 py-2.5">
                    <span className="text-sm font-bold">Exchange (both ways)</span>
                    <span className="mono font-bold">{fmt(inside ? FEES.exIn : FEES.exOut)}</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg border border-line bg-paper px-3.5 py-2.5">
                    <span className="text-sm font-bold">Same-day express</span>
                    {inside ? (
                      <span className="mono font-bold text-moss">{fmt(FEES.sameDay)} tonight</span>
                    ) : (
                      <span className="mono text-xs font-bold uppercase text-ink/40">Not available</span>
                    )}
                  </li>
                </ul>
                {inside && (
                  <p className="mt-4 rounded-lg border border-line bg-sun/20 px-3.5 py-2.5 text-xs font-bold leading-snug">
                    Ordering before 12:00 PM? Prepay {fmt(FEES.sameDay)} and it
                    arrives tonight between 6–10 PM.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-line px-4 py-10 text-center">
                <IcPin className="h-8 w-8 text-moss" />
                <p className="mt-2 max-w-[220px] text-sm font-semibold text-ink/55">
                  Fees depend on your zone — inside or outside the Dhaka rider ring.
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* rules */}
      <div className="mt-10">
        <p className="overline text-moss">House rules</p>
        <h3 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          How the desk really works
        </h3>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {RULES.map((r, i) => (
            <Reveal key={r.title} delay={i * 80}>
              <li className="flex h-full gap-3.5 rounded-xl border-2 border-line bg-card p-4.5 transition hover:border-ink hover:shadow-[4px_4px_0_0_rgba(12,59,46,0.18)]">
                <span className="mono grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-sun text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="flex items-center gap-2 font-display text-[15px] font-bold">
                    <r.icon className="h-4 w-4 text-moss" />
                    {r.title}
                  </p>
                  <p className="mt-1 text-[13px] font-medium leading-relaxed text-ink/65">{r.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </div>
  );
}
