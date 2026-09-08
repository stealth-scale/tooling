import { describe, expect, it } from 'vite-plus/test'

import { seededSpies, seedSpies } from './spies.ts'

/** A spy that records the name it was given, standing in for Storybook's own. */
const spy = (name: string): string => `spy:${name}`

describe('seededSpies', () => {
  it('fills in every handler the component documents and the story left out', () => {
    const seeded = seededSpies(
      { argTypes: { children: {}, onOpenChange: {}, onSelect: {}, size: {} }, initialArgs: {} },
      spy,
    )

    expect(seeded).toEqual({ onOpenChange: 'spy:onOpenChange', onSelect: 'spy:onSelect' })
  })

  it('leaves a handler the story set, which is how a story asserts on one', () => {
    const seeded = seededSpies(
      { argTypes: { onSelect: {} }, initialArgs: { onSelect: () => 'the story’s own' } },
      spy,
    )

    expect(seeded).toEqual({})
  })

  it('fills in nothing for a component that takes no handler', () => {
    expect(seededSpies({ argTypes: { onset: {}, size: {} }, initialArgs: {} }, spy)).toEqual({})
  })
})

describe('seedSpies', () => {
  it("fills in Storybook's own spy, named after the prop so the panel says which fired", () => {
    const seeded = seedSpies({ argTypes: { onSelect: {} }, initialArgs: {} })
    const filled = seeded['onSelect'] as { getMockName: () => string }

    expect(filled.getMockName()).toBe('onSelect')
  })
})
