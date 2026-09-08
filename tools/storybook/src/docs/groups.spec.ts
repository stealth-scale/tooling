import { describe, expect, it } from 'vite-plus/test'

import { COLOR_TOKENS, SURFACE_TOKENS } from '@stealthscale/core-theme'

import { type TokenGroup, tokensOf } from './groups.ts'

/** Every group a page may name. */
const GROUPS: readonly TokenGroup[] = [
  'chart',
  'code',
  'effect',
  'emphasis',
  'gradient',
  'outline',
  'shadow',
  'sidebar',
  'status',
  'surface',
]

describe('tokensOf', () => {
  it('answers the contract’s own list for a group', () => {
    expect(tokensOf('surface')).toBe(SURFACE_TOKENS)
  })

  it('covers every colour token once across the groups, so no token is left off a page', () => {
    const named = GROUPS.flatMap((group) => tokensOf(group))

    expect(named.toSorted()).toEqual([...COLOR_TOKENS].toSorted())
  })
})
