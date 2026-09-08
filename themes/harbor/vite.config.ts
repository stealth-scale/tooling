import { defineConfig } from 'vite-plus'

import { THEME_EXPORTS, writeTheme } from '@stealthscale/core-theme/write'
import { packConfig } from '@stealthscale/tool-config'

import { recipe } from './src/recipe.ts'

/**
 * What is true of this package alone.
 *
 * `writeTheme` writes everything the theme ships and no bundler produces: the palette solved
 * from the recipe, the families it loads, the framework it runs on, the base layer, the
 * densities, the keyframes and the file an app links. `THEME_EXPORTS` names what it wrote, so
 * the list of artefacts is core-theme's rather than a copy in every theme.
 *
 * A theme extends another by extending its recipe, so this package's `dist` is complete on its
 * own and imports no other theme's stylesheet.
 */
export default defineConfig({
  pack: packConfig({
    hooks: {
      'build:before': (): void => {
        writeTheme(recipe, import.meta.url)
      },
    },
    sourceCondition: 'tooling-source',
    staticExports: THEME_EXPORTS,
  }),
})
