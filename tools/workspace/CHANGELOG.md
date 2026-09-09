# @stealthscale/tool-workspace

## 0.2.0

### Minor Changes

- a471dc9: Finds a theme a repository installs, rather than only one it holds. The registry read the workspace globs alone, so a repository consuming the toolchain had no way to register a theme at all: it either kept a theme package of its own or drew none. It now reads the packages the root manifest depends on as well, exported from `tool-workspace` as `dependencyManifests`, and takes the workspace first so a repository developing a theme it also depends on draws the one on disk.
  
  **A theme states the value its attribute takes.** The basename of the package's directory used to supply it, read twice: `writeTheme` baked the author's directory into `scoped.css` while the registry read the consumer's, and installed those are different names for one theme (`themes/ember` against `node_modules/@stealthscale/theme-ember`), leaving the stylesheet scoped to an attribute nothing set. `stealth.theme` now carries `name` beside the `title` a person reads, and the build and the registry both read it.
  
  Every theme package adds the field:
  
  ```json
  "stealth": { "theme": { "name": "ember", "title": "Ember" } }
  ```
  
  A theme without it fails its own build, which is where the missing name is cheapest to find.

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
