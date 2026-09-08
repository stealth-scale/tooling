import { describe, expect, it } from 'vite-plus/test'

import { NAMED } from '#named.ts'

describe('NAMED', () => {
  it('knows the 148 names CSS Color 4 lists, each packed as 0xrrggbb', () => {
    expect(Object.keys(NAMED)).toHaveLength(148)
    for (const [name, packed] of Object.entries(NAMED)) {
      expect(Number.isInteger(packed), name).toBe(true)
      expect(packed, name).toBeGreaterThanOrEqual(0)
      expect(packed, name).toBeLessThanOrEqual(0xff_ff_ff)
    }
  })

  it('reads the reference values the standard gives', () => {
    expect(NAMED['rebeccapurple']).toBe(0x66_33_99)
    expect(NAMED['white']).toBe(0xff_ff_ff)
    expect(NAMED['black']).toBe(0)
  })

  it('names each grey under both spellings, as the standard does', () => {
    expect(NAMED['gray']).toBe(NAMED['grey'])
    expect(NAMED['darkslategray']).toBe(NAMED['darkslategrey'])
  })
})
