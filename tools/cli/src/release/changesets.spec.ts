import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'

import { scratchWorkspace } from '@stealthscale/tool-testing'

import type { Manifest } from '../workspace/manifests.ts'
import { tagEvent, writeTagEvents } from './changesets.ts'

/** A manifest with the two fields a tag is built from. */
function manifest(name: string, version: string): Manifest {
  return { name, version } as Manifest
}

describe('tagEvent', () => {
  it('tags a package with its name and its version', () => {
    expect(tagEvent(manifest('@t/ui', '0.1.0'))).toEqual({
      packageName: '@t/ui',
      tag: '@t/ui@0.1.0',
      type: 'git-tag',
    })
  })
})

describe('writeTagEvents', () => {
  it('writes one JSON object per line', () => {
    const workspace = scratchWorkspace()
    const file = workspace.path('out.ndjson')

    writeTagEvents(file, [tagEvent(manifest('@t/a', '1.0.0')), tagEvent(manifest('@t/b', '2.0.0'))])

    expect(readFileSync(file, 'utf8')).toBe(
      '{"packageName":"@t/a","tag":"@t/a@1.0.0","type":"git-tag"}\n' +
        '{"packageName":"@t/b","tag":"@t/b@2.0.0","type":"git-tag"}\n',
    )
    workspace.remove()
  })

  it('writes the file empty for a run that published nothing, so the action reads it', () => {
    const workspace = scratchWorkspace()
    const file = workspace.path('out.ndjson')

    writeTagEvents(file, [])

    expect(readFileSync(file, 'utf8')).toBe('')
    workspace.remove()
  })
})
