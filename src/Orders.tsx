import { Fragment } from "react";
import {
  STATUS_STEPS,
  etaFor,
  fmt,
  fmtDate,
  productById,
  statusIndex,
  type Order,
  type OrderStatus,
} from "./data";
import { Img, Reveal, StatusPill } from "./ui";
import { IcBolt, IcPin, IcScooter, IcSwap, IcTruck } from "./icons";

function toneFor(s: OrderStatus): "moss" | "tang" | "sun" | "ink" {
  if (s === "delivered") return "moss";
  if (s === "in-transit") return "tang";
  if (s === "packed") return "sun";
  return "ink";
}
const spineFor: Record<OrderStatus, string> = {
  delivered: "bg-moss",
  "in-transit": "bg-tang",
  packed: "bg-sun",
  confirmed: "bg-ink/40",
};

function Barcode({ text }: { text: string }) {
  let x = 0;
  const bars: { x: number; w: number }[] = [];
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    const w = (c % 3) + 1;
    bars.push({ x, w });
    x += w + ((c >> 2) % 2) + 1;
  }
  return (
    <div className="flex flex-col items-start">
      <svg viewBox={`0 0 ${x} 26`} className="h-6 w-36" preserveAspectRatio="none" aria-hidden>
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={26} fill="var(--color-ink)" />
        ))}
      </svg>
      <span className="mono mt-1 text-[9px] font-semibold tracking-[0.25em] text-ink/60">{text}</span>
    </div>
  );
}

function Timeline({ o }: { o: Order }) {
  const idx = statusIndex(o.status);
  return (
    <div className="flex items-start">
      {STATUS_STEPS.map((s, i) => (
        <Fragment key={s.key}>
          {i > 0 && (
            <span className={`mt-[5px] h-[3px] flex-1 rounded-full ${i <= idx ? "bg-moss" : "bg-line"}`} />
          )}
          <span className="flex w-14 flex-col items-center gap-1.5 sm:w-16">
            <span
              className={`h-3.5 w-3.5 rounded-full border-2 ${
                i < idx
                  ? "border-moss bg-moss"
                  : i === idx
                    ? "pulse-dot border-ink bg-sun"
                    : "border-line bg-card"
              }`}
            />
            <span
              className={`mono text-[8.5px] font-bold uppercase tracking-wide ${
                i <= idx ? "text-ink" : "text-ink/35"
              }`}
            >
              {s.label}
            </span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function OrderCard({ o, onExchange }: { o: Order; onExchange: (id: string) => void }) {
  return (
    <article className="relative overflow-hidden rounded-xl border-2 border-ink bg-card shadow-[5px_5px_0_0_rgba(12,59,46,0.15)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_rgba(12,59,46,0.22)]">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${spineFor[o.status]}`} />

      <header className="flex items-start justify-between gap-3 p-5 pb-3">
        <div>
          <p className="overline text-moss">Order</p>
          <p className="mono text-xl font-bold leading-tight">{o.id}</p>
          <p className="mt-0.5 text-xs font-semibold text-ink/55">
            {fmtDate(o.placedAt)} · {o.customer}
          </p>
        </div>
        <StatusPill
          label={STATUS_STEPS[statusIndex(o.status)].label}
          tone={toneFor(o.status)}
        />
      </header>

      <ul className="space-y-2.5 px-5">
        {o.items.map((it) => {
          const p = productById(it.id);
          return (
            <li key={it.id} className="flex items-center gap-3">
              {p ? (
                <Img src={p.img} alt={it.name} className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover" />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-paper text-ink/40">
                  <IcTruck className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{it.name}</p>
                <p className="mono text-[11px] text-ink/50">
                  {it.qty} × {fmt(it.price)}
                </p>
              </div>
              <p className="mono text-sm font-bold">{fmt(it.qty * it.price)}</p>
            </li>
          );
        })}
      </ul>

      {/* ticket tear */}
      <div className="relative my-4 px-5">
        <div className="border-t-2 border-dashed border-line" />
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border-2 border-ink bg-paper" />
        <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border-2 border-ink bg-paper" />
      </div>

      <div className="mono space-y-1.5 px-5 text-sm">
        <div className="flex justify-between font-semibold text-ink/65">
          <span>Subtotal</span>
          <span>{fmt(o.subtotal)}</span>
        </div>
        <div className="flex justify-between font-semibold text-ink/65">
          <span className="flex items-center gap-2">
            Delivery
            <span
              className={`rounded border border-ink px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                o.method === "sameday" ? "bg-sun" : o.prepaid ? "bg-moss text-[#f2f7ec]" : "bg-paper"
              }`}
            >
              {o.method === "sameday" ? "Same-day" : o.prepaid ? "Prepaid" : "COD"}
            </span>
          </span>
          <span>{fmt(o.fee)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{fmt(o.total)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 px-5 text-xs font-semibold text-ink/70">
        <p className="flex items-center gap-1.5">
          <IcPin className="h-3.5 w-3.5 shrink-0 text-moss" />
          {o.area} · {o.inside ? "inside" : "outside"} Dhaka
        </p>
        <p className="flex items-center gap-1.5">
          {o.method === "sameday" ? (
            <IcBolt className="h-3.5 w-3.5 shrink-0 text-tang" />
          ) : (
            <IcTruck className="h-3.5 w-3.5 shrink-0 text-moss" />
          )}
          {etaFor(o.method, o.inside)}
        </p>
        <p className="col-span-2 mono text-[10px] uppercase tracking-wider text-ink/45">
          {o.prepaid && o.txn
            ? `Delivery fee prepaid · ${o.txn}`
            : o.prepaid
              ? "Delivery fee prepaid"
              : "Cash on delivery — full total at the door"}
        </p>
      </div>

      <div className="mt-4 px-5">
        <Timeline o={o} />
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink bg-paper px-5 py-3.5">
        <Barcode text={o.id} />
        {o.status === "delivered" ? (
          <button onClick={() => onExchange(o.id)} className="btn btn-sun btn-sm">
            <IcSwap className="h-4 w-4" /> Request exchange
          </button>
        ) : (
          <span className="mono flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink/50">
            <IcScooter className="h-4 w-4" />
            Exchange unlocks after delivery
          </span>
        )}
      </footer>
    </article>
  );
}

export function Orders({
  orders,
  onExchange,
}: {
  orders: Order[];
  onExchange: (id: string) => void;
}) {
  return (
    <div className="pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="overline text-moss">Receipts on this device</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">My orders</h2>
        </div>
        <p className="mono rounded-lg border-2 border-ink bg-card px-3 py-2 text-xs font-bold">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border-2 border-dashed border-line bg-card/60 px-6 py-16 text-center">
          <IcTruck className="h-10 w-10 text-moss" />
          <p className="font-display mt-3 text-2xl font-bold">No parcels yet</p>
          <p className="mt-1 max-w-xs text-sm font-semibold text-ink/60">
            Place an order from the shelf and your receipts will land here —
            with live status and a barcode.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          {orders.map((o, i) => (
            <Reveal key={o.id} delay={(i % 2) * 90}>
              <OrderCard o={o} onExchange={onExchange} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
