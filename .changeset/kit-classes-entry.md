---
'@stealthscale/tool-storybook': patch
---

Points Tailwind at the kit from the stylesheet Vite actually hands it. The previous release matched the file holding `@import "tailwindcss"`, which a theme imports from its entry and Tailwind then resolves itself, off the disk: that file never reaches a transform and the entry that does never names Tailwind, so the directive was never appended and the kit's classes were still never generated. The registered appearance stylesheets are matched by path instead.
