---
'@stealthscale/core-theme': minor
---

Draws a disabled control and an invalid one in the base layer, so a component gets both without asking. Being disabled arrives three ways — `disabled`, `data-disabled` and `aria-disabled` — and all three fade to `--disabled-opacity`, which a recipe sets as `effect.disabled`. Being invalid takes the border and outline colour of `destructive`.

Adds `{outcome}-soft` and `{outcome}-soft-foreground` for the four outcomes: the tinted fill a badge, a callout or a table cell takes where the solid one would shout. The fill is a lift off the page in the outcome's hue, the label is walked until it clears AAA against it, and the pair is measured on every build like every other.

Adds `motion-state` and `motion-press` to `utilities.css`, which `index.css` now imports. They ease the properties a state change touches, at the theme's own duration and curve.

Raises `duration.fast` from 100ms to 150ms and `duration.normal` from 200ms to 250ms, since anything under 100ms does not read as movement and a state change at that speed cost a transition to buy a snap. A theme's `motion.speed` still scales all three.
