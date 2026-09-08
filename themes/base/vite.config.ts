import { defineConfig } from 'vite-plus'

import { packConfig } from '@stealthscale/tool-config'

/**
 * What is true of this package alone.
 *
 * The two stylesheets are written by `emit.ts` before the pack step runs, so no build writes
 * them and the rewrite would drop them from the exports map. Naming them keeps the paths a
 * consumer links: `./tokens.css` declares this theme's custom properties on the document, and
 * `./scoped.css` declares the same behind `[data-theme]` for a page drawing several at once.
 * Neither is a whole stylesheet: the design system's authored base comes first, and a
 * consumer imports that before either of these.
 */
export default defineConfig({
  pack: packConfig({
    sourceCondition: 'tooling-source',
    staticExports: {
      './scoped.css': './src/scoped.gen.css',
      './tokens.css': './src/tokens.gen.css',
    },
  }),
})
