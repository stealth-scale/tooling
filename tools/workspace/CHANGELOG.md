# @stealthscale/tool-workspace

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.
- Updated dependencies [2ea6c72]
  - @stealthscale/core-result@0.1.1
  - @stealthscale/core-schema@0.1.1

## 0.1.0

### Minor Changes

- Reads a workspace off its manifests: the packages the root names, what each declares, and the order their dependencies put them in.

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @stealthscale/core-result@0.1.0
  - @stealthscale/core-schema@0.1.0
