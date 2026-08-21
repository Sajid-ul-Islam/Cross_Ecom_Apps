import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { beforeCutoff, fmtHMS, IMG_FALLBACK, msToCutoff } from "./data";
import { IcCheck, IcInfo, IcX } from "./icons";

/* ------------------------------ hooks ------------------------------ */

/** Re-renders on an interval — powers the live clocks. */
export function useNow(ms = 1000) {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setN(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return n;
}

export function useLS<T>(key: string, init: T | (() => T)) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* corrupted → fall through */
    }
    return typeof init === "function" ? (init as () => T)() : init;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* storage full/unavailable */
    }
  }, [key, v]);
  return [v, setV] as const;
}

/* --------------------------- scroll reveal --------------------------- */

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ------------------------------ toasts ------------------------------ */

type Kind = "ok" | "err" | "info";
type Toast = { id: number; msg: string; kind: Kind };

const ToastCtx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const push = (msg: string, kind: Kind = "ok") => {
    const id = idRef.current++;
    setList((l) => [...l.slice(-3), { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4000);
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[95] flex flex-col items-end gap-2">
        {list.map((t) => (
          <div
            key={t.id}
            className="anim-pop flex max-w-[330px] items-center gap-2.5 rounded-lg border-2 border-ink bg-pine py-2.5 pl-3 pr-2 text-[#e9f2e2] shadow-[5px_5px_0_0_rgba(22,40,31,0.35)]"
          >
            <span
              className={`shrink-0 ${t.kind === "ok" ? "text-sun" : t.kind === "err" ? "text-[#ff9d8a]" : "text-sun"}`}
            >
              {t.kind === "ok" ? (
                <IcCheck className="h-4.5 w-4.5" />
              ) : t.kind === "err" ? (
                <IcX className="h-4.5 w-4.5" />
              ) : (
                <IcInfo className="h-4.5 w-4.5" />
              )}
            </span>
            <p className="text-sm font-semibold leading-snug">{t.msg}</p>
            <button
              aria-label="Dismiss"
              onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}
              className="ml-1 shrink-0 rounded p-1 opacity-70 transition hover:bg-pine2 hover:opacity-100"
            >
              <IcX className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* --------------------------- small pieces --------------------------- */

export function CutoffChip({ dark = false }: { dark?: boolean }) {
  useNow(1000);
  const open = beforeCutoff();
  const left = fmtHMS(msToCutoff());
  return (
    <span
      className={`mono inline-flex items-center gap-2 rounded-md border-2 border-ink px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider ${
        dark ? "bg-pine2 text-[#e9f2e2]" : "bg-card text-ink"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${open ? "bg-moss pulse-dot" : "bg-tang"}`}
      />
      {open ? (
        <span>
          Same-day open · cutoff in <b className="text-sun">{left}</b>
        </span>
      ) : (
        <span>
          Cutoff passed · reopens in <b className="text-sun">{left}</b>
        </span>
      )}
    </span>
  );
}

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "moss" | "tang" | "sun" | "ink";
}) {
  const map = {
    moss: "bg-moss text-[#f2f7ec]",
    tang: "bg-tang text-[#fdf3ea]",
    sun: "bg-sun text-ink",
    ink: "bg-ink text-paper",
  } as const;
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 rounded-md border border-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${map[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export function Img({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(e) => {
        const t = e.currentTarget;
        if (t.src !== IMG_FALLBACK) t.src = IMG_FALLBACK;
      }}
    />
  );
}
