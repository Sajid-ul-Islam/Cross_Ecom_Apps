import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  money,
  ORDER_STATUSES,
  type AdminSession,
  type Coupon,
  type Order,
  type OrderStatus,
  type Product,
} from "../api/contracts";
import * as gw from "../api/gateway";
import { useToast } from "../components/ui";
import {
  IconBox,
  IconCart,
  IconCheck,
  IconLayers,
  IconLock,
  IconLogout,
  IconMinus,
  IconPlus,
  IconTag,
  IconTrash,
  IconUser,
} from "../components/Icons";

type Tab = "overview" | "orders" | "inventory" | "coupons";

const statusTone: Record<OrderStatus, string> = {
  pending: "text-amber border-amber/60",
  processing: "text-wire border-wire/60",
  completed: "text-mint border-mint/60",
  refunded: "text-coral border-coral/60",
  cancelled: "text-faint border-line",
};

const channelTone: Record<string, string> = {
  android: "text-mint",
  web: "text-wire",
  ios: "text-faint",
};

export function Admin() {
  const [session, setSession] = useState<AdminSession | null>(() => gw.getSession());
  if (!session) return <Login onSuccess={setSession} />;
  return <Console session={session} onLogout={() => { gw.logout(); setSession(null); }} />;
}

/* ------------------------------------------------------------------ */
/*  login gate                                                         */
/* ------------------------------------------------------------------ */

function Login({ onSuccess }: { onSuccess: (s: AdminSession) => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await gw.login(email, pass);
      onSuccess(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setShake((x) => x + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl justify-center px-5 py-20 sm:px-8">
      <div key={shake} className={`corners w-full max-w-md border border-line bg-panel/80 ${shake ? "shake" : ""}`}>
        <div className="flex items-center justify-between border-b border-dashed border-line px-6 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-coral">restricted · /admin route group</span>
          <IconLock size={15} className="text-coral" />
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Admin console</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-dim">
            Guarded by session middleware in the real Next.js build — the middle API layer issues this JWT.
          </p>
          <label className="mb-1 mt-6 block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="admin@bridgework.dev"
            className="w-full border border-line bg-bg/40 px-3 py-2.5 font-mono text-[13px]"
          />
          <label className="mb-1 mt-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">password</label>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type="password"
            placeholder="••••••••••"
            className="w-full border border-line bg-bg/40 px-3 py-2.5 font-mono text-[13px]"
          />
          {error && <p className="mt-3 font-mono text-[11px] text-coral">✕ {error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 border border-amber bg-amber/10 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-amber transition-all hover:bg-amber/20 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "handshaking ···" : (<>authenticate <IconLock size={14} /></>)}
          </button>
          <button
            onClick={() => { setEmail(gw.demoCredentials.email); setPass(gw.demoCredentials.pass); }}
            className="mt-3 w-full cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em] text-faint transition-colors hover:text-wire"
          >
            ↳ fill demo credentials
          </button>
          <p className="mt-5 border-t border-dashed border-line pt-4 font-mono text-[10px] leading-relaxed text-faint">
            demo: {gw.demoCredentials.email} / {gw.demoCredentials.pass}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  console                                                            */
/* ------------------------------------------------------------------ */

function Console({ session, onLogout }: { session: AdminSession; onLogout: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [stockBusy, setStockBusy] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [savingPrice, setSavingPrice] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({ code: "", type: "percent" as "percent" | "fixed", value: "", min: "" });
  const [couponBusy, setCouponBusy] = useState(false);

  const refresh = async () => {
    const [o, p, c] = await Promise.all([gw.listOrders(), gw.listAllProducts(), gw.listCoupons()]);
    setOrders(o);
    setProducts(p);
    setCoupons(c);
    setLoading(false);
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const booked = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
    const revenue = booked.reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    const low = products.filter((p) => p.stock <= 8).length;
    const byChannel = (["android", "web", "ios"] as const).map((ch) => ({
      channel: ch,
      revenue: Math.round(booked.filter((o) => o.channel === ch).reduce((s, o) => s + o.total, 0)),
    }));
    return { revenue, pending, low, byChannel, aov: booked.length ? revenue / booked.length : 0 };
  }, [orders, products]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    setBusyOrder(id);
    try {
      await gw.updateOrderStatus(id, status);
      await refresh();
      toast(`Order → ${status}`, "mint");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "amber");
    } finally {
      setBusyOrder(null);
    }
  };

  const nudgeStock = async (id: string, delta: number) => {
    setStockBusy(id);
    try {
      await gw.adjustStock(id, delta);
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Stock update failed", "amber");
    } finally {
      setStockBusy(null);
    }
  };

  const savePrice = async (id: string) => {
    const v = parseFloat(priceDraft[id] ?? "");
    if (!Number.isFinite(v) || v <= 0) {
      toast("Enter a valid price", "amber");
      return;
    }
    setSavingPrice(id);
    try {
      await gw.setPrice(id, v);
      setPriceDraft((d) => { const n = { ...d }; delete n[id]; return n; });
      await refresh();
      toast(`Price → ${money(v)}`, "mint");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Price update failed", "amber");
    } finally {
      setSavingPrice(null);
    }
  };

  const flipActive = async (id: string, active: boolean) => {
    try {
      await gw.setActive(id, active);
      await refresh();
      toast(active ? "Product listed" : "Product hidden from storefront", "wire");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "amber");
    }
  };

  const addCoupon = async () => {
    setCouponBusy(true);
    try {
      const c = await gw.createCoupon(couponForm.code, couponForm.type, parseFloat(couponForm.value), parseFloat(couponForm.min || "0"));
      setCouponForm({ code: "", type: "percent", value: "", min: "" });
      await refresh();
      toast(`Coupon ${c.code} minted`, "mint");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Coupon failed", "amber");
    } finally {
      setCouponBusy(false);
    }
  };

  const visibleOrders = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  const chartColors: Record<string, string> = { android: "#55d69b", web: "#66bce3", ios: "#64798f" };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 pb-20">
      {/* console header */}
      <div className="sticky top-0 z-30 -mx-5 border-b border-line bg-bg/85 px-5 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex h-14 items-center gap-4">
          <span className="font-display text-[15px] font-extrabold tracking-tight">
            ADMIN<span className="text-amber">/</span>CONSOLE
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-faint md:block">
            route group (admin) · RBAC · session {session.email}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-mint sm:flex">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" /> JWT valid
            </span>
            <button
              onClick={onLogout}
              className="flex cursor-pointer items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:border-coral/60 hover:text-coral"
            >
              <IconLogout size={13} /> logout
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {(
            [
              ["overview", "overview", IconLayers],
              ["orders", `orders · ${orders.length}`, IconCart],
              ["inventory", `inventory · ${products.length}`, IconBox],
              ["coupons", `coupons · ${coupons.length}`, IconTag],
            ] as [Tab, string, (p: { size?: number; className?: string }) => React.ReactNode][]
          ).map(([t, label, Ico]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-200 active:scale-95 ${
                tab === t ? "border-amber/70 bg-amber/10 text-amber" : "border-line text-faint hover:border-faint hover:text-dim"
              }`}
            >
              <Ico size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse border border-line bg-panel/50" />
          ))}
        </div>
      ) : (
        <>
          {/* ---------------- overview ---------------- */}
          {tab === "overview" && (
            <div className="mt-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { k: "revenue (booked)", v: money(stats.revenue), tone: "text-mint", Ico: IconLayers },
                  { k: "orders", v: String(orders.length), tone: "text-ink", Ico: IconCart },
                  { k: "pending queue", v: String(stats.pending), tone: "text-amber", Ico: IconUser },
                  { k: "low-stock SKUs", v: String(stats.low), tone: "text-coral", Ico: IconBox },
                ].map(({ k, v, tone, Ico }, i) => (
                  <div key={k} className="group border border-line bg-panel/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-wire/40" style={{ transitionDelay: `${i * 40}ms` }}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">{k}</span>
                      <Ico size={15} className="text-line transition-colors group-hover:text-wire" />
                    </div>
                    <p className={`mt-3 font-display text-3xl font-extrabold tracking-tight ${tone}`}>{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="border border-line bg-panel/70 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[15px] font-bold">revenue by channel</h3>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">via middle API · per channel</span>
                  </div>
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.byChannel} barSize={52}>
                        <XAxis dataKey="channel" tick={{ fill: "#9fb4c8", fontFamily: "IBM Plex Mono", fontSize: 11 }} axisLine={{ stroke: "#22405c" }} tickLine={false} />
                        <YAxis tick={{ fill: "#64798f", fontFamily: "IBM Plex Mono", fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                        <Tooltip
                          cursor={{ fill: "rgba(102,188,227,0.06)" }}
                          contentStyle={{ background: "#0c1e31", border: "1px solid #22405c", fontFamily: "IBM Plex Mono", fontSize: 12 }}
                          labelStyle={{ color: "#e9f1f8", textTransform: "uppercase" }}
                          formatter={(v) => money(Number(v))}
                        />
                        <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                          {stats.byChannel.map((e) => (
                            <Cell key={e.channel} fill={chartColors[e.channel]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-faint">
                    AOV {money(stats.aov)} · ios channel opens in phase 5
                  </p>
                </div>

                <div className="border border-line bg-panel/70">
                  <div className="border-b border-dashed border-line px-5 py-3">
                    <h3 className="font-display text-[15px] font-bold">latest across the bridge</h3>
                  </div>
                  <ul>
                    {orders.slice(0, 6).map((o) => (
                      <li key={o.id} className="flex items-center gap-3 border-b border-linesoft px-5 py-2.5 font-mono text-[11px] transition-colors last:border-b-0 hover:bg-panel2">
                        <span className="text-wire">{o.number}</span>
                        <span className={`text-[9px] uppercase tracking-[0.16em] ${channelTone[o.channel]}`}>{o.channel}</span>
                        <span className="ml-auto text-dim">{money(o.total)}</span>
                        <span className={`border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] ${statusTone[o.status]}`}>{o.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- orders ---------------- */}
          {tab === "orders" && (
            <div className="mt-8">
              <div className="flex flex-wrap gap-2">
                {(["all", ...ORDER_STATUSES] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`cursor-pointer border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-all active:scale-95 ${
                      statusFilter === s ? "border-wire bg-wire/10 text-wire" : "border-line text-faint hover:border-faint hover:text-dim"
                    }`}
                  >
                    {s} {s !== "all" && `· ${orders.filter((o) => o.status === s).length}`}
                  </button>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto border border-line bg-panel/70">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                      <th className="px-4 py-3">order</th>
                      <th className="px-4 py-3">date</th>
                      <th className="px-4 py-3">customer</th>
                      <th className="px-4 py-3">channel</th>
                      <th className="px-4 py-3 text-right">items</th>
                      <th className="px-4 py-3 text-right">total</th>
                      <th className="px-4 py-3 text-right">status → sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((o) => (
                      <tr key={o.id} className="border-b border-linesoft font-mono text-[12px] transition-colors last:border-b-0 hover:bg-panel2">
                        <td className="px-4 py-3 text-wire">{o.number}</td>
                        <td className="px-4 py-3 text-faint">
                          {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{" "}
                          {new Date(o.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-ink">{o.customerName}</p>
                          <p className="text-[10px] text-faint">{o.customerEmail}</p>
                        </td>
                        <td className={`px-4 py-3 text-[10px] uppercase tracking-[0.16em] ${channelTone[o.channel]}`}>{o.channel}</td>
                        <td className="px-4 py-3 text-right text-dim">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                        <td className="px-4 py-3 text-right text-ink">
                          {money(o.total)}
                          {o.couponCode && <p className="text-[9px] uppercase text-mint">{o.couponCode}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={o.status}
                              disabled={busyOrder === o.id}
                              onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                              className={`cursor-pointer border bg-bg/60 px-2 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-opacity disabled:opacity-50 ${statusTone[o.status]}`}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s} className="text-ink">{s}</option>
                              ))}
                            </select>
                            {busyOrder === o.id && <span className="font-mono text-[10px] text-faint">sync···</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleOrders.length === 0 && (
                  <p className="p-8 text-center font-mono text-[12px] text-faint">no orders in this state.</p>
                )}
              </div>
              <p className="mt-3 font-mono text-[10px] text-faint">
                status changes sync back to WooCommerce through the gateway · cancelled / refunded orders restock automatically
              </p>
            </div>
          )}

          {/* ---------------- inventory ---------------- */}
          {tab === "inventory" && (
            <div className="mt-8 overflow-x-auto border border-line bg-panel/70">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                    <th className="px-4 py-3">sku</th>
                    <th className="px-4 py-3">product</th>
                    <th className="px-4 py-3">price (edit → sync)</th>
                    <th className="px-4 py-3 text-center">stock ±</th>
                    <th className="px-4 py-3 text-center">visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const draft = priceDraft[p.id] ?? "";
                    return (
                      <tr key={p.id} className={`border-b border-linesoft font-mono text-[12px] transition-colors last:border-b-0 hover:bg-panel2 ${!p.active ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3 text-wire">{p.sku}</td>
                        <td className="px-4 py-3">
                          <p className="font-sans text-[13px] font-semibold text-ink">{p.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-faint">{p.category}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-faint">$</span>
                            <input
                              value={draft === "" ? p.price.toFixed(2) : draft}
                              onChange={(e) => setPriceDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                              className="w-20 border border-line bg-bg/50 px-2 py-1 text-[12px] text-ink transition-colors focus:border-wire"
                            />
                            <button
                              onClick={() => savePrice(p.id)}
                              disabled={savingPrice === p.id || draft === ""}
                              className="cursor-pointer border border-mint/50 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-mint transition-all hover:bg-mint/10 active:scale-95 disabled:cursor-default disabled:opacity-30"
                            >
                              {savingPrice === p.id ? "···" : "sync"}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => nudgeStock(p.id, -1)} disabled={stockBusy === p.id} className="cursor-pointer border border-line p-1.5 text-faint transition-all hover:border-coral/60 hover:text-coral active:scale-90 disabled:opacity-40" aria-label="Decrease stock">
                              <IconMinus size={12} />
                            </button>
                            <span className={`w-10 text-center text-[13px] ${p.stock === 0 ? "text-coral" : p.stock <= 8 ? "text-amber" : "text-mint"}`}>
                              {stockBusy === p.id ? "··" : p.stock}
                            </span>
                            <button onClick={() => nudgeStock(p.id, +1)} disabled={stockBusy === p.id} className="cursor-pointer border border-line p-1.5 text-faint transition-all hover:border-mint/60 hover:text-mint active:scale-90 disabled:opacity-40" aria-label="Increase stock">
                              <IconPlus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => flipActive(p.id, !p.active)}
                            className={`cursor-pointer border px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] transition-all active:scale-95 ${
                              p.active ? "border-mint/60 text-mint hover:bg-mint/10" : "border-line text-faint hover:border-faint"
                            }`}
                          >
                            {p.active ? "listed" : "hidden"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="border-t border-dashed border-line px-4 py-3 font-mono text-[10px] text-faint">
                stock & price writes go gateway-first; WooCommerce stays the system of record.
              </p>
            </div>
          )}

          {/* ---------------- coupons ---------------- */}
          {tab === "coupons" && (
            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <div className="border border-line bg-panel/70 p-5">
                <h3 className="font-display text-[15px] font-bold">mint a coupon</h3>
                <label className="mb-1 mt-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">code</label>
                <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="RIDGELINE25" className="w-full border border-line bg-bg/40 px-3 py-2.5 font-mono text-[13px] tracking-[0.1em]" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">type</label>
                    <select value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as "percent" | "fixed" })} className="w-full cursor-pointer border border-line bg-bg/40 px-2 py-2.5 font-mono text-[11px] uppercase text-dim">
                      <option value="percent">percent</option>
                      <option value="fixed">fixed $</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{couponForm.type === "percent" ? "%" : "$"}</label>
                    <input value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })} placeholder={couponForm.type === "percent" ? "10" : "20"} className="w-full border border-line bg-bg/40 px-3 py-2.5 font-mono text-[13px]" />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">min $</label>
                    <input value={couponForm.min} onChange={(e) => setCouponForm({ ...couponForm, min: e.target.value })} placeholder="0" className="w-full border border-line bg-bg/40 px-3 py-2.5 font-mono text-[13px]" />
                  </div>
                </div>
                <button
                  onClick={addCoupon}
                  disabled={couponBusy}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 border border-mint bg-mint/10 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-mint transition-all hover:bg-mint/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {couponBusy ? "minting ···" : (<><IconTag size={14} /> create coupon</>)}
                </button>
              </div>

              <div className="border border-line bg-panel/70">
                <div className="border-b border-dashed border-line px-5 py-3">
                  <h3 className="font-display text-[15px] font-bold">live codes</h3>
                </div>
                <ul>
                  {coupons.map((c) => (
                    <li key={c.code} className={`flex items-center gap-4 border-b border-linesoft px-5 py-3 font-mono text-[12px] transition-colors last:border-b-0 hover:bg-panel2 ${!c.active ? "opacity-45" : ""}`}>
                      <span className="w-28 truncate text-amber">{c.code}</span>
                      <span className="text-dim">{c.type === "percent" ? `${c.value}% off` : `${money(c.value)} off`}</span>
                      {c.minSubtotal > 0 && <span className="hidden text-[10px] text-faint sm:block">min {money(c.minSubtotal)}</span>}
                      <span className="ml-auto text-[10px] text-faint">used ×{c.used}</span>
                      <button
                        onClick={async () => { await gw.toggleCoupon(c.code); await refresh(); toast(`${c.code} ${c.active ? "paused" : "activated"}`, "wire"); }}
                        className={`cursor-pointer border px-2 py-1 text-[9px] uppercase tracking-[0.14em] transition-all active:scale-95 ${c.active ? "border-mint/60 text-mint" : "border-line text-faint"}`}
                      >
                        {c.active ? "active" : "paused"}
                      </button>
                      <button
                        onClick={async () => { await gw.deleteCoupon(c.code); await refresh(); toast(`${c.code} revoked`, "amber"); }}
                        className="cursor-pointer text-faint transition-colors hover:text-coral"
                        aria-label={`Delete ${c.code}`}
                      >
                        <IconTrash size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-3 font-mono text-[10px] text-faint">
                  storefront validates codes against this list at checkout via the gateway.
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* console footer note */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
        <span className="flex items-center gap-2">
          <IconCheck size={12} className="text-mint" /> admin panel · apps/web route group
        </span>
        <span className="text-wire/70">writes: gateway → woocommerce sandbox (sim)</span>
      </div>
    </div>
  );
}
