import { useEffect, useMemo, useRef, useState } from "react";
import {
  money,
  type Category,
  type Order,
  type Product,
} from "../api/contracts";
import * as gw from "../api/gateway";
import { useLocalStorage } from "../hooks";
import { Stamp, useToast } from "../components/ui";
import {
  IconArrow,
  IconCart,
  IconCheck,
  IconMinus,
  IconPlus,
  IconSearch,
  IconTag,
  IconTrash,
  IconX,
} from "../components/Icons";

/* ------------------------------------------------------------------ */
/*  product glyphs — schematic line art per category                   */
/* ------------------------------------------------------------------ */

function Glyph({ category, size = 40, className = "" }: { category: Category; size?: number; className?: string }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className };
  switch (category) {
    case "PACKS":
      return (<svg {...s}><path d="M8 7.5h8a2.5 2.5 0 0 1 2.5 2.5v9H5.5v-9A2.5 2.5 0 0 1 8 7.5Z" /><path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M8.5 13h7v3.5h-7zM5.5 19h13" /></svg>);
    case "SHELTER":
      return (<svg {...s}><path d="m12 5 8.5 14h-17z" /><path d="M12 19v-5.5M12 13.5 9.5 19M12 13.5 14.5 19" /></svg>);
    case "COOK":
      return (<svg {...s}><path d="M6 10.5h12v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" /><path d="M4 10.5h16M9.5 7.5c0-1 .8-1 .8-2M13.5 7.5c0-1 .8-1 .8-2" /></svg>);
    case "LIGHT":
      return (<svg {...s}><rect x="9" y="8" width="6" height="9" /><path d="M10.5 8V6h3v2M12 3.2v1M12 17v2M5.5 12.5h1.6M16.9 12.5h1.6M7.3 8l1.1 1.1M15.6 15.9l1.1 1.1" /></svg>);
    case "TOOLS":
      return (<svg {...s}><path d="m6 4 6.5 11M18 4l-6.5 11M9.5 20.5 12 15l2.5 5.5M8 8.5h8" /></svg>);
    case "APPAREL":
      return (<svg {...s}><path d="M9 4 4.5 7l1.8 3.4L9 9v11h6V9l2.7 1.4L19.5 7 15 4c-.8 1.2-1.8 1.8-3 1.8S9.8 5.2 9 4Z" /><path d="M12 5.8V20" /></svg>);
  }
}

/* ------------------------------------------------------------------ */

const CATEGORIES: ("ALL" | Category)[] = ["ALL", "PACKS", "SHELTER", "COOK", "LIGHT", "TOOLS", "APPAREL"];

interface CartLine {
  productId: string;
  qty: number;
}

type DrawerView = "cart" | "checkout" | "done";

export function Storefront() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<{ number: string; channel: string; total: number; status: string }[]>([]);
  const [feedIdx, setFeedIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<"ALL" | Category>("ALL");
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const [view, setView] = useState<DrawerView>("cart");
  const [placed, setPlaced] = useState<Order | null>(null);
  const [cart, setCart] = useLocalStorage<CartLine[]>("bw.cart.v1", []);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [placing, setPlacing] = useState(false);
  const [bump, setBump] = useState(0);
  const feedTimer = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    gw.listProducts().then((p) => {
      if (!alive) return;
      setProducts(p);
      setLoading(false);
    });
    gw.gatewayFeed().then((f) => alive && setFeed(f));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (feed.length === 0) return;
    feedTimer.current = window.setInterval(() => setFeedIdx((i) => (i + 1) % feed.length), 2400);
    return () => window.clearInterval(feedTimer.current);
  }, [feed.length]);

  const visible = useMemo(() => {
    let list = products.filter(
      (p) =>
        (cat === "ALL" || p.category === cat) &&
        (search.trim() === "" ||
          `${p.name} ${p.sku} ${p.tags.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, cat, search, sort]);

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const stockOf = (id: string) => products.find((p) => p.id === id)?.stock ?? 0;
  const priceOf = (id: string) => products.find((p) => p.id === id)?.price ?? 0;
  const subtotal = Math.round(cart.reduce((s, l) => s + priceOf(l.productId) * l.qty, 0) * 100) / 100;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = Math.round((subtotal - discount) * 100) / 100;

  const feedRows: ({ number: string; channel: string; total: number; status: string } | null)[] =
    feed.length > 0 ? feed.slice(0, 5) : [null, null, null, null, null];

  const addToCart = (productId: string, qty: number) => {
    const stock = stockOf(productId);
    const current = cart.find((l) => l.productId === productId)?.qty ?? 0;
    const next = Math.min(stock, current + qty);
    if (stock === 0) {
      toast("Out of stock — check back soon", "amber");
      return;
    }
    if (next === current) {
      toast(`Only ${stock} in stock`, "amber");
      return;
    }
    setCart((prev) => {
      const has = prev.some((l) => l.productId === productId);
      return has ? prev.map((l) => (l.productId === productId ? { ...l, qty: next } : l)) : [...prev, { productId, qty: next }];
    });
    setBump((b) => b + 1);
    const p = products.find((x) => x.id === productId);
    toast(`${p?.sku ?? "ITEM"} → cart`, "mint");
  };

  const setQty = (productId: string, qty: number) => {
    const stock = stockOf(productId);
    if (qty < 1) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    const clamped = Math.min(stock, qty);
    if (clamped < qty) toast(`Only ${stock} in stock`, "amber");
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty: clamped } : l)));
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    try {
      const v = await gw.validateCoupon(couponInput, subtotal);
      setCoupon(v);
      toast(`Coupon ${v.code} applied — saved ${money(v.discount)}`, "mint");
    } catch (e) {
      setCoupon(null);
      toast(e instanceof Error ? e.message : "Coupon rejected", "amber");
    } finally {
      setCouponBusy(false);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const order = await gw.createOrder({
        customerName: form.name,
        customerEmail: form.email,
        address: form.address,
        items: cart.map((l) => ({ productId: l.productId, qty: l.qty })),
        couponCode: coupon?.code,
      });
      setPlaced(order);
      setCart([]);
      setCoupon(null);
      setCouponInput("");
      setView("done");
      gw.gatewayFeed().then(setFeed);
      gw.listProducts().then(setProducts);
      toast(`Order ${order.number} filed with the gateway`, "mint");
    } catch (e) {
      if (e instanceof Error && e.message.includes("subtotal")) setCoupon(null);
      toast(e instanceof Error ? e.message : "Checkout failed", "amber");
    } finally {
      setPlacing(false);
    }
  };

  const openDrawer = () => {
    setView("cart");
    setDrawer(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 pb-20">
      {/* ---------- storefront nav ---------- */}
      <div className="sticky top-0 z-30 -mx-5 border-b border-line bg-bg/85 px-5 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex h-14 items-center gap-4">
          <span className="font-display text-[15px] font-extrabold tracking-tight">
            TRAILHEAD<span className="text-amber">·</span>SUPPLY
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.24em] text-faint md:block">
            customer storefront · apps/web
          </span>
          <div className="ml-auto flex items-center gap-3">
            <label className="hidden items-center gap-2 border border-line bg-panel px-3 py-1.5 transition-colors focus-within:border-wire sm:flex">
              <IconSearch size={14} className="text-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search sku / gear"
                className="w-36 bg-transparent font-mono text-[12px] text-ink placeholder:text-faint"
              />
            </label>
            <span className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-faint lg:flex">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
              via middle API
            </span>
            <button
              onClick={openDrawer}
              className="relative flex cursor-pointer items-center gap-2 border border-wire/60 bg-panel px-3.5 py-1.5 transition-all hover:bg-panel2 active:scale-95"
            >
              <IconCart size={16} className="text-wire" />
              <span className="font-mono text-[11px] tracking-[0.14em] text-wire">CART</span>
              {cartCount > 0 && (
                <span
                  key={bump}
                  className="bump absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center bg-amber px-1 font-mono text-[10px] font-semibold text-bg"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- opener: cover + live gateway feed ---------- */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-wire flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-wire/70" />
            catalog sheet 01 · {products.length || 12} live SKUs
          </p>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-[4.4rem] font-extrabold leading-[0.95] tracking-tight">
            Gear for the
            <br />
            <span className="text-wire">long route</span> home.
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 max-w-xl">
            {[
              ["FREIGHT", "free > $120"],
              ["RETURNS", "30 days"],
              ["GATEWAY", "api.bridgework"],
              ["SYNC", "→ WooCommerce"],
            ].map(([k, v]) => (
              <div key={k} className="bg-panel px-3 py-2.5 transition-colors hover:bg-panel2">
                <p className="font-mono text-[9px] tracking-[0.2em] text-faint">{k}</p>
                <p className="mt-0.5 font-mono text-[11px] text-dim">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* live feed card */}
        <div className="corners border border-line bg-panel/80">
          <div className="flex items-center justify-between border-b border-dashed border-line px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mint">gateway feed · live</span>
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
          </div>
          <div className="p-2 font-mono text-[11px]">
            {feedRows.map((f, i) =>
              f ? (
                <div
                  key={f.number}
                  className={`flex items-center gap-3 px-2 py-1.5 transition-all duration-500 ${
                    i === feedIdx % Math.min(feed.length, 5) ? "bg-panel2 text-ink" : "text-faint"
                  }`}
                >
                  <span className="text-wire">{f.number}</span>
                  <span className="uppercase text-[9px] tracking-[0.16em]">{f.channel}</span>
                  <span className="ml-auto">{money(f.total)}</span>
                  <span className={`text-[9px] uppercase tracking-[0.12em] ${f.status === "completed" ? "text-mint" : f.status === "pending" ? "text-amber" : "text-faint"}`}>
                    {f.status}
                  </span>
                </div>
              ) : (
                <div key={`ph${i}`} className="px-2 py-1.5 text-faint/50">
                  ··· waiting on bridge traffic
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ---------- marquee strip ---------- */}
      <div className="mt-10 overflow-hidden border-y border-line bg-panel/60 py-2">
        <div className="marquee-track font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {(feed.length > 0 ? feed : ([{ number: "BW-····", channel: "—", total: 0, status: "sync" }] as { number: string; channel: string; total: number; status: string }[])).map((f) => (
                <span key={`${dup}-${f.number}`} className="flex items-center">
                  <span className="px-5">{f.number}</span>
                  <span className="text-amber/70">→</span>
                  <span className="px-5">{f.channel}</span>
                  <span className="text-amber/70">→</span>
                  <span className="px-5">{f.total ? money(f.total) : "···"}</span>
                  <span className="text-amber/70">→</span>
                  <span className="px-5 text-mint/70">woocommerce ✓</span>
                  <span className="text-wire/40">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- catalog ---------- */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`cursor-pointer border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-all duration-200 active:scale-95 ${
                cat === c ? "border-amber bg-amber/10 text-amber" : "border-line text-faint hover:border-faint hover:text-dim"
              }`}
            >
              {c}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              {visible.length} item{visible.length === 1 ? "" : "s"}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="cursor-pointer border border-line bg-panel px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim"
            >
              <option value="featured">featured</option>
              <option value="price-asc">price ↑</option>
              <option value="price-desc">price ↓</option>
              <option value="rating">rating</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse border border-line bg-panel/50" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {visible.map((p, i) => (
              <article
                key={p.id}
                className="group relative flex cursor-pointer flex-col border border-line bg-panel/70 transition-all duration-300 hover:-translate-y-1 hover:border-wire/50 hover:bg-panel hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                onClick={() => {
                  setDetail(p);
                  setDetailQty(1);
                }}
                style={{ transitionDelay: `${Math.min(i * 20, 120)}ms` }}
              >
                {/* glyph plate */}
                <div className="relative flex h-36 items-center justify-center border-b border-dashed border-line text-wire/70 transition-colors duration-300 group-hover:text-wire">
                  <span className="absolute left-2 top-2 h-2.5 w-2.5 border-l border-t border-transparent transition-colors duration-300 group-hover:border-wire/70" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 border-r border-t border-transparent transition-colors duration-300 group-hover:border-wire/70" />
                  <span className="absolute bottom-2 left-2 h-2.5 w-2.5 border-b border-l border-transparent transition-colors duration-300 group-hover:border-wire/70" />
                  <span className="absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r border-transparent transition-colors duration-300 group-hover:border-wire/70" />
                  <Glyph category={p.category} size={52} className="transition-transform duration-300 group-hover:scale-110" />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.24em] text-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    view sheet
                  </span>
                  {p.compareAt && (
                    <span className="absolute right-2 top-2 bg-amber px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-bg">
                      SAVE {money(p.compareAt - p.price)}
                    </span>
                  )}
                </div>
                {/* body */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between font-mono text-[10px] text-faint">
                    <span className="tracking-[0.16em]">{p.sku}</span>
                    <span className="text-amber">★ {p.rating.toFixed(1)}</span>
                  </div>
                  <h3 className="mt-1.5 font-display text-[16px] font-bold leading-tight tracking-tight transition-colors group-hover:text-wire">
                    {p.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-faint">{p.blurb}</p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-display text-xl font-extrabold">{money(p.price)}</p>
                      {p.compareAt && <p className="font-mono text-[10px] text-faint line-through">{money(p.compareAt)}</p>}
                    </div>
                    <StockBadge stock={p.stock} />
                  </div>
                  <button
                    disabled={p.stock === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p.id, 1);
                    }}
                    className={`mt-3 flex w-full items-center justify-center gap-2 border py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-all duration-200 active:scale-[0.97] ${
                      p.stock === 0
                        ? "cursor-not-allowed border-line text-faint/50"
                        : "cursor-pointer border-mint/60 text-mint hover:bg-mint/10"
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : (<><IconPlus size={13} /> add to cart</>)}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="mt-10 border border-dashed border-line p-10 text-center font-mono text-[12px] text-faint">
            no SKUs match “{search}” — the catalog ends here.
          </div>
        )}
      </div>

      {/* ---------- detail modal ---------- */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={() => setDetail(null)}>
          <div
            className="tick-in w-full max-w-2xl border border-line bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wire">product sheet · {detail.sku}</span>
              <button onClick={() => setDetail(null)} className="cursor-pointer text-faint transition-colors hover:text-ink" aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <div className="grid sm:grid-cols-[1fr_1.3fr]">
              <div className="flex items-center justify-center border-b border-line bg-bg/40 p-8 text-wire sm:border-b-0 sm:border-r">
                <Glyph category={detail.category} size={110} />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-2xl font-extrabold tracking-tight">{detail.name}</h3>
                  <StockBadge stock={detail.stock} />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-dim">{detail.blurb}</p>
                <table className="mt-4 w-full font-mono text-[11px]">
                  <tbody>
                    {[
                      ["SKU", detail.sku],
                      ["CATEGORY", detail.category],
                      ["WEIGHT", detail.weight],
                      ["MATERIAL", detail.material],
                      ["TAGS", detail.tags.join(" · ")],
                      ["RATING", `★ ${detail.rating.toFixed(1)} / 5`],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-t border-linesoft">
                        <td className="py-1.5 pr-3 text-faint">{k}</td>
                        <td className="py-1.5 text-right text-dim">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex items-center border border-line">
                    <button onClick={() => setDetailQty((q) => Math.max(1, q - 1))} className="cursor-pointer p-2.5 text-faint transition-colors hover:text-ink active:scale-90" aria-label="Less">
                      <IconMinus size={14} />
                    </button>
                    <span className="w-8 text-center font-mono text-[13px]">{detailQty}</span>
                    <button onClick={() => setDetailQty((q) => Math.min(detail.stock, q + 1))} className="cursor-pointer p-2.5 text-faint transition-colors hover:text-ink active:scale-90" aria-label="More">
                      <IconPlus size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-extrabold">{money(detail.price * detailQty)}</p>
                    {detail.compareAt && <p className="font-mono text-[10px] text-faint line-through">{money(detail.compareAt * detailQty)}</p>}
                  </div>
                </div>
                <button
                  disabled={detail.stock === 0}
                  onClick={() => {
                    addToCart(detail.id, detailQty);
                    setDetail(null);
                  }}
                  className={`mt-4 flex w-full items-center justify-center gap-2 border py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] transition-all active:scale-[0.98] ${
                    detail.stock === 0 ? "cursor-not-allowed border-line text-faint/50" : "cursor-pointer border-mint/70 bg-mint/10 text-mint hover:bg-mint/20"
                  }`}
                >
                  {detail.stock === 0 ? "Out of stock" : (<><IconCart size={15} /> add {detailQty} to cart</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- cart drawer ---------- */}
      {drawer && (
        <div className="fixed inset-0 z-50" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]" />
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-panel shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-wire">
                {view === "cart" ? "cart · staged at gateway" : view === "checkout" ? "checkout · web channel" : "order filed"}
              </span>
              <button onClick={() => setDrawer(false)} className="cursor-pointer text-faint transition-colors hover:text-ink" aria-label="Close cart">
                <IconX size={18} />
              </button>
            </div>

            {view === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  {cart.length === 0 ? (
                    <div className="mt-16 text-center">
                      <IconCart size={40} className="mx-auto text-line" />
                      <p className="mt-4 font-mono text-[12px] text-faint">cart is empty — nothing on the bridge yet.</p>
                      <button onClick={() => setDrawer(false)} className="mt-5 cursor-pointer border border-wire/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-wire transition-colors hover:bg-wire/10">
                        browse catalog
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {cart.map((l) => {
                        const p = products.find((x) => x.id === l.productId);
                        if (!p) return null;
                        return (
                          <li key={l.productId} className="flex gap-3 border border-linesoft bg-bg/30 p-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-line text-wire/70">
                              <Glyph category={p.category} size={28} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="truncate font-display text-[14px] font-bold">{p.name}</p>
                                <button onClick={() => setQty(l.productId, 0)} className="cursor-pointer text-faint transition-colors hover:text-coral" aria-label="Remove">
                                  <IconTrash size={14} />
                                </button>
                              </div>
                              <p className="font-mono text-[10px] text-faint">{p.sku} · {money(p.price)} ea</p>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center border border-line">
                                  <button onClick={() => setQty(l.productId, l.qty - 1)} className="cursor-pointer p-1.5 text-faint hover:text-ink active:scale-90" aria-label="Less">
                                    <IconMinus size={12} />
                                  </button>
                                  <span className="w-7 text-center font-mono text-[12px]">{l.qty}</span>
                                  <button onClick={() => setQty(l.productId, l.qty + 1)} className="cursor-pointer p-1.5 text-faint hover:text-ink active:scale-90" aria-label="More">
                                    <IconPlus size={12} />
                                  </button>
                                </div>
                                <span className="font-mono text-[12px] text-dim">{money(p.price * l.qty)}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-line p-5">
                    <div className="flex gap-2">
                      <div className="flex flex-1 items-center gap-2 border border-line bg-bg/40 px-3">
                        <IconTag size={13} className="text-faint" />
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="COUPON CODE"
                          className="w-full bg-transparent py-2 font-mono text-[11px] tracking-[0.14em] text-ink placeholder:text-faint"
                        />
                      </div>
                      <button
                        onClick={applyCoupon}
                        disabled={couponBusy}
                        className="cursor-pointer border border-wire/60 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-wire transition-all hover:bg-wire/10 active:scale-95 disabled:opacity-50"
                      >
                        {couponBusy ? "···" : "apply"}
                      </button>
                    </div>
                    {coupon && (
                      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-mint">
                        ✓ {coupon.code} — saves {money(discount)}
                      </p>
                    )}
                    <div className="mt-4 space-y-1.5 font-mono text-[12px]">
                      <div className="flex justify-between text-dim"><span>subtotal</span><span>{money(subtotal)}</span></div>
                      {discount > 0 && <div className="flex justify-between text-mint"><span>discount</span><span>−{money(discount)}</span></div>}
                      <div className="flex justify-between text-dim">
                        <span>freight</span>
                        <span className={subtotal >= 120 ? "text-mint" : ""}>{subtotal >= 120 ? "FREE" : "flat $9"}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-line pt-2 text-[15px] font-semibold text-ink">
                        <span>total</span><span>{money(subtotal >= 120 ? total : total + 9)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setView("checkout")}
                      className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 border border-amber bg-amber/10 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-amber transition-all hover:bg-amber/20 active:scale-[0.98]"
                    >
                      checkout <IconArrow size={15} />
                    </button>
                  </div>
                )}
              </>
            )}

            {view === "checkout" && (
              <div className="flex flex-1 flex-col overflow-y-auto p-5">
                <button onClick={() => setView("cart")} className="mb-4 self-start cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-faint transition-colors hover:text-wire">
                  ← back to cart
                </button>
                <label className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">full name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Trail" className="border border-line bg-bg/40 px-3 py-2.5 text-[13px]" />
                <label className="mb-1 mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@ridgemail.co" type="email" className="border border-line bg-bg/40 px-3 py-2.5 text-[13px]" />
                <label className="mb-1 mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">shipping address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="14 Col Pass, Alpine District" rows={3} className="resize-none border border-line bg-bg/40 px-3 py-2.5 text-[13px]" />
                <div className="mt-4 border border-dashed border-line bg-bg/30 p-3 font-mono text-[11px] text-dim">
                  <div className="flex justify-between"><span>{cart.reduce((s, l) => s + l.qty, 0)} items</span><span>{money(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-mint"><span>{coupon?.code}</span><span>−{money(discount)}</span></div>}
                  <div className="mt-1 flex justify-between border-t border-linesoft pt-1 text-[13px] text-ink">
                    <span>total</span><span>{money(subtotal >= 120 ? total : total + 9)}</span>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[10px] leading-relaxed text-faint">
                  order is filed with the <span className="text-amber">middle API layer</span>, which syncs it to WooCommerce.
                  no payment details are collected in this prototype.
                </p>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 border border-mint bg-mint/10 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-mint transition-all hover:bg-mint/20 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                >
                  {placing ? "filing order ···" : (<>place order <IconArrow size={15} /></>)}
                </button>
              </div>
            )}

            {view === "done" && placed && (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <Stamp tone="mint" pop className="text-[13px]">order filed</Stamp>
                <p className="mt-6 font-display text-4xl font-extrabold tracking-tight text-mint">{placed.number}</p>
                <p className="mt-3 font-mono text-[12px] text-dim">{placed.items.reduce((s, i) => s + i.qty, 0)} items · {money(placed.total)}</p>
                <div className="mt-6 w-full border border-dashed border-line bg-bg/30 p-4 text-left font-mono text-[11px] text-dim">
                  {placed.items.map((i) => (
                    <div key={i.productId} className="flex justify-between py-0.5">
                      <span className="truncate pr-3">{i.qty}× {i.name}</span>
                      <span>{money(i.price * i.qty)}</span>
                    </div>
                  ))}
                  {placed.discount > 0 && (
                    <div className="flex justify-between py-0.5 text-mint"><span>{placed.couponCode}</span><span>−{money(placed.discount)}</span></div>
                  )}
                </div>
                <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
                  queued → middle API → woocommerce
                </p>
                <p className="mt-1 font-mono text-[10px] text-faint">check it under /admin → orders</p>
                <button
                  onClick={() => setDrawer(false)}
                  className="mt-6 flex cursor-pointer items-center gap-2 border border-wire/60 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-wire transition-all hover:bg-wire/10 active:scale-95"
                >
                  <IconCheck size={14} /> back to catalog
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ---------- footer strip ---------- */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
        <span>trailhead supply co. · storefront prototype</span>
        <span className="text-wire/70">channel: web · all calls via api.bridgework.dev (sim)</span>
      </div>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="border border-coral/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-coral">out</span>;
  if (stock <= 8)
    return (
      <span className="flex items-center gap-1.5 border border-amber/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
        <span className="pulse-dot inline-block h-1 w-1 rounded-full bg-amber" /> {stock} left
      </span>
    );
  return <span className="border border-mint/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-mint">in stock</span>;
}
