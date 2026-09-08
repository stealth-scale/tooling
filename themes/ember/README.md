# @stealthscale/theme-ember

A **library**: an app links it, and a Storybook draws it beside the other themes.

Draws a stealth product in a warm orange, packed and quick. It is the theme for an operations
console: rows matter more than whitespace, the shadows are half the base's so a screen full of
surfaces does not read as clutter, and everything moves a fifth faster because somebody working
a queue sees each animation hundreds of times a day.

```ts
import { extendRecipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

export const recipe = extendRecipe(base, {
  color: { primary: '#d9480f' },
  effect: { depth: 0.5 },
  font: {
    display: { family: 'Bricolage Grotesque Variable', source: '…/bricolage-grotesque/wght.css' },
    mono: { family: 'Fira Code Variable', source: '…/fira-code/wght.css' },
    sans: { family: 'Jost Variable', source: '…/jost/wght.css' },
  },
  motion: { speed: 0.8 },
  size: { density: { default: 'compact' } },
})
```

It changes something in four of the five groups, which is what a house style of its own looks
like. `source` names the stylesheet that loads the face, resolved from this package, so the
theme brings its own font rather than naming one and hoping something else loaded it. Jost is
built on circles and sets a smaller x-height than the base's Inter, so a page reads rounder and
lighter at the same size.

`depth` and `speed` are one number each and reach every table under them: half the ink in every
box, inset, drop and text shadow, and four fifths of every duration, so the whole vocabulary
moves together rather than falling out of step.

## Install

```sh
bun add @stealthscale/theme-ember
```

Link `@stealthscale/theme-ember/index.css` and nothing else.
