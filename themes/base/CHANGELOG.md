# @stealthscale/theme-base

## 0.1.3

### Patch Changes

- Updated dependencies [bf78d6f]
  - @stealthscale/core-theme@0.2.0

## 0.1.2

### Patch Changes

- a4c8b78: Describes the recipe the contract takes. The documentation still had fourteen flat members and a `writeTheme` that took a base package, which is two designs old; it now has the five groups, the three forms a colour may be written in, `extendRecipe`, `stated` for a value the palette may not move, and `THEME_EXPORTS` for the entries a theme hands `packConfig`.
- Updated dependencies [a4c8b78]
  - @stealthscale/core-theme@0.1.2

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.
- Updated dependencies [2ea6c72]
  - @stealthscale/core-theme@0.1.1

## 0.1.0

### Minor Changes

- Ships the base theme a stealth product starts from, and the stylesheets and tokens every theme extending it inherits.

### Patch Changes

- Updated dependencies
  - @stealthscale/core-theme@0.1.0
