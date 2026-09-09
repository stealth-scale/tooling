---
'@stealthscale/tool-storybook': patch
---

Shows a story's markup in the code panel where the story states a return type, which `explicit-function-return-type` asks every story for. The arrow was matched without one, so a reader met `(): ReactElement =>` and the whole annotation instead of the markup.

Writes the values a prop takes in the props table, rather than the name of its type and the word `undefined`. Every optional prop is written `T | undefined`, and the Name column already says a prop may be left out.
