/* Hand-drawn inline icon set — stroke-based, inherits currentColor. */

type P = { className?: string };

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IcLogo = ({ className }: P) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" rx="7" fill="#0c3b2e" />
    <path d="M16 7l8 4.2v9.6L16 25l-8-4.2v-9.6z" fill="none" stroke="#ffc531" strokeWidth="2.2" />
    <path d="M8 11.2l8 4.2 8-4.2M16 15.4V25" stroke="#ffc531" strokeWidth="2.2" fill="none" />
    <circle cx="25" cy="7" r="3.4" fill="#f4581c" />
  </svg>
);

export const IcBox = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z" />
    <path d="M4 7.2l8 4.2 8-4.2M12 11.4V21" />
    <path d="M8 5.1l8 4.2" />
  </svg>
);

export const IcSwap = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M4 8.5h13M13.5 4.5l4 4-4 4" />
    <path d="M20 15.5H7M10.5 11.5l-4 4 4 4" />
  </svg>
);

export const IcScooter = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <circle cx="6" cy="17.5" r="2.6" />
    <circle cx="18" cy="17.5" r="2.6" />
    <path d="M8.6 17.5h5l1.6-6.4h-3" />
    <path d="M12.8 8.5h2.6l1.8 6.6M17.6 15.1l.6-1.9h2.3" />
    <path d="M2.5 13.5h2.4M2 10.5h2" />
  </svg>
);

export const IcClock = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.5V12l3.2 2" />
  </svg>
);

export const IcCamera = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M4 8.5h3l1.6-2.3h6.8L17 8.5h3v10H4z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);

export const IcUpload = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M12 15V4.5M7.5 8.5L12 4l4.5 4.5" />
    <path d="M4.5 15.5v4h15v-4" />
  </svg>
);

export const IcCheck = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

export const IcX = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IcPlus = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IcMinus = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M5 12h14" />
  </svg>
);

export const IcTrash = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M4.5 6.5h15M9.5 6V4.5h5V6M6.5 6.5l1 13h9l1-13" />
    <path d="M10 10.5v5.5M14 10.5v5.5" />
  </svg>
);

export const IcPin = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M12 21s-6.5-5.7-6.5-10.5a6.5 6.5 0 0113 0C18.5 15.3 12 21 12 21z" />
    <circle cx="12" cy="10.3" r="2.3" />
  </svg>
);

export const IcReceipt = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6L8.4 20 6 18.4z" transform="translate(0,-0.5)" />
    <path d="M9 8h6.5M9 11.5h6.5M9 15h4" />
  </svg>
);

export const IcChevron = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);

export const IcArrow = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M4 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export const IcBolt = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M13 3L5.5 13.5H11L9.5 21 18 10.5h-5.5z" />
  </svg>
);

export const IcShield = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M12 3.5l7 2.6v5.4c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6.1z" />
    <path d="M9 12l2.2 2.2L15.5 9.8" />
  </svg>
);

export const IcCard = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="M3.5 9.8h17M7 14.5h4" />
  </svg>
);

export const IcWallet = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5z" />
    <path d="M15 12h5v3.5h-5a1.75 1.75 0 010-3.5z" />
  </svg>
);

export const IcPhone = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <rect x="7.5" y="3.5" width="9" height="17" rx="2.5" />
    <path d="M10.5 18h3" />
  </svg>
);

export const IcInfo = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 11v5M12 7.8v.4" />
  </svg>
);

export const IcTruck = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M3 6.5h11v10H3zM14 10h4.2l2.8 3.2v3.3H14z" />
    <circle cx="7" cy="17.8" r="1.9" />
    <circle cx="17" cy="17.8" r="1.9" />
  </svg>
);

export const IcStar = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S} aria-hidden>
    <path d="M12 4l2.3 4.9 5.2.7-3.8 3.7.9 5.3L12 16l-4.6 2.6.9-5.3-3.8-3.7 5.2-.7z" />
  </svg>
);
