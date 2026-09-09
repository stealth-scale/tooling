# @stealthscale/tool-storybook

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
