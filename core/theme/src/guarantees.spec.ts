import { describe, expect, it } from 'vite-plus/test'

import { FILL_PAIRS, OUTLINE_PAIRS, type Pair, TEXT_PAIRS } from '#guarantees.ts'
import { CODE_TOKENS, REQUIRED_TOKENS } from '#tokens.ts'

/**
 * Writes a pair the way a failure names it.
 */
function named([on, over]: Pair): string {
  return `${over} on ${on}`
}

describe('TEXT_PAIRS', () => {
  it('names only tokens the contract defines, so a renamed token fails here first', () => {
    for (const pair of TEXT_PAIRS) {
      expect(REQUIRED_TOKENS, named(pair)).toContain(pair[0])
      expect(REQUIRED_TOKENS, named(pair)).toContain(pair[1])
    }
  })

  it('holds every syntax colour to the surface a code block sits on', () => {
    for (const token of CODE_TOKENS) {
      expect(TEXT_PAIRS).toContainEqual(['muted', token])
    }
  })

  it('names each pair once', () => {
    const written = TEXT_PAIRS.map((pair) => named(pair))

    expect(new Set(written).size).toBe(written.length)
  })
})

describe('FILL_PAIRS', () => {
  it('is a subset of the text pairs, since a label on a fill is text on a surface', () => {
    for (const pair of FILL_PAIRS) {
      expect(TEXT_PAIRS, named(pair)).toContainEqual(pair)
    }
  })
})

describe('OUTLINE_PAIRS', () => {
  it('names only tokens the contract defines', () => {
    for (const pair of OUTLINE_PAIRS) {
      expect(REQUIRED_TOKENS, named(pair)).toContain(pair[0])
      expect(REQUIRED_TOKENS, named(pair)).toContain(pair[1])
    }
  })

  it('checks each edge against the plane it is drawn on, never against itself', () => {
    for (const [on, over] of OUTLINE_PAIRS) {
      expect(over).not.toBe(on)
    }
  })
})
