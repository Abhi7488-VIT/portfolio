/**
 * motion.ts: the one motion system for the whole site.
 *
 * Every animation (GSAP, Framer Motion, CSS) reads its easing, duration and spring from here.
 * CSS mirrors these values as custom properties in styles/tokens.css (--ease-*, --t-*), so a hover
 * in CSS and a tween in GSAP feel identical. Change a value here AND in tokens.css.
 *
 * Feel: entrances decelerate hard (expo-out), interactions settle on a short, damped spring,
 * nothing overshoots on UI state.
 */

/** Cubic-bezier control points. */
export const ease = {
  /** Expo out: reveals of 800ms+, line rises, clip-path openings. The signature curve. */
  expo: [0.16, 1, 0.3, 1] as const,
  /** Quint out: UI entrances and moving hovers under 600ms. */
  out: [0.22, 1, 0.36, 1] as const,
  /** Quart in-out: wipes, panels, things that travel while visible. */
  inOut: [0.76, 0, 0.24, 1] as const,
  /** Ease-in for something leaving for good, kept short. */
  exit: [0.55, 0.055, 0.675, 0.19] as const,
}

/** GSAP CustomEase names, registered once in lib/gsap.ts from the same control points. */
export const gsapEase = {
  expo: 'ak-expo',
  out: 'ak-out',
  inOut: 'ak-inout',
  exit: 'ak-exit',
} as const

/** Durations in seconds (GSAP and Framer Motion both take seconds). */
export const dur = {
  press: 0.14,
  hover: 0.18,
  ui: 0.24,
  panel: 0.42,
  reveal: 0.8,
  open: 1.2,
} as const

/** Stagger steps in seconds. */
export const stagger = {
  char: 0.022,
  item: 0.07,
  line: 0.09,
} as const

/** Framer Motion springs. Critically damped or close to it: no visible bounce. */
export const spring = {
  /** Buttons, toggles, chips. Quick and firm. */
  press: { type: 'spring', stiffness: 520, damping: 36, mass: 0.6 },
  /** Panels, palette, chat widget. */
  ui: { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 },
  /** Magnetic pull and tilt. Soft, slightly lazy. */
  magnetic: { type: 'spring', stiffness: 180, damping: 18, mass: 0.5 },
  /** Cursor ring following the pointer. */
  cursor: { type: 'spring', stiffness: 700, damping: 48, mass: 0.4 },
} as const

/** Framer Motion transition presets. */
export const transition = {
  reveal: { duration: dur.reveal, ease: ease.expo },
  ui: { duration: dur.ui, ease: ease.out },
  exit: { duration: dur.ui * 0.65, ease: ease.exit },
} as const

/** Distances (px) used by entrances so every section rises the same amount. */
export const distance = {
  rise: 24,
  riseSmall: 12,
} as const

/** Page-load budget. The boot sequence must hand over within this many ms. */
export const LOAD_BUDGET_MS = 1500
