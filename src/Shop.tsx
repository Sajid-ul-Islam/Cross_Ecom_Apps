import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  FEED,
  FEES,
  PRODUCTS,
  ZONES_INSIDE,
  ZONES_OUTSIDE,
  beforeCutoff,
  etaFor,
  fmt,
  fmtHMS,
  isInside,
  msToCutoff,
  productById,
  uid,
  type CartMap,
  type DeliveryMethod,
  type Order,
  type OrderItem,
} from "./data";
import { CutoffChip, Img, Reveal, useNow, useLS, useToast } from "./ui";
import { PaymentModal } from "./PaymentModal";
import {
  IcBolt,
  IcBox,
  IcCheck,
  IcChevron,
  IcMinus,
  IcPin,
  IcPlus,
  IcScooter,
  IcTrash,
  IcX,
} from "./icons";

/* ------------------------------ live board ------------------------------ */

const AGES = [0, 6, 13, 21, 30];

function LiveBoard() {
  const now = useNow(1000);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => i + 1), 3400);
    return () => clearInterval(t);
  }, []);
  void now;

  const rows = AGES.map((min, k) => ({
    key: `${idx}-${k}`,
    text: FEED[(idx + k) % FEED.length],
    ago: min === 0 ? "now" : `${min}m ago`,
    fresh: k === 0,
  }));

  const clock = new Date(now);
  const dhaka = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(clock);

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-ink bg-pine p-5 text-[#e9f2e2] shadow-[7px_7px_0_0_rgba(22,40,31,0.25)]">
      <div className="flex items-center justify-between gap-3">
        <p className="overline flex items-center gap-2 text-sun">
          <span className="h-2 w-2 rounded-full bg-tang pulse-dot" />
          Live dispatch
        </p>
        <p className="mono text-xs font-semibold opacity-80">{dhaka} DHK</p>
      </div>

      <ul className="mt-4 flex-1 space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.key}
            className={`${r.fresh ? "feed-in bg-pine2" : ""} flex items-baseline gap-3 rounded-md px-2.5 py-2`}
          >
            <span className={`mono shrink-0 text-[10px] font-semibold ${r.fresh ? "text-sun" : "opacity-55"}`}>
              {r.ago}
            </span>
            <span className={`text-[13px] font-semibold leading-snug ${r.fresh ? "" : "opacity-80"}`}>
              {r.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-4 border-t border-pine2 pt-4">
        {[
          ["14", "riders on shift"],
          ["3h 12m", "avg inside Dhaka"],
          ["208", "drops today"],
        ].map(([n, l]) => (
          <div key={l} className="min-w-0">
            <p className="mono text-lg font-bold text-sun leading-none">{n}</p>
            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wider opacity-60">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- dispatch band ---------------------------- */

function DispatchBoard({ onShop, onFees }: { onShop: () => void; onFees: () => void }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
      <div className="flex flex-col justify-center py-4 lg:py-8">
        <p className="overline text-moss">Dhaka dispatch desk · open Sat–Thu</p>
        <h1 className="font-display mt-4 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
          Order by <span className="mark-hl">12:00 noon</span>,<br />
          it&rsquo;s at your door tonight.
        </h1>
        <p className="mt-5 max-w-md text-[15px] font-medium leading-relaxed text-ink/75">
          BazarBox runs its own riders inside Dhaka. Prepay the delivery fee to
          jump the dispatch queue — or grab <b>same-day</b> for{" "}
          <b className="mono">{fmt(FEES.sameDay)}</b> on any order placed before
          the noon cutoff.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={onShop} className="btn btn-primary">
            Browse the shelf <IcChevron className="h-4 w-4 rotate-[-90deg]" />
          </button>
          <button onClick={onFees} className="btn btn-ghost">
            Delivery fees
          </button>
        </div>
        <div className="mt-6">
          <CutoffChip />
        </div>
      </div>
      <Reveal delay={120} className="min-h-[340px]">
        <LiveBoard />
      </Reveal>
    </section>
  );
}

/* ------------------------------ product card ------------------------------ */

function ProductCard({
  p,
  qty,
  onAdd,
  onSet,
}: {
  p: (typeof PRODUCTS)[number];
  qty: number;
  onAdd: () => void;
  onSet: (q: number) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border-2 border-line bg-card transition duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_rgba(12,59,46,0.2)]">
      <div className="relative aspect-square overflow-hidden">
        <Img
          src={p.img}
          alt={p.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
        />
        {p.tag && (
          <span className="mono absolute left-3 top-3 rounded-md border-2 border-ink bg-sun px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {p.tag}
          </span>
        )}
        {qty === 0 && (
          <button
            onClick={onAdd}
            className="btn btn-primary btn-sm absolute bottom-3 right-3 max-lg:opacity-100 max-lg:translate-y-0 opacity-0 translate-y-2 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <IcPlus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">{p.cat}</p>
        <h3 className="font-display mt-1 text-[17px] font-bold leading-snug">{p.name}</h3>
        <p className="mt-1 line-clamp-1 text-xs font-medium text-ink/60">{p.blurb}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="mono text-[15px] font-bold">{fmt(p.price)}</p>
          {qty === 0 ? (
            <button
              onClick={onAdd}
              className="rounded-lg border-2 border-ink bg-paper px-2.5 py-1.5 text-xs font-bold transition hover:bg-sun lg:opacity-0 lg:group-hover:opacity-100"
            >
              Add to bag
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border-2 border-ink bg-paper px-1 py-0.5">
              <button aria-label="Decrease" onClick={() => onSet(qty - 1)} className="rounded p-1 transition hover:bg-sun">
                <IcMinus className="h-3.5 w-3.5" />
              </button>
              <span className="mono w-6 text-center text-sm font-bold">{qty}</span>
              <button aria-label="Increase" onClick={() => onSet(qty + 1)} className="rounded p-1 transition hover:bg-sun">
                <IcPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* --------------------------------- shop --------------------------------- */

export function Shop({
  cart,
  setCart,
  addOrder,
  onFees,
  cartPing,
}: {
  cart: CartMap;
  setCart: Dispatch<SetStateAction<CartMap>>;
  addOrder: (o: Order) => void;
  onFees: () => void;
  cartPing: number;
}) {
  useNow(1000); // keeps the noon-cutoff state honest while checkout is open
  const toast = useToast();
  const shelfRef = useRef<HTMLDivElement>(null);

  const [filter, setFilter] = useState("All");
  const [drawer, setDrawer] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [customer, setCustomer] = useLS("bz.customer", { name: "", phone: "" });
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [area, setArea] = useState("");
  const [method, setMethod] = useState<DeliveryMethod>("standard");
  const [prepaid, setPrepaid] = useState(false);
  const [errs, setErrs] = useState<{ name?: string; phone?: string; area?: string }>({});
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (cartPing > 0) {
      setDrawer(true);
      setStep("cart");
    }
  }, [cartPing]);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ p: productById(id), qty }))
        .filter((l): l is { p: (typeof PRODUCTS)[number]; qty: number } => Boolean(l.p)),
    [cart],
  );
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);

  const cats = useMemo(() => ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.cat)))], []);
  const shown = filter === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === filter);

  const setQty = (id: string, q: number) =>
    setCart((c) => {
      const n = { ...c };
      if (q <= 0) delete n[id];
      else n[id] = q;
      return n;
    });

  /* ---- checkout derivation ---- */
  const inside = area ? isInside(area) : null;
  const cutoffOpen = beforeCutoff();
  const sdAvail = inside === true && cutoffOpen;
  const prepaidEff = method === "sameday" ? true : prepaid;
  const fee = !area ? 0 : method === "sameday" ? FEES.sameDay : inside ? FEES.stdIn : FEES.stdOut;
  const sdDisabled = !area || inside === false || !cutoffOpen;

  useEffect(() => {
    if (method === "sameday" && !sdAvail) setMethod("standard");
  }, [method, sdAvail]);

  const finalize = (prepaidVal: boolean, txn?: string) => {
    const items: OrderItem[] = lines.map((l) => ({
      id: l.p.id,
      name: l.p.name,
      price: l.p.price,
      qty: l.qty,
    }));
    const order: Order = {
      id: uid("BB"),
      placedAt: Date.now(),
      customer: name.trim(),
      phone,
      area: area!,
      inside: inside!,
      method,
      fee,
      prepaid: prepaidVal,
      txn,
      items,
      subtotal,
      total: subtotal + fee,
      status: "confirmed",
    };
    addOrder(order);
    setCustomer({ name: name.trim(), phone });
    setCart({});
    setDrawer(false);
    setStep("cart");
    setArea("");
    setMethod("standard");
    setPrepaid(false);
    toast(
      method === "sameday"
        ? `Order ${order.id} confirmed — arriving tonight (6–10 PM).`
        : prepaidVal
          ? `Order ${order.id} confirmed — priority dispatch, fee prepaid.`
          : `Order ${order.id} confirmed — cash on delivery.`,
    );
  };

  const tryPlace = () => {
    const e: typeof errs = {};
    if (name.trim().length < 2) e.name = "Tell us who receives the parcel.";
    if (!/^01[3-9]\d{8}$/.test(phone)) e.phone = "Valid BD number: 01XXXXXXXXX.";
    if (!area) e.area = "Pick a delivery area.";
    setErrs(e);
    if (Object.keys(e).length) return;
    if (prepaidEff) setPaying(true);
    else finalize(false);
  };

  const scrollToShelf = () =>
    shelfRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* -------------------------------- render -------------------------------- */

  return (
    <div>
      <DispatchBoard onShop={scrollToShelf} onFees={onFees} />

      {/* shelf */}
      <div ref={shelfRef} className="scroll-mt-32 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="overline text-moss">Fresh off the van</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">The shelf</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`mono rounded-lg border-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  filter === c
                    ? "border-ink bg-pine text-[#e9f2e2] shadow-[2px_2px_0_0_var(--color-ink)]"
                    : "border-line bg-card hover:border-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70}>
              <ProductCard
                p={p}
                qty={cart[p.id] ?? 0}
                onAdd={() => {
                  setQty(p.id, (cart[p.id] ?? 0) + 1);
                  toast(`${p.name} added to your bag.`, "info");
                }}
                onSet={(q) => setQty(p.id, q)}
              />
            </Reveal>
          ))}
        </div>
      </div>

      {/* floating bag button */}
      <button
        onClick={() => {
          setDrawer(true);
          setStep("cart");
        }}
        className="btn btn-sun fixed bottom-5 left-5 z-[60]"
        aria-label="Open bag"
      >
        <IcBox className="h-4.5 w-4.5" />
        Bag
        <span className="mono grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink bg-tang px-1 text-[11px] font-bold text-[#fdf6ee]">
          {count}
        </span>
      </button>

      {/* ------------------------- drawer ------------------------- */}
      {drawer && (
        <div className="fixed inset-0 z-[70]">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-ink/50"
            onClick={() => setDrawer(false)}
          />
          <aside className="anim-slidein absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l-2 border-ink bg-paper shadow-[-8px_0_30px_rgba(22,40,31,0.25)]">
            <header className="flex items-center justify-between border-b-2 border-ink bg-pine px-5 py-4 text-[#e9f2e2]">
              <div>
                <p className="overline text-sun">
                  {step === "cart" ? "Your bag" : "Delivery & payment"}
                </p>
                <p className="font-display text-xl font-bold">
                  {step === "cart" ? `${count} item${count === 1 ? "" : "s"}` : "Almost there"}
                </p>
              </div>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Close bag"
                className="rounded-lg border-2 border-[#e9f2e2]/30 p-2 transition hover:bg-pine2"
              >
                <IcX className="h-4 w-4" />
              </button>
            </header>

            {step === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  {lines.length === 0 ? (
                    <div className="mt-14 flex flex-col items-center text-center">
                      <span className="grid h-16 w-16 place-items-center rounded-xl border-2 border-ink bg-card text-moss">
                        <IcBox className="h-8 w-8" />
                      </span>
                      <p className="font-display mt-4 text-xl font-bold">Bag is empty</p>
                      <p className="mt-1 max-w-[240px] text-sm font-medium text-ink/60">
                        The shelf is full though — go grab something before the noon cutoff.
                      </p>
                      <button
                        onClick={() => {
                          setDrawer(false);
                          scrollToShelf();
                        }}
                        className="btn btn-ghost btn-sm mt-5"
                      >
                        Browse the shelf
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {lines.map((l) => (
                        <li
                          key={l.p.id}
                          className="flex gap-3 rounded-xl border-2 border-line bg-card p-3"
                        >
                          <Img src={l.p.img} alt={l.p.name} className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold leading-snug">{l.p.name}</p>
                              <button
                                aria-label="Remove"
                                onClick={() => setQty(l.p.id, 0)}
                                className="rounded p-1 text-ink/40 transition hover:bg-paper hover:text-err"
                              >
                                <IcTrash className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mono text-xs text-ink/55">{fmt(l.p.price)} each</p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1 rounded-lg border-2 border-ink bg-paper px-1 py-0.5">
                                <button aria-label="Decrease" onClick={() => setQty(l.p.id, l.qty - 1)} className="rounded p-1 transition hover:bg-sun">
                                  <IcMinus className="h-3.5 w-3.5" />
                                </button>
                                <span className="mono w-6 text-center text-sm font-bold">{l.qty}</span>
                                <button aria-label="Increase" onClick={() => setQty(l.p.id, l.qty + 1)} className="rounded p-1 transition hover:bg-sun">
                                  <IcPlus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="mono text-sm font-bold">{fmt(l.p.price * l.qty)}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {lines.length > 0 && (
                  <footer className="border-t-2 border-ink bg-card p-5">
                    <div className="mono flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink/60">Subtotal</span>
                      <span className="text-lg font-bold">{fmt(subtotal)}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-ink/50">
                      Delivery fee is calculated on the next step — from {fmt(FEES.stdIn)}.
                    </p>
                    <button onClick={() => setStep("checkout")} className="btn btn-primary mt-4 w-full">
                      Continue to delivery <IcChevron className="h-4 w-4 -rotate-90" />
                    </button>
                  </footer>
                )}
              </>
            )}

            {step === "checkout" && (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  <button
                    onClick={() => setStep("cart")}
                    className="mono text-xs font-bold uppercase tracking-wider text-moss transition hover:text-pine"
                  >
                    &larr; Back to bag
                  </button>

                  {/* contact */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="overline mb-1.5 block text-ink/60">Receiver name</label>
                      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nusrat Jahan" />
                      {errs.name && <p className="mt-1 text-xs font-bold text-err">{errs.name}</p>}
                    </div>
                    <div>
                      <label className="overline mb-1.5 block text-ink/60">Phone</label>
                      <input className="input mono" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="01XXXXXXXXX" maxLength={11} />
                      {errs.phone && <p className="mt-1 text-xs font-bold text-err">{errs.phone}</p>}
                    </div>
                    <div>
                      <label className="overline mb-1.5 block text-ink/60">Delivery area</label>
                      <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                        <option value="">Select your area…</option>
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
                      {errs.area && <p className="mt-1 text-xs font-bold text-err">{errs.area}</p>}
                      {area && (
                        <p className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold ${inside ? "text-moss" : "text-tang"}`}>
                          <IcPin className="h-3.5 w-3.5" />
                          {inside ? "Inside Dhaka zone" : "Outside Dhaka zone"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* delivery method */}
                  <p className="overline mt-6 mb-2 text-ink/60">Delivery method</p>
                  <div className="space-y-2.5">
                    <label
                      className={`relative block cursor-pointer rounded-xl border-2 p-4 transition ${
                        method === "standard"
                          ? "border-ink bg-card shadow-[4px_4px_0_0_var(--color-ink)]"
                          : "border-line bg-card hover:border-ink/40"
                      }`}
                    >
                      <input type="radio" className="sr-only" checked={method === "standard"} onChange={() => setMethod("standard")} />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-[15px] font-bold">Standard delivery</p>
                          <p className="mono mt-0.5 text-xs text-ink/55">
                            {area ? etaFor("standard", inside!) : "24–48h inside · 2–4 days outside"}
                          </p>
                        </div>
                        <p className="mono text-lg font-bold">
                          {area ? fmt(inside ? FEES.stdIn : FEES.stdOut) : "৳60+"}
                        </p>
                      </div>
                    </label>

                    <label
                      className={`relative block rounded-xl border-2 p-4 transition ${
                        sdDisabled
                          ? "cursor-not-allowed border-line bg-paper opacity-60"
                          : "cursor-pointer " + (method === "sameday" ? "border-ink bg-card shadow-[4px_4px_0_0_var(--color-ink)]" : "border-line bg-card hover:border-ink/40")
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={method === "sameday"}
                        disabled={sdDisabled}
                        onChange={() => {
                          setMethod("sameday");
                          setPrepaid(true);
                        }}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-display flex flex-wrap items-center gap-2 text-[15px] font-bold">
                            Same-day express
                            <span className="mono rounded border border-ink bg-sun px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                              Prepaid only
                            </span>
                          </p>
                          <p className="mono mt-0.5 text-xs text-ink/55">Tonight 6–10 PM · inside Dhaka · before 12:00 PM</p>
                          {!area && <p className="mt-1 text-xs font-bold text-ink/50">Select your area to check eligibility.</p>}
                          {area && inside === false && (
                            <p className="mt-1 text-xs font-bold text-tang">Inside Dhaka only — pick a standard slot instead.</p>
                          )}
                          {area && inside && !cutoffOpen && (
                            <p className="mt-1 text-xs font-bold text-tang">
                              Noon cutoff passed — reopens in <span className="mono">{fmtHMS(msToCutoff())}</span>
                            </p>
                          )}
                        </div>
                        <p className="mono text-lg font-bold">{fmt(FEES.sameDay)}</p>
                      </div>
                    </label>
                  </div>

                  {/* prepay toggle */}
                  <div className="mt-5">
                    <div
                      className={`flex items-center justify-between gap-3 rounded-xl border-2 p-4 transition ${
                        prepaidEff ? "border-ink bg-card shadow-[4px_4px_0_0_var(--color-ink)]" : "border-line bg-card"
                      }`}
                    >
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-bold">
                          <IcBolt className="h-4 w-4 text-tang" />
                          Advance the delivery fee online
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-ink/55">
                          Priority dispatch — a rider is assigned before packing even ends.
                          {method === "sameday" && " Required for same-day."}
                        </p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={prepaidEff}
                        aria-label="Prepay delivery fee"
                        disabled={method === "sameday"}
                        onClick={() => setPrepaid((v) => !v)}
                        className={`relative h-6.5 w-11.5 shrink-0 rounded-full border-2 border-ink transition ${
                          prepaidEff ? "bg-moss" : "bg-line"
                        } ${method === "sameday" ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`absolute top-[2px] h-4.5 w-4.5 rounded-full border border-ink bg-card transition-all ${
                            prepaidEff ? "left-[calc(100%-20px)]" : "left-[2px]"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* breakdown */}
                  <div className="mono mt-5 rounded-xl border-2 border-ink bg-card p-4 text-sm">
                    <div className="flex justify-between font-semibold text-ink/70">
                      <span>Subtotal</span>
                      <span>{fmt(subtotal)}</span>
                    </div>
                    <div className="mt-1.5 flex justify-between font-semibold text-ink/70">
                      <span className="flex items-center gap-2">
                        Delivery
                        {area && (
                          <span
                            className={`rounded border border-ink px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              prepaidEff ? "bg-sun" : "bg-paper"
                            }`}
                          >
                            {method === "sameday" ? "Same-day" : prepaidEff ? "Prepaid" : "COD"}
                          </span>
                        )}
                      </span>
                      <span>{area ? fmt(fee) : "—"}</span>
                    </div>
                    <div className="my-3 border-t-2 border-dashed border-line" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{area ? fmt(subtotal + fee) : fmt(subtotal)}</span>
                    </div>
                    <p className="mt-2 font-body text-xs font-semibold leading-snug text-ink/55">
                      {prepaidEff
                        ? "The delivery fee is paid online now — nothing extra at the door."
                        : `Pay ${area ? fmt(subtotal + fee) : "cash"} to the rider when the parcel arrives.`}
                    </p>
                  </div>
                </div>

                <footer className="border-t-2 border-ink bg-card p-5">
                  <button onClick={tryPlace} className="btn btn-primary w-full">
                    {prepaidEff
                      ? `Pay ${fmt(fee)} fee & place order`
                      : "Place order — cash on delivery"}
                  </button>
                  <p className="mono mt-2.5 text-center text-[10px] uppercase tracking-wider text-ink/45">
                    {prepaidEff ? "bKash · Nagad · Rocket · Card" : "Fee collected at your door"}
                  </p>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}

      {paying && (
        <PaymentModal
          amount={fee}
          label={`Advance delivery fee — ${area}`}
          onClose={() => setPaying(false)}
          onSuccess={(txn) => {
            setPaying(false);
            finalize(true, txn);
          }}
        />
      )}
    </div>
  );
}
