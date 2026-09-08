# @stealthscale/theme-harbor

A **library**: an app links it, and a Storybook draws it beside the other themes.

Draws a stealth product in a deep teal, at the enhanced contrast level and the touch density.
It is the theme for something used on a tablet or in a warehouse: every control clears the
44 pixel target by default, every fill clears 7:1 against the label on it, and the corners are
softer than the base's.

```ts
import { extendRecipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

export const recipe = extendRecipe(base, {
  color: { contrast: 'AAA', primary: '#0f766e' },
  font: {
    mono: { family: 'Spline Sans Mono Variable', source: '…/spline-sans-mono/wght.css' },
    sans: { family: 'Space Grotesk Variable', source: '…/space-grotesk/wght.css' },
  },
  size: { density: { default: 'touch' }, radius: '1rem' },
})
```

Space Grotesk is wide and squared where the base's Inter is narrow and round, and it holds that
width at arm's length or behind safety glass. Its monospace sibling carries the same skeleton
into code, so a table of readings and the prose around it read as one face.

`src/recipe.ts` is the only file a person wrote; everything under
`dist` is written by `writeTheme` when the package is built. The brand's teal goes in as the
hex the brand writes, and the solver keeps its hue and its saturation while setting the
lightness per mode, which is what lets one teal carry a readable label on paper and on a
near-black page.

Everything this recipe does not name is the base theme's, so a change there reaches this theme
without an edit here.

## Install

```sh
bun add @stealthscale/theme-harbor
```

Link `@stealthscale/theme-harbor/index.css` and nothing else. `@stealthscale/theme-base`
documents the other entries and when a page reaches for them.
