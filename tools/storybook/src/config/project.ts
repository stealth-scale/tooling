/**
 * @fileoverview Runs every story as a test. A story already renders the component, drives it
 * and asserts what a reader sees, so the suite plays it in a real browser rather than a
 * second specification restating the same scene in jsdom.
 */

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { type UserConfig } from 'vite-plus'
import { playwright } from 'vite-plus/test/browser-playwright'

import { CONFIG_DIR } from './directory.ts'

/**
 * Names one entry of a vite-plus config's test projects.
 */
type TestProject = NonNullable<NonNullable<UserConfig['test']>['projects']>[number]

/**
 * Describes what a repository may change about how its stories run.
 */
export interface ProjectOptions {
  /**
   * Names Storybook's configuration directory, relative to the config that declares the
   * project. Default: `.storybook`.
   */
  configDir?: string

  /**
   * Sets the toolbar globals every story in this project runs under, such as one theme.
   * Declare the project twice with different values to run the set twice.
   */
  initialGlobals?: Readonly<Record<string, unknown>>
}

/**
 * Builds the project that plays every story in a browser.
 *
 * Chromium is the one browser, because a story asserts what the design system draws rather
 * than what a rendering engine disagrees about. The plugin applies the kit's own
 * preview annotations itself, so nothing here loads a setup file.
 *
 * @param {Readonly<ProjectOptions>} options - The settings this repository changes; every
 *     member is documented on `ProjectOptions`.
 * @returns {TestProject} The project, to pass to `testConfig` under `projects`.
 */
export function storiesProject(options: Readonly<ProjectOptions> = {}): TestProject {
  return {
    extends: true,
    plugins: [
      storybookTest({
        configDir: options.configDir ?? CONFIG_DIR,
        ...(options.initialGlobals === undefined
          ? {}
          : { initialGlobals: { ...options.initialGlobals } }),
      }),
    ],
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: 'chromium' }],
        provider: playwright(),
      },
      name: 'stories',
    },
  }
}
