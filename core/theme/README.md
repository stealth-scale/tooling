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

A theme defines every token in both modes: sixty-one colours, one radius and two font
families. The colours are the surfaces and the text on each, four emphasis levels, four
outcomes with the outcome as ink on the page, the edges, five chart series and three chart
tones, eight syntax roles, the sidebar's plane, the scrim under a dialog, selection,
highlight, and the two colours every shadow mixes from.

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

`parseColor`, `luminance` and `contrast` read any colour this system writes or a browser
reports and measure contrast as WCAG defines it. They agree with the standards' own reference
values, and the specification holds them to those: `#777777` on white measures 4.48 and fails
AA, and `oklch(62.8% 0.2577 29.23)` reads back as pure red. They are here rather than in a
dependency because the palette solver calls them thousands of times and the maths is forty
lines that do not change.

## Install

```sh
bun add @stealthscale/core-theme
```
