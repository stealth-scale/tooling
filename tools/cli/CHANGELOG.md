# @stealthscale/tool-cli

## 0.1.2

### Patch Changes

- Updated dependencies [a471dc9]
  - @stealthscale/tool-workspace@0.2.0

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.
- Updated dependencies [2ea6c72]
  - @stealthscale/core-schema@0.1.1
  - @stealthscale/tool-workspace@0.1.1

## 0.1.0

### Minor Changes

- Ships the stealth command, which publishes a workspace’s public packages in dependency order and skips the versions the registry already has.

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @stealthscale/core-schema@0.1.0
  - @stealthscale/tool-workspace@0.1.0
