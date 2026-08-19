interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function base(props: IconProps) {
  return {
    width: props.size ?? 18,
    height: props.size ?? 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: props.strokeWidth ?? 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
    "aria-hidden": true,
  };
}

export const IconCompass = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 13.6 13.6 8.5 15.5l1.9-5.1z" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5c0 4.6 3 8.4 7 10 4-1.6 7-5.4 7-10V6z" />
    <path d="m9.2 12 2 2 3.6-4" />
  </svg>
);

export const IconLayers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5z" />
    <path d="m4 12.5 8 4.5 8-4.5" />
    <path d="m4 17 8 4.5 8-4.5" />
  </svg>
);

export const IconTerminal = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="15" />
    <path d="m7 9.5 3 2.7-3 2.7M12.5 15h4.5" />
  </svg>
);

export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="7" y="2.8" width="10" height="18.4" />
    <path d="M10.5 5.5h3M11 18.5h2" />
  </svg>
);

export const IconGlobe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.4 3.9 5.4 3.9 9S14.6 18.6 12 21c-2.6-2.4-3.9-5.4-3.9-9S9.4 5.4 12 3Z" />
  </svg>
);

export const IconCart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 4.5h2.2l2 11h10.6l2-8H6.3" />
    <circle cx="9.2" cy="19.4" r="1.4" />
    <circle cx="16.8" cy="19.4" r="1.4" />
  </svg>
);

export const IconBranch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="5.5" r="2" />
    <circle cx="6" cy="18.5" r="2" />
    <circle cx="18" cy="8" r="2" />
    <path d="M6 7.5v9M18 10c0 4-4.5 4.2-9.5 4.4" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.4 2" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12.8 4.4 4.4L19 7" />
  </svg>
);

export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="12" height="12" />
    <path d="M15.5 8.5v-5h-12v12h5" />
  </svg>
);

export const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 2.8h8l4 4v14.4H6z" />
    <path d="M14 2.8v4h4M9 12h6M9 15.5h6" />
  </svg>
);

export const IconFolder = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6.5V19h18V8.5h-8.5L10.5 6z" />
  </svg>
);

export const IconFlame = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3c1 3-3.5 4.6-3.5 8.5a3.5 3.5 0 0 0 7 0c0-1.6-.8-2.6-.8-2.6s3.3 1 3.3 4.6A6 6 0 0 1 6 13.5C6 8.5 12 7 12 3Z" />
  </svg>
);

export const IconRoute = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M8.2 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.6" />
  </svg>
);

export const IconLock = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5.5" y="10.5" width="13" height="10" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2.5" />
  </svg>
);

export const IconChip = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="7" y="7" width="10" height="10" />
    <path d="M10 2.8v4M14 2.8v4M10 17.2v4M14 17.2v4M2.8 10h4M2.8 14h4M17.2 10h4M17.2 14h4" />
  </svg>
);

export const IconArrow = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 3.5V8h-4.5" />
  </svg>
);

export const IconEye = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const IconMap = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 4-5.5 2v14L9 18l6 2 5.5-2V4L15 6z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5M10.5 18l-6-6 6-6" />
  </svg>
);

export const IconBag = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 8.2h12l-1 12H7z" />
    <path d="M9 8V6.8a3 3 0 0 1 6 0V8" />
  </svg>
);

export const IconSignal = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 18.5v-3M9.5 18.5v-6M14 18.5V8.5M18.5 18.5v-13" />
  </svg>
);

export const IconBattery = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="8.5" width="16" height="8" />
    <path d="M21 11v3" />
    <path d="M5.5 11v3h7.5v-3z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.4 15.4 5.1 5.1" />
  </svg>
);

export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13M10 10.5v5.5M14 10.5v5.5" />
  </svg>
);

export const IconMinus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 4.5H6.5v15H14M10.5 12H21M17.5 8l4 4-4 4" />
  </svg>
);

export const IconTag = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 12.5v-9h9l8 8.5-8.5 9z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);

export const IconBox = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 8 4v10l-8 4-8-4V7z" />
    <path d="M4 7l8 4 8-4M12 11v10" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.4-3.6 4.1-5.3 7.5-5.3s6.1 1.7 7.5 5.3" />
  </svg>
);
