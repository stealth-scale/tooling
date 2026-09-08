import { defineConfig } from 'vite-plus'

import { packConfig } from '@stealthscale/tool-config'

/**
 * What is true of this package alone.
 *
 * The package is named for where it sits in the tree and the command it installs is named
 * `stealth`, so the pack step is told which is which; left to itself it names the command
 * after the package. Nothing else is here: the repository is linted, formatted and tested
 * from the root, and a run's cache is a root setting that a package may not carry.
 */
export default defineConfig({
  pack: packConfig({ bin: { stealth: './src/bin/stealth.ts' } }),
})
