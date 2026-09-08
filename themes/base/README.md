# @stealthscale/theme-base

A **library**: an app links it, and every other theme extends it.

Solves the neutral theme a stealth product starts from, and ships everything a document needs
to draw in it. `./index.css` is the whole stylesheet an app links: the Tailwind stack, the
authored base, the densities, the motion vocabulary and this theme's tokens, in the order the
cascade needs them. The parts are exported on their own for a theme that extends this one and
for a Storybook that draws several themes at once.

| Entry            | Holds                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| `./index.css`    | The whole stylesheet, which an app links and nothing else                  |
| `./tailwind.css` | Tailwind, `tw-animate-css` and the typography plugin, once for every theme |
| `./base.css`     | What no palette computes: the families, the state variants, the base layer |
| `./density.css`  | The three densities, each behind `data-density`, the default on `:root`    |
| `./motion.css`   | The animations, their keyframes, and what reduced motion is held to        |
| `./tokens.css`   | This theme's custom properties on `:root`, and the dark ones under `.dark` |
| `./scoped.css`   | The same tokens behind `[data-theme='base']`, for a page drawing several   |
| `./values`       | The solved table, for whatever reads a theme as data rather than as CSS    |
| `.`              | The recipe, for a theme that starts from this one                          |

The palette is solved once, when this package is built: the pack step's `build:before` hook
calls `writeTheme` from `core-theme`, which holds the recipe to its schema, solves every
token in both modes and writes the artefacts into `dist/`. A consumer carries no solver,
every consumer reads the same table, and a recipe that cannot be drawn fails this package's
build naming the field or the pair.

A person writes two files. `src/recipe.ts` states every member a recipe takes, with the
reason this theme chose each value. `src/base.css` holds what no table computes and every
theme shares: the two font families, Base UI's state attributes as Tailwind variants, and the
base layer that reads the tokens. Everything else under `dist/` is generated.

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
