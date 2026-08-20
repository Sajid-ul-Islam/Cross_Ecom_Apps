import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  bdt,
  DEFAULT_PROFILE,
  DEEN_CATALOG,
  DEEN_CATEGORIES,
  deenCreateOrder,
  deenListOrders,
  deenListProducts,
  DELIVERY_FEES,
  FREE_TEE_THRESHOLD,
  getDeenProfile,
  HERO_IMG,
  ORDER_FLOW,
  PAYMENT_LABELS,
  saveDeenProfile,
  subscribeDeenApi,
  type DeenArea,
  type DeenCartItem,
  type DeenCategory,
  type DeenOrder,
  type DeenPayment,
  type DeenProduct,
  type DeenProfile,
  type DeenRequest,
} from "../api/deen";
import { PHASES, type TaskStatus } from "../data";
import { Bar, Reveal, Stamp, StatusChip, useToast } from "../components/ui";
import { useReducedMotion } from "../hooks";
import {
  IconArrowLeft,
  IconBag,
  IconBattery,
  IconBox,
  IconCheck,
  IconMinus,
  IconPlus,
  IconSearch,
  IconSignal,
  IconTag,
  IconTrash,
  IconUser,
  IconX,
} from "../components/Icons";

/* ------------------------------------------------------------------ */
/*  in-app palette (light, denim-inspired)                             */
/* ------------------------------------------------------------------ */

const T = {
  paper: "#F5F3EC",
  card: "#FFFFFF",
  ink: "#151A2C",
  sub: "#6C7284",
  line: "#E6E2D7",
  indigo: "#2A3680",
  indigoDark: "#1A2350",
  crimson: "#C93B36",
  ok: "#2E7D5B",
};

type Screen =
  | { name: "home" }
  | { name: "shop"; category?: DeenCategory | "ALL"; saleOnly?: boolean }
  | { name: "product"; id: string }
  | { name: "bag" }
  | { name: "checkout" }
  | { name: "success"; order: DeenOrder }
  | { name: "orders" }
  | { name: "profile" };

type Tab = "home" | "shop" | "bag" | "orders" | "profile";

/* ---------------- image with woven fallback ---------------- */

function PImg({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`weave flex items-center justify-center ${className}`}>
        <span className="font-disp text-lg tracking-wide text-white/60">{alt.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} onError={() => setFailed(true)} />;
}

function HouseIcon({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} aria-hidden>
      <path d="M4 11 12 4l8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- product bits ---------------- */

const pctOff = (p: DeenProduct) => (p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0);

function PriceLine({ p, size = "base" }: { p: DeenProduct; size?: "sm" | "base" | "lg" }) {
  const main = size === "sm" ? "text-[13px]" : size === "lg" ? "text-[22px]" : "text-[15px]";
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-arch font-bold ${main}`} style={{ color: T.ink }}>
        {bdt(p.salePrice ?? p.price)}
      </span>
      {p.salePrice && (
        <span className="font-mono text-[11px] line-through" style={{ color: T.sub }}>
          {bdt(p.price)}
        </span>
      )}
      {p.salePrice && (
        <span className="font-mono text-[10px] font-semibold" style={{ color: T.crimson }}>
          −{pctOff(p)}%
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE APP                                                            */
/* ------------------------------------------------------------------ */

function DeenPhone() {
  const toast = useToast();
  const reduced = useReducedMotion();
  const [boot, setBoot] = useState(true);
  const [products, setProducts] = useState<DeenProduct[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [cart, setCart] = useState<DeenCartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<DeenOrder | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setBoot(false), reduced ? 200 : 1600);
    return () => window.clearTimeout(t);
  }, [reduced]);

  useEffect(() => {
    deenListProducts().then(setProducts);
  }, []);

  const find = (id: string) => products.find((p) => p.id === id) ?? DEEN_CATALOG.find((p) => p.id === id);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => {
    const p = find(i.productId);
    return s + (p ? (p.salePrice ?? p.price) * i.qty : 0);
  }, 0);

  const addToCart = (productId: string, size: string, qty = 1) => {
    setCart((prev) => {
      const key = prev.findIndex((i) => i.productId === productId && i.size === size);
      if (key >= 0) return prev.map((i, idx) => (idx === key ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { productId, size, qty }];
    });
    toast(`Added to bag · size ${size}`, "mint");
  };

  const setQty = (productId: string, size: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => !(i.productId === productId && i.size === size))
        : prev.map((i) => (i.productId === productId && i.size === size ? { ...i, qty } : i))
    );
  };

  const placeOrder = async (payload: { name: string; phone: string; address: string; area: DeenArea; payment: DeenPayment }) => {
    const order = await deenCreateOrder({ ...payload, items: cart });
    setCart([]);
    setLastOrder(order);
    setScreen({ name: "success", order });
    toast(`Order ${order.number} placed via middle API`, "mint");
  };

  const tab: Tab =
    screen.name === "product" || screen.name === "shop"
      ? screen.name === "shop"
        ? "shop"
        : "shop"
      : screen.name === "bag" || screen.name === "checkout" || screen.name === "success"
        ? "bag"
        : screen.name;

  const clock = useMemo(() => {
    const d = new Date();
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, [screen]);

  /* ---------------- screens ---------------- */

  const screenNode: ReactNode = (() => {
    switch (screen.name) {
      case "home":
        return <HomeScreen go={setScreen} products={products} cartSubtotal={cartSubtotal} />;
      case "shop":
        return <ShopScreen init={screen} go={setScreen} products={products} />;
      case "product":
        return <ProductScreen product={find(screen.id)} go={setScreen} onAdd={addToCart} cartSubtotal={cartSubtotal} />;
      case "bag":
        return <BagScreen cart={cart} find={find} go={setScreen} setQty={setQty} subtotal={cartSubtotal} />;
      case "checkout":
        return <CheckoutScreen cart={cart} find={find} subtotal={cartSubtotal} onPlace={placeOrder} go={setScreen} />;
      case "success":
        return <SuccessScreen order={screen.order} go={setScreen} />;
      case "orders":
        return <OrdersScreen profile={getDeenProfile()} go={setScreen} />;
      case "profile":
        return <ProfileScreen go={setScreen} />;
    }
  })();

  return (
    <div className="mx-auto w-[360px] shrink-0 max-w-full">
      {/* device frame */}
      <div
        className="relative rounded-[44px] border border-black/60 p-[10px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.75)]"
        style={{ background: "linear-gradient(160deg,#2b3346,#12161f 55%,#242c3f)" }}
      >
        <span className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-black/70" />
        <span className="absolute -right-[3px] top-48 h-10 w-[3px] rounded-r bg-black/70" />
        <div className="relative h-[720px] overflow-hidden rounded-[34px]" style={{ background: T.paper }}>
          {/* status bar */}
          <div className="relative z-20 flex items-center justify-between px-6 pt-2.5 pb-1.5 font-mono text-[10px]" style={{ color: T.ink }}>
            <span className="font-semibold tracking-wider">{clock}</span>
            <span className="absolute left-1/2 top-2 h-[9px] w-[9px] -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1.5" style={{ color: T.sub }}>
              <span style={{ color: T.ink }}>GP</span>
              <IconSignal size={11} />
              <IconBattery size={15} />
            </span>
          </div>

          {/* screen content */}
          <div className="h-[calc(100%-104px)] overflow-hidden">
            {boot ? <BootSplash /> : <div key={screen.name} className="screen-in h-full overflow-y-auto hide-scroll">{screenNode}</div>}
          </div>

          {/* bottom nav */}
          {!boot && (
            <div className="absolute inset-x-0 bottom-0 z-20 border-t" style={{ background: "rgba(255,255,255,0.96)", borderColor: T.line }}>
              <div className="grid grid-cols-5">
                {(
                  [
                    { id: "home", label: "Home", icon: <HouseIcon size={20} active={tab === "home"} /> },
                    { id: "shop", label: "Shop", icon: <IconTag size={20} strokeWidth={tab === "shop" ? 2.1 : 1.7} /> },
                    { id: "bag", label: "Bag", icon: <IconBag size={20} strokeWidth={tab === "bag" ? 2.1 : 1.7} /> },
                    { id: "orders", label: "Orders", icon: <IconBox size={20} strokeWidth={tab === "orders" ? 2.1 : 1.7} /> },
                    { id: "profile", label: "Profile", icon: <IconUser size={20} strokeWidth={tab === "profile" ? 2.1 : 1.7} /> },
                  ] as { id: Tab; label: string; icon: ReactNode }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setScreen({ name: t.id } as Screen)}
                    className="relative flex cursor-pointer flex-col items-center gap-0.5 py-2.5 transition-all duration-200 active:scale-90"
                    style={{ color: tab === t.id ? T.indigo : T.sub }}
                  >
                    {t.icon}
                    <span className="font-arch text-[9.5px] font-semibold tracking-wide">{t.label}</span>
                    {t.id === "bag" && cartCount > 0 && (
                      <span
                        className="deen-pop absolute right-[22%] top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white"
                        style={{ background: T.crimson }}
                      >
                        {cartCount}
                      </span>
                    )}
                    <span
                      className="absolute bottom-0 h-[3px] w-8 rounded-t-full transition-all duration-300"
                      style={{ background: tab === t.id ? T.indigo : "transparent" }}
                    />
                  </button>
                ))}
              </div>
              <div className="mx-auto mb-1.5 h-[4px] w-24 rounded-full bg-black/20" />
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
        Pixel 8 · Android 15 · Expo Dev Build
      </p>
    </div>
  );
}

/* ---------------- boot ---------------- */

function BootSplash() {
  return (
    <div className="flex h-full flex-col items-center justify-center" style={{ background: T.indigoDark }}>
      <div className="boot-line font-disp text-[44px] tracking-tight text-white">DEEN</div>
      <p className="boot-line mt-2 font-mono text-[10px] tracking-[0.3em] text-white/50" style={{ animationDelay: "0.2s" }}>
        দেশের প্রথম ডেনিম ব্র্যান্ড
      </p>
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="deen-dot h-1.5 w-1.5 rounded-full bg-white/70" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="absolute bottom-8 font-mono text-[9px] tracking-[0.2em] text-white/35">expo run:android · via middle API</p>
    </div>
  );
}

/* ---------------- home ---------------- */

function HomeScreen({
  go,
  products,
  cartSubtotal,
}: {
  go: (s: Screen) => void;
  products: DeenProduct[];
  cartSubtotal: number;
}) {
  const list = products.length ? products : DEEN_CATALOG;
  const newDrop = list.filter((p) => p.isNew);
  const freeTeeLeft = Math.max(0, FREE_TEE_THRESHOLD - cartSubtotal);

  const catCount = (c: DeenCategory) => list.filter((p) => p.category === c).length;

  return (
    <div className="font-arch" style={{ color: T.ink }}>
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-1 pb-3">
        <span className="font-disp text-[22px] tracking-tight">DEEN</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go({ name: "shop" })}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90"
            style={{ border: `1px solid ${T.line}`, color: T.ink }}
            aria-label="Search"
          >
            <IconSearch size={16} />
          </button>
          <button
            onClick={() => go({ name: "bag" })}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90"
            style={{ border: `1px solid ${T.line}`, color: T.ink }}
            aria-label="Bag"
          >
            <IconBag size={16} />
          </button>
        </div>
      </div>

      {/* hero */}
      <div className="relative mx-4 h-[190px] overflow-hidden rounded-2xl">
        <PImg src={HERO_IMG} alt="Blue Label denim" className="hero-drift h-full w-full" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(20,26,60,0.72) 8%, rgba(20,26,60,0.15) 60%)" }} />
        <div className="absolute inset-0 flex flex-col justify-center p-5">
          <p className="font-mono text-[9px] tracking-[0.3em] text-white/70">BLUE LABEL COLLECTION</p>
          <p className="font-disp mt-1.5 max-w-[190px] text-[26px] leading-[1.02] text-white">Jeans built to outlast trends.</p>
          <button
            onClick={() => go({ name: "shop", category: "JEANS" })}
            className="mt-3.5 w-fit cursor-pointer rounded-full px-4 py-2 font-arch text-[12px] font-bold text-white transition-transform active:scale-95"
            style={{ background: T.indigo }}
          >
            Shop Jeans →
          </button>
        </div>
      </div>

      {/* free tee strip */}
      <button
        onClick={() => go({ name: "shop" })}
        className="mx-4 mt-3 flex w-[calc(100%-32px)] cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-transform active:scale-[0.98]"
        style={{ background: cartSubtotal >= FREE_TEE_THRESHOLD ? T.ok : T.indigoDark }}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
          {cartSubtotal >= FREE_TEE_THRESHOLD ? <IconCheck size={14} /> : <IconTag size={13} />}
        </span>
        <span className="flex-1">
          <span className="block text-[12px] font-bold text-white">
            {cartSubtotal >= FREE_TEE_THRESHOLD ? "Summer Fest unlocked — free tee on this bag" : "Summer Fest · free cotton tee"}
          </span>
          <span className="block font-mono text-[10px] text-white/60">
            {cartSubtotal >= FREE_TEE_THRESHOLD ? `You saved ${bdt(0)} · gift added at checkout` : `Add ${bdt(freeTeeLeft)} more to qualify`}
          </span>
        </span>
      </button>

      {/* categories */}
      <div className="mt-5 px-4">
        <div className="flex items-baseline justify-between">
          <p className="font-disp text-[15px]">Shop by Category</p>
          <button onClick={() => go({ name: "shop" })} className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: T.indigo }}>
            View all
          </button>
        </div>
        <div className="hide-scroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {DEEN_CATEGORIES.map((c, i) => {
            const hues = ["#2A3680", "#7A3B52", "#3E5C4B", "#8C6A2F", "#4E4A6B", "#2F6B72", "#6B4A2F"];
            return (
              <button
                key={c}
                onClick={() => go({ name: "shop", category: c })}
                className="shrink-0 cursor-pointer rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: hues[i % hues.length] }}
              >
                <span className="block font-mono text-[9px] text-white/60">{catCount(c)} styles</span>
                <span className="block font-disp text-[13px] text-white">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* new drop rail */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between px-4">
          <p className="font-disp text-[15px]">New Drop</p>
          <button onClick={() => go({ name: "shop" })} className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: T.indigo }}>
            Explore
          </button>
        </div>
        <div className="hide-scroll mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
          {newDrop.map((p) => (
            <button key={p.id} onClick={() => go({ name: "product", id: p.id })} className="w-[136px] shrink-0 cursor-pointer text-left transition-transform active:scale-[0.97]">
              <div className="relative h-[172px] overflow-hidden rounded-xl" style={{ background: T.line }}>
                <PImg src={p.images[0]} alt={p.name} className="h-full w-full" />
                {p.salePrice && (
                  <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white" style={{ background: T.crimson }}>
                    −{pctOff(p)}%
                  </span>
                )}
              </div>
              <p className="clamp2 mt-1.5 text-[11.5px] font-semibold leading-snug">{p.name}</p>
              <PriceLine p={p} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* promo tiles */}
      <div className="mt-4 grid grid-cols-2 gap-3 px-4 pb-6">
        <button
          onClick={() => go({ name: "shop", saleOnly: true })}
          className="cursor-pointer rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          style={{ background: T.crimson }}
        >
          <p className="font-disp text-[17px] leading-tight text-white">Half Price, Full Style</p>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/70">up to 50% off</p>
        </button>
        <button
          onClick={() => go({ name: "shop", category: "SHIRT" })}
          className="cursor-pointer rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          style={{ background: T.indigo }}
        >
          <p className="font-disp text-[17px] leading-tight text-white">Cuban Collar Drop</p>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/70">summer shirts</p>
        </button>
      </div>

      {/* trust footer */}
      <div className="border-t px-4 py-4 text-center" style={{ borderColor: T.line }}>
        <p className="font-mono text-[10px]" style={{ color: T.sub }}>
          Hotline 09617-700500 · 10 AM – 6 PM
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: T.sub }}>
          COD · bKash · Nagad &nbsp;·&nbsp; 7-day exchange
        </p>
      </div>
    </div>
  );
}

/* ---------------- shop ---------------- */

function ShopScreen({
  init,
  go,
  products,
}: {
  init: { category?: DeenCategory | "ALL"; saleOnly?: boolean };
  go: (s: Screen) => void;
  products: DeenProduct[];
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<DeenCategory | "ALL">(init.category ?? "ALL");
  const [saleOnly, setSaleOnly] = useState(init.saleOnly ?? false);
  const [sort, setSort] = useState<"featured" | "low" | "high" | "off">("featured");

  const list = (products.length ? products : DEEN_CATALOG)
    .filter((p) => (cat === "ALL" ? true : p.category === cat))
    .filter((p) => (saleOnly ? !!p.salePrice : true))
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "low") return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
      if (sort === "high") return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
      if (sort === "off") return pctOff(b) - pctOff(a);
      return Number(!!b.salePrice) - Number(!!a.salePrice);
    });

  return (
    <div className="font-arch" style={{ color: T.ink }}>
      <div className="px-4 pt-1 pb-3">
        <p className="font-disp text-[20px]">Shop</p>
        <div className="mt-2.5 flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: "#EDEAE1" }}>
          <IconSearch size={15} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jeans, panjabi, SKU…"
            className="w-full bg-transparent font-arch text-[13px] placeholder:text-[#9a9789]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="cursor-pointer" style={{ color: T.sub }}>
              <IconX size={14} />
            </button>
          )}
        </div>
        <div className="hide-scroll -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4">
          {(["ALL", ...DEEN_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="shrink-0 cursor-pointer rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 active:scale-95"
              style={
                cat === c
                  ? { background: T.indigo, borderColor: T.indigo, color: "#fff" }
                  : { background: "transparent", borderColor: T.line, color: T.sub }
              }
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <button
            onClick={() => setSaleOnly((s) => !s)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-all active:scale-95"
            style={saleOnly ? { background: T.crimson, borderColor: T.crimson, color: "#fff" } : { borderColor: T.line, color: T.sub }}
          >
            <IconTag size={11} /> Sale only
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="cursor-pointer rounded-full border bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ borderColor: T.line, color: T.sub }}
          >
            <option value="featured">Featured</option>
            <option value="low">Price ↑</option>
            <option value="high">Price ↓</option>
            <option value="off">Biggest discount</option>
          </select>
        </div>
      </div>

      <p className="px-4 pb-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: T.sub }}>
        {list.length} styles
      </p>

      {list.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="font-disp text-[16px]">Nothing matches</p>
          <p className="text-[12px]" style={{ color: T.sub }}>
            Try another search or clear the filters.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCat("ALL");
              setSaleOnly(false);
            }}
            className="mt-1 cursor-pointer rounded-full px-4 py-2 text-[12px] font-bold text-white transition-transform active:scale-95"
            style={{ background: T.indigo }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 pb-8">
          {list.map((p) => (
            <button key={p.id} onClick={() => go({ name: "product", id: p.id })} className="cursor-pointer text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl" style={{ background: T.line }}>
                <PImg src={p.images[0]} alt={p.name} className="h-full w-full" />
                {p.salePrice && (
                  <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white" style={{ background: T.crimson }}>
                    SALE −{pctOff(p)}%
                  </span>
                )}
                {p.isNew && !p.salePrice && (
                  <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white" style={{ background: T.indigo }}>
                    NEW
                  </span>
                )}
              </div>
              <p className="clamp2 mt-2 text-[12px] font-semibold leading-snug">{p.name}</p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: T.sub }}>
                {p.sizes.join(" · ")}
              </p>
              <div className="mt-1">
                <PriceLine p={p} size="sm" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- product ---------------- */

function ProductScreen({
  product,
  go,
  onAdd,
  cartSubtotal,
}: {
  product: DeenProduct | undefined;
  go: (s: Screen) => void;
  onAdd: (id: string, size: string, qty: number) => void;
  cartSubtotal: number;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQtyState] = useState(1);
  const [sizeErr, setSizeErr] = useState(false);

  if (!product) return null;
  const unit = product.salePrice ?? product.price;
  const freeTeeLeft = Math.max(0, FREE_TEE_THRESHOLD - (cartSubtotal + unit * qty));

  const add = () => {
    if (!size) {
      setSizeErr(true);
      return;
    }
    onAdd(product.id, size, qty);
  };

  return (
    <div className="flex h-full flex-col font-arch" style={{ color: T.ink }}>
      <div className="min-h-0 flex-1 overflow-y-auto hide-scroll pb-2">
        {/* gallery */}
        <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ background: T.line }}>
          <PImg key={imgIdx} src={product.images[imgIdx]} alt={product.name} className="h-full w-full" />
          <button
            onClick={() => go({ name: "shop", category: product.category })}
            className="absolute left-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow transition-transform active:scale-90"
            aria-label="Back"
          >
            <IconArrowLeft size={17} />
          </button>
          {product.salePrice && (
            <span className="absolute right-3 top-3 rounded px-2 py-1 font-mono text-[10px] font-bold text-white" style={{ background: T.crimson }}>
              SALE −{pctOff(product)}%
            </span>
          )}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className="h-1.5 cursor-pointer rounded-full transition-all duration-300"
                style={{ width: i === imgIdx ? 18 : 6, background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)" }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="px-4 pt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: T.sub }}>
            {product.category} · SKU {product.sku}
          </p>
          <h2 className="font-disp mt-1 text-[19px] leading-tight">{product.name}</h2>
          <div className="mt-2">
            <PriceLine p={product} size="lg" />
          </div>

          {/* sizes */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em]">
                Size {sizeErr && !size && <span style={{ color: T.crimson }}>· pick one</span>}
              </p>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: T.sub }}>
                size guide
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setSizeErr(false);
                  }}
                  className="h-10 min-w-[46px] cursor-pointer rounded-lg border px-2 font-mono text-[12px] font-semibold transition-all duration-150 active:scale-90"
                  style={
                    size === s
                      ? { background: T.indigo, borderColor: T.indigo, color: "#fff" }
                      : { background: "#fff", borderColor: sizeErr ? T.crimson : T.line, color: T.ink }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* qty */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em]">Quantity</p>
            <div className="flex items-center gap-3 rounded-full border px-2 py-1" style={{ borderColor: T.line }}>
              <button onClick={() => setQtyState((q) => Math.max(1, q - 1))} className="cursor-pointer p-1 transition-transform active:scale-75" aria-label="Less">
                <IconMinus size={14} />
              </button>
              <span className="w-5 text-center font-mono text-[13px] font-bold">{qty}</span>
              <button onClick={() => setQtyState((q) => q + 1)} className="cursor-pointer p-1 transition-transform active:scale-75" aria-label="More">
                <IconPlus size={14} />
              </button>
            </div>
          </div>

          {/* free tee progress */}
          <div className="mt-4 rounded-xl p-3.5" style={{ background: freeTeeLeft === 0 ? T.ok : "#EFEBDF" }}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: freeTeeLeft === 0 ? "#fff" : T.indigo }}>
              {freeTeeLeft === 0 ? "Free tee unlocked with this item" : `Add ${bdt(freeTeeLeft)} more for a free tee`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.12)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((cartSubtotal + unit * qty) / FREE_TEE_THRESHOLD) * 100)}%`, background: freeTeeLeft === 0 ? "#fff" : T.indigo }}
              />
            </div>
          </div>

          {/* details */}
          <div className="mt-4 space-y-2.5 pb-4">
            {[
              ["Fabric", product.fabric],
              ["Delivery", "Inside Dhaka ৳70 · outside ৳130 · 2–4 days"],
              ["Exchange", "7-day easy exchange on unused items"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 rounded-xl border px-3.5 py-2.5" style={{ borderColor: T.line }}>
                <span className="w-[74px] shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: T.sub }}>
                  {k}
                </span>
                <span className="text-[12px] leading-snug">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* sticky CTA */}
      <div className="border-t p-3.5" style={{ background: "#fff", borderColor: T.line }}>
        <button
          onClick={add}
          className="w-full cursor-pointer rounded-xl py-3.5 font-disp text-[15px] tracking-wide text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{ background: T.indigo }}
        >
          Add to Bag · {bdt(unit * qty)}
        </button>
      </div>
    </div>
  );
}

/* ---------------- bag ---------------- */

function BagScreen({
  cart,
  find,
  go,
  setQty,
  subtotal,
}: {
  cart: DeenCartItem[];
  find: (id: string) => DeenProduct | undefined;
  go: (s: Screen) => void;
  setQty: (id: string, size: string, qty: number) => void;
  subtotal: number;
}) {
  const freeTeeLeft = Math.max(0, FREE_TEE_THRESHOLD - subtotal);
  return (
    <div className="flex h-full flex-col font-arch" style={{ color: T.ink }}>
      <div className="px-4 pt-1 pb-3">
        <p className="font-disp text-[20px]">Your Bag</p>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#EFEBDF", color: T.indigo }}>
            <IconBag size={26} />
          </span>
          <p className="font-disp text-[16px]">Your bag is empty</p>
          <p className="text-[12px] leading-relaxed" style={{ color: T.sub }}>
            Denim, panjabis, tees — everything from the live store is one tap away.
          </p>
          <button onClick={() => go({ name: "shop" })} className="mt-1 cursor-pointer rounded-full px-5 py-2.5 text-[12px] font-bold text-white transition-transform active:scale-95" style={{ background: T.indigo }}>
            Start shopping
          </button>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto hide-scroll px-4">
            {cart.map((it) => {
              const p = find(it.productId);
              if (!p) return null;
              return (
                <div key={`${it.productId}-${it.size}`} className="flex gap-3 rounded-xl border p-2.5" style={{ borderColor: T.line, background: "#fff" }}>
                  <button onClick={() => go({ name: "product", id: p.id })} className="h-[84px] w-[64px] shrink-0 cursor-pointer overflow-hidden rounded-lg" style={{ background: T.line }}>
                    <PImg src={p.images[0]} alt={p.name} className="h-full w-full" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="clamp2 text-[12px] font-semibold leading-snug">{p.name}</p>
                      <button onClick={() => setQty(it.productId, it.size, 0)} className="cursor-pointer transition-transform active:scale-75" style={{ color: T.sub }} aria-label="Remove">
                        <IconTrash size={14} />
                      </button>
                    </div>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: T.sub }}>
                      size <span className="rounded border px-1.5 py-px" style={{ borderColor: T.line }}>{it.size}</span> · {p.sku}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 rounded-full border px-1.5 py-0.5" style={{ borderColor: T.line }}>
                        <button onClick={() => setQty(it.productId, it.size, it.qty - 1)} className="cursor-pointer p-0.5 transition-transform active:scale-75" aria-label="Less">
                          <IconMinus size={12} />
                        </button>
                        <span className="w-4 text-center font-mono text-[11px] font-bold">{it.qty}</span>
                        <button onClick={() => setQty(it.productId, it.size, it.qty + 1)} className="cursor-pointer p-0.5 transition-transform active:scale-75" aria-label="More">
                          <IconPlus size={12} />
                        </button>
                      </div>
                      <span className="text-[13px] font-bold">{bdt((p.salePrice ?? p.price) * it.qty)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* free tee progress */}
            <div className="rounded-xl p-3.5" style={{ background: freeTeeLeft === 0 ? T.ok : T.indigoDark }}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                {freeTeeLeft === 0 ? "★ Free cotton tee added to your order" : `${bdt(freeTeeLeft)} away from a free tee`}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / FREE_TEE_THRESHOLD) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="border-t p-4" style={{ background: "#fff", borderColor: T.line }}>
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] uppercase tracking-[0.12em]" style={{ color: T.sub }}>Subtotal</span>
              <span className="font-disp text-[19px]">{bdt(subtotal)}</span>
            </div>
            <p className="mt-0.5 font-mono text-[9.5px]" style={{ color: T.sub }}>delivery added at checkout · ৳70 Dhaka / ৳130 outside</p>
            <button onClick={() => go({ name: "checkout" })} className="mt-3 w-full cursor-pointer rounded-xl py-3.5 font-disp text-[15px] text-white transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: T.indigo }}>
              Checkout →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- checkout ---------------- */

function CheckoutScreen({
  cart,
  find,
  subtotal,
  onPlace,
  go,
}: {
  cart: DeenCartItem[];
  find: (id: string) => DeenProduct | undefined;
  subtotal: number;
  onPlace: (p: { name: string; phone: string; address: string; area: DeenArea; payment: DeenPayment }) => Promise<void>;
  go: (s: Screen) => void;
}) {
  const profile = getDeenProfile();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<DeenArea>("dhaka");
  const [payment, setPayment] = useState<DeenPayment>("cod");
  const [err, setErr] = useState("");
  const [placing, setPlacing] = useState(false);

  const freeTee = subtotal >= FREE_TEE_THRESHOLD;
  const delivery = DELIVERY_FEES[area];
  const total = subtotal + delivery;

  const submit = async () => {
    setErr("");
    setPlacing(true);
    try {
      await onPlace({ name, phone, address, area, payment });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPlacing(false);
    }
  };

  const input = "w-full rounded-xl border bg-white px-3.5 py-2.5 font-arch text-[13px]";

  return (
    <div className="flex h-full flex-col font-arch" style={{ color: T.ink }}>
      <div className="flex items-center gap-3 px-4 pt-1 pb-3">
        <button onClick={() => go({ name: "bag" })} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-transform active:scale-90" style={{ borderColor: T.line }} aria-label="Back">
          <IconArrowLeft size={16} />
        </button>
        <p className="font-disp text-[20px]">Checkout</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto hide-scroll px-4 pb-4">
        {/* summary */}
        <div className="rounded-xl border p-3.5" style={{ borderColor: T.line, background: "#fff" }}>
          {cart.map((it) => {
            const p = find(it.productId);
            return p ? (
              <div key={`${it.productId}-${it.size}`} className="flex items-center justify-between py-1 text-[12px]">
                <span className="truncate pr-3">
                  {p.name} <span className="font-mono text-[9px]" style={{ color: T.sub }}>×{it.qty} · {it.size}</span>
                </span>
                <span className="shrink-0 font-semibold">{bdt((p.salePrice ?? p.price) * it.qty)}</span>
              </div>
            ) : null;
          })}
          {freeTee && (
            <div className="flex items-center justify-between py-1 text-[12px]" style={{ color: T.ok }}>
              <span className="font-semibold">Free Cotton T-shirt · Summer Fest</span>
              <span className="font-mono text-[10px] font-bold">FREE</span>
            </div>
          )}
          <div className="stitch my-2" style={{ color: T.sub }} />
          <div className="flex justify-between py-0.5 text-[12px]" style={{ color: T.sub }}>
            <span>Delivery · {area === "dhaka" ? "inside Dhaka" : "outside Dhaka"}</span>
            <span>{bdt(delivery)}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em]">Total</span>
            <span className="font-disp text-[19px]">{bdt(total)}</span>
          </div>
        </div>

        {/* form */}
        <div className="space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={input} style={{ borderColor: T.line }} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile · 01XXXXXXXXX" inputMode="tel" className={input} style={{ borderColor: T.line }} />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address — house, road, area, district" rows={2} className={`${input} resize-none`} style={{ borderColor: T.line }} />
        </div>

        {/* area */}
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em]">Delivery area</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "dhaka", label: "Inside Dhaka", fee: DELIVERY_FEES.dhaka },
                { id: "outside", label: "Outside Dhaka", fee: DELIVERY_FEES.outside },
              ] as { id: DeenArea; label: string; fee: number }[]
            ).map((a) => (
              <button
                key={a.id}
                onClick={() => setArea(a.id)}
                className="cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.97]"
                style={area === a.id ? { borderColor: T.indigo, background: "#EEF0FA" } : { borderColor: T.line, background: "#fff" }}
              >
                <span className="block text-[12px] font-bold">{a.label}</span>
                <span className="font-mono text-[10px]" style={{ color: T.sub }}>{bdt(a.fee)} · 2–4 days</span>
              </button>
            ))}
          </div>
        </div>

        {/* payment */}
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em]">Payment</p>
          <div className="space-y-2">
            {(Object.keys(PAYMENT_LABELS) as DeenPayment[]).map((pm) => (
              <button
                key={pm}
                onClick={() => setPayment(pm)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all active:scale-[0.98]"
                style={payment === pm ? { borderColor: T.indigo, background: "#EEF0FA" } : { borderColor: T.line, background: "#fff" }}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full border" style={{ borderColor: payment === pm ? T.indigo : T.line }}>
                  {payment === pm && <span className="h-2 w-2 rounded-full" style={{ background: T.indigo }} />}
                </span>
                <span className="flex-1">
                  <span className="block text-[12.5px] font-bold">{PAYMENT_LABELS[pm]}</span>
                  <span className="block font-mono text-[9.5px]" style={{ color: T.sub }}>
                    {pm === "cod" ? "pay the rider on arrival" : "we'll send the payment number after confirmation"}
                  </span>
                </span>
                {pm !== "cod" && (
                  <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ background: pm === "bkash" ? "#D12053" : "#F6921E", color: "#fff" }}>
                    {pm}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <div className="deen-pop rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold" style={{ borderColor: T.crimson, color: T.crimson, background: "#FBEFEE" }}>
            {err}
          </div>
        )}
      </div>

      <div className="border-t p-4" style={{ background: "#fff", borderColor: T.line }}>
        <button
          onClick={submit}
          disabled={placing}
          className="w-full cursor-pointer rounded-xl py-3.5 font-disp text-[15px] text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: T.indigo }}
        >
          {placing ? "Placing order…" : `Place Order · ${bdt(total)}`}
        </button>
      </div>
    </div>
  );
}

/* ---------------- success ---------------- */

function SuccessScreen({ order, go }: { order: DeenOrder; go: (s: Screen) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center font-arch" style={{ color: T.ink }}>
      <span className="deen-pop flex h-20 w-20 items-center justify-center rounded-full text-white" style={{ background: T.ok }}>
        <IconCheck size={34} />
      </span>
      <p className="font-disp mt-5 text-[22px]">Shukriya!</p>
      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: T.sub }}>
        Order <span className="font-mono font-bold" style={{ color: T.ink }}>{order.number}</span> is in. We'll call{" "}
        <span className="font-mono font-bold" style={{ color: T.ink }}>{order.phone}</span> to confirm within the hour.
      </p>
      {order.payment !== "cod" && (
        <p className="mt-3 rounded-xl px-4 py-2.5 font-mono text-[10.5px] leading-relaxed" style={{ background: "#EFEBDF" }}>
          {PAYMENT_LABELS[order.payment]}: our agent will share the merchant number via SMS. Pay {bdt(order.total)} to confirm.
        </p>
      )}
      <div className="mt-4 w-full rounded-xl border p-3.5 text-left" style={{ borderColor: T.line, background: "#fff" }}>
        {order.lines.map((l, i) => (
          <div key={i} className="flex justify-between py-0.5 text-[12px]">
            <span className="truncate pr-3">{l.name}{l.gift ? " ★" : ""}</span>
            <span className="shrink-0 font-semibold">{l.gift ? "FREE" : bdt(l.unit * l.qty)}</span>
          </div>
        ))}
        <div className="stitch my-2" style={{ color: T.sub }} />
        <div className="flex justify-between py-0.5 text-[12px]" style={{ color: T.sub }}>
          <span>Delivery</span><span>{bdt(order.delivery)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em]">Total</span>
          <span className="font-disp text-[18px]">{bdt(order.total)}</span>
        </div>
      </div>
      <div className="mt-5 flex gap-2.5">
        <button onClick={() => go({ name: "orders" })} className="cursor-pointer rounded-full border px-5 py-2.5 text-[12px] font-bold transition-transform active:scale-95" style={{ borderColor: T.line }}>
          Track order
        </button>
        <button onClick={() => go({ name: "shop" })} className="cursor-pointer rounded-full px-5 py-2.5 text-[12px] font-bold text-white transition-transform active:scale-95" style={{ background: T.indigo }}>
          Keep shopping
        </button>
      </div>
    </div>
  );
}

/* ---------------- orders ---------------- */

function OrdersScreen({ go }: { profile: DeenProfile; go: (s: Screen) => void }) {
  const [orders, setOrders] = useState<DeenOrder[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    deenListOrders().then(setOrders);
  }, []);

  return (
    <div className="px-4 pt-1 pb-8 font-arch" style={{ color: T.ink }}>
      <p className="font-disp text-[20px]">Your Orders</p>
      {orders === null ? (
        <div className="mt-10 flex justify-center">
          <span className="deen-dot h-2 w-2 rounded-full" style={{ background: T.indigo }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="font-disp text-[16px]">No orders yet</p>
          <button onClick={() => go({ name: "shop" })} className="cursor-pointer rounded-full px-5 py-2.5 text-[12px] font-bold text-white transition-transform active:scale-95" style={{ background: T.indigo }}>
            Browse the store
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {orders.map((o) => {
            const isOpen = open === o.id;
            const stageIdx = ORDER_FLOW.indexOf(o.status);
            return (
              <div key={o.id} className="overflow-hidden rounded-xl border transition-shadow" style={{ borderColor: T.line, background: "#fff" }}>
                <button onClick={() => setOpen(isOpen ? null : o.id)} className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left">
                  <span>
                    <span className="block font-mono text-[12px] font-bold">{o.number}</span>
                    <span className="block font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: T.sub }}>
                      {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · {o.lines.length} item{o.lines.length > 1 ? "s" : ""} · {bdt(o.total)}
                    </span>
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white"
                    style={{ background: o.status === "delivered" ? T.ok : o.status === "shipped" ? T.indigo : "#8C6A2F" }}
                  >
                    {o.status}
                  </span>
                </button>
                {isOpen && (
                  <div className="screen-up border-t px-4 py-3.5" style={{ borderColor: T.line }}>
                    {/* timeline */}
                    <div className="flex items-center">
                      {ORDER_FLOW.map((st, i) => (
                        <div key={st} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center">
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full border-2"
                              style={{
                                borderColor: i <= stageIdx ? T.indigo : T.line,
                                background: i <= stageIdx ? T.indigo : "#fff",
                                color: "#fff",
                              }}
                            >
                              {i <= stageIdx && <IconCheck size={10} />}
                            </span>
                            <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em]" style={{ color: i <= stageIdx ? T.ink : T.sub }}>
                              {st}
                            </span>
                          </div>
                          {i < ORDER_FLOW.length - 1 && <span className="mx-1 mb-4 h-[2px] flex-1" style={{ background: i < stageIdx ? T.indigo : T.line }} />}
                        </div>
                      ))}
                    </div>
                    <div className="stitch mt-3" style={{ color: T.sub }} />
                    <div className="mt-2.5 space-y-1">
                      {o.lines.map((l, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="truncate pr-3">{l.name} <span className="font-mono text-[9px]" style={{ color: T.sub }}>×{l.qty} · {l.size}</span></span>
                          <span className="shrink-0 font-semibold">{l.gift ? "FREE" : bdt(l.unit * l.qty)}</span>
                        </div>
                      ))}
                      <p className="pt-1.5 font-mono text-[9.5px] leading-relaxed" style={{ color: T.sub }}>
                        {o.address} · {PAYMENT_LABELS[o.payment]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- profile ---------------- */

function ProfileScreen({ go }: { go: (s: Screen) => void }) {
  const toast = useToast();
  const [draft, setDraft] = useState<DeenProfile>(getDeenProfile());

  const saveAll = () => {
    saveDeenProfile(draft);
    toast("Profile synced · SecureStore updated", "mint");
  };

  const input = "w-full rounded-xl border bg-white px-3.5 py-2.5 font-arch text-[13px]";
  const label = "mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.18em]";

  return (
    <div className="px-4 pt-1 pb-8 font-arch" style={{ color: T.ink }}>
      <p className="font-disp text-[20px]">Profile</p>

      <div className="mt-3 flex items-center gap-3.5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full font-disp text-[18px] text-white" style={{ background: T.indigo }}>
          {draft.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "D"}
        </span>
        <div>
          <p className="text-[15px] font-bold">{draft.name || "—"}</p>
          <p className="font-mono text-[10px]" style={{ color: T.sub }}>{draft.phone || "no number"}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <label className={label} style={{ color: T.sub }}>Full name</label>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={input} style={{ borderColor: T.line }} />
        </div>
        <div>
          <label className={label} style={{ color: T.sub }}>Mobile</label>
          <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} inputMode="tel" className={input} style={{ borderColor: T.line }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} style={{ color: T.sub }}>Jeans waist</label>
            <select value={draft.jeansSize} onChange={(e) => setDraft({ ...draft, jeansSize: e.target.value })} className={input} style={{ borderColor: T.line }}>
              {["28", "30", "32", "34", "36", "38", "40"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} style={{ color: T.sub }}>Top size</label>
            <select value={draft.topSize} onChange={(e) => setDraft({ ...draft, topSize: e.target.value })} className={input} style={{ borderColor: T.line }}>
              {["S", "M", "L", "XL", "2XL", "3XL"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={saveAll} className="w-full cursor-pointer rounded-xl py-3 font-disp text-[14px] text-white transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: T.indigo }}>
          Save changes
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {(
          [
            ["pushOrders", "Order updates", "delivery & status alerts"],
            ["pushPromos", "Drops & promos", "new arrivals, sale alerts"],
          ] as ["pushOrders" | "pushPromos", string, string][]
        ).map(([key, title, sub]) => (
          <button
            key={key}
            onClick={() => setDraft({ ...draft, [key]: !draft[key] })}
            className="flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98]"
            style={{ borderColor: T.line, background: "#fff" }}
          >
            <span>
              <span className="block text-[13px] font-bold">{title}</span>
              <span className="block font-mono text-[9.5px]" style={{ color: T.sub }}>{sub}</span>
            </span>
            <span className="flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200" style={{ background: draft[key] ? T.indigo : "#D9D5C9" }}>
              <span className="h-5 w-5 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: draft[key] ? "translateX(20px)" : "none" }} />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl p-4 text-center" style={{ background: T.indigoDark }}>
        <p className="font-disp text-[14px] text-white">Need help?</p>
        <p className="mt-1 font-mono text-[11px] text-white/70">Hotline 09617-700500 · 10 AM – 6 PM</p>
        <button onClick={() => go({ name: "shop" })} className="mt-3 cursor-pointer rounded-full bg-white px-5 py-2 text-[11px] font-bold transition-transform active:scale-95" style={{ color: T.indigoDark }}>
          Back to store
        </button>
      </div>

      <p className="mt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.2em]" style={{ color: T.sub }}>
        deen app v0.9 · expo sdk 53 · middle api · woo rest v3
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WORKSPACE PAGE around the device                                   */
/* ------------------------------------------------------------------ */

export function DeenApp({ overrides, onCycle }: { overrides: Record<string, TaskStatus>; onCycle: (id: string) => void }) {
  const [requests, setRequests] = useState<DeenRequest[]>([]);
  const p2 = PHASES.find((p) => p.code === "P2")!;
  const done = p2.tasks.filter((t) => (overrides[t.id] ?? t.status) === "done").length;
  const pct = Math.round((done / p2.tasks.length) * 100);

  useEffect(() => subscribeDeenApi((r) => setRequests((prev) => [r, ...prev].slice(0, 9))), []);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-wire">
              <span className="inline-block h-px w-8 bg-wire/70" />
              apps/mobile · P2 · Expo Android first
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              DEEN <span className="text-wire">on Android</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-dim">
              Live shopping app for <span className="text-ink font-semibold">deencommerce.com</span> — দেশের প্রথম ডেনিম ব্র্যান্ড. Real catalog (42 styles, ৳ BDT),
              size-aware bag, Summer Fest free-tee promo, Dhaka delivery rules and COD · bKash · Nagad checkout — all through the
              <span className="text-amber font-semibold"> middle API layer</span>, never straight to WooCommerce.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Stamp tone="mint" pop>Expo SDK 53</Stamp>
            <Stamp tone="amber">Woo REST v3</Stamp>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[250px_360px_1fr] lg:items-start">
        {/* left — meta */}
        <div className="order-2 space-y-4 lg:order-1">
          <Reveal>
            <div className="corners border border-line bg-panel/70 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-wire">Client</p>
              <p className="mt-2 font-display text-xl font-extrabold">DEEN</p>
              <p className="mt-0.5 text-[12px] text-dim">দেশের প্রথম ডেনিম ব্র্যান্ড</p>
              <dl className="mt-4 space-y-2 text-[12px]">
                {[
                  ["Store", "deencommerce.com"],
                  ["Engine", "WordPress + WooCommerce"],
                  ["Currency", "৳ BDT (en-IN groups)"],
                  ["Hotline", "09617-700500"],
                  ["Market", "Bangladesh · COD-first"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-faint">{k}</dt>
                    <dd className="text-right font-medium text-dim">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="border border-line bg-panel/70 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber">Pipeline</p>
              <ol className="mt-3 space-y-1.5 font-mono text-[10.5px] text-dim">
                {["WooCommerce REST v3", "middle API (Fastify)", "TanStack Query cache", "Expo app (this device)"].map((s, i, arr) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${i === arr.length - 1 ? "bg-mint pulse-dot" : "bg-line"}`} />
                    {s}
                  </li>
                ))}
              </ol>
              <div className="stitch mt-4 text-line" />
              <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-faint">
                Woo consumer keys live in the gateway vault. The device only ever holds a JWT.
              </p>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="border border-dashed border-line bg-panel/40 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">iOS · P5 · queued</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
                <span className="font-mono text-[11px] text-amber">expo prebuild ios</span> done — scaffold only. Feature work starts after the Play release, on this same codebase.
              </p>
            </div>
          </Reveal>
        </div>

        {/* center — device */}
        <div className="order-1 lg:order-2">
          <Reveal delay={60}>
            <DeenPhone />
          </Reveal>
        </div>

        {/* right — sprint + traffic */}
        <div className="order-3 space-y-4">
          <Reveal delay={100}>
            <div className="corners border border-line bg-panel/70">
              <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3.5">
                <h3 className="font-display text-[15px] font-bold">Sprint board · P2 Expo Android</h3>
                <span className="font-mono text-[10px] text-faint">{done}/{p2.tasks.length} · {pct}%</span>
              </div>
              <div className="px-5 pt-3.5">
                <Bar value={pct} tone={pct === 100 ? "mint" : "amber"} />
              </div>
              <ul className="p-3">
                {p2.tasks.map((t) => {
                  const st = overrides[t.id] ?? t.status;
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded px-2 py-2 transition-colors hover:bg-panel2">
                      <StatusChip status={st} onClick={() => onCycle(t.id)} title="Cycle status — synced with the blueprint ledger" />
                      <span className={`flex-1 text-[12.5px] leading-snug ${st === "done" ? "text-faint line-through decoration-line" : st === "active" ? "text-ink" : "text-dim"}`}>
                        {t.label}
                      </span>
                      <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-faint sm:block">{t.id}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="border border-line bg-panel/70">
              <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3.5">
                <h3 className="font-display text-[15px] font-bold">Device ↔ gateway traffic</h3>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-mint">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint" /> live
                </span>
              </div>
              <div className="p-2">
                {requests.length === 0 ? (
                  <p className="px-3 py-6 text-center font-mono text-[10.5px] text-faint">
                    Poke the phone — every tap in the app streams here.
                  </p>
                ) : (
                  requests.map((r) => (
                    <div key={r.id} className="tick-in flex items-center gap-3 border-t border-linesoft px-3 py-2 font-mono text-[10.5px] first:border-t-0">
                      <span className={`w-12 font-bold ${r.method === "GET" ? "text-wire" : "text-amber"}`}>{r.method}</span>
                      <span className="min-w-0 flex-1 truncate text-dim">{r.path}</span>
                      <span className={r.status < 400 ? "text-mint" : "text-coral"}>{r.status}</span>
                      <span className="w-12 text-right text-faint">{r.ms} ms</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
