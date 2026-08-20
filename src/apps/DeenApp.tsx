import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  bdt,
  DEFAULT_PROFILE,
  DEEN_CATALOG,
  DEEN_CATEGORIES,
  DEEN_COUPONS,
  deenAddReview,
  deenAvg,
  deenCancelOrder,
  deenCreateOrder,
  deenListOrders,
  deenListProducts,
  deenLogin,
  deenLogout,
  deenRegister,
  deenValidateCoupon,
  DELIVERY_FEES,
  demoAccount,
  FREE_TEE_THRESHOLD,
  getDeenProfile,
  getDeenReviews,
  getDeenSession,
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
  type DeenReview,
  type DeenSession,
} from "../api/deen";
import { PHASES, type TaskStatus } from "../data";
import { Bar, Reveal, Stamp, StatusChip, useToast } from "../components/ui";
import { useReducedMotion } from "../hooks";
import {
  IconArrowLeft,
  IconBag,
  IconBattery,
  IconBell,
  IconBox,
  IconCheck,
  IconClock,
  IconHeart,
  IconLogout,
  IconMinus,
  IconPlus,
  IconRuler,
  IconSearch,
  IconShare,
  IconSignal,
  IconStar,
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

const SIZE_GUIDE_ROWS: string[][] = [
  ["M", "38–40", "30–32", "27"],
  ["L", "40–42", "32–34", "28"],
  ["XL", "42–44", "34–36", "29"],
  ["2XL", "44–46", "36–38", "30"],
  ["3XL", "46–48", "38–40", "31"],
  ["30 (jeans)", "—", "30", "40"],
  ["32 (jeans)", "—", "32", "41"],
  ["34 (jeans)", "—", "34", "42"],
  ["36 (jeans)", "—", "36", "42"],
  ["38 (jeans)", "—", "38", "43"],
];

type Screen =
  | { name: "home" }
  | { name: "shop"; category?: DeenCategory | "ALL"; saleOnly?: boolean }
  | { name: "product"; id: string }
  | { name: "bag" }
  | { name: "checkout" }
  | { name: "success"; order: DeenOrder }
  | { name: "orders" }
  | { name: "profile" }
  | { name: "wishlist" }
  | { name: "auth"; returnTo?: Screen }
  | { name: "notifications" };

type Tab = "home" | "shop" | "wishlist" | "bag" | "orders" | "profile";

/* ---------------- notifications ---------------- */

interface Notif {
  id: string;
  title: string;
  body: string;
  ts: number;
  read: boolean;
}

const NKEY = "deen.notifs.v1";

function loadNotifs(): Notif[] {
  try {
    const raw = window.localStorage.getItem(NKEY);
    if (raw) return JSON.parse(raw) as Notif[];
  } catch {
    /* ignore */
  }
  return [
    {
      id: "n-welcome",
      title: "Summer Fest is live",
      body: "Free cotton tee on every order over ৳3,500 — plus codes SUMMER10 and DEEN100.",
      ts: Date.now(),
      read: false,
    },
  ];
}

function saveNotifs(n: Notif[]) {
  try {
    window.localStorage.setItem(NKEY, JSON.stringify(n));
  } catch {
    /* ignore */
  }
}

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

function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
    return initial;
  });
  const set = (updater: T | ((prev: T) => T)) => {
    setV((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return [v, set] as const;
}

function DeenPhone() {
  const toast = useToast();
  const reduced = useReducedMotion();
  const [boot, setBoot] = useState(true);
  const [products, setProducts] = useState<DeenProduct[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [cart, setCart] = usePersisted<DeenCartItem[]>("deen.cart.v1", []);
  const [wishlist, setWishlist] = usePersisted<string[]>("deen.wishlist.v1", []);
  const [recents, setRecents] = usePersisted<string[]>("deen.recent.v1", []);
  const [searchHistory, setSearchHistory] = usePersisted<string[]>("deen.search.v1", []);
  const [notifs, setNotifs] = usePersisted<Notif[]>(NKEY, loadNotifs());
  const [session, setSession] = useState<DeenSession | null>(() => getDeenSession());

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
  const unread = notifs.filter((n) => !n.read).length;

  const pushNotif = (title: string, body: string) => {
    setNotifs((prev) => [{ id: `n-${Date.now()}`, title, body, ts: Date.now(), read: false }, ...prev].slice(0, 30));
  };

  const recordVisit = (id: string) => {
    setRecents((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));
  };

  const recordSearch = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setSearchHistory((prev) => [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5));
  };

  const toggleWishlist = (id: string) => {
    const has = wishlist.includes(id);
    setWishlist((prev) => (has ? prev.filter((x) => x !== id) : [id, ...prev]));
    toast(has ? "Removed from wishlist" : "Saved to wishlist ♥", has ? "wire" : "coral");
  };

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

  const requireAuth = (target: Screen) => {
    if (session) {
      setScreen(target);
    } else {
      toast("Log in to continue — it takes 10 seconds", "amber");
      setScreen({ name: "auth", returnTo: target });
    }
  };

  const placeOrder = async (payload: {
    name: string;
    phone: string;
    address: string;
    area: DeenArea;
    payment: DeenPayment;
    couponCode?: string;
  }) => {
    const order = await deenCreateOrder({ ...payload, items: cart });
    setCart([]);
    setScreen({ name: "success", order });
    pushNotif(`Order ${order.number} confirmed`, `${bdt(order.total)} · ${PAYMENT_LABELS[order.payment]}. We'll call to confirm shortly.`);
    toast(`Order ${order.number} placed via middle API`, "mint");
  };

  const cancelOrder = async (id: string) => {
    const o = await deenCancelOrder(id);
    pushNotif(`Order ${o.number} cancelled`, "We've released the items and any hold on your payment.");
    toast(`Order ${o.number} cancelled`, "wire");
  };

  const tab: Tab =
    screen.name === "product" || screen.name === "shop"
      ? "shop"
      : screen.name === "bag" || screen.name === "checkout" || screen.name === "success"
        ? "bag"
        : screen.name === "auth"
          ? "profile"
          : screen.name === "notifications"
            ? "home"
            : screen.name;

  const clock = useMemo(() => {
    const d = new Date();
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, [screen]);

  /* ---------------- screens ---------------- */

  const screenNode: ReactNode = (() => {
    switch (screen.name) {
      case "home":
        return (
          <HomeScreen
            go={setScreen}
            products={products}
            cartSubtotal={cartSubtotal}
            unread={unread}
            recents={recents.map(find).filter((p): p is DeenProduct => !!p)}
          />
        );
      case "shop":
        return <ShopScreen init={screen} go={setScreen} products={products} history={searchHistory} onSearch={recordSearch} />;
      case "product":
        return (
          <ProductScreen
            product={find(screen.id)}
            go={setScreen}
            onAdd={addToCart}
            cartSubtotal={cartSubtotal}
            wished={wishlist.includes(screen.id)}
            onWish={() => toggleWishlist(screen.id)}
            onVisit={recordVisit}
            sessionName={session?.name}
          />
        );
      case "bag":
        return <BagScreen cart={cart} find={find} go={setScreen} setQty={setQty} subtotal={cartSubtotal} onCheckout={() => requireAuth({ name: "checkout" })} />;
      case "checkout":
        return <CheckoutScreen cart={cart} find={find} subtotal={cartSubtotal} onPlace={placeOrder} go={setScreen} />;
      case "success":
        return <SuccessScreen order={screen.order} go={setScreen} />;
      case "orders":
        return <OrdersScreen go={setScreen} onCancel={cancelOrder} />;
      case "profile":
        return <ProfileScreen go={setScreen} session={session} onLogout={() => { deenLogout(); setSession(null); toast("Signed out — token cleared from SecureStore", "wire"); }} wishCount={wishlist.length} />;
      case "wishlist":
        return <WishlistScreen ids={wishlist} find={find} go={setScreen} onRemove={toggleWishlist} onAdd={addToCart} />;
      case "auth":
        return (
          <AuthScreen
            go={setScreen}
            returnTo={screen.returnTo ?? null}
            onAuthed={(s) => {
              setSession(s);
              pushNotif(`Welcome, ${s.name.split(" ")[0]}`, "You're signed in. Orders and offers now sync to this device.");
              setScreen(screen.returnTo ?? { name: "profile" });
              toast(`Signed in as ${s.phone}`, "mint");
            }}
          />
        );
      case "notifications":
        return (
          <NotificationsScreen
            notifs={notifs}
            go={setScreen}
            onReadAll={() => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))}
            onClear={() => setNotifs([])}
          />
        );
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
              <div className="grid grid-cols-6">
                {(
                  [
                    { id: "home", label: "Home", icon: <HouseIcon size={19} active={tab === "home"} /> },
                    { id: "shop", label: "Shop", icon: <IconTag size={19} strokeWidth={tab === "shop" ? 2.1 : 1.7} /> },
                    { id: "wishlist", label: "Saved", icon: <IconHeart size={19} strokeWidth={tab === "wishlist" ? 2.1 : 1.7} /> },
                    { id: "bag", label: "Bag", icon: <IconBag size={19} strokeWidth={tab === "bag" ? 2.1 : 1.7} /> },
                    { id: "orders", label: "Orders", icon: <IconBox size={19} strokeWidth={tab === "orders" ? 2.1 : 1.7} /> },
                    { id: "profile", label: "Profile", icon: <IconUser size={19} strokeWidth={tab === "profile" ? 2.1 : 1.7} /> },
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
  unread,
  recents,
}: {
  go: (s: Screen) => void;
  products: DeenProduct[];
  cartSubtotal: number;
  unread: number;
  recents: DeenProduct[];
}) {
  const list = products.length ? products : DEEN_CATALOG;
  const newDrop = list.filter((p) => p.isNew);
  const freeTeeLeft = Math.max(0, FREE_TEE_THRESHOLD - cartSubtotal);

  const catCount = (c: DeenCategory) => list.filter((p) => p.category === c).length;

  const circleBtn = "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90";

  return (
    <div className="font-arch" style={{ color: T.ink }}>
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-1 pb-3">
        <span className="font-disp text-[22px] tracking-tight">DEEN</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go({ name: "notifications" })}
            className={circleBtn}
            style={{ border: `1px solid ${T.line}`, color: T.ink }}
            aria-label="Notifications"
          >
            <IconBell size={16} />
            {unread > 0 && (
              <span className="deen-pop absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[8px] font-bold text-white" style={{ background: T.crimson }}>
                {unread}
              </span>
            )}
          </button>
          <button
            onClick={() => go({ name: "shop" })}
            className={circleBtn}
            style={{ border: `1px solid ${T.line}`, color: T.ink }}
            aria-label="Search"
          >
            <IconSearch size={16} />
          </button>
          <button
            onClick={() => go({ name: "wishlist" })}
            className={circleBtn}
            style={{ border: `1px solid ${T.line}`, color: T.ink }}
            aria-label="Wishlist"
          >
            <IconHeart size={16} />
          </button>
          <button
            onClick={() => go({ name: "bag" })}
            className={circleBtn}
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

      {/* recently viewed */}
      {recents.length > 0 && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between px-4">
            <p className="font-disp text-[15px] flex items-center gap-1.5">
              <IconClock size={13} className="inline" /> Recently viewed
            </p>
          </div>
          <div className="hide-scroll mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {recents.map((p) => (
              <button key={`r-${p.id}`} onClick={() => go({ name: "product", id: p.id })} className="w-[92px] shrink-0 cursor-pointer text-left transition-transform active:scale-[0.96]">
                <div className="h-[116px] overflow-hidden rounded-lg" style={{ background: T.line }}>
                  <PImg src={p.images[0]} alt={p.name} className="h-full w-full" />
                </div>
                <p className="mt-1 truncate text-[10px] font-semibold">{p.name}</p>
                <p className="font-mono text-[9px]" style={{ color: T.sub }}>{bdt(p.salePrice ?? p.price)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

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
  history,
  onSearch,
}: {
  init: { category?: DeenCategory | "ALL"; saleOnly?: boolean };
  go: (s: Screen) => void;
  products: DeenProduct[];
  history: string[];
  onSearch: (q: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<DeenCategory | "ALL">(init.category ?? "ALL");
  const [saleOnly, setSaleOnly] = useState(init.saleOnly ?? false);
  const [sort, setSort] = useState<"featured" | "low" | "high" | "off">("featured");
  const [priceBand, setPriceBand] = useState<"all" | "lt1k" | "1to2k" | "gt2k">("all");

  const priceOf = (p: DeenProduct) => p.salePrice ?? p.price;
  const inBand = (p: DeenProduct) => {
    const v = priceOf(p);
    if (priceBand === "lt1k") return v < 1000;
    if (priceBand === "1to2k") return v >= 1000 && v <= 2000;
    if (priceBand === "gt2k") return v > 2000;
    return true;
  };

  const list = (products.length ? products : DEEN_CATALOG)
    .filter((p) => (cat === "ALL" ? true : p.category === cat))
    .filter((p) => (saleOnly ? !!p.salePrice : true))
    .filter(inBand)
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "low") return priceOf(a) - priceOf(b);
      if (sort === "high") return priceOf(b) - priceOf(a);
      if (sort === "off") return pctOff(b) - pctOff(a);
      return Number(!!b.salePrice) - Number(!!a.salePrice);
    });

  const openProduct = (id: string) => {
    onSearch(query);
    go({ name: "product", id });
  };

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

        {/* search history */}
        {!query && history.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.14em]" style={{ color: T.sub }}>
              <IconClock size={10} /> recent
            </span>
            {history.map((h) => (
              <button
                key={h}
                onClick={() => setQuery(h)}
                className="cursor-pointer rounded-full border px-2.5 py-1 font-arch text-[10.5px] font-semibold transition-all active:scale-95"
                style={{ borderColor: T.line, color: T.sub, background: "#fff" }}
              >
                {h}
              </button>
            ))}
          </div>
        )}

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

        {/* price bands */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: "Any price" },
              { id: "lt1k", label: "Under ৳1,000" },
              { id: "1to2k", label: "৳1,000 – 2,000" },
              { id: "gt2k", label: "Over ৳2,000" },
            ] as { id: typeof priceBand; label: string }[]
          ).map((b) => (
            <button
              key={b.id}
              onClick={() => setPriceBand(b.id)}
              className="cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] transition-all active:scale-95"
              style={
                priceBand === b.id
                  ? { background: T.indigoDark, borderColor: T.indigoDark, color: "#fff" }
                  : { borderColor: T.line, color: T.sub, background: "transparent" }
              }
            >
              {b.label}
            </button>
          ))}
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
            <button key={p.id} onClick={() => openProduct(p.id)} className="cursor-pointer text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]">
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
  wished,
  onWish,
  onVisit,
  sessionName,
}: {
  product: DeenProduct | undefined;
  go: (s: Screen) => void;
  onAdd: (id: string, size: string, qty: number) => void;
  cartSubtotal: number;
  wished: boolean;
  onWish: () => void;
  onVisit: (id: string) => void;
  sessionName?: string;
}) {
  const toast = useToast();
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQtyState] = useState(1);
  const [sizeErr, setSizeErr] = useState(false);
  const [guide, setGuide] = useState(false);
  const [reviews, setReviews] = useState<DeenReview[]>([]);
  const [rStars, setRStars] = useState(0);
  const [rText, setRText] = useState("");
  const [rBusy, setRBusy] = useState(false);

  useEffect(() => {
    if (product) {
      onVisit(product.id);
      setReviews(getDeenReviews(product.id));
      setSize(null);
      setQtyState(1);
      setSizeErr(false);
      setImgIdx(0);
      setRStars(0);
      setRText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return null;
  const unit = product.salePrice ?? product.price;
  const freeTeeLeft = Math.max(0, FREE_TEE_THRESHOLD - (cartSubtotal + unit * qty));
  const avg = deenAvg(product.id);

  const add = () => {
    if (!size) {
      setSizeErr(true);
      return;
    }
    onAdd(product.id, size, qty);
  };

  const share = async () => {
    const url = `https://deencommerce.com/product/${product.sku.toLowerCase()}/`;
    const text = `${product.name} — ${bdt(unit)} at DEEN`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "DEEN", text, url });
        return;
      }
      throw new Error("no-share");
    } catch {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast("Product link copied to clipboard", "wire");
      } catch {
        toast(url, "wire");
      }
    }
  };

  const submitReview = async () => {
    if (rBusy) return;
    setRBusy(true);
    try {
      const r = await deenAddReview(product.id, sessionName ?? "", rStars, rText);
      setReviews((prev) => [r, ...prev]);
      setRStars(0);
      setRText("");
      toast("Review published — shukriya!", "mint");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save review.", "coral");
    } finally {
      setRBusy(false);
    }
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
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {product.salePrice && (
              <span className="rounded px-2 py-1 font-mono text-[10px] font-bold text-white" style={{ background: T.crimson }}>
                SALE −{pctOff(product)}%
              </span>
            )}
            <button
              onClick={onWish}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow transition-all active:scale-75 ${wished ? "heart-pop" : ""}`}
              style={{ color: wished ? T.crimson : T.sub }}
              aria-label="Wishlist"
            >
              <IconHeart size={16} strokeWidth={wished ? 2.2 : 1.7} className={wished ? "fill-current" : ""} />
            </button>
            <button
              onClick={share}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow transition-all active:scale-75"
              style={{ color: T.sub }}
              aria-label="Share"
            >
              <IconShare size={15} />
            </button>
          </div>
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
          <div className="mt-2 flex items-center gap-2.5">
            <PriceLine p={product} size="lg" />
            {avg && (
              <span className="flex items-center gap-1 rounded-full border px-2 py-0.5" style={{ borderColor: T.line }}>
                <span style={{ color: "#D9A016" }}><IconStar size={11} /></span>
                <span className="font-mono text-[10px] font-bold">{avg.avg.toFixed(1)}</span>
                <span className="font-mono text-[9px]" style={{ color: T.sub }}>({avg.count})</span>
              </span>
            )}
          </div>

          {/* sizes */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em]">
                Size {sizeErr && !size && <span style={{ color: T.crimson }}>· pick one</span>}
              </p>
              <button
                onClick={() => setGuide(true)}
                className="flex cursor-pointer items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors active:scale-95"
                style={{ color: T.indigo }}
              >
                <IconRuler size={11} /> size guide
              </button>
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
          <div className="mt-4 space-y-2.5">
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

          {/* reviews */}
          <div className="mt-5 pb-4">
            <div className="flex items-baseline justify-between">
              <p className="font-disp text-[15px]">Reviews {avg && <span className="font-mono text-[10px]" style={{ color: T.sub }}>· {avg.avg.toFixed(1)} ★ · {avg.count}</span>}</p>
            </div>

            <div className="mt-2.5 space-y-2.5">
              {reviews.length === 0 && (
                <p className="rounded-xl border border-dashed px-3.5 py-3 text-[11.5px]" style={{ borderColor: T.line, color: T.sub }}>
                  No reviews yet — be the first to rate this piece.
                </p>
              )}
              {reviews.slice(0, 3).map((r) => (
                <div key={r.id} className="rounded-xl border p-3" style={{ borderColor: T.line, background: "#fff" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold">{r.name}</span>
                    <span className="flex gap-0.5" style={{ color: "#D9A016" }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ opacity: i < r.stars ? 1 : 0.25 }}><IconStar size={10} /></span>
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug" style={{ color: T.sub }}>{r.text}</p>
                </div>
              ))}
            </div>

            {/* write a review */}
            <div className="mt-3 rounded-xl border p-3.5" style={{ borderColor: T.line, background: "#fff" }}>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: T.sub }}>
                {sessionName ? `Reviewing as ${sessionName}` : "Write a review"}
              </p>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setRStars(i + 1)} className="cursor-pointer transition-transform active:scale-75" style={{ color: i < rStars ? "#D9A016" : T.line }} aria-label={`${i + 1} stars`}>
                    <IconStar size={20} />
                  </button>
                ))}
              </div>
              <textarea
                value={rText}
                onChange={(e) => setRText(e.target.value)}
                placeholder="Fit, fabric, fade — how is it?"
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border bg-white px-3 py-2 font-arch text-[12px]"
                style={{ borderColor: T.line }}
              />
              <button
                onClick={submitReview}
                disabled={rBusy || rStars === 0}
                className="mt-2 w-full cursor-pointer rounded-lg py-2.5 font-arch text-[12px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: T.indigoDark }}
              >
                {rBusy ? "Publishing…" : "Publish review"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* sticky CTA */}
      <div className="flex gap-2.5 border-t p-3.5" style={{ background: "#fff", borderColor: T.line }}>
        <button
          onClick={onWish}
          className={`flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-90 ${wished ? "heart-pop" : ""}`}
          style={{ borderColor: wished ? T.crimson : T.line, color: wished ? T.crimson : T.sub, background: wished ? "#FBEFEE" : "#fff" }}
          aria-label="Toggle wishlist"
        >
          <IconHeart size={19} />
        </button>
        <button
          onClick={add}
          className="flex-1 cursor-pointer rounded-xl py-3.5 font-disp text-[15px] tracking-wide text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{ background: T.indigo }}
        >
          Add to Bag · {bdt(unit * qty)}
        </button>
      </div>

      {/* size guide modal */}
      {guide && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/45" onClick={() => setGuide(false)}>
          <div className="screen-up w-full rounded-t-3xl p-5" style={{ background: T.paper }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-disp text-[16px]">Size Guide · {product.category}</p>
              <button onClick={() => setGuide(false)} className="cursor-pointer transition-transform active:scale-90" style={{ color: T.sub }} aria-label="Close">
                <IconX size={17} />
              </button>
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: T.sub }}>
              measurements in inches · DEEN standard block
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: T.line }}>
              <table className="w-full font-mono text-[10.5px]">
                <thead>
                  <tr style={{ background: T.indigoDark, color: "#fff" }}>
                    {["Size", "Chest", "Waist", "Length"].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE_ROWS.map((r, i) => (
                    <tr key={r[0]} style={{ background: i % 2 ? "#EFEBDF" : "#fff" }}>
                      {r.map((c, j) => (
                        <td key={j} className={`px-2 py-1.5 ${j === 0 ? "font-bold" : ""}`} style={{ color: j === 0 ? T.indigo : T.ink }}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: T.sub }}>
              Between sizes? Go up for a relaxed fit. Jeans are true to waist — our denim stretches half a size after three wears.
            </p>
          </div>
        </div>
      )}
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
  onCheckout,
}: {
  cart: DeenCartItem[];
  find: (id: string) => DeenProduct | undefined;
  go: (s: Screen) => void;
  setQty: (id: string, size: string, qty: number) => void;
  subtotal: number;
  onCheckout: () => void;
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
            <button onClick={onCheckout} className="mt-3 w-full cursor-pointer rounded-xl py-3.5 font-disp text-[15px] text-white transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: T.indigo }}>
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
  onPlace: (p: {
    name: string;
    phone: string;
    address: string;
    area: DeenArea;
    payment: DeenPayment;
    couponCode?: string;
  }) => Promise<void>;
  go: (s: Screen) => void;
}) {
  const toast = useToast();
  const profile = getDeenProfile();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<DeenArea>("dhaka");
  const [payment, setPayment] = useState<DeenPayment>("cod");
  const [err, setErr] = useState("");
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const freeTee = subtotal >= FREE_TEE_THRESHOLD;
  const delivery = DELIVERY_FEES[area];
  const discount = appliedCoupon?.discount ?? 0;
  const total = subtotal - discount + delivery;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    setCheckingCoupon(true);
    try {
      const v = await deenValidateCoupon(couponCode, subtotal);
      setAppliedCoupon(v);
      setCouponMsg({ ok: true, text: `${v.code} applied — you save ${bdt(v.discount)}.` });
      toast(`Coupon ${v.code} validated via gateway`, "mint");
    } catch (e) {
      setAppliedCoupon(null);
      setCouponMsg({ ok: false, text: e instanceof Error ? e.message : "Coupon not valid." });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const submit = async () => {
    setErr("");
    setPlacing(true);
    try {
      await onPlace({ name, phone, address, area, payment, couponCode: appliedCoupon?.code });
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
          {appliedCoupon && (
            <div className="flex justify-between py-0.5 text-[12px]" style={{ color: T.ok }}>
              <span className="font-semibold">Coupon {appliedCoupon.code}</span>
              <span>−{bdt(appliedCoupon.discount)}</span>
            </div>
          )}
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

        {/* coupon */}
        <div className="rounded-xl border p-3.5" style={{ borderColor: T.line, background: "#fff" }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]">Promo code</p>
          {appliedCoupon ? (
            <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "#EAF3EE" }}>
              <span className="text-[12px] font-bold" style={{ color: T.ok }}>
                {appliedCoupon.code} · −{bdt(appliedCoupon.discount)}
              </span>
              <button
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                  setCouponMsg(null);
                }}
                className="cursor-pointer transition-transform active:scale-90"
                style={{ color: T.sub }}
                aria-label="Remove coupon"
              >
                <IconX size={15} />
              </button>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="SUMMER10 · DEEN100 · DENIM500"
                className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 font-mono text-[11px] tracking-wider"
                style={{ borderColor: T.line }}
              />
              <button
                onClick={applyCoupon}
                disabled={checkingCoupon || !couponCode.trim()}
                className="shrink-0 cursor-pointer rounded-lg px-3.5 py-2 font-arch text-[11px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: T.indigo }}
              >
                {checkingCoupon ? "…" : "Apply"}
              </button>
            </div>
          )}
          {couponMsg && !appliedCoupon && (
            <p className="mt-1.5 text-[11px] font-semibold" style={{ color: couponMsg.ok ? T.ok : T.crimson }}>
              {couponMsg.text}
            </p>
          )}
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: T.sub }}>
            validated by the middle API against Woo coupons
          </p>
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

function OrdersScreen({ go, onCancel }: { go: (s: Screen) => void; onCancel: (id: string) => Promise<void> }) {
  const [orders, setOrders] = useState<DeenOrder[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    deenListOrders().then(setOrders);
  }, []);

  const cancel = async (id: string) => {
    setCancelling(id);
    try {
      await onCancel(id);
      setOrders((prev) => (prev ? prev.map((o) => (o.id === id ? { ...o, status: "cancelled" as const } : o)) : prev));
    } finally {
      setCancelling(null);
    }
  };

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
                    style={{
                      background:
                        o.status === "delivered" ? T.ok : o.status === "shipped" ? T.indigo : o.status === "cancelled" ? "#8a8578" : "#8C6A2F",
                    }}
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
                      {o.discount > 0 && (
                        <div className="flex justify-between py-0.5 text-[12px]" style={{ color: T.ok }}>
                          <span>Coupon {o.couponCode}</span>
                          <span>−{bdt(o.discount)}</span>
                        </div>
                      )}
                      <p className="pt-1.5 font-mono text-[9.5px] leading-relaxed" style={{ color: T.sub }}>
                        {o.address} · {PAYMENT_LABELS[o.payment]}
                      </p>
                      {o.status === "received" && (
                        <button
                          onClick={() => cancel(o.id)}
                          disabled={cancelling === o.id}
                          className="mt-3 w-full cursor-pointer rounded-lg border py-2.5 font-arch text-[12px] font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                          style={{ borderColor: T.crimson, color: T.crimson, background: "#FBEFEE" }}
                        >
                          {cancelling === o.id ? "Cancelling…" : "Cancel order"}
                        </button>
                      )}
                      {o.status === "cancelled" && (
                        <p className="mt-2.5 rounded-lg px-3 py-2 font-mono text-[9.5px] leading-relaxed" style={{ background: "#EFEBDF", color: T.sub }}>
                          Cancelled before confirmation — nothing was charged.
                        </p>
                      )}
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

function ProfileScreen({
  go,
  session,
  onLogout,
  wishCount,
}: {
  go: (s: Screen) => void;
  session: DeenSession | null;
  onLogout: () => void;
  wishCount: number;
}) {
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
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{draft.name || "—"}</p>
          <p className="font-mono text-[10px]" style={{ color: T.sub }}>{draft.phone || "no number"}</p>
          {session ? (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em]" style={{ background: "#EAF3EE", color: T.ok }}>
              <span className="pulse-dot h-1 w-1 rounded-full" style={{ background: T.ok }} /> signed in · token in SecureStore
            </span>
          ) : (
            <span className="mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em]" style={{ background: "#EFEBDF", color: "#8C6A2F" }}>
              guest session
            </span>
          )}
        </div>
      </div>

      {/* quick rows */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => go({ name: "wishlist" })}
          className="flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-all active:scale-[0.97]"
          style={{ borderColor: T.line, background: "#fff" }}
        >
          <span className="flex items-center gap-2 text-[12.5px] font-bold">
            <span style={{ color: wishCount > 0 ? T.crimson : T.ink }}><IconHeart size={15} /></span> Wishlist
          </span>
          <span className="font-mono text-[11px] font-bold" style={{ color: T.indigo }}>{wishCount}</span>
        </button>
        <button
          onClick={() => go({ name: "notifications" })}
          className="flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-all active:scale-[0.97]"
          style={{ borderColor: T.line, background: "#fff" }}
        >
          <span className="flex items-center gap-2 text-[12.5px] font-bold">
            <IconBell size={15} /> Alerts
          </span>
          <span className="font-mono text-[11px] font-bold" style={{ color: T.indigo }}>→</span>
        </button>
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

      {session && (
        <button
          onClick={onLogout}
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 font-arch text-[13px] font-bold transition-all active:scale-[0.98]"
          style={{ borderColor: T.crimson, color: T.crimson, background: "#fff" }}
        >
          <IconLogout size={15} /> Sign out
        </button>
      )}

      <p className="mt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.2em]" style={{ color: T.sub }}>
        deen app v1.1 · expo sdk 53 · middle api · woo rest v3
      </p>
    </div>
  );
}

/* ---------------- wishlist ---------------- */

function WishlistScreen({
  ids,
  find,
  go,
  onRemove,
  onAdd,
}: {
  ids: string[];
  find: (id: string) => DeenProduct | undefined;
  go: (s: Screen) => void;
  onRemove: (id: string) => void;
  onAdd: (id: string, size: string, qty?: number) => void;
}) {
  const items = ids.map(find).filter((p): p is DeenProduct => !!p);
  return (
    <div className="px-4 pt-1 pb-8 font-arch" style={{ color: T.ink }}>
      <div className="flex items-center gap-3">
        <button onClick={() => go({ name: "home" })} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-transform active:scale-90" style={{ borderColor: T.line }} aria-label="Back">
          <IconArrowLeft size={16} />
        </button>
        <p className="font-disp text-[20px]">Wishlist</p>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: T.sub }}>{items.length} saved</span>
      </div>

      {items.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#FBEFEE", color: T.crimson }}>
            <IconHeart size={26} />
          </span>
          <p className="font-disp text-[16px]">Nothing saved yet</p>
          <p className="max-w-[220px] text-[12px] leading-relaxed" style={{ color: T.sub }}>
            Tap the heart on any product to keep it here — synced to this device.
          </p>
          <button onClick={() => go({ name: "shop" })} className="mt-1 cursor-pointer rounded-full px-5 py-2.5 text-[12px] font-bold text-white transition-transform active:scale-95" style={{ background: T.indigo }}>
            Browse the store
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((p) => (
            <div key={p.id} className="flex gap-3 rounded-xl border p-2.5" style={{ borderColor: T.line, background: "#fff" }}>
              <button onClick={() => go({ name: "product", id: p.id })} className="h-[88px] w-[66px] shrink-0 cursor-pointer overflow-hidden rounded-lg" style={{ background: T.line }}>
                <PImg src={p.images[0]} alt={p.name} className="h-full w-full" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => go({ name: "product", id: p.id })} className="clamp2 cursor-pointer text-left text-[12px] font-semibold leading-snug">
                    {p.name}
                  </button>
                  <button onClick={() => onRemove(p.id)} className="shrink-0 cursor-pointer transition-transform active:scale-75" style={{ color: T.crimson }} aria-label="Remove from wishlist">
                    <IconHeart size={16} />
                  </button>
                </div>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: T.sub }}>{p.sku}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <PriceLine p={p} size="sm" />
                  <button
                    onClick={() => onAdd(p.id, p.sizes[0])}
                    className="cursor-pointer rounded-full px-3 py-1.5 font-arch text-[10.5px] font-bold text-white transition-all active:scale-90"
                    style={{ background: T.indigo }}
                  >
                    Add · {p.sizes[0]}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- auth ---------------- */

function AuthScreen({
  go,
  returnTo,
  onAuthed,
}: {
  go: (s: Screen) => void;
  returnTo: Screen | null;
  onAuthed: (s: DeenSession) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const s = mode === "login" ? await deenLogin(phone, pass) : await deenRegister(name, phone, pass);
      onAuthed(s);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border bg-white px-3.5 py-2.5 font-arch text-[13px]";
  const label = "mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.18em]";

  return (
    <div className="flex h-full flex-col font-arch" style={{ color: T.ink }}>
      <div className="min-h-0 flex-1 overflow-y-auto hide-scroll px-4">
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => go(returnTo ?? { name: "profile" })} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-transform active:scale-90" style={{ borderColor: T.line }} aria-label="Back">
            <IconArrowLeft size={16} />
          </button>
          <p className="font-disp text-[20px]">{mode === "login" ? "Welcome back" : "Create account"}</p>
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: T.sub }}>
          {mode === "login"
            ? "Sign in to sync your bag, wishlist and orders on this device."
            : "One account for the app and the website — orders sync everywhere."}
        </p>

        {/* mode toggle */}
        <div className="mt-4 grid grid-cols-2 rounded-xl border p-1" style={{ borderColor: T.line, background: "#fff" }}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(""); }}
              className="cursor-pointer rounded-lg py-2 font-arch text-[12px] font-bold transition-all duration-200"
              style={mode === m ? { background: T.indigo, color: "#fff" } : { color: T.sub }}
            >
              {m === "login" ? "Log in" : "Register"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {mode === "register" && (
            <div>
              <label className={label} style={{ color: T.sub }}>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rafiq Hasan" className={input} style={{ borderColor: T.line }} />
            </div>
          )}
          <div>
            <label className={label} style={{ color: T.sub }}>Mobile</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className={input} style={{ borderColor: T.line }} />
          </div>
          <div>
            <label className={label} style={{ color: T.sub }}>Password</label>
            <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="••••••" className={input} style={{ borderColor: T.line }} />
          </div>
        </div>

        {err && (
          <div className="deen-pop mt-3 rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold" style={{ borderColor: T.crimson, color: T.crimson, background: "#FBEFEE" }}>
            {err}
          </div>
        )}

        {/* demo account */}
        <button
          onClick={() => { setMode("login"); setPhone(demoAccount.phone); setPass(demoAccount.pass); setErr(""); }}
          className="mt-4 w-full cursor-pointer rounded-xl border border-dashed px-3.5 py-3 text-left transition-all active:scale-[0.98]"
          style={{ borderColor: T.indigo, background: "#EEF0FA" }}
        >
          <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: T.indigo }}>Demo account · tap to fill</span>
          <span className="mt-1 block font-mono text-[11px]" style={{ color: T.ink }}>
            {demoAccount.phone} · pass: {demoAccount.pass}
          </span>
        </button>

        <p className="mt-3 text-center font-mono text-[9px] leading-relaxed" style={{ color: T.sub }}>
          Sessions are JWT-shaped and stored in Expo SecureStore on device.
          <br />In production, register hits POST /v1/deen/auth on the middle API.
        </p>
      </div>

      <div className="border-t p-3.5" style={{ background: "#fff", borderColor: T.line }}>
        <button
          onClick={submit}
          disabled={busy}
          className="w-full cursor-pointer rounded-xl py-3.5 font-disp text-[15px] text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: T.indigo }}
        >
          {busy ? "Talking to the gateway…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- notifications ---------------- */

function NotificationsScreen({
  notifs,
  go,
  onReadAll,
  onClear,
}: {
  notifs: Notif[];
  go: (s: Screen) => void;
  onReadAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="px-4 pt-1 pb-8 font-arch" style={{ color: T.ink }}>
      <div className="flex items-center gap-3">
        <button onClick={() => go({ name: "home" })} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-transform active:scale-90" style={{ borderColor: T.line }} aria-label="Back">
          <IconArrowLeft size={16} />
        </button>
        <p className="font-disp text-[20px]">Notifications</p>
        {notifs.length > 0 && (
          <div className="ml-auto flex gap-2">
            <button onClick={onReadAll} className="cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-transform active:scale-95" style={{ borderColor: T.line, color: T.sub }}>
              Read all
            </button>
            <button onClick={onClear} className="cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-transform active:scale-95" style={{ borderColor: T.crimson, color: T.crimson }}>
              Clear
            </button>
          </div>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#EFEBDF", color: T.indigo }}>
            <IconBell size={26} />
          </span>
          <p className="font-disp text-[16px]">All quiet</p>
          <p className="max-w-[230px] text-[12px] leading-relaxed" style={{ color: T.sub }}>
            Order updates, promo unlocks and drop alerts will land here — mirrored from FCM push.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {notifs.map((n) => (
            <div key={n.id} className="tick-in flex gap-3 rounded-xl border p-3.5" style={{ borderColor: T.line, background: n.read ? "#fff" : "#EEF0FA" }}>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: n.read ? "#EFEBDF" : T.indigo, color: n.read ? T.sub : "#fff" }}>
                <IconBell size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12.5px] font-bold">{n.title}</p>
                  <span className="shrink-0 font-mono text-[8.5px] uppercase" style={{ color: T.sub }}>
                    {new Date(n.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: T.sub }}>{n.body}</p>
              </div>
              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: T.crimson }} />}
            </div>
          ))}
        </div>
      )}
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
