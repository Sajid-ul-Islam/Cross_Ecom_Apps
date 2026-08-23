import { useEffect, useRef, useState } from "react";
import { fmt, txnId } from "./data";
import { IcBolt, IcCheck, IcX } from "./icons";

const METHODS = [
  { id: "bkash", name: "bKash", color: "#d12053", hint: "01XXXXXXXXX" },
  { id: "nagad", name: "Nagad", color: "#f6921e", hint: "01XXXXXXXXX" },
  { id: "rocket", name: "Rocket", color: "#8c3494", hint: "01XXXXXXXXX" },
  { id: "card", name: "Card", color: "#235789", hint: "16-digit card number" },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

export function PaymentModal({
  amount,
  label,
  onClose,
  onSuccess,
}: {
  amount: number;
  label: string;
  onClose: () => void;
  onSuccess: (txn: string) => void;
}) {
  const [method, setMethod] = useState<MethodId>("bkash");
  const [num, setNum] = useState("");
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");
  const [err, setErr] = useState("");
  const [txn, setTxn] = useState("");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage === "form") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, onClose]);

  const m = METHODS.find((x) => x.id === method)!;

  const pay = () => {
    const digits = num.replace(/\D/g, "");
    if (method === "card") {
      if (digits.length !== 16) return setErr("Card number must be 16 digits.");
    } else if (!/^01[3-9]\d{8}$/.test(digits)) {
      return setErr("Enter a valid 11-digit wallet number (01XXXXXXXXX).");
    }
    setErr("");
    setStage("processing");
    timers.current.push(
      window.setTimeout(() => {
        const t = txnId();
        setTxn(t);
        setStage("done");
        timers.current.push(window.setTimeout(() => onSuccess(t), 1100));
      }, 1500),
    );
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-ink/60 p-4" role="dialog" aria-modal>
      <div
        className="anim-pop relative mx-auto mt-[10vh] w-full max-w-sm overflow-hidden rounded-xl border-2 border-ink bg-card shadow-[8px_8px_0_0_rgba(22,40,31,0.35)]"
      >
        <div
          className="flex items-center justify-between px-5 py-4 text-[#fdf6ee]"
          style={{ background: m.color }}
        >
          <div>
            <p className="overline opacity-80">Secure payment</p>
            <p className="font-display text-lg font-bold leading-tight">{label}</p>
          </div>
          <p className="mono text-2xl font-bold">{fmt(amount)}</p>
        </div>

        {stage === "form" && (
          <div className="p-5">
            <p className="overline mb-2 text-ink/60">Pay with</p>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map((mm) => (
                <button
                  key={mm.id}
                  onClick={() => {
                    setMethod(mm.id);
                    setErr("");
                  }}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 px-1 py-2.5 transition ${
                    method === mm.id
                      ? "border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]"
                      : "border-line bg-card hover:border-ink/50"
                  }`}
                >
                  <span
                    className="mono grid h-7 w-7 place-items-center rounded-md text-[11px] font-bold text-[#fdf6ee]"
                    style={{ background: mm.color }}
                  >
                    {mm.name[0]}
                  </span>
                  <span className="text-[11px] font-bold">{mm.name}</span>
                </button>
              ))}
            </div>

            <label className="overline mt-4 mb-1.5 block text-ink/60">
              {method === "card" ? "Card number" : "Wallet number"}
            </label>
            <input
              className="input mono"
              inputMode="numeric"
              placeholder={m.hint}
              maxLength={method === "card" ? 19 : 11}
              value={num}
              onChange={(e) => setNum(e.target.value.replace(/[^\d]/g, ""))}
            />
            {err && <p className="mt-1.5 text-xs font-bold text-err">{err}</p>}

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-paper px-3 py-2.5">
              <IcBolt className="mt-0.5 h-4 w-4 shrink-0 text-tang" />
              <p className="text-xs font-semibold leading-snug text-ink/80">
                Paying the delivery fee in advance bumps your parcel to the
                priority dispatch queue.
              </p>
            </div>

            <button onClick={pay} className="btn btn-primary mt-4 w-full">
              Pay {fmt(amount)}
            </button>
            <button
              onClick={onClose}
              className="mt-2.5 w-full text-center text-sm font-bold text-ink/60 transition hover:text-err"
            >
              Cancel payment
            </button>
          </div>
        )}

        {stage === "processing" && (
          <div className="flex flex-col items-center px-5 py-10">
            <span
              className="spin h-11 w-11 rounded-full border-4 border-line"
              style={{ borderTopColor: m.color }}
            />
            <p className="mono mt-4 text-sm font-semibold">
              Talking to {m.name} gateway<span className="blink">…</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-ink/55">
              Do not close this window
            </p>
          </div>
        )}

        {stage === "done" && (
          <div className="flex flex-col items-center px-5 py-9">
            <span className="anim-pop grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-moss text-[#f2f7ec]">
              <IcCheck className="h-7 w-7" />
            </span>
            <p className="font-display mt-3 text-xl font-bold">Payment received</p>
            <p className="mono mt-1 rounded bg-paper px-2 py-1 text-xs font-semibold text-ink/70">
              {txn}
            </p>
            <p className="mono mt-3 text-[11px] uppercase tracking-wider text-ink/50">
              Closing<span className="blink">…</span>
            </p>
          </div>
        )}

        {stage === "form" && (
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 rounded p-1 text-[#fdf6ee]/70 transition hover:bg-ink/20 hover:text-[#fdf6ee]"
          >
            <IcX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
