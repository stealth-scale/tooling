import { writeFileSync } from 'node:fs'
import { defineConfig } from 'vite-plus'

import { emitDensities, emitMotion, emitTailwind } from '@stealthscale/core-theme'
import { writeTheme } from '@stealthscale/core-theme/write'
import { packConfig } from '@stealthscale/tool-config'

import { recipe } from './src/recipe.ts'

/**
 * Writes everything this theme ships that no bundler produces: the palette solved from the
 * recipe, the densities, the motion vocabulary, and the Tailwind every stealth theme runs on.
 *
 * It runs inside the pack rather than from a script beside it. The task runner caches a
 * script by its inputs and knows nothing about what it wrote, so a second run replays the log
 * and leaves the directory empty; the pack is a step it already tracks.
 *
 * The three that follow no palette are written here rather than in another theme because they
 * are the same whatever the recipe solves to, and this is the theme every other theme extends.
 */
function writeArtefacts(): void {
  writeTheme(recipe, import.meta.url)
  writeFileSync(new URL('./dist/density.css', import.meta.url), emitDensities())
  writeFileSync(new URL('./dist/motion.css', import.meta.url), emitMotion())
  writeFileSync(new URL('./dist/tailwind.css', import.meta.url), emitTailwind())
}

/**
 * What is true of this package alone.
 *
 * `./index.css` is the whole thing, which an app drawing this theme links and nothing else.
 *
 * `./base.css` is the half no palette computes: Tailwind, the fonts, the variants, the motion
 * vocabulary, the densities and the base layer. A theme extending this one imports it and
 * then its own tokens, which is the whole of extending a theme.
 *
 * `./tokens.css` is this theme's custom properties on the document, and `./scoped.css` the
 * same behind `[data-theme]`, for a page drawing several themes at once.
 */
export default defineConfig({
  pack: packConfig({
    copy: [{ from: 'src/*.css', to: 'dist' }],
    hooks: { 'build:before': writeArtefacts },
    sourceCondition: 'tooling-source',
    staticExports: {
      './base.css': './dist/base.css',
      './density.css': './dist/density.css',
      './index.css': './dist/index.css',
      './motion.css': './dist/motion.css',
      './scoped.css': './dist/scoped.css',
      './tailwind.css': './dist/tailwind.css',
      './tokens.css': './dist/tokens.css',
      './values': './dist/values.mjs',
    },
  }),
})
