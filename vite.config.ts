import { defineConfig } from 'vite-plus'

// By relative path, not by name: the source condition that resolves a workspace package to
// its source is set by the config being loaded, so this one file cannot use it. Every other
// repository imports the same builders as `@stealthscale/tool-config` and
// `@stealthscale/tool-storybook/config`.
import { lintConfig, runConfig, stealthDefaults, testConfig } from './tools/config/src/index.ts'
import { storiesProject } from './tools/storybook/src/config/index.ts'

/**
 * Configures this workspace once, at its root.
 *
 * `stealthDefaults` carries everything true of every stealth repository. A block replaced
 * beside it, built by that block's own function, carries what is true only of this one.
 */
export default defineConfig({
  ...stealthDefaults({ sourceCondition: 'tooling-source' }),

  // Only the story kit renders, so it alone takes the `web` rules; `tools/` is where the
  // console is the interface rather than a leftover.
  lint: lintConfig({
    layers: [
      {
        because: 'a core package is what a tool builds on, so nothing in core imports a tool',
        except: ['@stealthscale/tool-testing'],
        files: ['core/**'],
        forbid: ['@stealthscale/tool-*'],
      },
    ],
    node: ['tools/**'],
    overrides: [
      {
        // valibot exports `_addIssue`, underscore and all, as the way a custom action reports;
        // `core/schema` owns valibot, so it is the one package that calls it.
        files: ['core/schema/**'],
        rules: { 'no-underscore-dangle': ['error', { allow: ['_addIssue'] }] },
      },
      {
        // The package that refuses a `javascript:` URL has to name one to prove it does.
        files: ['core/schema/src/urls.spec.ts'],
        rules: { 'no-script-url': 'off' },
      },
      {
        // Storybook loads a preview and a manager entry by their default export, the way it
        // loads a configuration file. These two are that, written as package source because
        // every repository imports them by name rather than writing them itself.
        files: ['tools/storybook/src/preview/index.ts', 'tools/storybook/src/manager.ts'],
        rules: { 'no-default-export': 'off' },
      },
      {
        // `__docgenInfo` is the property Storybook's own docs blocks read a component's props
        // table from, underscores and all. The kit writes it and reads it back.
        files: ['tools/storybook/src/**'],
        rules: { 'no-underscore-dangle': ['error', { allow: ['__docgenInfo', '__id'] }] },
      },
    ],
    web: ['tools/storybook/**'],
  }),

  // This repository's Storybook loads the packed kit, whose preview sits under `dist`, which
  // Vite's dependency scanner never crawls. Naming the preview's source here lets the scanner
  // reach everything the preview imports before the first story loads, instead of finding it
  // mid-run and reloading the story. Only the story project optimizes dependencies, so the
  // other projects ignore this. A consumer's kit sits under `node_modules`, which the
  // scanner does crawl.
  optimizeDeps: { entries: ['tools/storybook/src/preview/index.ts'] },

  // This repository ships the Storybook kit, and its own Storybook is the first consumer of it.
  run: runConfig({ storybook: true }),

  test: testConfig({
    dom: true,
    projects: [storiesProject()],
    uncovered: [
      // The bin hands its command to citty and decides nothing.
      'tools/cli/src/bin/**',

      // The two modules Storybook loads by their default export. They import the kit's own
      // virtual modules, which exist only inside the bundler Storybook runs, so nothing
      // outside Storybook can load them. What they call is specified beside them.
      'tools/storybook/src/preview/index.ts',
      'tools/storybook/src/manager.ts',
    ],
  }),
})
