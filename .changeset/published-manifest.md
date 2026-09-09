---
'@stealthscale/core-appearance': patch
'@stealthscale/core-env': patch
'@stealthscale/core-locale': patch
'@stealthscale/core-logging': patch
'@stealthscale/core-result': patch
'@stealthscale/core-schema': patch
'@stealthscale/core-theme': patch
'@stealthscale/theme-base': patch
'@stealthscale/theme-ember': patch
'@stealthscale/theme-harbor': patch
'@stealthscale/theme-lumen': patch
'@stealthscale/tool-cli': patch
'@stealthscale/tool-config': patch
'@stealthscale/tool-fixtures': patch
'@stealthscale/tool-storybook': patch
'@stealthscale/tool-testing': patch
'@stealthscale/tool-workspace': patch
---

Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.
