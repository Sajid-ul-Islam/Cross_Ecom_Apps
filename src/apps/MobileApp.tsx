/* ------------------------------------------------------------------ */
/*  apps/mobile — EXPO ANDROID (P2, primary build target)              */
/*  Live device build developing against the same middle API layer.    */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, money, type Order, type OrderStatus, type Product } from "../api/contracts";
import {
  createOrder,
  getCustomer,
  listProducts,
  listPublicOrders,
  pingHealth,
  saveCustomer,
  seedGatewayEvents,
  subscribeGateway,
  validateCoupon,
  type CustomerProfile,
  type GatewayEvent,
} from "../api/gateway";
import { PHASES, type TaskStatus } from "../data";
import { useLocalStorage, useReducedMotion } from "../hooks";
import { Bar, Reveal, Stamp, StatusChip, useToast } from "../components/ui";
import {
  IconArrowLeft,
  IconBag,
  IconBattery,
  IconCart,
  IconCheck,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSignal,
  IconUser,
  IconX,
} from "../components/Icons";

const CYCLE: Record<TaskStatus, TaskStatus> = { todo: "active", active: "done", done: "todo" };

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "border-amber/60 text-amber",
  processing: "border-wire/60 text-wire",
  completed: "border-mint/60 text-mint",
  refunded: "border-coral/60 text-coral",
  cancelled: "border-line text-faint",
};

const methodTone = (m: string) =>
  m === "GET" ? "text-wire" : m === "POST" ? "text-mint" : m === "DELETE" ? "text-coral" : "text-amber";

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Screen =
  | { name: "home" }
  | { name: "product"; id: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "success"; order: Order }
  | { name: "orders" }
  | { name: "profile" };

function AppBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-linesoft bg-panel/70 px-3 py-2.5">
      {onBack && (
        <button onClick={onBack} className="cursor-pointer p-1 text-dim transition-colors hover:text-ink active:scale-90" aria-label="Back">
          <IconArrowLeft size={17} />
        </button>
      )}
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-dim">{title}</span>
      <span className="ml-auto flex items-center gap-2">{right}</span>
    </div>
  );
}

export function MobileApp({
  overrides,
  onCycle,
}: {
  overrides: Record<string, TaskStatus>;
  onCycle: (id: string) => void;
}) {
  const toast = useToast();
  const reduced = useReducedMotion();

  const [booted, setBooted] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  const [products, setProducts] = useState<Product[] | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");

  const [health, setHealth] = useState<{ ms: number; redis: string } | null>(null);
  const [events, setEvents] = useState<GatewayEvent[]>(seedGatewayEvents);

  const [cart, setCart] = useLocalStorage<Record<string, number>>("bw.mobile.cart.v1", {});
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [history, setHistory] = useState<Order[] | null>(null);
  const [historyBusy, setHistoryBusy] = useState(false);

  const [customer, setCustomer] = useState<CustomerProfile>(() => getCustomer());
  const [form, setForm] = useState(() => ({ name: customer.name, email: customer.email, address: "" }));
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [clock, setClock] = useState(() => new Date());

  /* ---- boot handshake ---- */
  useEffect(() => {
    if (booted) return;
    const d = reduced ? [30, 60, 90, 130] : [500, 1350, 2150, 2950];
    const timers = [
      window.setTimeout(() => setBootStep(1), d[0]),
      window.setTimeout(() => setBootStep(2), d[1]),
      window.setTimeout(() => setBootStep(3), d[2]),
      window.setTimeout(() => setBooted(true), d[3]),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [booted, reduced]);

  /* ---- clock / health / telemetry ---- */
  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!booted) return;
    let alive = true;
    const ping = () => pingHealth("android").then((h) => alive && setHealth(h)).catch(() => undefined);
    ping();
    const t = window.setInterval(ping, 25000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [booted]);

  useEffect(() => subscribeGateway((e) => setEvents((prev) => [e, ...prev].slice(0, 7))), []);

  /* ---- catalog ---- */
  const refreshCatalog = () => {
    setProductsError(null);
    setProducts(null);
    listProducts("android")
      .then(setProducts)
      .catch((e: unknown) => setProductsError(e instanceof ApiError ? e.message : "Gateway unreachable."));
  };
  useEffect(refreshCatalog, []);

  /* ---- order history (orders + profile screens) ---- */
  useEffect(() => {
    if (screen.name !== "orders" && screen.name !== "profile") return;
    let alive = true;
    setHistoryBusy(true);
    listPublicOrders(customer.email, "android")
      .then((o) => {
        if (alive) {
          setHistory(o);
          setHistoryBusy(false);
        }
      })
      .catch(() => alive && setHistoryBusy(false));
    return () => {
      alive = false;
    };
  }, [screen.name, customer.email]);

  useEffect(() => {
    if (screen.name === "product") setQty(1);
  }, [screen]);

  /* ---- derived ---- */
  const categories = useMemo(
    () => ["ALL", ...(products ? Array.from(new Set(products.map((p) => p.category))) : [])],
    [products]
  );
  const visible = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "ALL" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [products, query, category]);

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const cartLines = useMemo(() => {
    if (!products) return [];
    return Object.entries(cart)
      .map(([id, q]) => {
        const product = products.find((p) => p.id === id);
        return product ? { product, qty: q } : null;
      })
      .filter((x): x is { product: Product; qty: number } => x !== null);
  }, [cart, products]);
  const subtotal = Math.round(cartLines.reduce((s, l) => s + l.product.price * l.qty, 0) * 100) / 100;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = Math.round((subtotal - discount) * 100) / 100;
  const current = screen.name === "product" && products ? products.find((p) => p.id === screen.id) ?? null : null;

  const p2 = PHASES.find((p) => p.code === "P2")!;
  const p2Done = p2.tasks.filter((t) => (overrides[t.id] ?? t.status) === "done").length;

  /* ---- actions ---- */
  const addToCart = (p: Product, n: number) => {
    if (p.stock <= 0) {
      toast(`${p.sku} is out of stock`, "coral");
      return;
    }
    const cur = cart[p.id] ?? 0;
    const next = Math.min(p.stock, cur + n);
    if (next === cur) {
      toast(`Max stock reached — only ${p.stock} in the warehouse`, "amber");
      return;
    }
    setCart({ ...cart, [p.id]: next });
    setCoupon(null);
    toast(`Added ${p.sku} to cart`, "mint");
  };

  const decItem = (id: string) => {
    const cur = cart[id] ?? 0;
    if (cur <= 1) {
      removeItem(id);
      return;
    }
    setCart({ ...cart, [id]: cur - 1 });
    setCoupon(null);
  };

  const removeItem = (id: string) => {
    const next = { ...cart };
    delete next[id];
    setCart(next);
    setCoupon(null);
  };

  const applyCoupon = async () => {
    if (!couponInput.trim() || couponBusy || subtotal <= 0) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const v = await validateCoupon(couponInput, subtotal, "android");
      setCoupon(v);
      setCouponInput("");
      toast(`Coupon ${v.code} applied — saves ${money(v.discount)}`, "mint");
    } catch (e) {
      setCouponError(e instanceof ApiError ? e.message : "Coupon service unavailable.");
    } finally {
      setCouponBusy(false);
    }
  };

  const placeOrder = async () => {
    if (placing || cartLines.length === 0) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const order = await createOrder({
        customerName: form.name,
        customerEmail: form.email,
        address: form.address,
        items: cartLines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        couponCode: coupon?.code,
        channel: "android",
      });
      setCart({});
      setCoupon(null);
      setForm((f) => ({ ...f, address: "" }));
      setScreen({ name: "success", order });
      toast(`Order ${order.number} filed via gateway`, "mint");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gateway error — order not filed.";
      setPlaceError(msg);
      if (e instanceof ApiError && e.code === "INSUFFICIENT_STOCK") {
        setScreen({ name: "cart" });
        toast(msg, "coral");
      }
    } finally {
      setPlacing(false);
    }
  };

  const saveProfile = () => {
    const next = { ...customer, name: form.name.trim() || customer.name, email: form.email.trim() || customer.email };
    setCustomer(next);
    saveCustomer(next);
    toast("Profile synced to device storage", "wire");
  };

  const cartButton = (
    <button
      onClick={() => setScreen({ name: "cart" })}
      className="relative cursor-pointer p-1 text-dim transition-colors hover:text-ink active:scale-90"
      aria-label="Open cart"
    >
      <IconBag size={18} />
      {cartCount > 0 && (
        <span className="tick-in absolute -right-1.5 -top-1 bg-amber px-1 font-mono text-[9px] font-bold leading-[14px] text-bg">
          {cartCount}
        </span>
      )}
    </button>
  );

  const showNav = booted && (screen.name === "home" || screen.name === "orders" || screen.name === "profile");

  const navBtn = (target: "home" | "orders" | "profile", icon: ReactNode, label: string) => (
    <button
      onClick={() => setScreen({ name: target } as Screen)}
      className={`flex cursor-pointer flex-col items-center gap-1 py-2.5 transition-colors ${
        screen.name === target ? "text-amber" : "text-faint hover:text-dim"
      }`}
    >
      {icon}
      <span className="font-mono text-[8.5px] uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  /* ================= device screen content ================= */

  const renderScreen = () => {
    switch (screen.name) {
      case "home":
        return (
          <div key="home" className="screen-in absolute inset-0 flex flex-col">
            <AppBar title="trailhead supply" right={cartButton} />
            <div className={`flex-1 overflow-y-auto px-3.5 pt-3 ${showNav ? "pb-16" : "pb-4"}`}>
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-extrabold tracking-tight">
                  Gear for the <span className="text-mint">long way</span> round.
                </p>
                {health && (
                  <span className="flex shrink-0 items-center gap-1.5 border border-mint/40 bg-mint/5 px-1.5 py-0.5 font-mono text-[9px] text-mint">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint" />
                    {health.ms}ms
                  </span>
                )}
              </div>

              <label className="mt-3 flex items-center gap-2 border border-line bg-panel px-2.5 py-2 transition-colors focus-within:border-wire">
                <IconSearch size={14} className="shrink-0 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search the catalog…"
                  className="w-full bg-transparent font-mono text-[12px] text-ink placeholder:text-faint"
                />
              </label>

              <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`shrink-0 cursor-pointer border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                      category === c ? "border-amber/70 bg-amber/10 text-amber" : "border-line text-faint hover:text-dim"
                    }`}
                  >
                    {c.toLowerCase()}
                  </button>
                ))}
              </div>

              {productsError ? (
                <div className="mt-8 text-center">
                  <p className="font-mono text-[11px] text-coral">{productsError}</p>
                  <button
                    onClick={refreshCatalog}
                    className="mx-auto mt-3 flex cursor-pointer items-center gap-2 border border-coral/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-coral transition-colors hover:bg-coral/10"
                  >
                    <IconRefresh size={12} /> retry
                  </button>
                </div>
              ) : !products ? (
                <p className="mt-10 text-center font-mono text-[11px] text-faint">
                  <span className="pulse-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-wire" />
                  syncing catalog via gateway…
                </p>
              ) : visible.length === 0 ? (
                <p className="mt-10 text-center font-mono text-[11px] text-faint">no gear matches “{query}”</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {visible.map((p) => (
                    <div
                      key={p.id}
                      className="group cursor-pointer border border-line bg-panel p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-wire/50"
                      onClick={() => setScreen({ name: "product", id: p.id })}
                    >
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-faint">{p.category.toLowerCase()}</p>
                      <p className="mt-1 font-display text-[12.5px] font-bold leading-tight">{p.name}</p>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="font-mono text-[13px] font-semibold text-mint">{money(p.price)}</span>
                        {p.compareAt && <span className="font-mono text-[10px] text-faint line-through">{money(p.compareAt)}</span>}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span
                          className={`font-mono text-[8.5px] uppercase tracking-[0.14em] ${
                            p.stock === 0 ? "text-coral" : p.stock <= 6 ? "text-amber" : "text-faint"
                          }`}
                        >
                          {p.stock === 0 ? "out" : p.stock <= 6 ? `low · ${p.stock}` : `${p.stock} in stock`}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, 1);
                          }}
                          className="cursor-pointer border border-mint/50 p-1 text-mint transition-all hover:bg-mint/10 active:scale-90"
                          aria-label={`Add ${p.sku} to cart`}
                        >
                          <IconPlus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "product":
        if (!current) return null;
        return (
          <div key={`product-${current.id}`} className="screen-in absolute inset-0 flex flex-col">
            <AppBar title={current.sku} onBack={() => setScreen({ name: "home" })} right={cartButton} />
            <div className="flex-1 overflow-y-auto px-4 pb-5 pt-4">
              <Stamp tone="wire">{current.category.toLowerCase()}</Stamp>
              <h3 className="mt-2 font-display text-[22px] font-extrabold leading-tight tracking-tight">{current.name}</h3>
              <p className="mt-1 font-mono text-[10px] text-faint">★ {current.rating} · {current.weight}</p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="font-display text-2xl font-extrabold text-mint">{money(current.price)}</span>
                {current.compareAt && <span className="font-mono text-[12px] text-faint line-through">{money(current.compareAt)}</span>}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-dim">{current.blurb}</p>

              <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line">
                {[
                  ["SKU", current.sku],
                  ["STOCK", current.stock === 0 ? "OUT" : `${current.stock} units`],
                  ["MATERIAL", current.material],
                  ["WEIGHT", current.weight],
                ].map(([k, v]) => (
                  <div key={k} className="bg-panel px-2.5 py-2">
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-faint">{k}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {current.tags.map((t) => (
                  <span key={t} className="border border-linesoft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                    {t}
                  </span>
                ))}
              </div>

              {(cart[current.id] ?? 0) > 0 && (
                <p className="mt-3 font-mono text-[10px] text-amber">already in cart: {cart[current.id]}</p>
              )}
            </div>

            <div className="shrink-0 border-t border-line bg-panel/80 p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-line">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="cursor-pointer p-2 text-dim transition-colors hover:text-ink active:scale-90"
                    aria-label="Decrease quantity"
                  >
                    <IconMinus size={13} />
                  </button>
                  <span className="w-7 text-center font-mono text-[13px]">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(current.stock || 1, q + 1))}
                    className="cursor-pointer p-2 text-dim transition-colors hover:text-ink active:scale-90"
                    aria-label="Increase quantity"
                  >
                    <IconPlus size={13} />
                  </button>
                </div>
                <button
                  onClick={() => addToCart(current, qty)}
                  disabled={current.stock === 0}
                  className="flex-1 cursor-pointer bg-mint px-3 py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-bg transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {current.stock === 0 ? "out of stock" : `add ${qty} · ${money(current.price * qty)}`}
                </button>
              </div>
            </div>
          </div>
        );

      case "cart":
        return (
          <div key="cart" className="drawer-rise absolute inset-0 flex flex-col border-t-2 border-mint/60 bg-bg">
            <AppBar title={`cart · ${cartCount} items`} right={
              <button onClick={() => setScreen({ name: "home" })} className="cursor-pointer p-1 text-dim transition-colors hover:text-ink" aria-label="Close cart">
                <IconX size={16} />
              </button>
            } />
            {cartLines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <IconBag size={34} className="text-line" />
                <p className="font-mono text-[11px] text-faint">cart is empty — the trail awaits.</p>
                <button
                  onClick={() => setScreen({ name: "home" })}
                  className="cursor-pointer border border-wire/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-wire transition-colors hover:bg-wire/10"
                >
                  browse gear
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-3.5 py-3">
                  <ul className="space-y-2">
                    {cartLines.map((l) => (
                      <li key={l.product.id} className="border border-line bg-panel p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-[12.5px] font-bold leading-tight">{l.product.name}</p>
                            <p className="font-mono text-[9px] text-faint">{l.product.sku} · {money(l.product.price)} each</p>
                          </div>
                          <button onClick={() => removeItem(l.product.id)} className="cursor-pointer p-0.5 text-faint transition-colors hover:text-coral" aria-label={`Remove ${l.product.sku}`}>
                            <IconX size={13} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center border border-linesoft">
                            <button onClick={() => decItem(l.product.id)} className="cursor-pointer p-1.5 text-dim hover:text-ink active:scale-90" aria-label="Decrease">
                              <IconMinus size={11} />
                            </button>
                            <span className="w-6 text-center font-mono text-[11.5px]">{l.qty}</span>
                            <button
                              onClick={() => addToCart(l.product, 1)}
                              className="cursor-pointer p-1.5 text-dim hover:text-ink active:scale-90"
                              aria-label="Increase"
                            >
                              <IconPlus size={11} />
                            </button>
                          </div>
                          <span className="font-mono text-[12.5px] font-semibold text-mint">{money(l.product.price * l.qty)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* coupon */}
                  <div className="mt-3 border border-dashed border-line p-2.5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">coupon · validated by gateway</p>
                    {coupon ? (
                      <div className="mt-2 flex items-center justify-between border border-mint/50 bg-mint/5 px-2 py-1.5">
                        <span className="font-mono text-[11px] text-mint">
                          {coupon.code} · −{money(Math.min(coupon.discount, subtotal))}
                        </span>
                        <button onClick={() => setCoupon(null)} className="cursor-pointer text-faint hover:text-coral" aria-label="Remove coupon">
                          <IconX size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-1.5">
                        <input
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError(null);
                          }}
                          placeholder="WELCOME10"
                          className="min-w-0 flex-1 border border-line bg-bg px-2 py-1.5 font-mono text-[11px] uppercase text-ink placeholder:text-faint"
                        />
                        <button
                          onClick={applyCoupon}
                          disabled={couponBusy || !couponInput.trim()}
                          className="cursor-pointer border border-amber/60 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber transition-colors hover:bg-amber/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {couponBusy ? "…" : "apply"}
                        </button>
                      </div>
                    )}
                    {couponError && <p className="mt-1.5 font-mono text-[10px] text-coral">{couponError}</p>}
                  </div>
                </div>

                <div className="shrink-0 border-t border-line bg-panel/80 p-3.5 backdrop-blur">
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-dim"><span>subtotal</span><span>{money(subtotal)}</span></div>
                    {discount > 0 && (
                      <div className="flex justify-between text-mint"><span>coupon</span><span>−{money(discount)}</span></div>
                    )}
                    <div className="flex justify-between text-[13px] font-semibold text-ink"><span>total</span><span>{money(total)}</span></div>
                  </div>
                  <button
                    onClick={() => setScreen({ name: "checkout" })}
                    className="mt-2.5 w-full cursor-pointer bg-amber py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-bg transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    checkout via gateway
                  </button>
                  <p className="mt-1.5 text-center font-mono text-[8.5px] tracking-[0.14em] text-faint">POST /v1/orders · channel: android</p>
                </div>
              </>
            )}
          </div>
        );

      case "checkout":
        return (
          <div key="checkout" className="screen-in absolute inset-0 flex flex-col">
            <AppBar title="checkout" onBack={() => setScreen({ name: "cart" })} />
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">ship to</p>
              <div className="mt-2 space-y-2.5">
                <label className="block">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">full name</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full border border-line bg-panel px-2.5 py-2 text-[13px] text-ink"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">email</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full border border-line bg-panel px-2.5 py-2 text-[13px] text-ink"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">address</span>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    rows={2}
                    placeholder="street, city, postcode"
                    className="mt-1 w-full resize-none border border-line bg-panel px-2.5 py-2 text-[13px] text-ink placeholder:text-faint"
                  />
                </label>
              </div>

              <div className="mt-4 border border-dashed border-line bg-panel/60 p-2.5 font-mono text-[10px] leading-relaxed text-dim">
                <p><span className="text-mint">POST</span> /v1/orders · channel <span className="text-mint">android</span></p>
                <p className="mt-1">{cartLines.length} line{cartLines.length === 1 ? "" : "s"} · total {money(total)}{coupon ? ` · coupon ${coupon.code}` : ""}</p>
                <p className="mt-1 text-faint">gateway → woocommerce · stock decremented · webhook queued</p>
              </div>

              {placeError && (
                <p className="mt-3 border border-coral/50 bg-coral/5 px-2.5 py-2 font-mono text-[10.5px] text-coral">{placeError}</p>
              )}
            </div>
            <div className="shrink-0 border-t border-line bg-panel/80 p-3.5 backdrop-blur">
              <button
                onClick={placeOrder}
                disabled={placing}
                className="w-full cursor-pointer bg-mint py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-bg transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                {placing ? "filing order…" : `place order · ${money(total)}`}
              </button>
            </div>
          </div>
        );

      case "success":
        return (
          <div key="success" className="screen-up absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span className="stamp-pop flex h-16 w-16 items-center justify-center rounded-full border-2 border-mint text-mint">
              <IconCheck size={30} />
            </span>
            <h3 className="mt-4 font-display text-xl font-extrabold tracking-tight">ORDER {screen.order.number} FILED</h3>
            <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-dim">
              status <span className="text-amber">PENDING</span> · webhook → woocommerce queued
              <br />
              total <span className="text-mint">{money(screen.order.total)}</span> · channel android
            </p>
            <p className="mt-2 font-mono text-[9px] text-faint">push notification queued via FCM (P2-6)</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setScreen({ name: "orders" })}
                className="cursor-pointer border border-wire/60 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-wire transition-colors hover:bg-wire/10"
              >
                view orders
              </button>
              <button
                onClick={() => setScreen({ name: "home" })}
                className="cursor-pointer px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint transition-colors hover:text-dim"
              >
                back to shop
              </button>
            </div>
          </div>
        );

      case "orders":
        return (
          <div key="orders" className="screen-in absolute inset-0 flex flex-col">
            <AppBar title="my orders" right={cartButton} />
            <div className={`flex-1 overflow-y-auto px-3.5 py-3 ${showNav ? "pb-16" : "pb-4"}`}>
              {historyBusy ? (
                <p className="mt-10 text-center font-mono text-[11px] text-faint">
                  <span className="pulse-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-wire" />
                  GET /v1/orders?mine=true …
                </p>
              ) : !history || history.length === 0 ? (
                <div className="mt-12 text-center">
                  <p className="font-mono text-[11px] text-faint">no orders for {customer.email} yet.</p>
                  <button
                    onClick={() => setScreen({ name: "home" })}
                    className="mx-auto mt-3 cursor-pointer border border-wire/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-wire transition-colors hover:bg-wire/10"
                  >
                    place the first one
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {history.map((o) => (
                    <li key={o.id} className="border border-line bg-panel p-2.5 transition-colors hover:border-wire/40">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[12px] font-semibold text-ink">{o.number}</span>
                        <span className={`border px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] ${STATUS_TONE[o.status]}`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-dim">
                        {o.items.slice(0, 2).map((i) => i.name).join(" · ")}
                        {o.items.length > 2 ? ` +${o.items.length - 2} more` : ""}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-faint">
                        <span>{timeAgo(o.createdAt)} · <span className="text-mint">android</span></span>
                        <span className="text-[12px] font-semibold text-mint">{money(o.total)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );

      case "profile":
        return (
          <div key="profile" className="screen-in absolute inset-0 flex flex-col">
            <AppBar title="profile" right={cartButton} />
            <div className={`flex-1 overflow-y-auto px-4 py-4 ${showNav ? "pb-16" : "pb-4"}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center border border-wire/50 bg-panel font-display text-lg font-extrabold text-wire">
                  {customer.name.charAt(0)}
                </span>
                <div>
                  <p className="font-display text-[15px] font-bold">{customer.name}</p>
                  <p className="font-mono text-[10px] text-faint">{customer.device}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line">
                <div className="bg-panel px-3 py-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-faint">orders</p>
                  <p className="mt-0.5 font-display text-lg font-extrabold text-ink">{historyBusy ? "…" : history?.length ?? 0}</p>
                </div>
                <div className="bg-panel px-3 py-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-faint">lifetime spend</p>
                  <p className="mt-0.5 font-display text-lg font-extrabold text-mint">
                    {historyBusy ? "…" : money(history?.reduce((s, o) => s + o.total, 0) ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <label className="block">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">name</span>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full border border-line bg-panel px-2.5 py-2 text-[13px] text-ink" />
                </label>
                <label className="block">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">email</span>
                  <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 w-full border border-line bg-panel px-2.5 py-2 text-[13px] text-ink" />
                </label>
                <div className="flex items-center justify-between border border-line bg-panel px-2.5 py-2">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">push · FCM</p>
                    <p className="mt-0.5 font-mono text-[10px] text-dim">{customer.push ? "order updates on" : "muted"}</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = { ...customer, push: !customer.push };
                      setCustomer(next);
                      saveCustomer(next);
                      toast(next.push ? "Push enabled" : "Push muted", "wire");
                    }}
                    className={`cursor-pointer border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                      customer.push ? "border-mint/60 bg-mint/10 text-mint" : "border-line text-faint hover:text-dim"
                    }`}
                  >
                    {customer.push ? "on" : "off"}
                  </button>
                </div>
              </div>

              <button
                onClick={saveProfile}
                className="mt-4 w-full cursor-pointer border border-wire/60 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-wire transition-colors hover:bg-wire/10 active:scale-[0.98]"
              >
                sync profile
              </button>
              <button
                onClick={() => toast("Demo build — device session retained", "amber")}
                className="mt-2 w-full cursor-pointer py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-faint transition-colors hover:text-coral"
              >
                sign out
              </button>
            </div>
          </div>
        );
    }
  };

  /* ================= layout ================= */

  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-mint">
              <span className="inline-block h-px w-8 bg-mint/70" />
              P2 · Expo Android — primary build target
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-[2.4rem]">
              apps/mobile <span className="text-mint">· live device build</span>
            </h2>
          </div>
          <p className="max-w-md text-[13px] leading-relaxed text-dim">
            The Android app boots, handshakes with the middle API layer and runs the real P2 flows — catalog, cart,
            coupon, checkout, history. Orders it files land in <span className="font-mono text-[12px] text-amber">/admin</span> instantly.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[400px_1fr]">
        {/* ---------- device ---------- */}
        <Reveal className="lg:sticky lg:top-16">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.12em] text-faint">~/apps/mobile · npx expo start --android</p>
            <Stamp tone="mint" pop>
              running
            </Stamp>
          </div>

          <div className="relative mx-auto w-full max-w-[380px] rounded-[2.4rem] border border-line bg-[#0a1828] p-[10px] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            {/* side buttons */}
            <span className="absolute -right-[3px] top-24 h-10 w-[3px] bg-line" />
            <span className="absolute -right-[3px] top-[152px] h-16 w-[3px] bg-line" />

            <div className="relative overflow-hidden rounded-[1.9rem] border border-linesoft bg-bg">
              {/* status bar */}
              <div className="relative flex items-center justify-between px-5 pb-1 pt-2.5 font-mono text-[9.5px] text-dim">
                <span>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                <span className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#050d16] ring-1 ring-line" />
                <span className="flex items-center gap-1.5">
                  <IconSignal size={11} />
                  <span>5G</span>
                  <IconBattery size={15} />
                </span>
              </div>

              <div className="relative h-[596px]">
                {!booted ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg px-8">
                    <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden>
                      <rect width="32" height="32" fill="var(--color-panel)" stroke="var(--color-line)" />
                      <path d="M6 22 L14 10 L18 16 L26 6" stroke="var(--color-mint)" strokeWidth="2.4" fill="none" />
                      <circle cx="26" cy="6" r="2.6" fill="var(--color-amber)" />
                    </svg>
                    <p className="mt-3 font-display text-lg font-extrabold tracking-tight">
                      BRIDGEWORK <span className="text-mint">mobile</span>
                    </p>
                    <div className="mt-6 w-full max-w-[240px] space-y-1.5 font-mono text-[10px] text-dim">
                      <p className="boot-line text-faint">&gt; expo run:android · bundling 100%</p>
                      {bootStep >= 1 && <p className="boot-line">&gt; GET /v1/health · 200 · gateway ok</p>}
                      {bootStep >= 2 && <p className="boot-line">&gt; catalog sync · /v1/products</p>}
                      {bootStep >= 3 && <p className="boot-line text-mint">&gt; session minted · JWT → SecureStore ✓</p>}
                      <span className="blink inline-block h-3 w-1.5 translate-y-0.5 bg-mint" />
                    </div>
                  </div>
                ) : (
                  <>
                    {renderScreen()}
                    {showNav && (
                      <nav className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-panel/95 backdrop-blur">
                        {navBtn("home", <IconBag size={17} />, "shop")}
                        {navBtn("orders", <IconCart size={17} />, "orders")}
                        {navBtn("profile", <IconUser size={17} />, "profile")}
                      </nav>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">
            ios/ stays queued for P5 — this codebase is the head-start
          </p>
        </Reveal>

        {/* ---------- workspace panels ---------- */}
        <div className="space-y-5">
          {/* device monitor */}
          <Reveal delay={60}>
            <div className="corners border border-line bg-panel/70">
              <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
                <h3 className="font-display text-[15px] font-bold">device ↔ gateway — live traffic</h3>
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-mint">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint" />
                  {health ? `health ${health.ms}ms` : "pinging…"}
                </span>
              </div>
              <ul className="divide-y divide-linesoft px-5 py-2">
                {events.map((e) => (
                  <li key={e.id} className="tick-in flex items-center gap-2.5 py-1.5 font-mono text-[10.5px]">
                    <span className="w-14 shrink-0 text-faint">
                      {new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                    </span>
                    <span className={`w-12 shrink-0 font-semibold ${methodTone(e.method)}`}>{e.method}</span>
                    <span className="truncate text-ink">{e.path}</span>
                    <span className="ml-auto shrink-0 text-dim">
                      <span className={e.status < 400 ? "text-mint" : "text-coral"}>{e.status}</span> · {e.ms}ms
                    </span>
                    <span
                      className={`shrink-0 border px-1 py-px text-[8px] uppercase tracking-[0.12em] ${
                        e.channel === "android" ? "border-mint/50 text-mint" : e.channel === "admin" ? "border-amber/50 text-amber" : "border-wire/50 text-wire"
                      }`}
                    >
                      {e.channel}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* sprint board */}
          <Reveal delay={120}>
            <div className="corners border border-line bg-panel/70">
              <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
                <h3 className="font-display text-[15px] font-bold">sprint board — P2 expo android</h3>
                <span className="font-mono text-[10px] text-dim">
                  {p2Done}/{p2.tasks.length}
                </span>
              </div>
              <div className="px-5 pt-3">
                <Bar value={(p2Done / p2.tasks.length) * 100} tone={p2Done === p2.tasks.length ? "mint" : "amber"} />
              </div>
              <ul className="px-5 py-3">
                {p2.tasks.map((t) => {
                  const st = overrides[t.id] ?? t.status;
                  return (
                    <li key={t.id} className="flex items-center gap-3 border-t border-linesoft py-2 first:border-t-0">
                      <StatusChip status={st} onClick={() => onCycle(t.id)} title={`Cycle status — currently ${st.toUpperCase()}`} />
                      <span className={`text-[12.5px] leading-snug ${st === "done" ? "text-faint line-through decoration-line" : st === "active" ? "text-ink" : "text-dim"}`}>
                        {t.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="border-t border-dashed border-line px-5 py-2.5 font-mono text-[9.5px] tracking-[0.12em] text-faint">
                chips write to the shared ledger — open #/blueprint and watch them land in the timeline
              </p>
            </div>
          </Reveal>

          {/* build channel */}
          <Reveal delay={180}>
            <div className="border border-line bg-panel/70 px-5 py-4">
              <h3 className="font-display text-[15px] font-bold">release channel</h3>
              <ul className="mt-3 space-y-1.5 font-mono text-[11px] leading-relaxed text-dim">
                <li><span className="text-mint">$</span> eas build --platform android --profile preview</li>
                <li className="text-faint">track: internal → closed → production (P2-7 → P2-8)</li>
                <li><span className="text-wire">EXPO_PUBLIC_API_URL</span> = gateway.bridgework.dev</li>
                <li className="text-faint">FCM sender id — pending, wired in P2-6</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
