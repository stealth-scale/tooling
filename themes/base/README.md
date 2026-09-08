# @stealthscale/theme-base

A library: somebody installs it on its own.

Solves the neutral theme a stealth product starts from, and ships it three ways:
`./tokens.css` declares its custom properties on the document, `./scoped.css` declares the
same behind `[data-theme='base']` for a page drawing several at once, and the barrel exports
the solved table for whatever reads a theme as data rather than as CSS.

None of them is a whole stylesheet. A theme is custom properties; the authored base that
reads them, with Tailwind, the fonts and the variants, is the design system's, and a
consumer imports that first.

The palette is solved once, when this package is built. A consumer carries no solver, every
consumer reads the same table, and a recipe that cannot be drawn fails this package's build
naming the field or the token.

`src/recipe.ts` is the whole theme. Everything else under `src` is written by `emit.ts` and
is not committed.
