# @stealthscale/core-env

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.

## 0.1.0

### Minor Changes

- Reads the environment as one value: the .env files layered, the machine winning over them, and one written default per absence.
