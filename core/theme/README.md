# @stealthscale/core-theme

A **library**: every tier that renders installs it, and Storybook and the generators
read it.

The package defines the tokens a theme must set, solves a palette that clears WCAG contrast,
and writes everything a theme package ships: its tokens, the densities, the motion
vocabulary and the Tailwind stack every stealth theme runs on. It holds no theme and no font.
A theme is a package that states a recipe and calls `writeTheme` from its pack hook;
`themes/base` is the first, and it holds the authored base every other theme extends.

```ts
// themes/acme/vite.config.ts
import { defineConfig } from 'vite-plus'

import { writeTheme } from '@stealthscale/core-theme/write'
import { packConfig } from '@stealthscale/tool-config'

import { recipe } from './src/recipe.ts'

export default defineConfig({
  pack: packConfig({
    hooks: {
      'build:before': () =>
        writeTheme(recipe, import.meta.url, { base: '@stealthscale/theme-base' }),
    },
    sourceCondition: 'acme-source',
    staticExports: {
      './index.css': './dist/index.css',
      './scoped.css': './dist/scoped.css',
      './tokens.css': './dist/tokens.css',
      './values': './dist/values.mjs',
    },
  }),
})
```

## What a theme ships

`writeTheme` reads the theme's name from its package directory, holds the recipe to its
schema, solves the palette and writes five files into `dist/`: `tokens.css` with the light
values on `:root` and the dark ones under `.dark`, `scoped.css` with the same values behind
`[data-theme]` for a page drawing several themes, `values.mjs` with the solved table and its
declaration, and `index.css`, which imports the base package's Tailwind stack, base,
densities and motion before the theme's own tokens. `emitTheme` answers the same three
things without touching the disk, for a specification or a build that reads the palette
back.

The parts every theme shares are written by the base theme alone, from `emitTailwind`,
`emitDensities` and `emitMotion`, and a theme extending it imports them from there rather
than restating them.

## Densities

A density is one length: the height of the default control. Every step derives from it four
pixels apart, `xs` and `sm` below and `lg` above, the way every radius derives from one
`--radius`. `compact` puts the default at 32 pixels, `comfortable` at 40 and `touch` at 44,
and a specification holds every control in every density to WCAG's 24 pixel minimum and the
touch density to the 44 pixel enhanced target from its default step up. The focus ring is two
pixels wide in every density, the perimeter the enhanced focus criterion asks for, and the
density decides only whether there is room to draw it outside the control.

`emitDensities` writes each density behind its `data-density` attribute, with the default on
`:root` as well, and the theme layer registers every step as `h-md`, `min-h-md` and `size-md`
utilities that follow the density of the region an element sits in.

## Motion

Which animations exist is a contract a component writes against, so `ANIMATION` names the
sixteen, `KEYFRAMES` holds what each runs, and every one-shot is built from the theme's own
durations and easings. `emitMotion` writes them as a stylesheet of their own, because a
keyframe cannot sit inside the theme layer, together with what a person asking for reduced
motion is held to: every animation and transition cut to a hundredth of a millisecond, so a
component waiting on `animationend` still hears it, and a spinner slowed rather than frozen.

## The contract

A theme defines every token in both modes: every colour `COLOR_TOKENS` names, one radius and
two font families. The colours are the surfaces and the text on each, the emphasis levels,
four outcomes with the outcome as ink on the page, the edges, five chart series and three
chart tones, eight syntax roles, the sidebar's plane, the scrim under a dialog, selection,
highlight, glass, the three gradient stops, the glow, and the three colours every shadow mixes
from. `secondary` is `muted` under the name shadcn's components ask for.

Every scale derives from those tokens or is fixed. Eight radii are multiples of the one
`--radius`. Every box, inset, drop and text shadow takes a share of the theme's shadow ink,
so no shadow in the product is black. The type scale, the weights, tracking, leading, blur
and the easings are the same in every theme, because a scale is a reading decision and a
product that changes it has a different rhythm rather than a different brand.

## Elevation in dark mode

A shadow is ink, and ink on a near-black page draws nothing a person sees. A dark page sits
around 13% lightness and the heaviest layer composites to about 10%, three points spread under
a fifteen pixel blur, so every step looks the same and nothing reads as raised.

What separates a raised surface from a dark page is a light edge. The four floating steps
carry a 1px rim in `--shadow-rim`, which is the page's own ink and so flips with the mode: a
dark hairline at 10% on paper, a light one at 32% on a near-black page. Primer rings its
floating shadows for the same reason, and Radix rings every step in a grey that inverts
between themes.

```css
--shadow-lg:
  inset 0 1px 0 0 var(--shadow-highlight),
  0 0 0 1px color-mix(in oklch, var(--shadow-rim) 60%, transparent),
  0 10px 15px -3px color-mix(in oklch, var(--shadow) 40%, transparent),
  0 4px 6px -4px color-mix(in oklch, var(--shadow) 40%, transparent);
```

`2xs`, `xs` and `sm` take no rim. Those are resting surfaces, and a button or a small card
already draws its own border, so ringing them puts two hairlines where a designer asked for
one. `md` through `2xl` are the floating steps a menu, a popover and a dialog use, and those
sit over the page with nothing else to delineate them.

No surface colour moves. `--card` is what a card renders as, whatever shadow it carries, so
the pairs the guarantees measure are the pairs that ship. `effect.depth` scales the rim along
with the ink.

The emitter nulls every namespace it owns before it registers a step, so a utility nothing
here defines renders nothing rather than rendering Tailwind's default. A theme controls
`shadow-xl` and `rounded-4xl` as surely as `bg-primary`. Breakpoints and containers are not
owned, because those are a layout decision, the same for every theme, and the design
system's base sets them.

## Effects

Gradients, glass and glow are tokens rather than one class each, so a product composes them
and every theme answers.

```html
<div class="bg-glass border-glass-border backdrop-blur-md shadow-lg">Glass</div>
<div class="bg-linear-to-r/oklch from-gradient-1 via-gradient-2 to-gradient-3">Gradient</div>
<button class="bg-primary shadow-glow-md hover:shadow-glow-lg">Glow</button>
<div class="bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:20px_20px]">Grid</div>
```

The three gradient stops share one lightness and differ only in hue, walking the short way
round from the primary to the accent. Composing `from-primary to-accent` instead gives a fade
to white, because those two sit at whatever lightness their contrast demanded. `glass` and
`glass-border` carry the alpha their mode needs, since a translucent card that reads right on
paper reads as a smear on a near-black page. A glow is thrown in the theme's own primary, has
no offset, and joins the shadow namespace so `shadow-glow-md` is a utility like any other.

What the package does not provide is the choreography. A pointer-tracked spotlight, a beam or
a text reveal is a component, and it belongs in the design system reading these tokens and
the durations and easings beside them.

## The palette

A recipe states colours and a shape, and `buildPalette` turns it into every token in both
modes. Every surface is placed against the page rather than at a lightness of its own: a
card, a popover, a muted panel, an accent, a sidebar and every hairline is a signed lift off
`page`, so a theme that moves its paper or its ink carries all of them with it and a theme
that wants its cards flush states `cardLift: 0`.
Every fill is solved for contrast rather than set: at the same lightness a green is
perceptibly lighter than a blue, so a fixed number clears 7:1 with white text for one theme
and not for the next. The walk moves lightness until the ratio holds, which makes the ratio a
property of the builder rather than of numbers that drift the moment a hue moves.

A recipe asks for `AAA` or `AA` on its fills. Text on a surface is held to `AAA` whatever it
asks for. A field's outline and the focus ring are solved to 3:1 against what they sit on,
which is the floor WCAG 1.4.11 puts on any boundary a person needs to find a control.

A recipe is written by hand in a package a tool loads, so `recipeSchema()` holds one to its
contract before the palette is built: a hue past the wheel, a lightness past 100 and a chart
that is not five series are each refused with a code. It refuses a key that is no member as
well, because a typo in an optional name would otherwise leave the default in place and say
nothing.

### What a recipe states

Four members are required and ten have a default. A hue is 0 to 360 and a lightness is 0 to 100.

| Member          | Required | Default               | Decides                                                     |
| --------------- | -------- | --------------------- | ----------------------------------------------------------- |
| `primary`       | yes      |                       | The hue of the primary action                               |
| `accent`        | yes      |                       | The hue of the accent surface, which a hover and a row take |
| `neutral`       | yes      |                       | The hue the greys are tinted with                           |
| `chart`         | yes      |                       | The five series hues, in the order a chart assigns them     |
| `chroma`        | no       | `0.17`                | How saturated the primary is; past 0.22 it shouts           |
| `contrast`      | no       | `AAA`                 | What a fill clears against its label; text stays AAA        |
| `fonts`         | no       | Inter, JetBrains Mono | The two families, as CSS lists                              |
| `ink`           | no       | `13`                  | The lightness of the dark page                              |
| `paper`         | no       | `97`                  | The lightness of the light page                             |
| `neutralChroma` | no       | `0.008`               | How much the greys are tinted; 0 is a true grey             |
| `surfaceChroma` | no       | `2.5 × neutralChroma` | How much the page, cards and popovers are tinted            |
| `surfaceHue`    | no       | `neutral`             | The hue of the surfaces, when it is not the greys'          |
| `radius`        | no       | `0.5rem`              | The corner every radius step is a multiple of               |
| `status`        | no       | 27, 150, 85, 235      | The outcome hues: destructive, success, warning, info       |

`themes/base` writes all fourteen, including the ones that would take the same value by
default, because it is the theme another theme is written by. A theme of its own writes only
what makes it different, and leaving a member out is how it says the default should move if
the contract ever moves it.

### Stating a colour

A recipe answers for the relationships between tokens, not for a colour somebody else owns. A
company whose blue is a fixed hex has one value the palette may not move, so a theme states it
and leaves the rest derived:

```ts
// themes/acme/vite.config.ts
writeTheme(recipe, import.meta.url, {
  base: '@stealthscale/theme-base',
  values: {
    dark: { primary: '#4f7cff' },
    light: { primary: '#2d5bd7' },
  },
})
```

Only what is named is replaced. `primary-foreground` is still solved against the new fill, the
ring still takes the primary's hue, and the other mode is untouched where it is not named.

Anything stated is checked like anything solved. `assertReadable` runs over the finished table,
so a brand colour its own label cannot be read on fails that theme's build with the pair and
the two ratios:

```
Theme acme fails 1 guarantee(s): light.primary-foreground on primary is 3.11:1, needs 4.5:1
```

A name that is no token is refused the same way, because a typo would otherwise pass unread
and leave the solved value in place.

## The colour maths

`parseColor` reads every notation CSS can express and sRGB can hold: hex with or without an
alpha, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color(srgb …)` and
the 148 named colours. `luminance` and `contrast` measure as WCAG defines it.

They agree with the standards' own reference values, and the specification holds them to
those: `#777777` on white measures 4.48 and fails AA, `oklch(62.8% 0.2577 29.23)` reads back
as pure red, and each sRGB primary round-trips from the Lab the standard gives for it.

A perceptual notation outside the gamut is mapped into it the way CSS Color 4 specifies, with
its chroma reduced until the display shows it, so the ratio is measured on the colour the
standard says the page shows. A wide-gamut space such as `display-p3` is refused outright,
because sRGB cannot hold it.
`transparent` is refused because it has no colour to measure, and `contrast` answers 0 for
anything unreadable, so a caller tells "unreadable" from "not measured".

`hex` writes the other way, as `#rrggbb`. A theme's own values are `oklch()`, and a tool that
draws chrome around the product rather than inside it parses colours with a library that
predates CSS Color 4; hand it this.

## Declaring a package a theme

A package says it is a theme in its manifest, under the `stealth` field the toolchain reads:

```json
{
  "name": "@acme/theme-thesmos",
  "stealth": { "theme": { "title": "Thesmos" } }
}
```

`THEME_KEY` names that entry and `THEME_CONTRIBUTION` is the schema it is held to, so the
toolchain finds every theme in a workspace by reading the manifests. Adding a theme is adding
a package, and no file anywhere lists the themes. The value written to the document's theme
attribute is the basename of the package's directory, which is why it is not declared here:
two themes cannot claim one name. The recipe is not declared either. A consumer reads the
artefacts the package exports at `./values` and `./scoped.css`, never a module it would have
to evaluate.

## Install

```sh
bun add @stealthscale/core-theme
```
