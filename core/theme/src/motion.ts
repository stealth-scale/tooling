/**
 * @fileoverview Names the motion every stealth theme shares: the animations a component
 * reaches for, and the keyframes they run.
 *
 * Motion says what kind of thing is happening, and that meaning does not change with a brand,
 * so a theme picks no animation of its own. Each animation is built from the `duration` and
 * `ease` steps rather than from a literal, so the whole vocabulary moves when those do.
 *
 * Each carries its fill mode, which is not decoration. An entrance without `backwards` shows
 * one frame at full opacity before it starts, and an exit without `forwards` snaps back to
 * visible the instant it ends. Both read as a blip rather than as motion.
 */

/**
 * Sets how far a control shrinks while it is held down. Far enough to answer the press, near
 * enough that the label does not visibly reflow.
 */
export const PRESS_SCALE = 0.98

/**
 * Sets what an element is held to when a person asks for reduced motion.
 *
 * `0.01ms` rather than `0s`: an animation still fires `animationstart` and `animationend`, so
 * a component that waits for one before it unmounts still completes instead of hanging open.
 */
export const STILL: readonly string[] = [
  'animation-delay: 0s !important',
  'animation-duration: 0.01ms !important',
  'animation-iteration-count: 1 !important',
  'transition-delay: 0s !important',
  'transition-duration: 0.01ms !important',
]

/**
 * Sets what a spinner is held to instead, because a frozen loading indicator reports that
 * nothing is happening. It keeps turning, slowly enough to read as calm.
 */
export const SPINNING: readonly string[] = [
  'animation-duration: 2s !important',
  'animation-iteration-count: infinite !important',
]

/**
 * Sets each animation, as the shorthand a `--animate-*` step holds: the keyframes it runs, how
 * long it takes, the curve it follows, and what it leaves behind.
 *
 * The four that repeat carry their own duration. A spinner reading the theme's `slow` would
 * change speed whenever somebody retuned how a dialog opens, so a loop states its own.
 */
export const ANIMATION: Readonly<Record<string, string>> = {
  'collapse-down': 'collapse-down var(--duration-normal) var(--ease-out) forwards',
  'collapse-up': 'collapse-up var(--duration-normal) var(--ease-in) forwards',
  'fade-in': 'fade-in var(--duration-normal) var(--ease-out) backwards',
  'fade-out': 'fade-out var(--duration-fast) var(--ease-in) forwards',
  ping: 'ping 1s var(--ease-out) infinite',
  pulse: 'pulse 2s var(--ease-in-out) infinite',
  shimmer: 'shimmer 1.6s linear infinite',
  'slide-in-from-bottom': 'slide-in-from-bottom var(--duration-normal) var(--ease-out) backwards',
  'slide-in-from-left': 'slide-in-from-left var(--duration-normal) var(--ease-out) backwards',
  'slide-in-from-right': 'slide-in-from-right var(--duration-normal) var(--ease-out) backwards',
  'slide-in-from-top': 'slide-in-from-top var(--duration-normal) var(--ease-out) backwards',
  'slide-out-to-bottom': 'slide-out-to-bottom var(--duration-fast) var(--ease-in) forwards',
  'slide-out-to-top': 'slide-out-to-top var(--duration-fast) var(--ease-in) forwards',
  spin: 'spin 1s linear infinite',
  'zoom-in': 'zoom-in var(--duration-normal) var(--ease-out) backwards',
  'zoom-out': 'zoom-out var(--duration-fast) var(--ease-in) forwards',
}

/**
 * Sets the keyframes each animation runs, as the declarations at each offset.
 *
 * A slide moves eight pixels, which is far enough to read as direction and near enough that
 * the eye does not track it as travel. A collapse reads its height from
 * `--collapsible-panel-height`, which the component measures and sets, because a keyframe
 * cannot animate to `auto`.
 */
export const KEYFRAMES: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  'collapse-down': {
    from: ['height: 0', 'opacity: 0'],
    to: ['height: var(--collapsible-panel-height, auto)', 'opacity: 1'],
  },
  'collapse-up': {
    from: ['height: var(--collapsible-panel-height, auto)', 'opacity: 1'],
    to: ['height: 0', 'opacity: 0'],
  },
  'fade-in': { from: ['opacity: 0'], to: ['opacity: 1'] },
  'fade-out': { from: ['opacity: 1'], to: ['opacity: 0'] },
  ping: { '75%, 100%': ['opacity: 0', 'transform: scale(2)'] },
  pulse: { '0%, 100%': ['opacity: 1'], '50%': ['opacity: 0.5'] },
  shimmer: { from: ['background-position: -200% 0'], to: ['background-position: 200% 0'] },
  'slide-in-from-bottom': {
    from: ['opacity: 0', 'transform: translateY(8px)'],
    to: ['opacity: 1', 'transform: translateY(0)'],
  },
  'slide-in-from-left': {
    from: ['opacity: 0', 'transform: translateX(-8px)'],
    to: ['opacity: 1', 'transform: translateX(0)'],
  },
  'slide-in-from-right': {
    from: ['opacity: 0', 'transform: translateX(8px)'],
    to: ['opacity: 1', 'transform: translateX(0)'],
  },
  'slide-in-from-top': {
    from: ['opacity: 0', 'transform: translateY(-8px)'],
    to: ['opacity: 1', 'transform: translateY(0)'],
  },
  'slide-out-to-bottom': {
    from: ['opacity: 1', 'transform: translateY(0)'],
    to: ['opacity: 0', 'transform: translateY(8px)'],
  },
  'slide-out-to-top': {
    from: ['opacity: 1', 'transform: translateY(0)'],
    to: ['opacity: 0', 'transform: translateY(-8px)'],
  },
  spin: { to: ['transform: rotate(360deg)'] },
  'zoom-in': {
    from: ['opacity: 0', 'transform: scale(0.95)'],
    to: ['opacity: 1', 'transform: scale(1)'],
  },
  'zoom-out': {
    from: ['opacity: 1', 'transform: scale(1)'],
    to: ['opacity: 0', 'transform: scale(0.95)'],
  },
}
