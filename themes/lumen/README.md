# @stealthscale/theme-lumen

A **library**: an app links it, and a Storybook draws it beside the other themes.

Draws an editorial product: a violet the brand owns, prose set in a serif at seventeen pixels, a
display serif over it and a heavier hand with elevation. It is the one theme here that sets body
text in a serif, so a page tells itself apart from the other three before a word is read.

```ts
import { extendRecipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

export const recipe = extendRecipe(base, {
  color: {
    primary: '#7c3aed',
    stated: { dark: { primary: '#7c3aed' }, light: { primary: '#7c3aed' } },
  },
  effect: { depth: 1.5 },
  font: {
    display: { fallback: 'Georgia, serif', family: 'Fraunces Variable', source: '…/fraunces' },
    mono: { family: 'Source Code Pro Variable', source: '…/source-code-pro/wght.css' },
    sans: { fallback: 'Georgia, serif', family: 'Literata Variable', source: '…/literata' },
  },
  size: { text: { base: '17px' } },
})
```

## The violet, stated twice

The two mean different things, and this theme is where the difference is worth reading.

`color.primary` is the brand as a **tone**. The solver keeps its hue and saturation and picks
the lightness per mode, so the accent, the ring, the gradient and the ink beside it all follow
it and every pair still clears its floor.

`color.stated.light.primary` is the brand as a **value the palette may not move**. The fill
ships as the hex the company owns, unmoved. Everything derived from it is still solved against
what shipped, so the label on that button, the ring around it and the ink beside it follow the
stated colour rather than the one the solver would have chosen. The stated value is measured
like a solved one: a brand colour its own label cannot be read on fails this package's build
with the pair and both ratios.

Reach for `stated` for the one colour somebody else owns, and for nothing else.

## Install

```sh
bun add @stealthscale/theme-lumen
```

Link `@stealthscale/theme-lumen/index.css` and nothing else.
