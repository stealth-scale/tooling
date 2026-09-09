# @stealthscale/core-result

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.

## 0.1.0

### Minor Changes

- Answers a step that can refuse with a value rather than a thrown fault, so a caller reads the outcome instead of catching it.
