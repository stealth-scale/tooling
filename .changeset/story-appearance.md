---
'@stealthscale/tool-storybook': patch
---

Draws a story in the appearance it pinned for itself. A story naming its own `globals` reached the provider but never the document, so `direction: 'rtl'` left the story facing the wrong way and a story asserting on it passed anyway. The appearance is written on the story's own wrapper instead, which a documentation page can carry once per story.
