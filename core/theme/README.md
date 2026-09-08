# @stealthscale/core-theme

A **library**: every tier that renders installs it, and the catalogue and the generators
read it.

The package defines the tokens a theme must set, solves a palette that clears WCAG contrast,
and writes the stylesheet a theme ships. It holds no theme, no font and no CSS framework.
The themes, the fonts and the base stylesheet belong to the design system, which depends on
this package and adds them.

```ts
import { assertComplete, buildPalette, emit } from '@stealthscale/core-theme'

const values = buildPalette({
  accent: 200,
  chart: [258, 152, 292, 45, 12],
  neutral: 260,
  primary: 258,
})

assertComplete(values)
writeFileSync('src/index.gen.css', emit(values))
```

## The contract

A theme defines every token in both modes: sixty-five colours, one radius and two font
families. The colours are the surfaces and the text on each, four emphasis levels, four
outcomes with the outcome as ink on the page, the edges, five chart series and three chart
tones, eight syntax roles, the sidebar's plane, the scrim under a dialog, selection,
highlight, glass, the three gradient stops, the glow, and the two colours every shadow mixes
from.

Every scale derives from those tokens or is fixed. Eight radii are multiples of the one
`--radius`. Every box, inset, drop and text shadow takes a share of the theme's shadow ink,
so no shadow in the product is black. The type scale, the weights, tracking, leading, blur
and the easings are the same in every theme, because a scale is a reading decision and a
product that changes it has a different rhythm rather than a different brand.

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

A recipe states hues and a shape, and `buildPalette` turns it into every token in both modes.
Every fill is solved for contrast rather than set: at the same lightness a green is
perceptibly lighter than a blue, so a fixed number clears 7:1 with white text for one theme
and not for the next. The walk moves lightness until the ratio holds, which makes the ratio a
property of the builder rather than of numbers that drift the moment a hue moves.

A recipe asks for `AAA` or `AA` on its fills. Text on a surface is held to `AAA` whatever it
asks for. A field's outline and the focus ring are solved to 3:1 against what they sit on,
which is the floor WCAG 1.4.11 puts on any boundary a person needs to find a control.

## The colour maths

`parseColor` reads every notation CSS can express and sRGB can hold: hex with or without an
alpha, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color(srgb …)` and
the 148 named colours. `luminance` and `contrast` measure as WCAG defines it.

They agree with the standards' own reference values, and the specification holds them to
those: `#777777` on white measures 4.48 and fails AA, `oklch(62.8% 0.2577 29.23)` reads back
as pure red, and each sRGB primary round-trips from the Lab the standard gives for it. That
last case caught a mistyped matrix row that tinted every `lab()` colour.

A wide-gamut space such as `display-p3` is refused rather than clipped, because a ratio
measured on a clipped colour describes something the page does not show. `transparent` is
refused for the same reason, and `contrast` answers 0 for anything unreadable, so a caller
tells "unreadable" from "not measured".

## Install

```sh
bun add @stealthscale/core-theme
```
