/**
 * Motion Foundations --- Shared Tokens and Springs
 * Rule 1: Use motion/react standard specifications.
 * Rule 2: Keep spring presets centralized.
 * Rule 3: Support reduced motion overrides.
 */

export const motionTokens = {
  duration: {
    instant: 0.08,
    fast: 0.18,
    normal: 0.35,
    slow: 0.6,
    crawl: 1.0,
  },
  easing: {
    smooth: [0.22, 1, 0.36, 1],
    sharp: [0.4, 0, 0.2, 1],
    bounce: [0.34, 1.56, 0.64, 1],
    linear: [0, 0, 1, 1],
  },
  distance: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 48,
  },
  scale: {
    subtle: 0.98,
    press: 0.95,
    pop: 1.04,
  },
} as const;

export const springs = {
  snappy: { stiffness: 300, damping: 30 },
  gentle: { stiffness: 120, damping: 14 },
  bouncy: { stiffness: 400, damping: 10 },
  instant: { stiffness: 600, damping: 35 },
  release: { stiffness: 200, damping: 20, restDelta: 0.001 },
} as const;

/**
 * Client-side helper to determine if reduced motion is requested.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
