/**
 * Motion Foundations --- React Native Animation Tokens
 *
 * Provides standardized duration tokens and spring configurations for mobile animations.
 */

export const motionTokens = {
  duration: {
    instant: 80,
    fast: 180,
    normal: 350,
    slow: 600,
  },
  easing: {
    // Bezier curves mapped for mobile
    standard: [0.2, 0, 0, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
  },
  scale: {
    press: 0.96,
    subtle: 0.98,
    pop: 1.04,
  },
} as const;

export const springPresets = {
  snappy: { tension: 120, friction: 14 },
  gentle: { tension: 80, friction: 10 },
  bouncy: { tension: 150, friction: 8 },
} as const;
