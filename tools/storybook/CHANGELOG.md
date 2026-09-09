# @stealthscale/tool-storybook

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
