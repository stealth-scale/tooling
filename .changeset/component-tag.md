---
'@stealthscale/tool-config': patch
---

Allows `@component` in a docblock. react-docgen recognises a component by the JSX it returns and so cannot see one drawn through `useRender`; the Storybook kit reads that tag to catch those. The tag list refused it, which left a component needing the annotation as a lint error and a component without it as an empty props table.
