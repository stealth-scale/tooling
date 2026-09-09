/**
 * @fileoverview Adds to the Vite configuration Storybook assembled: the workspace's own
 * modules, its export condition, the utilities a stylesheet is written with, and the reader
 * that turns a component's docblocks into its props table.
 */

import { type StorybookConfig } from '@storybook/react-vite'
import tailwind from '@tailwindcss/vite'

import { generatedGlobs, serverSourceConditions, sourceConditions } from '@stealthscale/tool-config'

import { stealthDocgen } from './docgen.ts'
import { virtualModules } from './modules.ts'
import { type Registrations } from './registrations.ts'
import { tailwindSources } from './sources.ts'

/**
 * Names the Vite configuration Storybook hands its `viteFinal`.
 */
type ViteConfig = Parameters<NonNullable<StorybookConfig['viteFinal']>>[0]

/**
 * Builds what the kit adds to the configuration Storybook assembled.
 *
 * A package's own Vite configuration inherits nothing from the repository's, so the source
 * condition is set here as well: without it every workspace package a story imports resolves
 * to what it last built, and a story would draw a stale component.
 *
 * What a build wrote is left out of the watch. A running catalogue shares a workspace with
 * whoever is running the specifications, and a coverage report is thousands of files: without
 * this, one `vp test` reloads the page once per file written.
 *
 * @param {Registrations} registered - The reading of the workspace.
 * @param {string} sourceCondition - This repository's source condition, which its own Vite
 *     config names too.
 * @returns {(vite: ViteConfig) => ViteConfig} The `viteFinal` a configuration hands Storybook.
 */
export function viteFinal(
  registered: Registrations,
  sourceCondition: string,
): (vite: ViteConfig) => ViteConfig {
  return (vite) => ({
    ...vite,
    plugins: [
      ...(vite.plugins ?? []),
      tailwindSources(registered.appearance.stylesheets),
      tailwind(),
      virtualModules(registered),
      stealthDocgen(),
    ],
    resolve: { ...vite.resolve, conditions: sourceConditions(sourceCondition) },

    // Vite keeps its own ignores and merges these on top, so `.git` and `node_modules` stay
    // out whatever is named here.
    server: {
      ...vite.server,
      watch: { ...vite.server?.watch, ignored: generatedGlobs() },
    },
    ssr: {
      ...vite.ssr,
      resolve: { ...vite.ssr?.resolve, conditions: serverSourceConditions(sourceCondition) },
    },
  })
}
