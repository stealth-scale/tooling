# @stealthscale/core-locale

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.

## 0.1.0

### Minor Changes

- Reads a BCP-47 tag with the engine's own Intl and looks it up against what a catalogue ships, so a product answers in a locale it has words for.
