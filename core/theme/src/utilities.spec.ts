import { describe, expect, it } from 'vite-plus/test'

import { HEADER } from '#css.ts'
import { emitUtilities } from '#utilities.ts'

/**
 * Reads the body of one utility, from its opening brace to the brace that closes it.
 *
 * @param {string} css - The stylesheet.
 * @param {string} name - The class to read.
 * @returns {string} Everything between the two braces.
 */
function body(css: string, name: string): string {
  const start = css.indexOf(`@utility ${name} {`)
  if (start === -1) throw new Error(`no utility ${name}`)
  const close = css.indexOf('\n}', start)
  return css.slice(css.indexOf('{', start) + 1, close)
}

/**
 * Reads the properties one utility declares. These are ordinary CSS properties rather than
 * the custom properties `declarations` reads, and a nested rule's own lines are left out.
 *
 * @param {string} name - The class to read.
 * @returns {Record<string, string>} Each property mapped to its value.
 */
function properties(name: string): Record<string, string> {
  const lines = [...body(emitUtilities(), name).matchAll(/^ {2}([a-z-]+):\s*(.+);$/gmu)]
  return Object.fromEntries(lines.map((line) => [String(line[1]), String(line[2])]))
}

describe('emitUtilities', () => {
  it('writes each class as an at-rule, which is the only form Tailwind takes a utility in', () => {
    const css = emitUtilities()

    expect(css).toContain('@utility motion-state {')
    expect(css).toContain('@utility motion-press {')
    expect(css, 'a plain class would be dropped as unused').not.toContain('.motion-state')
  })

  it('eases the individual transform properties, since Tailwind writes those and not transform', () => {
    const property = properties('motion-state')['transition-property'] ?? ''

    expect(property).toContain('transform')
    expect(property).toContain('translate')
    expect(property, 'naming transform alone left the press snapping').toContain('scale')
  })

  it('leaves the layout properties alone, so a transition never animates a reflow', () => {
    const property = properties('motion-state')['transition-property'] ?? ''

    expect(property).not.toContain('width')
    expect(property).not.toContain('height')
    expect(property, 'the shorthand is what made two components disagree').not.toContain('all')
  })

  it('runs at the theme’s own step rather than a length of its own', () => {
    const state = properties('motion-state')

    expect(state['transition-duration']).toBe('var(--duration-fast)')
    expect(state['transition-timing-function']).toBe('var(--ease-out)')
  })

  it('gives motion-press everything motion-state has, and the press on top', () => {
    const css = emitUtilities()
    const press = body(css, 'motion-press')

    expect(press).toContain(body(css, 'motion-state').trim())
    expect(press).toContain('&:active {')
    expect(press).toContain('scale: var(--press-scale);')
  })

  it('closes the nested rule with a brace and no semicolon, which would be invalid', () => {
    expect(body(emitUtilities(), 'motion-press')).not.toContain('};')
  })

  it('ends every declaration of its own with a semicolon', () => {
    const state = body(emitUtilities(), 'motion-state')
      .split('\n')
      .filter((line) => line.trim() !== '')

    expect(state.every((line) => line.endsWith(';'))).toBe(true)
  })

  it('opens with the header every generated stylesheet carries', () => {
    expect(emitUtilities().startsWith(HEADER)).toBe(true)
  })
})
