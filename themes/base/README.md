# @stealthscale/theme-base

A **library**: an app links it, and every other theme extends it.

Solves the neutral theme a stealth product starts from, and ships everything a document needs
to draw in it. `./index.css` is the whole stylesheet an app links: the font files, the
Tailwind stack, the base layer, the densities, the keyframes and this theme's own values, in
the order the cascade needs them. The parts are exported on their own for a Storybook that
draws several themes at once, which loads `./scoped.css` and `./fonts.css` per theme.

| Entry            | Holds                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| `./index.css`    | The whole stylesheet, which an app links and nothing else                  |
| `./fonts.css`    | An `@import` per font file this theme's own families load from             |
| `./tailwind.css` | Tailwind, `tw-animate-css` and the typography plugin, once for every theme |
| `./base.css`     | The mode variant, and the base layer that reads the tokens                 |
| `./density.css`  | The three densities, each behind `data-density`, the default on `:root`    |
| `./motion.css`   | The keyframes every animation runs, and the reduced-motion policy          |
| `./tokens.css`   | The theme layer, then every value, with the dark tokens under `.dark`      |
| `./scoped.css`   | The same values behind `[data-theme='base']`, for a page drawing several   |
| `./values`       | The solved tokens and the merged tables, for what reads a theme as data    |
| `.`              | The recipe, for a theme that starts from this one                          |

The palette is solved once, when this package is built: the pack step's `build:before` hook
calls `writeTheme` from `core-theme`, which holds the recipe to its schema, solves every
token in both modes and writes the artefacts into `dist/`. A consumer carries no solver,
every consumer reads the same table, and a recipe that cannot be drawn fails this package's
build naming the field or the pair.

A person writes one file. `src/recipe.ts` states every value that changes what a reader sees,
with the reason this theme chose it, and everything under `dist/` is written from it. That
includes the base layer, which reads the tokens and is therefore the same in every theme, and
the two font families, which this recipe names along with the packages that carry their files.

The state attributes a component library writes, such as Base UI's `data-open`, are not here.
They belong to the library that writes them, which registers its own stylesheet under
`stealth.appearance` and loads before any theme.

The manifest registers the theme under `stealth.theme` and, under `stealth.appearance`, the
densities `density.css` answers and `./index.css` as the stylesheet every story is drawn under.

## Extending it

A theme of its own states only what makes it different and takes the rest from here:

```ts
// themes/acme/src/recipe.ts
import { recipe as base } from '@stealthscale/theme-base'

export const recipe = { ...base, primary: 12, accent: 40 }
```

```ts
// themes/acme/vite.config.ts, from the pack's build:before hook
writeTheme(recipe, import.meta.url, { base: '@stealthscale/theme-base' })
```

The generated `index.css` then imports this package's Tailwind stack, base, densities and
motion before the new theme's own tokens.

## Install

```sh
bun add @stealthscale/theme-base
```
