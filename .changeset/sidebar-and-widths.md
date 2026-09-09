---
'@stealthscale/tool-storybook': patch
---

Opens the sidebar with the Foundations pages, in the order they read. Storybook 10 keeps a story sorter and calls it from nowhere, so `parameters.options.storySort` moved nothing and the sidebar followed the index; the pages are named ahead of the workspace now, one entry each. The parameter is gone rather than left looking useful.

Adds the widths a layout is decided at to the toolbar, which Storybook carries itself.
