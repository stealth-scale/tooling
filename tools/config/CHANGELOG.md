# @stealthscale/tool-config

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.

## 0.1.0

### Minor Changes

- Holds the toolchain every stealth repository runs: the formatter, the linter, how a library is packed and how a specification runs.
