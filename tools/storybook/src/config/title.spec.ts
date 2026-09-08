import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import { titleOf } from './title.ts'

/** A workspace root, absolute, that no case reads from disk. */
const ROOT = join('/', 'ws')

/**
 * Titles a story file under a package, both given relative to the workspace root.
 */
function titleFor(directory: string, file: string): string | undefined {
  return titleOf(join(ROOT, directory, file), join(ROOT, directory), ROOT)
}

describe('titleOf', () => {
  it('names the group, the package and what sits below its source', () => {
    expect(titleFor('components/library', 'src/button/button.stories.tsx')).toBe(
      'Components/Library/Button',
    )
    expect(titleFor('tools/storybook', 'src/story/grid.stories.tsx')).toBe(
      'Tools/Storybook/Story/Grid',
    )
  })

  it('joins a package that sits deeper than one directory into one section', () => {
    expect(titleFor('plugins/identity/web', 'src/account/account.stories.tsx')).toBe(
      'Plugins/Identity Web/Account',
    )
  })

  it('writes a dashed directory as separate words', () => {
    expect(titleFor('components/data-display', 'src/org-chart/org-chart.stories.tsx')).toBe(
      'Components/Data Display/Org Chart',
    )
  })

  it('names a component once when its file repeats its directory', () => {
    expect(titleFor('components/library', 'src/button/button.stories.tsx')).toBe(
      'Components/Library/Button',
    )
    expect(titleFor('components/library', 'src/button/group.stories.tsx')).toBe(
      'Components/Library/Button/Group',
    )
  })

  it('titles a story that sits straight under the source', () => {
    expect(titleFor('foundations/theme', 'src/colours.mdx')).toBe('Foundations/Theme/Colours')
  })

  it('takes every extension off, however many the file carries', () => {
    expect(titleFor('components/library', 'src/button/button.stories.tsx')).toBe(
      titleFor('components/library', 'src/button/button.mdx'),
    )
  })

  it('refuses a file outside the package, and a package outside the workspace', () => {
    expect(titleOf(join(ROOT, 'elsewhere/x.stories.tsx'), join(ROOT, 'core/schema'), ROOT)).toBe(
      undefined,
    )
    expect(titleOf(join('/', 'other/x.stories.tsx'), join('/', 'other'), ROOT)).toBe(undefined)
  })

  it('refuses the workspace root itself, which is no package', () => {
    expect(titleOf(join(ROOT, 'src/x.stories.tsx'), ROOT, ROOT)).toBe(undefined)
  })

  it('refuses a story that does not sit under the package source', () => {
    expect(titleFor('components/library', 'stories/button.stories.tsx')).toBe(undefined)
    expect(titleFor('components/library', 'src')).toBe(undefined)
  })
})
