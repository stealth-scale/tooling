# @stealthscale/core-theme

## 0.2.0

### Minor Changes

- bf78d6f: Draws a disabled control and an invalid one in the base layer, so a component gets both without asking. Being disabled arrives three ways — `disabled`, `data-disabled` and `aria-disabled` — and all three fade to `--disabled-opacity`, which a recipe sets as `effect.disabled`. Being invalid takes the border and outline colour of `destructive`.
  
  Adds `{outcome}-soft` and `{outcome}-soft-foreground` for the four outcomes: the tinted fill a badge, a callout or a table cell takes where the solid one would shout. The fill is a lift off the page in the outcome's hue, the label is walked until it clears AAA against it, and the pair is measured on every build like every other.
  
  Adds `motion-state` and `motion-press` to `utilities.css`, which `index.css` now imports. They ease the properties a state change touches, at the theme's own duration and curve.
  
  Raises `duration.fast` from 100ms to 150ms and `duration.normal` from 200ms to 250ms, since anything under 100ms does not read as movement and a state change at that speed cost a transition to buy a snap. A theme's `motion.speed` still scales all three.

## 0.1.2

### Patch Changes

- a4c8b78: Describes the recipe the contract takes. The documentation still had fourteen flat members and a `writeTheme` that took a base package, which is two designs old; it now has the five groups, the three forms a colour may be written in, `extendRecipe`, `stated` for a value the palette may not move, and `THEME_EXPORTS` for the entries a theme hands `packConfig`.

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.
- Updated dependencies [2ea6c72]
  - @stealthscale/core-schema@0.1.1

## 0.1.0

### Minor Changes

- Solves a palette that clears WCAG contrast from a recipe of colours, fonts and sizes, and writes every stylesheet a theme package ships.

### Patch Changes

- Updated dependencies
  - @stealthscale/core-schema@0.1.0
