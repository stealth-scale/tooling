/**
 * @fileoverview Builds a repository's Storybook configuration out of its workspace. Which
 * packages hold stories, where each story sits in the sidebar and which of them the sidebar
 * shows are all answered by the tree, so a repository states none of it and nothing falls
 * behind when a package is added or moved.
 */

import { type StorybookConfig } from '@storybook/react-vite'
import { existsSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import remarkGfm from 'remark-gfm'

import {
  expandWorkspacePattern,
  workspacePatterns,
  workspaceRoot,
} from '@stealthscale/tool-workspace'

import { FOUNDATIONS } from '#pages.ts'

import { CONFIG_DIR } from './directory.ts'
import { derivedIndexers } from './indexer.ts'
import { registrations } from './registrations.ts'
import { viteFinal } from './vite.ts'

/**
 * Names the addons every stealth Storybook draws with, which a repository installs beside
 * `storybook`, since Storybook resolves an addon from the repository and holds every one to
 * its own version.
 */
const ADDONS = [
  {
    name: '@storybook/addon-docs',
    options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
  },
  '@storybook/addon-a11y',
  '@storybook/addon-vitest',
  'storybook-addon-pseudo-states',
]

/**
 * Names the files that hold a story or a page.
 */
const FILES = '**/*.@(stories.tsx|mdx)'

/**
 * Names the files that hold one of the kit's own pages.
 */
const PAGE_FILES = '*.mdx'

/**
 * Names the directory the kit keeps its pages in, below the package root.
 */
const PAGES_DIRECTORY = 'docs'

/**
 * Names one place Storybook looks for stories.
 */
type StoriesEntry = Extract<NonNullable<StorybookConfig['stories']>, readonly unknown[]>[number]

/**
 * Describes what a repository may change about its Storybook.
 */
export interface ConfigOptions {
  /**
   * Lists addons appended after the shared ones.
   */
  addons?: readonly string[]

  /**
   * Names the directory this configuration is loaded from, relative to the workspace root.
   * Storybook reads every place it looks for stories relative to it. Default: `.storybook`.
   */
  configDir?: string

  /**
   * Names the workspace to read. Default: the one the command was run in.
   */
  root?: string

  /**
   * Lists directories served beside the stories, such as fonts or a fixture's images.
   */
  staticDirs?: readonly string[]

  /**
   * Narrows where the stories are, each directory relative to the configuration directory,
   * as Storybook reads it. Default: every workspace package's `src`. The kit's own pages are
   * found either way.
   */
  stories?: readonly StoriesEntry[]
}

/**
 * Names this module's file, from which the rest of the package is found.
 *
 * The package is laid out the same way beside its source and beside what was packed: this
 * module two directories below the package root, the preset one, and the pages in `docs` at
 * the root. Only the extension differs, and it is read off this file rather than assumed.
 *
 * @returns {string} This module's path, absolute.
 */
function here(): string {
  return import.meta.filename
}

/**
 * Names the preset Storybook registers the kit's preview and manager through.
 *
 * @returns {string} The preset's path, absolute, with the extension this layout uses.
 */
export function presetPath(): string {
  const file = here()
  return join(file, '..', '..', `preset${extname(file)}`)
}

/**
 * Names the directory the kit's own pages sit in.
 *
 * @returns {string} The directory, absolute.
 */
export function pagesDirectory(): string {
  return join(here(), '..', '..', '..', PAGES_DIRECTORY)
}

/**
 * Derives where Storybook looks for stories, from the packages the workspace names.
 *
 * Each package is named as a directory of its own rather than as one glob with a wildcard in
 * it, because Storybook builds a story's fallback title from the directory it was found
 * under, and it cannot do that from a path whose directory is a pattern. Each is written
 * relative to the configuration directory, which is how Storybook and its test runner read
 * one.
 *
 * @param {string} root - The workspace root, absolute.
 * @param {string} configDir - The configuration directory, absolute.
 * @returns {StoriesEntry[]} One entry per workspace package that keeps a `src`, in the order
 *     the root names its patterns.
 */
function storiesIn(root: string, configDir: string): StoriesEntry[] {
  return workspacePatterns(root)
    .flatMap((pattern) => expandWorkspacePattern(root, pattern))
    .map((directory) => join(directory, 'src'))
    .filter((source) => existsSync(source))
    .map((directory) => ({ directory: relative(configDir, directory), files: FILES }))
}

/**
 * Builds the configuration a repository's Storybook runs on.
 *
 * Everything it needs is in the workspace already: which packages hold stories, and where
 * each one belongs in the sidebar. A repository that wants none of the derivation writes its
 * own configuration instead; one that wants most of it passes what differs.
 *
 * @param {Readonly<ConfigOptions>} options - The settings this repository changes; every
 *     member is documented on `ConfigOptions`, and anything absent is derived.
 * @returns {StorybookConfig} The configuration, ready to be the default export of
 *     `.storybook/main.ts`.
 * @throws {Error} When a package registers something Storybook cannot draw, naming every
 *     field at fault. A Storybook that started anyway would draw the wrong thing quietly.
 */
export function storybookConfig(options: Readonly<ConfigOptions> = {}): StorybookConfig {
  const root = options.root ?? workspaceRoot(process.cwd())
  const configDir = resolve(root, options.configDir ?? CONFIG_DIR)
  const read = registrations(root)
  if (!read.ok) {
    const refusals = read.failure.map((issue) => `${issue.path}: ${issue.reason}`)
    throw new Error(`The workspace registers what Storybook cannot draw:\n${refusals.join('\n')}`)
  }
  // Storybook indexes a page written in MDX itself and titles it after its file, under the
  // prefix this entry names, which is how every page lands under the first section.
  const pages = { directory: relative(configDir, pagesDirectory()), files: PAGE_FILES }

  return {
    addons: [presetPath(), ...ADDONS, ...(options.addons ?? [])],
    core: { disableTelemetry: true, disableWhatsNewNotifications: true },
    docs: { defaultName: 'Docs' },
    experimental_indexers: derivedIndexers(root),
    framework: '@storybook/react-vite',
    stories: [
      ...(options.stories ?? storiesIn(root, configDir)),
      { ...pages, titlePrefix: FOUNDATIONS },
    ],

    // Storybook's own reader recognises a component by the JSX it returns, which misses one
    // that renders through a render prop. `stealthDocgen` in `viteFinal` reads those too and
    // writes the same shape.
    typescript: { reactDocgen: false },

    viteFinal: viteFinal(read.value),
    ...(options.staticDirs === undefined ? {} : { staticDirs: [...options.staticDirs] }),
  }
}
