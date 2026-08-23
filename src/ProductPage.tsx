import type { Dispatch, SetStateAction } from "react";
import {
  CATEGORIES,
  DETAILS,
  FEES,
  PRODUCTS,
  SIZE_CHARTS,
  catByProduct,
  fmt,
  productById,
  type CartMap,
} from "./data";
import { Img, Reveal, useLS, useToast } from "./ui";
import { SizeChart } from "./SizeChart";
import {
  IcArrow,
  IcBox,
  IcCheck,
  IcChevron,
  IcMinus,
  IcPlus,
  IcRuler,
  IcSwap,
} from "./icons";

export function ProductPage({
  id,
  cart,
  setCart,
  onAddedToBag,
}: {
  id: string;
  cart: CartMap;
  setCart: Dispatch<SetStateAction<CartMap>>;
  onAddedToBag: () => void;
}) {
  const toast = useToast();
  const p = productById(id);
  const [size, setSize] = useLS<string | null>(`bz.size.${id}`, null);
  const [qty, setQty] = useLS<number>(`bz.qty.${id}`, 1);

  if (!p) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border-2 border-ink bg-card p-8 text-center shadow-[6px_6px_0_0_rgba(12,59,46,0.15)]">
        <IcBox className="mx-auto h-10 w-10 text-moss" />
        <h2 className="font-display mt-3 text-2xl font-bold">Item not on the shelf</h2>
        <p className="mt-1.5 text-sm font-medium text-ink/60">
          This product page came up empty — it may have sold out for the season.
        </p>
        <a href="#/" className="btn btn-primary btn-sm mt-5 inline-flex">
          Back to the shelf
        </a>
      </div>
    );
  }

  const cat = catByProduct(p.cat);
  const chart = SIZE_CHARTS[p.cat];
  const sizes = chart?.kind === "fit" ? chart.rows.map((r) => r[0]) : null;
  const details = DETAILS[p.id] ?? [];
  const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id);
  const needsSize = Boolean(sizes);
  const canAdd = !needsSize || Boolean(size);

  const add = () => {
    if (!canAdd) return;
    setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + qty }));
    toast(
      `${p.name}${size ? ` · size ${size}` : ""} × ${qty} added to your bag.`,
    );
    onAddedToBag();
  };

  return (
    <div className="pt-6">
      {/* breadcrumb */}
      <nav className="mono flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink/50">
        <a href="#/" className="transition hover:text-tang">The shelf</a>
        <IcChevron className="h-3 w-3 -rotate-90" />
        {cat && (
          <>
            <a href={`#/category/${cat.slug}`} className="transition hover:text-tang">
              {cat.name}
            </a>
            <IcChevron className="h-3 w-3 -rotate-90" />
          </>
        )}
        <span className="text-ink">{p.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
        {/* left — sticky image panel */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <div className="overflow-hidden rounded-xl border-2 border-ink bg-card shadow-[7px_7px_0_0_rgba(22,40,31,0.2)]">
              <div className="group relative aspect-square overflow-hidden">
                <Img
                  src={p.img}
                  alt={p.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                {p.tag && (
                  <span className="mono absolute left-4 top-4 rounded-md border-2 border-ink bg-sun px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {p.tag}
                  </span>
                )}
              </div>
            </div>
          </Reveal>

          {cat && (
            <Reveal delay={100}>
              <a
                href={`#/category/${cat.slug}`}
                className="group mt-4 flex items-center justify-between gap-3 rounded-xl border-2 border-line bg-card px-4.5 py-4 transition hover:border-ink hover:shadow-[4px_4px_0_0_rgba(12,59,46,0.18)]"
              >
                <span>
                  <span className="overline block text-moss">Shop the aisle</span>
                  <span className="font-display mt-1 block text-lg font-bold leading-tight">
                    {cat.name} · {cat.tagline}
                  </span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-sun transition group-hover:translate-x-0.5">
                  <IcArrow className="h-4 w-4" />
                </span>
              </a>
            </Reveal>
          )}
        </div>

        {/* right — the landing */}
        <div>
          <p className="overline text-moss">{p.cat}</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl">
            {p.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="mono text-2xl font-bold">{fmt(p.price)}</p>
            <p className="flex items-center gap-1.5 text-xs font-bold text-moss">
              <span className="h-2 w-2 rounded-full bg-moss pulse-dot" />
              In stock at the warehouse
            </p>
          </div>

          <p className="mt-4 max-w-xl text-[15px] font-medium leading-relaxed text-ink/75">
            {p.blurb} Part of the {p.cat.toLowerCase()} aisle — delivered by our
            own riders, with the noon cutoff same-day option inside Dhaka.
          </p>

          {details.length > 0 && (
            <Reveal>
              <div className="mt-6">
                <p className="overline text-moss">The details</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {details.map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-2.5 rounded-lg border-2 border-line bg-card px-3.5 py-2.5 text-[13px] font-semibold leading-snug"
                    >
                      <IcCheck className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          {/* size chart — the centrepiece */}
          <Reveal delay={80}>
            <div className="mt-8">
              <p className="flex items-center gap-2 font-display text-xl font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink bg-sun">
                  <IcRuler className="h-4.5 w-4.5" />
                </span>
                {chart?.kind === "specs" ? "Dimensions & specs" : "Size & fit chart"}
              </p>
              <div className="mt-3.5">
                {sizes && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(size === s ? null : s)}
                        className={`mono min-w-11 rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                          size === s
                            ? "border-ink bg-tang text-[#fdf6ee] shadow-[3px_3px_0_0_var(--color-ink)]"
                            : "border-line bg-card hover:border-ink hover:bg-sun/40"
                        }`}
                        aria-pressed={size === s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <SizeChart cat={p.cat} selected={size} onSelect={setSize} />
              </div>
            </div>
          </Reveal>

          {/* add bar */}
          <div className="mt-8 rounded-xl border-2 border-ink bg-card p-4.5 shadow-[5px_5px_0_0_rgba(12,59,46,0.18)] sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg border-2 border-ink bg-paper px-1.5 py-1">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="rounded p-1.5 transition hover:bg-sun"
                >
                  <IcMinus className="h-4 w-4" />
                </button>
                <span className="mono w-8 text-center text-base font-bold">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQty(Math.min(9, qty + 1))}
                  className="rounded p-1.5 transition hover:bg-sun"
                >
                  <IcPlus className="h-4 w-4" />
                </button>
              </div>

              {size && (
                <span className="mono anim-pop rounded-lg border-2 border-ink bg-sun px-3 py-2 text-sm font-bold">
                  Size {size}
                </span>
              )}

              <button onClick={add} disabled={!canAdd} className="btn btn-primary flex-1 min-w-[180px]">
                Add {qty > 1 ? `${qty} ` : ""}to bag · {fmt(p.price * qty)}
              </button>
            </div>

            {!canAdd && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-err/40 bg-err/10 px-3 py-2.5 text-xs font-bold text-err">
                <IcRuler className="mt-0.5 h-4 w-4 shrink-0" />
                Pick your size in the chart first — it saves everyone an exchange trip.
              </p>
            )}
            {canAdd && (
              <p className="mono mt-3 text-[10px] font-semibold uppercase tracking-wider text-ink/45">
                Same-day inside Dhaka ৳{FEES.sameDay} · standard from ৳{FEES.stdIn} · COD accepted
              </p>
            )}
          </div>

          {/* exchange reassurance */}
          <a
            href="#/exchange"
            className="group mt-4 flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-moss/50 bg-moss/10 px-4.5 py-3.5 transition hover:border-moss hover:bg-moss/15"
          >
            <p className="flex items-center gap-2.5 text-[13px] font-bold text-pine">
              <IcSwap className="h-5 w-5 shrink-0" />
              Wrong size when it arrives? The exchange desk swaps it for ৳{FEES.exIn} inside / ৳{FEES.exOut} outside Dhaka.
            </p>
            <IcArrow className="h-4 w-4 shrink-0 text-moss transition group-hover:translate-x-1" />
          </a>

          {/* related */}
          {related.length > 0 && (
            <div className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <p className="font-display text-xl font-extrabold">
                  More from {p.cat}
                </p>
                {cat && (
                  <a
                    href={`#/category/${cat.slug}`}
                    className="mono inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-moss transition hover:text-tang"
                  >
                    Whole aisle <IcArrow className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="scrollbar-none -mx-1 mt-4 flex gap-3.5 overflow-x-auto px-1 pb-2">
                {related.map((r) => (
                  <a
                    key={r.id}
                    href={`#/product/${r.id}`}
                    className="group w-44 shrink-0 overflow-hidden rounded-xl border-2 border-line bg-card transition hover:-translate-y-1 hover:border-ink hover:shadow-[4px_4px_0_0_rgba(12,59,46,0.2)]"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <Img
                        src={r.img}
                        alt={r.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-[13px] font-bold">{r.name}</p>
                      <p className="mono mt-1 text-xs font-bold text-moss">{fmt(r.price)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
