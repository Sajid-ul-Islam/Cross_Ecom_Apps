import type { Dispatch, SetStateAction } from "react";
import { CATEGORIES, PRODUCTS, type CartMap } from "./data";
import { Reveal, useToast } from "./ui";
import { ProductCard } from "./Shop";
import { IcArrow, IcBolt, IcBox, IcCamera, IcChevron } from "./icons";

const useWooCovers = () => ({
  coverFor: (_slug: string) => "",
  isLive: (_slug: string) => false,
  done: true,
});
const fallbackCover = (_slug: string) => "";

export function CategoryPage({
  slug,
  cart,
  setCart,
}: {
  slug: string;
  cart: CartMap;
  setCart: Dispatch<SetStateAction<CartMap>>;
}) {
  const toast = useToast();
  const { coverFor, isLive, done } = useWooCovers();

  const cat = CATEGORIES.find((c) => c.slug === slug);

  if (!cat) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border-2 border-ink bg-card p-8 text-center shadow-[6px_6px_0_0_rgba(12,59,46,0.15)]">
        <IcBox className="mx-auto h-10 w-10 text-moss" />
        <h2 className="font-display mt-3 text-2xl font-bold">No such aisle</h2>
        <p className="mt-1.5 text-sm font-medium text-ink/60">
          That category shelf doesn&rsquo;t exist — maybe it was moved during restock.
        </p>
        <a href="#/" className="btn btn-primary btn-sm mt-5 inline-flex">
          Back to the shelf
        </a>
      </div>
    );
  }

  const items = PRODUCTS.filter((p) => p.cat === cat.name);
  const others = CATEGORIES.filter((c) => c.slug !== slug);

  return (
    <div className="pt-6">
      {/* breadcrumb */}
      <nav className="mono flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink/50">
        <a href="#/" className="transition hover:text-tang">The shelf</a>
        <IcChevron className="h-3 w-3 -rotate-90" />
        <span className="text-ink">{cat.name}</span>
      </nav>

      {/* cover band */}
      <Reveal>
        <div className="relative mt-4 overflow-hidden rounded-xl border-2 border-ink shadow-[8px_8px_0_0_rgba(22,40,31,0.22)]">
          <img
            src={fallbackCover(slug)}
            alt={`${cat.name} category cover`}
            className="kenburns h-[300px] w-full object-cover sm:h-[400px]"
          />
          {isLive(slug) && (
            <img
              src={coverFor(slug)}
              alt=""
              className="anim-fadeup absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-pine via-pine/80 to-pine/15" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.18]"
            style={{ backgroundImage: "radial-gradient(rgba(238,241,228,0.5) 1px, transparent 1.2px)", backgroundSize: "18px 18px" }}
          />

          <div className="absolute inset-0 flex flex-col justify-end p-6 text-[#e9f2e2] sm:p-10">
            <p className="overline flex items-center gap-2 text-sun">
              <span className="h-2 w-2 rounded-full bg-tang pulse-dot" />
              Category landing
            </p>
            <h1 className="font-display mt-3 text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">
              {cat.name}
            </h1>
            <p className="mt-3 max-w-md text-[15px] font-semibold leading-snug text-[#e9f2e2]/85">
              {cat.tagline} — {cat.blurb}
            </p>
            <div className="mono mt-5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-md border-2 border-[#e9f2e2]/40 bg-pine2/80 px-2.5 py-1.5">
                {items.length} product{items.length === 1 ? "" : "s"} on this shelf
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1.5 transition ${
                  done ? "border-[#e9f2e2]/40 bg-pine2/80" : "border-sun/60 bg-pine2/80 text-sun"
                }`}
              >
                <IcCamera className="h-3.5 w-3.5" />
                {!done
                  ? "fetching catalog photo from WooCommerce…"
                  : isLive(slug)
                    ? "cover photo · WooCommerce catalog"
                    : "cover · BazarBox studio session"}
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* other aisles */}
      <div className="scrollbar-none -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {others.map((c) => {
          const n = PRODUCTS.filter((p) => p.cat === c.name).length;
          return (
            <a
              key={c.slug}
              href={`#/category/${c.slug}`}
              className="group flex shrink-0 items-center gap-2 rounded-lg border-2 border-line bg-card px-3.5 py-2 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_3px_0_0_var(--color-ink)]"
            >
              <span className="font-display text-sm font-bold">{c.name}</span>
              <span className="mono rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] font-bold text-ink/55">
                {n}
              </span>
            </a>
          );
        })}
      </div>

      {/* products */}
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="overline text-moss">This aisle</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Everything in {cat.name}
          </h2>
        </div>
        <a
          href="#/"
          className="mono hidden items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-moss transition hover:text-tang sm:inline-flex"
        >
          Back to the full shelf <IcArrow className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 70}>
            <ProductCard
              p={p}
              qty={cart[p.id] ?? 0}
              onAdd={() => {
                setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
                toast(`${p.name} added to your bag.`, "info");
              }}
              onSet={(q) => setCart((c) => {
                const n = { ...c };
                if (q <= 0) delete n[p.id];
                else n[p.id] = q;
                return n;
              })}
            />
          </Reveal>
        ))}
      </div>

      {/* delivery strip */}
      <Reveal delay={120}>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-ink bg-sun/25 px-5 py-4">
          <p className="flex items-center gap-2.5 text-sm font-bold">
            <IcBolt className="h-5 w-5 text-tang" />
            Order anything here before 12:00 PM and it can be at your door tonight.
          </p>
          <a href="#/fees" className="btn btn-ghost btn-sm">
            See delivery fees <IcArrow className="h-3.5 w-3.5" />
          </a>
        </div>
      </Reveal>
    </div>
  );
}
