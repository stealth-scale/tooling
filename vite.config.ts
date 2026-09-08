import { defineConfig } from 'vite-plus'

// By relative path, not by name: the source condition that resolves a workspace package to
// its source is set by the config being loaded, so this one file cannot use it. Every other
// repository imports the same builders as `@stealthscale/tool-config`.
import { lintConfig, stealthDefaults, testConfig } from './tools/config/src/index.ts'

/**
 * The workspace, configured once.
 *
 * Everything true of every stealth repository is `stealthDefaults`. What is true only of this
 * one is a block replaced beside it, built by that block's own function.
 */
export default defineConfig({
  ...stealthDefaults,

  // Nothing here renders, so no `web` globs and no jsdom project — the defaults already leave
  // both out. `tools/` is where the console is the interface rather than a leftover.
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
    ],
  }),

  // The `stealth` bin hands its command to citty and decides nothing, so there is nothing in
  // it to specify; the command it starts is specified in full beside it.
  test: testConfig({ uncovered: ['tools/cli/src/bin/**'] }),
})
