/**
 * @fileoverview Writes the stylesheet that is the theme itself: the layer that names what
 * every utility resolves, and the values it resolves to.
 *
 * The theme layer carries no value. Every namespace points at a custom property of the same
 * name, and the theme's own stylesheet declares it. An unlayered declaration beats the layered
 * self-reference Tailwind writes, so a utility inlines `var(--duration-normal)` and resolves
 * it at the element: a document holding four themes behind `[data-theme]` draws four type
 * scales, four depths and four speeds rather than four palettes and one of everything else.
 *
 * The radius steps are the exception. Each is `calc(var(--radius) * n)`, so a region that
 * overrides `--radius` alone moves every step with it, which a property computed where it is
 * declared could not do.
 */

import { safeParse } from '@stealthscale/core-schema'

import { assertComplete, assertReadable } from '#assert.ts'
import {
  boxShadowOf,
  densityBlocks,
  densityDefaults,
  glowOf,
  HEADER,
  lines,
  numbered,
  radiusOf,
  references,
  stacked,
} from '#css.ts'
import { buildPalette } from '#palette.ts'
import { recipeSchema } from '#recipe.ts'
import { type Resolved, resolveRecipe } from '#resolve.ts'
import { CONTROL_SIZES, OWNED_NAMESPACES, RADIUS } from '#scales.ts'
import {
  emitBase,
  emitDensities,
  emitFonts,
  emitIndex,
  emitMotion,
  emitTailwind,
  emitUtilities,
} from '#shared.ts'
import { type Tables } from '#tables.ts'
import { COLOR_TOKENS, REQUIRED_TOKENS, type ThemeMode, type ThemeValues } from '#tokens.ts'

/**
 * Writes one `--token: value;` line per token, indented for the block it sits in.
 *
 * @param {ThemeValues} values - The theme.
 * @param {ThemeMode} mode - The mode whose values to write.
 * @returns {string} The lines, joined.
 */
function declarationLines(values: ThemeValues, mode: ThemeMode): string {
  return REQUIRED_TOKENS.map((token) => `  --${token}: ${values[mode][token]};`).join('\n')
}

/**
 * Writes the box shadows and the glows as one table, since `shadow-glow-md` is a utility like
 * any other.
 *
 * @param {Tables} tables - The theme's tables.
 * @returns {Record<string, string>} Each step mapped to its value.
 */
function boxShadows(tables: Tables): Record<string, string> {
  return Object.fromEntries([
    ...Object.entries(tables.shadow).map(([step, layers]): [string, string] => [
      step,
      boxShadowOf(layers, tables.shadowRim[step]),
    ]),
    ...Object.entries(tables.glow).map(([step, layers]): [string, string] => [
      `glow-${step}`,
      glowOf(layers),
    ]),
  ])
}

/**
 * Points every control step at the custom property a density sets, rather than at a length
 * fixed when the theme was built, so a utility resolves to whatever density the element sits
 * in. `size-*` reads the same property as `height-*`, because a square control is as wide as
 * it is tall.
 *
 * @returns {Record<string, string>} Each step mapped to the variable it reads.
 */
function controlSteps(): Record<string, string> {
  return Object.fromEntries(CONTROL_SIZES.map((step) => [step, `var(--height-${step})`]))
}

/**
 * Writes the type scale, each size with the line height that goes with it.
 *
 * @param {Tables} tables - The theme's tables.
 * @param {boolean} naming - `true` for the reference the theme layer names, `false` for the
 *     value the theme declares.
 * @returns {string} The lines, joined.
 */
function typeScale(tables: Tables, naming: boolean): string {
  return Object.entries(tables.text)
    .flatMap(([step, { lineHeight, size }]) => {
      const height = naming
        ? `var(--text-${step}--line-height)`
        : `calc(${String(lineHeight)} / ${String(size)})`
      return [
        `  --text-${step}: ${naming ? `var(--text-${step})` : `${String(size)}rem`};`,
        `  --text-${step}--line-height: ${height};`,
      ]
    })
    .join('\n')
}

/**
 * Writes the theme layer: every namespace nulled, then every step named.
 *
 * `@theme inline` is what turns a variable into a utility: `--color-primary` is why
 * `bg-primary` exists. Breakpoints and containers are not here, because those are a layout
 * decision, the same for every theme, and the design system's base sets them.
 *
 * @param {Tables} tables - The theme's tables, read for the step names it registers.
 * @returns {string} The `@theme inline` block.
 */
function themeLayer(tables: Tables): string {
  const nulled = OWNED_NAMESPACES.map((namespace) => `  --${namespace}-*: initial;`).join('\n')
  const colors = COLOR_TOKENS.map((token) => `  --color-${token}: var(--${token});`).join('\n')
  const radii = Object.fromEntries(
    Object.entries(RADIUS).map(([step, factor]): [string, string] => [step, radiusOf(factor)]),
  )

  return `@theme inline {
${nulled}

  --color-white: #fff;
  --color-black: #000;
${colors}

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-display: var(--font-display);

  --spacing: var(--spacing);

${typeScale(tables, true)}

${references('font-weight', tables.fontWeight)}

${references('tracking', tables.tracking)}

${references('leading', tables.leading)}

${lines('radius', radii)}

${references('shadow', boxShadows(tables))}

${references('inset-shadow', tables.insetShadow)}

${references('drop-shadow', tables.dropShadow)}

${references('text-shadow', tables.textShadow)}

${references('blur', tables.blur)}

${references('perspective', tables.perspective)}

${references('ease', tables.ease)}

${lines('height', controlSteps())}

${lines('size', controlSteps())}

${references('duration', tables.duration)}

${references('animate', tables.animation)}

  --default-transition-duration: var(--duration-normal);
  --default-transition-timing-function: var(--ease-out);
}`
}

/**
 * Writes every value the theme layer named, which is what makes one theme differ from another
 * in more than its colours.
 *
 * @param {Tables} tables - The theme's tables.
 * @returns {string} The declarations, joined, indented for the block they sit in.
 */
function scaleValues(tables: Tables): string {
  return `  --spacing: ${tables.spacing};
  --press-scale: ${String(tables.press)};
  --disabled-opacity: ${String(tables.disabled)};

${typeScale(tables, false)}

${lines('font-weight', numbered(tables.fontWeight))}

${lines('tracking', numbered(tables.tracking, 'em'))}

${lines('leading', numbered(tables.leading))}

${lines('shadow', boxShadows(tables))}

${lines('inset-shadow', stacked(tables.insetShadow))}

${lines('drop-shadow', stacked(tables.dropShadow))}

${lines('text-shadow', stacked(tables.textShadow))}

${lines('blur', numbered(tables.blur, 'px'))}

${lines('perspective', numbered(tables.perspective, 'px'))}

${lines('ease', tables.ease)}

${lines('duration', numbered(tables.duration, 'ms'))}

${lines('animate', tables.animation)}`
}

/**
 * Writes the stylesheet that claims the document: the theme layer, then every value on
 * `:root`, with the dark tokens under `.dark`.
 *
 * The light values sit on `:root` beside the scales, because a scale is the same in both
 * modes. The stylesheet is imported unlayered, so its declarations beat the self-references
 * the theme layer writes.
 *
 * @param {ThemeValues} values - The theme's tokens.
 * @param {Tables} tables - The theme's tables.
 * @returns {string} The stylesheet.
 */
export function emit(values: ThemeValues, tables: Tables): string {
  return `${HEADER}
${themeLayer(tables)}

:root {
  color-scheme: light;
${declarationLines(values, 'light')}

${scaleValues(tables)}
}

.dark {
  color-scheme: dark;
${declarationLines(values, 'dark')}
}
`
}

/**
 * Writes the same theme scoped to a `data-theme` attribute instead of `:root`, and no theme
 * layer, because a document that holds several themes registers the layer once.
 *
 * A deployable links one theme, so `:root` is right there. A Storybook renders every theme in
 * one document and switches between them from a toolbar, which needs each theme's values,
 * densities included, behind its own selector.
 *
 * @param {ThemeValues} values - The theme's tokens.
 * @param {Tables} tables - The theme's tables.
 * @param {string} name - The theme's name, as `data-theme` carries it.
 * @returns {string} The stylesheet.
 */
export function emitScoped(values: ThemeValues, tables: Tables, name: string): string {
  const scope = `[data-theme='${name}']`
  const densities = {
    fallback: tables.defaultDensity,
    focusWidth: tables.focusWidth,
    steps: tables.density,
  }

  return `${HEADER}
${scope} {
  color-scheme: light;
${declarationLines(values, 'light')}

${scaleValues(tables)}

${densityDefaults(densities)
  .map((declaration) => `  ${declaration};`)
  .join('\n')}
}

${scope}.dark,
.dark ${scope} {
  color-scheme: dark;
${declarationLines(values, 'dark')}
}

${densityBlocks(densities, scope)}
`
}

/**
 * Describes everything a theme package writes out when it is built.
 */
export interface EmittedTheme {
  /**
   * Carries the mode variant and the base layer that reads the tokens.
   */
  base: string

  /**
   * Carries the densities on the document.
   */
  density: string

  /**
   * Carries one `@import` per font file the recipe named.
   */
  fonts: string

  /**
   * Carries the whole stylesheet an app links.
   */
  index: string

  /**
   * Carries the keyframes and the reduced-motion policy.
   */
  motion: string

  /**
   * Lists what the resolution did to each written colour, one line each, so a build says how
   * it read a hex somebody pasted.
   */
  report: readonly string[]

  /**
   * Carries the stylesheet behind `[data-theme]`, which a page drawing several themes at once
   * loads one of per theme.
   */
  scoped: string

  /**
   * Carries every table the recipe resolved to, for whatever reads a theme as data.
   */
  tables: Tables

  /**
   * Carries the framework and its plugins.
   */
  tailwind: string

  /**
   * Carries the theme layer and every value, which claims `:root`.
   */
  tokens: string

  /**
   * Carries the classes a component opts into.
   */
  utilities: string

  /**
   * Carries every token in both modes.
   */
  values: ThemeValues
}

/**
 * Reads a recipe, holding it to its schema first.
 *
 * @param {unknown} recipe - The recipe module's export, as the package wrote it.
 * @param {string} name - The theme's name, for the message.
 * @returns {Resolved} The resolved recipe.
 * @throws {Error} When the recipe fails its schema, naming every field at fault.
 */
function resolved(recipe: unknown, name: string): Resolved {
  const read = safeParse(recipeSchema(), recipe)
  if (read.ok) return resolveRecipe(read.value)

  const reasons = read.failure.map((issue) => `${issue.path}: ${issue.reason}`)
  throw new Error(`Theme ${name} writes a recipe no palette builds from: ${reasons.join('; ')}`)
}

/**
 * Turns a theme's recipe into everything its package ships.
 *
 * A theme solves its palette once, where it is built, so no consumer carries the solver and
 * every one of them reads the same table. A recipe that cannot be drawn fails the theme's own
 * build, naming the field or the pair, rather than failing a Storybook at boot or an app in
 * front of a person.
 *
 * @param {unknown} recipe - The recipe, as the package wrote it. It is held to the
 *     schema before anything is built from it.
 * @param {string} name - The value a document writes for this theme, which is the basename of
 *     the package's directory.
 * @returns {EmittedTheme} Every stylesheet, the solved tokens, the merged tables, and the
 *     report of how each written colour was read.
 * @throws {Error} When the recipe fails its schema, when a token is missing, or when a pair
 *     the theme promises falls below its floor. Each message names what is at fault.
 */
export function emitTheme(recipe: unknown, name: string): EmittedTheme {
  const theme = resolved(recipe, name)
  const values = buildPalette(theme)

  assertComplete(values)
  assertReadable(values, theme.color.contrast)

  return {
    base: emitBase(),
    density: emitDensities(theme.tables),
    fonts: emitFonts(theme.font.sources),
    index: emitIndex(),
    motion: emitMotion(),
    report: theme.report,
    scoped: emitScoped(values, theme.tables, name),
    tables: theme.tables,
    tailwind: emitTailwind(),
    tokens: emit(values, theme.tables),
    utilities: emitUtilities(),
    values,
  }
}
