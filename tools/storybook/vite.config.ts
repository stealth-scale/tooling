import { defineConfig } from 'vite-plus'

import { packConfig } from '@stealthscale/tool-config'

/**
 * What is true of this package alone.
 *
 * The preview imports the virtual modules the catalogue's own plugin serves, which exist
 * only inside the bundler Storybook runs. Naming them external says so: the bundler leaves
 * them as imports rather than reporting each one unresolved and externalising it anyway,
 * which is what made a deliberate import read the same as a broken one.
 */
export default defineConfig({
  pack: packConfig({ neverBundle: [/^virtual:stealth\//u], sourceCondition: 'tooling-source' }),
})
