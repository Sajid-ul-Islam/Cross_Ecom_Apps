import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReveal } from "../hooks";
import { IconCheck, IconX } from "./Icons";

/* ---------------- toast ---------------- */

interface Toast {
  id: number;
  msg: string;
  tone: "mint" | "wire" | "amber" | "coral";
}

const ToastCtx = createContext<(msg: string, tone?: Toast["tone"]) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((msg: string, tone: Toast["tone"] = "mint") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const toneRing: Record<Toast["tone"], string> = {
    mint: "border-mint/60 text-mint",
    wire: "border-wire/60 text-wire",
    amber: "border-amber/60 text-amber",
    coral: "border-coral/60 text-coral",
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`tick-in flex items-center gap-2.5 border bg-panel/95 px-4 py-2.5 font-mono text-[12px] tracking-wide shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${toneRing[t.tone]}`}
          >
            <IconCheck size={14} />
            <span className="text-ink">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- reveal wrapper ---------------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------- section shell ---------------- */

export function SectionShell({
  id,
  sheet,
  kicker,
  title,
  intro,
  children,
}: {
  id: string;
  sheet: string;
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-24 mx-auto w-full max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
      <Reveal>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-wire uppercase flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-wire/70" />
              {sheet} · {kicker}
            </p>
            <h2 className="mt-3 font-display font-extrabold text-3xl sm:text-[2.6rem] leading-[1.05] tracking-tight">
              {title}
            </h2>
          </div>
          <div className="font-mono text-[11px] text-faint tracking-widest">{sheet}</div>
        </div>
        <p className="mt-4 max-w-2xl text-dim text-[15px] leading-relaxed">{intro}</p>
        <div className="mt-6 border-t border-dashed border-line" />
      </Reveal>
      <div className="mt-10">{children}</div>
    </section>
  );
}

/* ---------------- stamp ---------------- */

const stampTones: Record<string, string> = {
  mint: "text-mint border-mint/70",
  amber: "text-amber border-amber/70",
  wire: "text-wire border-wire/70",
  coral: "text-coral border-coral/70",
  dim: "text-dim border-faint/60",
};

export function Stamp({
  tone = "wire",
  children,
  pop = false,
  className = "",
}: {
  tone?: string;
  children: ReactNode;
  pop?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-block -rotate-2 border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${
        stampTones[tone] ?? stampTones.wire
      } ${pop ? "stamp-pop" : ""} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------- progress bar ---------------- */

export function Bar({
  value,
  tone = "mint",
  height = "h-[7px]",
}: {
  value: number;
  tone?: "mint" | "amber" | "wire" | "coral";
  height?: string;
}) {
  const toneBg: Record<string, string> = {
    mint: "bg-mint",
    amber: "bg-amber",
    wire: "bg-wire",
    coral: "bg-coral",
  };
  return (
    <div className={`w-full ${height} border border-line bg-bg/60`}>
      <div
        className={`bar-fill h-full ${toneBg[tone]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------------- status chip (task cycler) ---------------- */

export function StatusChip({
  status,
  onClick,
  title,
}: {
  status: "todo" | "active" | "done";
  onClick: () => void;
  title: string;
}) {
  const map = {
    todo: { label: "PENDING", cls: "border-line text-faint hover:border-faint hover:text-dim" },
    active: { label: "IN PROGRESS", cls: "border-amber/70 text-amber bg-amber/5 hover:bg-amber/10" },
    done: { label: "DONE", cls: "border-mint/70 text-mint bg-mint/5 hover:bg-mint/10" },
  } as const;
  const m = map[status];
  return (
    <button
      onClick={onClick}
      title={title}
      className={`shrink-0 cursor-pointer border px-2 py-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 active:scale-95 ${m.cls}`}
    >
      {status === "done" && <IconCheck size={10} className="mr-1 inline -mt-px" />}
      {m.label}
    </button>
  );
}

/* ---------------- modal ---------------- */

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-5 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="corners tick-in w-full max-w-md border border-line bg-panel p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display font-bold text-xl">{title}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-faint transition-colors hover:text-ink"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-dim">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-dim transition-colors hover:border-faint hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer border border-coral/70 bg-coral/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral transition-all hover:bg-coral/20 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
