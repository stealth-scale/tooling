# @stealthscale/tool-storybook

## 0.2.0

### Minor Changes

- a471dc9: Finds a theme a repository installs, rather than only one it holds. The registry read the workspace globs alone, so a repository consuming the toolchain had no way to register a theme at all: it either kept a theme package of its own or drew none. It now reads the packages the root manifest depends on as well, exported from `tool-workspace` as `dependencyManifests`, and takes the workspace first so a repository developing a theme it also depends on draws the one on disk.
  
  **A theme states the value its attribute takes.** The basename of the package's directory used to supply it, read twice: `writeTheme` baked the author's directory into `scoped.css` while the registry read the consumer's, and installed those are different names for one theme (`themes/ember` against `node_modules/@stealthscale/theme-ember`), leaving the stylesheet scoped to an attribute nothing set. `stealth.theme` now carries `name` beside the `title` a person reads, and the build and the registry both read it.
  
  Every theme package adds the field:
  
  ```json
  "stealth": { "theme": { "name": "ember", "title": "Ember" } }
  ```
  
  A theme without it fails its own build, which is where the missing name is cheapest to find.

### Patch Changes

- Updated dependencies [a471dc9]
  - @stealthscale/core-theme@0.3.0
  - @stealthscale/tool-workspace@0.2.0

## 0.1.5

### Patch Changes

- 88a9e42: Groups the contrast table by the kind of pair a reader is looking for, rather than printing all 34 text guarantees under one heading. The four groups are a `-foreground` on the token it pairs with, an `-ink` on the page, a `-soft-foreground` on its `-soft` fill, and a syntax role on `muted`. Each filter reads the suffix, so a token added to the contract needs no edit to the page.
  
  Draws `motion-state` and `motion-press` on the Motion page beside a third control with no class on it, since a table cannot show a transition.
- Updated dependencies [f2e0506]
- Updated dependencies [bf78d6f]
  - @stealthscale/tool-config@0.1.4
  - @stealthscale/core-theme@0.2.0

## 0.1.4

### Patch Changes

- c685a71: Points Tailwind at the kit from the stylesheet Vite actually hands it. The previous release matched the file holding `@import "tailwindcss"`, which a theme imports from its entry and Tailwind then resolves itself, off the disk: that file never reaches a transform and the entry that does never names Tailwind, so the directive was never appended and the kit's classes were still never generated. The registered appearance stylesheets are matched by path instead.

## 0.1.3

### Patch Changes

- f8fdc74: Shows a story's markup in the code panel where the story states a return type, which `explicit-function-return-type` asks every story for. The arrow was matched without one, so a reader met `(): ReactElement =>` and the whole annotation instead of the markup.
  
  Writes the values a prop takes in the props table, rather than the name of its type and the word `undefined`. Every optional prop is written `T | undefined`, and the Name column already says a prop may be left out.
- 254aed7: Reads the kit's own components when Tailwind builds. Automatic source detection skips `node_modules`, so a repository that installs the kit rather than holding its source generated none of the classes the kit draws with: a variant matrix came out with no gaps whatever its recipe said, and nothing reported it.
- 2688a94: Opens the sidebar with the Foundations pages, in the order they read. Storybook 10 keeps a story sorter and calls it from nowhere, so `parameters.options.storySort` moved nothing and the sidebar followed the index; the pages are named ahead of the workspace now, one entry each. The parameter is gone rather than left looking useful.
  
  Adds the widths a layout is decided at to the toolbar, which Storybook carries itself.

## 0.1.2

### Patch Changes

- 90027af: Gives a variant matrix room between its rows. The vertical gap doubles and the horizontal gap widens, both as multiples of the theme's own spacing, so a row of controls reads as a row rather than as one block.
- b546176: Draws a story in the appearance it pinned for itself. A story naming its own `globals` reached the provider but never the document, so `direction: 'rtl'` left the story facing the wrong way and a story asserting on it passed anyway. The appearance is written on the story's own wrapper instead, which a documentation page can carry once per story.
- Updated dependencies [e2390be]
- Updated dependencies [a4c8b78]
  - @stealthscale/tool-config@0.1.2
  - @stealthscale/core-appearance@0.1.2
  - @stealthscale/core-theme@0.1.2

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.
- Updated dependencies [2ea6c72]
  - @stealthscale/core-appearance@0.1.1
  - @stealthscale/core-logging@0.1.1
  - @stealthscale/core-result@0.1.1
  - @stealthscale/core-schema@0.1.1
  - @stealthscale/core-theme@0.1.1
  - @stealthscale/tool-config@0.1.1
  - @stealthscale/tool-workspace@0.1.1

## 0.1.0

### Minor Changes

- Derives a repository's Storybook from its workspace, and ships what a story file is written with.

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @stealthscale/core-appearance@0.1.0
  - @stealthscale/core-logging@0.1.0
  - @stealthscale/core-result@0.1.0
  - @stealthscale/core-schema@0.1.0
  - @stealthscale/core-theme@0.1.0
  - @stealthscale/tool-config@0.1.0
  - @stealthscale/tool-workspace@0.1.0
