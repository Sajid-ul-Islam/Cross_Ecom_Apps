import { useEffect, useRef, useState } from "react";
import {
  FEES,
  REASONS,
  ZONES_INSIDE,
  ZONES_OUTSIDE,
  fmt,
  fmtDate,
  isInside,
  photoStore,
  timeAgo,
  uid,
  type Exchange,
  type Order,
} from "./data";
import { Reveal, StatusPill, useToast } from "./ui";
import { PaymentModal } from "./PaymentModal";
import {
  IcArrow,
  IcBolt,
  IcCamera,
  IcCheck,
  IcSwap,
  IcUpload,
  IcWallet,
  IcX,
} from "./icons";

const STEPS = ["The issue", "Evidence", "Pickup & fee"];

function exTone(s: Exchange["status"]): "moss" | "tang" | "sun" | "ink" {
  if (s === "swapped") return "moss";
  if (s === "in-review") return "sun";
  return "tang";
}
const exLabel: Record<Exchange["status"], string> = {
  "pickup-scheduled": "Pickup scheduled",
  "in-review": "In review",
  swapped: "Swapped",
};

export function ExchangeDesk({
  orders,
  exchanges,
  addExchange,
  presetOrderId,
  onPresetConsumed,
}: {
  orders: Order[];
  exchanges: Exchange[];
  addExchange: (e: Exchange) => void;
  presetOrderId: string | null;
  onPresetConsumed: () => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [area, setArea] = useState("");
  const [pay, setPay] = useState<"online" | "cash">("online");
  const [drag, setDrag] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<Exchange | null>(null);

  const eligible = orders.filter((o) => o.status === "delivered");
  const order = orders.find((o) => o.id === orderId) ?? null;

  const openWith = (id: string) => {
    const o = orders.find((x) => x.id === id);
    setOrderId(id);
    setArea(o?.area ?? "");
    setPicked([]);
    setReason("");
    setNote("");
    setPhotos([]);
    setPay("online");
    setStep(1);
    setDone(null);
    setOpen(true);
  };

  useEffect(() => {
    if (presetOrderId) {
      openWith(presetOrderId);
      onPresetConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetOrderId]);

  const reset = () => {
    setOpen(false);
    setDone(null);
    setOrderId("");
    setPicked([]);
    setReason("");
    setNote("");
    setPhotos([]);
    setStep(1);
  };

  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast("Only image files are accepted.", "err");
      return;
    }
    const room = 4 - photos.length;
    if (room <= 0) {
      toast("Up to 4 photos per request.", "err");
      return;
    }
    let added = 0;
    files.slice(0, room).forEach((f) => {
      if (f.size > 4 * 1024 * 1024) {
        toast(`${f.name} is over 4MB — skipped.`, "err");
        return;
      }
      added++;
      const r = new FileReader();
      r.onload = () =>
        setPhotos((p) =>
          p.length < 4 ? [...p, { name: f.name, url: String(r.result) }] : p,
        );
      r.readAsDataURL(f);
    });
    if (added > 0) toast(`${added} photo${added > 1 ? "s" : ""} attached.`, "info");
  };

  const inside = area ? isInside(area) : null;
  const fee = inside ? (inside ? FEES.exIn : FEES.exOut) : 0;

  const commit = (payMethod: "online" | "cash", txn?: string) => {
    if (!order) return;
    const items = picked.map((i) => ({
      name: order.items[i].name,
      qty: order.items[i].qty,
    }));
    const ex: Exchange = {
      id: uid("EX"),
      orderId: order.id,
      createdAt: Date.now(),
      items,
      reason,
      note: note.trim(),
      photos: photos.map((p) => p.name),
      area,
      inside: Boolean(inside),
      fee,
      payMethod,
      txn,
      status: "pickup-scheduled",
    };
    photoStore.set(ex.id, photos);
    addExchange(ex);
    setDone(ex);
    toast(
      payMethod === "online"
        ? `Exchange ${ex.id} requested — rider pickup within 24h.`
        : `Exchange ${ex.id} requested — ${fmt(ex.fee)} payable at pickup.`,
    );
  };

  const canNext1 = picked.length > 0 && reason !== "";
  const canNext2 = photos.length > 0;

  /* ------------------------------- render ------------------------------- */

  return (
    <div className="pt-8">
      <div className="max-w-2xl">
        <p className="overline text-moss">Exchange desk</p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Got the wrong thing? <span className="mark-hl">Swap it.</span>
        </h2>
        <p className="mt-3 text-[15px] font-medium leading-relaxed text-ink/70">
          Tell us which item arrived wrong and why, attach a photo of what you
          received, and we send a rider. One fee covers pickup and the
          replacement — <b className="mono">{fmt(FEES.exIn)}</b> inside Dhaka,{" "}
          <b className="mono">{fmt(FEES.exOut)}</b> outside.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ------------------------------ wizard ------------------------------ */}
        <Reveal>
          <div className="rounded-xl border-2 border-ink bg-card p-5 shadow-[6px_6px_0_0_rgba(12,59,46,0.15)] sm:p-6">
            {/* launcher */}
            {!open && !done && (
              <div>
                <p className="overline text-moss">New request · step 0</p>
                <h3 className="font-display mt-1 text-2xl font-bold">
                  Pick the delivered order
                </h3>
                {eligible.length === 0 ? (
                  <div className="mt-5 flex flex-col items-center rounded-lg border-2 border-dashed border-line px-4 py-10 text-center">
                    <IcSwap className="h-9 w-9 text-moss" />
                    <p className="mt-2 max-w-[260px] text-sm font-semibold text-ink/60">
                      Exchanges unlock once an order is delivered. Yours are
                      still on the road.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 space-y-2.5">
                      {eligible.map((o) => (
                        <label
                          key={o.id}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-4 transition ${
                            orderId === o.id
                              ? "border-ink bg-paper shadow-[3px_3px_0_0_var(--color-ink)]"
                              : "border-line bg-card hover:border-ink/50"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="radio"
                              className="sr-only"
                              checked={orderId === o.id}
                              onChange={() => {
                                setOrderId(o.id);
                                setArea(o.area);
                              }}
                            />
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                                orderId === o.id ? "border-ink bg-sun" : "border-line bg-card"
                              }`}
                            >
                              {orderId === o.id && <IcCheck className="h-3 w-3" />}
                            </span>
                            <span>
                              <span className="mono block text-sm font-bold">{o.id}</span>
                              <span className="block text-xs font-semibold text-ink/55">
                                {o.items.length} item{o.items.length > 1 ? "s" : ""} · {fmt(o.total)} · {o.area}
                              </span>
                            </span>
                          </span>
                          <span className="mono text-[10px] font-bold uppercase tracking-wider text-ink/45">
                            {fmtDate(o.placedAt)}
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      disabled={!orderId}
                      onClick={() => {
                        setStep(1);
                        setOpen(true);
                      }}
                      className="btn btn-primary mt-5 w-full"
                    >
                      Start exchange request <IcArrow className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* done */}
            {done && (
              <div className="anim-fadeup">
                <div className="flex flex-col items-center pt-2 text-center">
                  <span className="anim-pop grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-moss text-[#f2f7ec]">
                    <IcCheck className="h-8 w-8" />
                  </span>
                  <h3 className="font-display mt-4 text-2xl font-extrabold">Exchange requested</h3>
                  <p className="mono mt-1 rounded bg-paper px-2.5 py-1 text-sm font-bold">{done.id}</p>
                </div>
                <dl className="mono mt-6 space-y-2 rounded-xl border-2 border-ink bg-paper p-4 text-sm">
                  {[
                    ["Order", done.orderId],
                    ["Items", done.items.map((i) => `${i.qty} × ${i.name}`).join(", ")],
                    ["Issue", done.reason],
                    ["Evidence", `${done.photos.length} photo${done.photos.length > 1 ? "s" : ""} attached`],
                    ["Pickup zone", `${done.area} · ${done.inside ? "inside" : "outside"} Dhaka`],
                    [
                      "Fee",
                      `${fmt(done.fee)} · ${done.payMethod === "online" ? `paid online (${done.txn})` : "cash at pickup"}`,
                    ],
                    [
                      "Pickup window",
                      done.payMethod === "online" ? "Within 24 hours" : "Within 24–48 hours",
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="font-semibold uppercase text-[10px] tracking-wider text-ink/50 pt-0.5">{k}</dt>
                      <dd className="text-right font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <button onClick={reset} className="btn btn-ghost mt-5 w-full">
                  Back to the desk
                </button>
              </div>
            )}

            {/* wizard */}
            {open && !done && order && (
              <div>
                {/* progress */}
                <div className="flex items-center">
                  {STEPS.map((label, i) => {
                    const n = i + 1;
                    const state = n < step ? "done" : n === step ? "active" : "todo";
                    return (
                      <div key={label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                        <span className="flex flex-col items-center">
                          <span
                            className={`mono grid h-8 w-8 place-items-center rounded-lg border-2 text-sm font-bold ${
                              state === "done"
                                ? "border-ink bg-moss text-[#f2f7ec]"
                                : state === "active"
                                  ? "border-ink bg-sun"
                                  : "border-line bg-card text-ink/40"
                            }`}
                          >
                            {state === "done" ? <IcCheck className="h-4 w-4" /> : n}
                          </span>
                          <span
                            className={`mono mt-1.5 text-[9px] font-bold uppercase tracking-wider ${
                              state === "todo" ? "text-ink/40" : "text-ink"
                            }`}
                          >
                            {label}
                          </span>
                        </span>
                        {i < STEPS.length - 1 && (
                          <span
                            className={`mx-2 mb-5 h-[3px] flex-1 rounded-full ${
                              n < step ? "bg-moss" : "bg-line"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="mono mt-5 text-[11px] font-bold uppercase tracking-wider text-ink/50">
                  Order {order.id} · delivered to {order.area}
                </p>

                {/* STEP 1 */}
                {step === 1 && (
                  <div className="anim-fadeup mt-4">
                    <p className="text-sm font-bold">Which item(s) do you want to exchange?</p>
                    <div className="mt-2.5 space-y-2">
                      {order.items.map((it, i) => {
                        const on = picked.includes(i);
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              setPicked((p) => (on ? p.filter((x) => x !== i) : [...p, i]))
                            }
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 p-3.5 text-left transition ${
                              on
                                ? "border-ink bg-paper shadow-[3px_3px_0_0_var(--color-ink)]"
                                : "border-line bg-card hover:border-ink/50"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
                                  on ? "border-ink bg-moss text-[#f2f7ec]" : "border-line bg-card"
                                }`}
                              >
                                {on && <IcCheck className="h-3 w-3" />}
                              </span>
                              <span>
                                <span className="block text-sm font-bold">{it.name}</span>
                                <span className="mono block text-[11px] text-ink/50">
                                  {it.qty} × {fmt(it.price)}
                                </span>
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-5 text-sm font-bold">What went wrong?</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setReason(r)}
                          className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${
                            reason === r
                              ? "border-ink bg-pine text-[#e9f2e2] shadow-[2px_2px_0_0_var(--color-ink)]"
                              : "border-line bg-card hover:border-ink"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    <div className="mt-6 flex gap-2.5">
                      <button onClick={reset} className="btn btn-ghost">
                        Cancel
                      </button>
                      <button disabled={!canNext1} onClick={() => setStep(2)} className="btn btn-primary flex-1">
                        Next — attach evidence <IcArrow className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="anim-fadeup mt-4">
                    <p className="text-sm font-bold">
                      Show us what you received <span className="text-err">*</span>
                    </p>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                      }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDrag(false);
                        addFiles(e.dataTransfer.files);
                      }}
                      className={`mt-2.5 rounded-xl border-2 border-dashed p-6 text-center transition ${
                        drag ? "border-tang bg-sun/15" : "border-line bg-paper"
                      }`}
                    >
                      <IcUpload className={`mx-auto h-8 w-8 ${drag ? "text-tang" : "text-moss"}`} />
                      <p className="mt-2 text-sm font-bold">
                        Drag photos here, or{" "}
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="text-tang underline decoration-2 underline-offset-2 transition hover:text-tang2"
                        >
                          browse files
                        </button>
                      </p>
                      <p className="mono mt-1.5 text-[10px] uppercase tracking-wider text-ink/50">
                        1–4 photos · max 4MB each · previews stay in this session
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) addFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {photos.length > 0 && (
                      <>
                        <div className="mt-3 grid grid-cols-4 gap-2.5">
                          {photos.map((p, i) => (
                            <div key={i} className="anim-pop group relative">
                              <img
                                src={p.url}
                                alt={p.name}
                                className="h-20 w-full rounded-lg border-2 border-ink object-cover"
                              />
                              <button
                                aria-label={`Remove ${p.name}`}
                                onClick={() => setPhotos((ph) => ph.filter((_, x) => x !== i))}
                                className="absolute -right-2 -top-2 rounded-full border-2 border-ink bg-tang p-1 text-[#fdf6ee] transition hover:bg-tang2"
                              >
                                <IcX className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="mono mt-2 text-[11px] font-bold text-moss">
                          {photos.length}/4 photos attached <IcCheck className="inline h-3.5 w-3.5" />
                        </p>
                      </>
                    )}

                    <label className="mt-5 block text-sm font-bold">
                      What happened? <span className="font-semibold text-ink/45">(optional, helps approval)</span>
                    </label>
                    <textarea
                      className="input mt-2 min-h-[92px] resize-y"
                      maxLength={300}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. The left shoe stitching came loose after two days of light use…"
                    />
                    <p className="mono mt-1 text-right text-[10px] font-semibold text-ink/40">{note.length}/300</p>

                    <div className="mt-4 flex gap-2.5">
                      <button onClick={() => setStep(1)} className="btn btn-ghost">
                        Back
                      </button>
                      <button disabled={!canNext2} onClick={() => setStep(3)} className="btn btn-primary flex-1">
                        Next — pickup &amp; fee <IcArrow className="h-4 w-4" />
                      </button>
                    </div>
                    {!canNext2 && (
                      <p className="mt-2 text-center text-xs font-bold text-err">
                        Attach at least one photo of the issue to continue.
                      </p>
                    )}
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="anim-fadeup mt-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="mono rounded-md border border-line bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                        {picked.length} item{picked.length > 1 ? "s" : ""} · {reason}
                      </span>
                      <span className="mono rounded-md border border-line bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                        {photos.length} photo{photos.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <p className="mt-5 text-sm font-bold">Where should the rider pick up?</p>
                    <select className="input mt-2" value={area} onChange={(e) => setArea(e.target.value)}>
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

                    {inside !== null && (
                      <div className="anim-fadeup mono mt-3.5 flex items-center justify-between rounded-xl border-2 border-ink bg-paper px-4 py-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/55">
                          Exchange delivery · {inside ? "inside" : "outside"} Dhaka
                        </span>
                        <span className="text-2xl font-bold text-tang">{fmt(fee)}</span>
                      </div>
                    )}

                    <p className="mt-5 text-sm font-bold">How do you want to pay the fee?</p>
                    <div className="mt-2.5 space-y-2.5">
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                          pay === "online"
                            ? "border-ink bg-card shadow-[3px_3px_0_0_var(--color-ink)]"
                            : "border-line bg-card hover:border-ink/50"
                        }`}
                      >
                        <input type="radio" className="sr-only" checked={pay === "online"} onChange={() => setPay("online")} />
                        <IcBolt className={`mt-0.5 h-5 w-5 shrink-0 ${pay === "online" ? "text-tang" : "text-ink/30"}`} />
                        <span>
                          <span className="flex flex-wrap items-center gap-2 text-sm font-bold">
                            Pay online now
                            <span className="mono rounded border border-ink bg-sun px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                              Recommended
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs font-semibold text-ink/55">
                            Rider pickup within 24h · bKash, Nagad, Rocket or card.
                          </span>
                        </span>
                      </label>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                          pay === "cash"
                            ? "border-ink bg-card shadow-[3px_3px_0_0_var(--color-ink)]"
                            : "border-line bg-card hover:border-ink/50"
                        }`}
                      >
                        <input type="radio" className="sr-only" checked={pay === "cash"} onChange={() => setPay("cash")} />
                        <IcWallet className={`mt-0.5 h-5 w-5 shrink-0 ${pay === "cash" ? "text-tang" : "text-ink/30"}`} />
                        <span>
                          <span className="block text-sm font-bold">Cash to the rider at pickup</span>
                          <span className="mt-0.5 block text-xs font-semibold text-ink/55">
                            Pickup within 24–48h · keep {fmt(fee)} ready.
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="mt-6 flex gap-2.5">
                      <button onClick={() => setStep(2)} className="btn btn-ghost">
                        Back
                      </button>
                      {pay === "online" ? (
                        <button onClick={() => setPaying(true)} className="btn btn-primary flex-1">
                          Pay {fmt(fee)} &amp; request exchange
                        </button>
                      ) : (
                        <button onClick={() => commit("cash")} className="btn btn-primary flex-1">
                          Request exchange — pay at pickup
                        </button>
                      )}
                    </div>
                    <p className="mono mt-2.5 text-center text-[10px] uppercase tracking-wider text-ink/45">
                      One fee covers pickup + replacement delivery
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Reveal>

        {/* ------------------------------ list ------------------------------ */}
        <div className="space-y-4">
          <Reveal delay={100}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-extrabold">Your requests</h3>
              <span className="mono rounded-lg border-2 border-ink bg-card px-2.5 py-1 text-xs font-bold">
                {exchanges.length}
              </span>
            </div>
          </Reveal>

          {exchanges.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-line bg-card/60 px-5 py-10 text-center">
              <IcSwap className="mx-auto h-9 w-9 text-moss" />
              <p className="mt-2 text-sm font-bold">No exchange requests yet</p>
              <p className="mx-auto mt-1 max-w-[250px] text-xs font-semibold text-ink/55">
                Delivered orders can be swapped within 7 days — photo of the issue required.
              </p>
            </div>
          )}

          {exchanges.map((ex, i) => {
            const shots = photoStore.get(ex.id) ?? [];
            return (
              <Reveal key={ex.id} delay={i * 70}>
                <article className="rounded-xl border-2 border-line bg-card p-4 transition hover:border-ink hover:shadow-[4px_4px_0_0_rgba(12,59,46,0.18)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="mono text-base font-bold">{ex.id}</p>
                    <StatusPill label={exLabel[ex.status]} tone={exTone(ex.status)} />
                  </div>
                  <p className="mono mt-0.5 text-[11px] font-semibold text-ink/50">
                    Order {ex.orderId} · {timeAgo(ex.createdAt)}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="mono rounded-md border border-line bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                      {ex.reason}
                    </span>
                    <span className="mono rounded-md border border-line bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                      {ex.items.map((it) => `${it.qty} × ${it.name}`).join(", ")}
                    </span>
                  </div>
                  {shots.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {shots.slice(0, 4).map((s, k) => (
                        <img
                          key={k}
                          src={s.url}
                          alt={s.name}
                          className="h-10 w-10 rounded-md border-2 border-ink object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mono mt-3 flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-ink/60">
                      <IcCamera className="h-3.5 w-3.5" />
                      {ex.photos.length} photo{ex.photos.length > 1 ? "s" : ""} · {ex.area}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {fmt(ex.fee)}
                      <span
                        className={`rounded border border-ink px-1.5 py-0.5 text-[9px] uppercase ${
                          ex.payMethod === "online" ? "bg-sun" : "bg-paper"
                        }`}
                      >
                        {ex.payMethod === "online" ? "Paid online" : "Cash"}
                      </span>
                    </span>
                  </div>
                  {ex.note && (
                    <p className="mt-2.5 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-medium italic text-ink/65">
                      “{ex.note}”
                    </p>
                  )}
                </article>
              </Reveal>
            );
          })}

          {/* policy */}
          <Reveal delay={150}>
            <aside className="rounded-xl border-2 border-ink bg-pine p-5 text-[#e9f2e2] shadow-[6px_6px_0_0_rgba(22,40,31,0.25)]">
              <p className="overline text-sun">Exchange policy, minus the fine print</p>
              <ul className="mt-3.5 space-y-2.5">
                {[
                  "7-day window from the delivery date.",
                  "A photo of the issue is mandatory — it fast-tracks approval.",
                  "The fee covers pickup AND re-delivery of the replacement.",
                  "Paid online → rider arrives within 24h. Cash → 24–48h.",
                  "Replacement out of stock → full refund within 48h.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[13px] font-semibold leading-snug">
                    <IcCheck className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
                    {t}
                  </li>
                ))}
              </ul>
            </aside>
          </Reveal>
        </div>
      </div>

      {paying && (
        <PaymentModal
          amount={fee}
          label={`Exchange fee — ${area}`}
          onClose={() => setPaying(false)}
          onSuccess={(txn) => {
            setPaying(false);
            commit("online", txn);
          }}
        />
      )}
    </div>
  );
}
