/**
 * @fileoverview Writes the stylesheets a theme ships that no palette computes: the font files
 * it loads, the framework it runs on, the base layer that reads its tokens, the densities the
 * document draws with, the keyframes every animation runs, and the file an app links. Only the
 * densities differ between themes; the rest are the same whatever a recipe solves to, and none
 * of them is a decision a theme author makes, which is why every one is generated.
 */

import { densityBlocks, densityDefaults, HEADER, rule } from '#css.ts'
import { KEYFRAMES, SPINNING, STILL } from '#motion.ts'
import { type Tables } from '#tables.ts'

// The utilities are one of the stylesheets a theme ships, so they are read from here with the
// rest. They sit in a file of their own only because the two together run past the line limit.
export { emitUtilities } from '#utilities.ts'

/**
 * Writes the stylesheet that loads the theme's own font files.
 *
 * Each source is resolved from the theme's own package, so a theme that names its own faces
 * declares the packages that carry them, and nothing shared names a font.
 *
 * @param {readonly string[]} sources - The stylesheets the recipe named, each once.
 * @returns {string} The stylesheet. It is a header alone for a theme that names no source,
 *     which is a theme drawing in the faces the system already has.
 */
export function emitFonts(sources: readonly string[]): string {
  const imports = sources.map((source) => `@import '${source}';\n`)
  return `${HEADER}\n${imports.join('')}`
}

/**
 * Writes the Tailwind a stealth theme runs on: the framework, the animation library and the
 * plugins every theme has.
 *
 * It is a stylesheet of its own so `@plugin` can sit directly after the import that defines
 * it, before any theme's overrides. A CSS parser refuses an `@import` that follows another
 * at-rule, so a single file listing the framework, the plugins and then the theme's own
 * stylesheets is not possible: the plugin would have to come last, after everything it is
 * meant to sit under.
 *
 * `tw-animate-css` is the default an app gets before any theme speaks: the `animate-in` and
 * `animate-out` composition and the utilities that modify a running animation. A theme's own
 * `--animate-*` values are declared after it and win where they collide, so a theme decides
 * what `animate-fade-in` means without taking the rest away.
 *
 * @returns {string} The stylesheet.
 */
export function emitTailwind(): string {
  return `${HEADER}
@import 'tailwindcss';
@import 'tw-animate-css';
@plugin '@tailwindcss/typography';
`
}

/**
 * Writes the two states a component never has to draw for itself.
 *
 * Being disabled arrives three ways, and a component that handled one of them is how a
 * disabled trigger and a disabled button came to look different: a native control carries
 * `disabled`, Base UI writes `data-disabled`, and something that cannot disable its own
 * element writes `aria-disabled`. Being invalid takes the geometry focus already has and
 * changes only the colour, so a control that is both does not wear two rings of two shapes.
 *
 * @returns {string} The rules, indented for the layer they sit in.
 */
function states(): string {
  return `${rule(
    ":disabled,\n  [data-disabled],\n  [aria-disabled='true']",
    ['opacity: var(--disabled-opacity)', 'pointer-events: none'],
    '  ',
  )}

${rule(
  "[aria-invalid='true']",
  ['border-color: var(--destructive)', 'outline-color: var(--destructive)'],
  '  ',
)}`
}

/**
 * Writes what every stealth stylesheet is before a single component renders: the mode
 * variant, and the base layer that reads the tokens.
 *
 * Every rule here reads a token the contract names, so a theme that moves a token moves what
 * a page draws without restating a line of this. That is why it is generated rather than
 * authored: none of it is a decision a theme makes. What a component library adds on top,
 * such as the state attributes its own primitives write, belongs to that library and loads
 * before any theme.
 *
 * @returns {string} The stylesheet.
 */
export function emitBase(): string {
  return `${HEADER}
/* The mode is a class rather than an attribute, because that is what \`dark:\` keys off. */
@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  /*
   * What a page is before a single component renders: the theme's surface, its text colour,
   * its family. Without this the tokens exist and nothing reads them, which looks exactly
   * like a theme that does not work.
   */
${rule('html', ['color-scheme: light dark'], '  ')}

${rule(
  'body',
  [
    'background-color: var(--background)',
    'color: var(--foreground)',
    'font-family: var(--font-sans)',
    '-webkit-font-smoothing: antialiased',
  ],
  '  ',
)}

  /* A border with no colour is black, and every component assumes the token. */
${rule('*,\n  *::before,\n  *::after', ['border-color: var(--border)'], '  ')}

  /*
   * Focus is a system decision rather than a component one, and its geometry is the
   * density's, so the browser's own ring and a component's agree.
   */
${rule(
  ':focus-visible',
  ['outline: var(--focus-width) solid var(--ring)', 'outline-offset: var(--focus-offset)'],
  '  ',
)}

${states()}

  /* Selected text is still text, so it takes the pair the contract guarantees. */
${rule(
  '::selection',
  ['background-color: var(--selection)', 'color: var(--selection-foreground)'],
  '  ',
)}

${rule('h1,\n  h2,\n  h3,\n  h4,\n  h5,\n  h6', ['font-family: var(--font-display)'], '  ')}

${rule('code,\n  kbd,\n  pre,\n  samp', ['font-family: var(--font-mono)'], '  ')}
}
`
}

/**
 * Writes the densities every element on the page reads, which a theme states and any region
 * may override.
 *
 * @param {Tables} tables - The theme's tables.
 * @returns {string} The stylesheet.
 */
export function emitDensities(tables: Tables): string {
  const densities = {
    fallback: tables.defaultDensity,
    focusWidth: tables.focusWidth,
    steps: tables.density,
  }

  return `${HEADER}
${rule(':root', densityDefaults(densities))}

${densityBlocks(densities, ':root')}
`
}

/**
 * Writes one animation's keyframes.
 *
 * @param {string} name - The animation's name, which its `--animate-*` step runs.
 * @param {Readonly<Record<string, readonly string[]>>} offsets - The declarations at each
 *     offset, as `KEYFRAMES` holds them.
 * @returns {string} The `@keyframes` rule.
 */
function keyframes(name: string, offsets: Readonly<Record<string, readonly string[]>>): string {
  const steps = Object.entries(offsets)
    .map(([offset, declarations]) => rule(offset, declarations, '  '))
    .join('\n')

  return `@keyframes ${name} {\n${steps}\n}`
}

/**
 * Writes the policy a person asking for reduced motion gets.
 *
 * The attribute answers as well as the media query, so the path can be reviewed on demand
 * rather than only on a machine configured for it. The press scale is flattened with
 * `!important`, because a theme declares it behind `[data-theme]` and no `:root` rule outranks
 * that whatever order the two load in.
 *
 * @returns {string} The rules, in both forms.
 */
function stillness(): string {
  const everything = '*,\n*::before,\n*::after'
  const attribute =
    '[data-reduced-motion],\n[data-reduced-motion] *,\n' +
    '[data-reduced-motion] *::before,\n[data-reduced-motion] *::after'
  const flattened = '--press-scale: 1 !important'

  return `@media (prefers-reduced-motion: reduce) {
${rule(':root', [flattened], '  ')}

${rule(everything, STILL, '  ')}

${rule("[data-slot='spinner']", SPINNING, '  ')}
}

${rule(attribute, [flattened, ...STILL])}

${rule("[data-reduced-motion] [data-slot='spinner']", SPINNING)}`
}

/**
 * Writes the keyframes every animation runs, and what a person asking for reduced motion gets
 * instead.
 *
 * A keyframe is a top-level rule and cannot sit inside the theme layer, and what an animation
 * *is* does not change with a brand: a theme says how long `animate-fade-in` takes and on
 * which curve, and a fade that slid would break the component that asked for a fade. So the
 * shapes are here, the same in every theme, and the timing is a value the theme declares.
 *
 * @returns {string} The stylesheet.
 */
export function emitMotion(): string {
  const frames = Object.entries(KEYFRAMES)
    .map(([name, offsets]) => keyframes(name, offsets))
    .join('\n\n')

  return `${HEADER}

${frames}

${stillness()}
`
}

/**
 * Writes the stylesheet an app links, which is the whole theme in the order the cascade needs
 * it: the font files, Tailwind, the base layer, the densities, the keyframes, then this
 * theme's own values.
 *
 * It is generated rather than authored for two reasons. It names generated files, and a
 * stylesheet a person wrote naming `tokens.css` by hand goes stale the day that file is
 * renamed, with the failure landing in whoever consumes the theme rather than in its build.
 * And which Tailwind a theme runs on is the toolchain's decision, not a theme's.
 *
 * @returns {string} The stylesheet.
 */
export function emitIndex(): string {
  return `${HEADER}
@import './fonts.css';
@import './tailwind.css';
@import './base.css';
@import './density.css';
@import './motion.css';
@import './utilities.css';
@import './tokens.css';
`
}
