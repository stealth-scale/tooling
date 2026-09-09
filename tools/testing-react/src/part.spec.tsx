import { describe, expect, it } from 'vite-plus/test'

import { part } from './part.ts'

describe('part', () => {
  it('finds the element marked with the slot, and names the slot it could not find', () => {
    const container = document.createElement('div')
    const badge = document.createElement('span')
    badge.dataset['slot'] = 'badge'
    container.append(badge)
    expect(part(container, 'badge')).toBe(badge)
    expect(() => part(container, 'nothing')).toThrow('No [data-slot="nothing"]')
  })
})
