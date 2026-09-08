import { describe, expect, it } from 'vite-plus/test'

import { declarations } from '#stylesheet.ts'

describe('declarations', () => {
  it('reads the first block whose selector matches, names without the dashes', () => {
    const found = declarations(
      'a { --x: 1px; }\n.b, .c { --y:  2px ; --z: calc(1px +\n 2px); }',
      '.b',
    )

    expect(found).toEqual({ y: '2px', z: 'calc(1px + 2px)' })
  })

  it('keeps the order the block wrote them in', () => {
    expect(Object.keys(declarations(':root { --b: 1; --a: 2; }', ':root'))).toEqual(['b', 'a'])
  })

  it('names the block it could not find', () => {
    expect(() => declarations('a { --x: 1px; }', '.missing')).toThrow('.missing')
  })
})
