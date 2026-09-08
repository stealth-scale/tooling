import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { defineConfig } from 'vite-plus'
import { playwright } from 'vite-plus/test/browser-playwright'

// By relative path, not by name: the source condition that resolves a workspace package to
// its source is set by the config being loaded, so this one file cannot use it. Every other
// repository imports the same builders as `@stealthscale/tool-config`.
import { lintConfig, stealthDefaults, testConfig } from './tools/config/src/index.ts'

/**
 * Configures this workspace once, at its root.
 *
 * `stealthDefaults` carries everything true of every stealth repository. A block replaced
 * beside it, built by that block's own function, carries what is true only of this one.
 */
export default defineConfig({
  ...stealthDefaults,

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
    ],
    web: ['tools/storybook/**'],
  }),

  // The `stealth` bin hands its command to citty and decides nothing, so there is nothing in
  // it to specify; the command it starts is specified in full beside it.
  test: testConfig({
    dom: true,
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: 'tools/storybook/.storybook' })],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: 'chromium' }],
            provider: playwright(),
          },
          name: 'stories',
        },
      },
    ],
    uncovered: ['tools/cli/src/bin/**'],
  }),
})
