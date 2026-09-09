---
'@stealthscale/core-appearance': patch
'@stealthscale/core-theme': patch
'@stealthscale/theme-base': patch
'@stealthscale/theme-harbor': patch
'@stealthscale/theme-lumen': patch
---

Describes the recipe the contract takes. The documentation still had fourteen flat members and a `writeTheme` that took a base package, which is two designs old; it now has the five groups, the three forms a colour may be written in, `extendRecipe`, `stated` for a value the palette may not move, and `THEME_EXPORTS` for the entries a theme hands `packConfig`.
