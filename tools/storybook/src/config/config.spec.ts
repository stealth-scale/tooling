import { existsSync, readdirSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import {
  packageFiles,
  type ScratchWorkspace,
  scratchWorkspace,
  workspaceFiles,
} from '@stealthscale/tool-testing'

import { PAGES } from '#pages.ts'

import { pagesDirectory, presetPath, storybookConfig } from './config.ts'

const CONDITION = 'tooling-source'

/** One entry an indexer reports, in the fields these cases read. */
interface Entry {
  [field: string]: unknown
  exportName: string
  tags?: string[]
  title?: string
  type: 'docs' | 'story'
}

/** An indexer standing in for the one Storybook brings, answering the entries given. */
function indexerFor(entries: Entry[]): { createIndex: unknown; test: RegExp } {
  return { createIndex: () => Promise.resolve(entries), test: /\.stories\.tsx$/u }
}

/** The wrapper the configuration puts around Storybook's own indexers. */
type Wrap = (
  existing: unknown,
) => { createIndex: (file: string, options: unknown) => Promise<Entry[]> }[]

/**
 * Builds the entry the configuration adds for the kit's own pages, relative to a workspace's
 * configuration directory.
 */
function pagesEntry(scratch: ScratchWorkspace): Record<string, string> {
  return {
    directory: relative(join(scratch.root, '.storybook'), pagesDirectory()),
    files: '*.mdx',
    titlePrefix: 'Foundations',
  }
}

/**
 * Builds a workspace holding one package with a `src` and one without.
 */
function workspace(): ScratchWorkspace {
  return scratchWorkspace({
    ...workspaceFiles(['components/*', 'tools/*']),
    ...packageFiles(
      'components/library',
      { name: '@t/component-library' },
      {
        'src/button/button.stories.tsx': '',
      },
    ),
    ...packageFiles('tools/cli', { name: '@t/tool-cli' }),
  })
}

/**
 * Reads the addons a configuration registers.
 */
function addonsOf(options: Parameters<typeof storybookConfig>[0]): unknown[] {
  return storybookConfig(options).addons ?? []
}

/**
 * Runs the configuration's indexer over the entries given, for a file at a path.
 */
async function indexed(
  scratch: ScratchWorkspace,
  file: string,
  entries: Entry[],
): Promise<Entry[]> {
  const wrap = storybookConfig({ root: scratch.root, sourceCondition: CONDITION })
    .experimental_indexers as unknown as Wrap
  const [wrapped] = wrap([indexerFor(entries)])

  return (await wrapped?.createIndex(file, {})) ?? []
}

describe('storybookConfig', () => {
  it('looks for stories in every package that keeps a source, and in its own pages', () => {
    const scratch = workspace()

    const { stories } = storybookConfig({ root: scratch.root, sourceCondition: CONDITION })

    expect(stories).toEqual([
      { directory: '../components/library/src', files: '**/*.@(stories.tsx|mdx)' },
      pagesEntry(scratch),
    ])
    scratch.remove()
  })

  it('writes every place relative to the directory a repository names for its configuration', () => {
    const scratch = workspace()

    const { stories } = storybookConfig({
      configDir: 'storybook/config',
      root: scratch.root,
      sourceCondition: CONDITION,
    })

    expect(stories).toEqual([
      { directory: '../../components/library/src', files: '**/*.@(stories.tsx|mdx)' },
      {
        directory: relative(scratch.path('storybook/config'), pagesDirectory()),
        files: '*.mdx',
        titlePrefix: 'Foundations',
      },
    ])
    scratch.remove()
  })

  it('takes the places a repository names instead of deriving them, pages included', () => {
    const scratch = workspace()
    const own = [{ directory: '../elsewhere', files: '**/*.stories.tsx' }]

    expect(
      storybookConfig({ root: scratch.root, sourceCondition: CONDITION, stories: own }).stories,
    ).toEqual([...own, pagesEntry(scratch)])
    scratch.remove()
  })

  it('registers its own preset first, then the shared addons, then what a repository adds', () => {
    const scratch = workspace()

    const shared = addonsOf({ root: scratch.root, sourceCondition: CONDITION })
    const extended = addonsOf({
      addons: ['my-addon'],
      root: scratch.root,
      sourceCondition: CONDITION,
    })

    expect(shared[0]).toBe(presetPath())
    expect(shared).toContain('@storybook/addon-a11y')
    expect(extended.at(-1)).toBe('my-addon')
    expect(extended).toHaveLength(shared.length + 1)
    scratch.remove()
  })

  it('reports nothing outward and serves nothing extra unless asked', () => {
    const scratch = workspace()

    const bare = storybookConfig({ root: scratch.root, sourceCondition: CONDITION })
    const serving = storybookConfig({
      root: scratch.root,
      sourceCondition: CONDITION,
      staticDirs: ['./public'],
    })

    expect(bare.core).toEqual({ disableTelemetry: true, disableWhatsNewNotifications: true })
    expect(bare.staticDirs).toBeUndefined()
    expect(serving.staticDirs).toEqual(['./public'])
    scratch.remove()
  })

  it('titles an entry from where its file sits, and drops the id worked out from the old one', async () => {
    const scratch = workspace()

    const [entry] = await indexed(
      scratch,
      scratch.path('components/library/src/button/button.stories.tsx'),
      [
        {
          ['__id']: 'button--playground',
          exportName: 'Playground',
          title: 'button',
          type: 'story',
        },
      ],
    )

    expect(entry?.title).toBe('Components/Library/Button')
    expect(entry, 'the id follows the title Storybook shows').not.toHaveProperty('__id')
    scratch.remove()
  })

  it("keeps the indexer's own title for a file the taxonomy does not describe", async () => {
    const scratch = workspace()

    const [entry] = await indexed(
      scratch,
      scratch.path('components/library/elsewhere.stories.tsx'),
      [{ ['__id']: 'kept', exportName: 'Playground', title: 'Kept', type: 'story' }],
    )

    expect(entry?.title).toBe('Kept')
    expect(entry?.['__id']).toBe('kept')
    scratch.remove()
  })

  it('shows the Playground in the sidebar and hides every other story', async () => {
    const scratch = workspace()

    const entries = await indexed(
      scratch,
      scratch.path('components/library/src/button/button.stories.tsx'),
      [
        { exportName: 'Playground', type: 'story' },
        { exportName: 'InRightToLeft', type: 'story' },
        { exportName: 'Docs', type: 'docs' },
      ],
    )

    expect(entries.map(({ tags }) => tags)).toEqual([[], ['!dev'], []])
    scratch.remove()
  })

  it('refuses a story file with no Playground, naming the file', async () => {
    const scratch = workspace()
    const file = scratch.path('components/library/src/button/button.stories.tsx')

    await expect(
      indexed(scratch, file, [{ exportName: 'Example', type: 'story' }]),
    ).rejects.toThrow(`${file} exports no Playground`)
    scratch.remove()
  })

  it('reads the workspace the command was run in when a repository names none', () => {
    const { stories } = storybookConfig({ sourceCondition: CONDITION })

    expect(
      stories,
      'this repository, found by walking up from the working directory',
    ).toContainEqual({ directory: '../tools/storybook/src', files: '**/*.@(stories.tsx|mdx)' })
  })

  it('carries the workspace and the source condition into what Storybook assembled', () => {
    const scratch = workspace()
    const final = storybookConfig({ root: scratch.root, sourceCondition: CONDITION })
      .viteFinal as unknown as (config: Record<string, unknown>) => {
      plugins: { name?: string }[]
      resolve: { conditions: string[] }
    }

    const vite = final({ plugins: [{ name: 'storybook:its-own' }] })

    expect(
      vite.plugins.map(({ name }) => name),
      'its own first, then ours',
    ).toContain('stealth:modules')
    expect(vite.plugins[0]?.name).toBe('storybook:its-own')
    expect(vite.resolve.conditions[0], "a story reads a package's source").toBe(CONDITION)
    expect(final({}).plugins, 'a configuration carrying no plugins of its own').not.toHaveLength(0)
    scratch.remove()
  })

  it('refuses to configure a Storybook for a workspace that registers what it cannot draw', () => {
    const scratch = scratchWorkspace({
      ...workspaceFiles(['themes/*']),
      ...packageFiles('themes/broken', { name: '@t/theme-broken', stealth: { theme: {} } }),
    })

    expect(() => storybookConfig({ root: scratch.root, sourceCondition: CONDITION })).toThrow(
      'Storybook cannot draw',
    )
    scratch.remove()
  })

  it('wraps nothing when Storybook hands it no indexers', () => {
    const scratch = workspace()
    const wrap = storybookConfig({ root: scratch.root, sourceCondition: CONDITION })
      .experimental_indexers as (existing: unknown) => unknown[]

    expect(wrap('nothing to wrap')).toEqual([])
    scratch.remove()
  })
})

describe('presetPath', () => {
  it('names the preset beside this layout, as a file that exists', () => {
    expect(basename(presetPath())).toBe('preset.ts')
    expect(existsSync(presetPath()), 'Storybook loads it from this path').toBe(true)
  })
})

describe('pagesDirectory', () => {
  it('holds exactly the pages the kit names, one file per page', () => {
    const files = readdirSync(pagesDirectory()).toSorted()

    expect(files).toEqual(PAGES.map((page) => `${page}.mdx`).toSorted())
  })
})
