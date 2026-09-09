---
'@stealthscale/tool-storybook': patch
---

Reads the kit's own components when Tailwind builds. Automatic source detection skips `node_modules`, so a repository that installs the kit rather than holding its source generated none of the classes the kit draws with: a variant matrix came out with no gaps whatever its recipe said, and nothing reported it.
