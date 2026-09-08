import { describe, expect, it } from 'vite-plus/test'

import { scratchWorkspace } from '@stealthscale/tool-testing'

import { boundName, missingDefinition, type Rewritten, stealthDocgen } from './docgen.ts'

/** The plugin's transform, in the shape these cases call it. */
type Transform = (source: string, id: string) => Rewritten | undefined

/**
 * Reads one file through the plugin and answers what it hung off it.
 */
function read(source: string, id = '/ws/components/library/src/button/button.tsx'): string {
  const transform = (stealthDocgen() as unknown as { transform: Transform }).transform
  return transform(source, id)?.code ?? ''
}

/**
 * Reads only what the plugin hung off a file, without the file's own text around it.
 */
function hung(source: string, id?: string): string {
  const written = read(source, id)
  const first = written.indexOf(';')
  return first === -1 ? '' : written.slice(first)
}

describe('boundName', () => {
  it('names the binding a declaration carries', () => {
    expect(boundName({ id: { name: 'Button' } })).toBe('Button')
  })

  it('names nothing for anything that carries no binding', () => {
    expect(boundName(null), 'a node that is nothing').toBeUndefined()
    expect(boundName({}), 'a declaration with no identifier').toBeUndefined()
    expect(boundName({ id: null }), 'an identifier that is nothing').toBeUndefined()
    expect(boundName({ id: 'Button' }), 'an identifier that is not a node').toBeUndefined()
    expect(boundName({ id: {} }), 'an identifier with no name').toBeUndefined()
    expect(boundName({ id: { name: 12 } }), 'a name that is no name').toBeUndefined()
  })
})

describe('missingDefinition', () => {
  it('recognises the one refusal that means the file holds no component', () => {
    expect(missingDefinition({ code: 'ERR_REACTDOCGEN_MISSING_DEFINITION' })).toBe(true)
  })

  it('recognises everything else as a real failure', () => {
    expect(missingDefinition(new SyntaxError('unexpected token'))).toBe(false)
    expect(missingDefinition({ code: 'ERR_SOMETHING_ELSE' })).toBe(false)
    expect(missingDefinition('a string')).toBe(false)
    expect(missingDefinition(null)).toBe(false)
  })
})

describe('stealthDocgen', () => {
  it('reads a component that returns markup, and hangs the record off its own binding', () => {
    const written = read(`
      /** Draws a button that submits, cancels or opens. */
      export function Button(props: { size?: 'small' | 'large' }) {
        return <button>{props.size}</button>
      }
    `)

    expect(written).toContain('Button.__docgenInfo=')
    expect(written).toContain('Draws a button that submits, cancels or opens.')
    expect(written, "the prop's own name reaches the table").toContain('size')
  })

  it('reads a component that returns no markup at all, where it says so', () => {
    const written = read(`
      /**
       * Draws a field that renders as whatever it is given.
       *
       * @component
       */
      export function Field(props: { render?: unknown }) {
        return useRender(props)
      }
    `)

    expect(written, 'the annotated resolver found it').toContain('Field.__docgenInfo=')
  })

  it('leaves the annotation out of what a page shows, since it is for the reader', () => {
    const record = hung(`
      /**
       * Draws a field.
       *
       * @component
       */
      export function Field(props: { render?: unknown }) {
        return useRender(props)
      }
    `)

    expect(record).toContain('Draws a field.')
    expect(record, 'the file still has it; the record does not').not.toContain('@component')
  })

  it('reads every part of a compound component, not only the first', () => {
    const written = read(`
      /** Draws the card. */
      export function Card(props: { tone?: string }) {
        return <div>{props.tone}</div>
      }

      /** Draws the card's header. */
      export function CardHeader(props: { sticky?: boolean }) {
        return <div>{props.sticky}</div>
      }
    `)

    expect(written).toContain('Card.__docgenInfo=')
    expect(written).toContain('CardHeader.__docgenInfo=')
  })

  it('leaves a file holding no component exactly as it arrived', () => {
    expect(read('export const NOTHING = 1\n'), 'no source map is paid for either').toBe('')
  })

  it('follows a plain extends into another file of the same package', () => {
    const scratch = scratchWorkspace({
      'button.tsx': [
        `import { type SharedProps } from './shared.ts'`,
        '',
        'export interface ButtonProps extends SharedProps {',
        '  /** Sets the size. */',
        "  size?: 'small' | 'large'",
        '}',
        '',
        '/** Draws a button. */',
        'export function Button(props: ButtonProps) {',
        '  return <button>{props.size}</button>',
        '}',
      ].join('\n'),
      'shared.ts': [
        'export interface SharedProps {',
        '  /** Sets the tone. */',
        "  tone?: 'quiet' | 'loud'",
        '}',
      ].join('\n'),
    })

    const record = hung(scratch.read('button.tsx'), scratch.path('button.tsx'))

    expect(record).toContain('"size"')
    expect(record, 'an inherited prop reaches the table').toContain('"tone"')
    scratch.remove()
  })

  it('hangs nothing off a component with no name to hang it on', () => {
    expect(hung('/** Draws it. */\nexport default () => <p />\n')).toBe('')
  })

  it('reports a file it cannot parse at all, rather than passing it on unread', () => {
    expect(() => read('export function Broken( {\n')).toThrow(/unexpected token/iu)
  })

  it('leaves a story, a specification and an installed package alone', () => {
    const component = '/** Draws it. */\nexport function It() { return <p /> }\n'

    expect(read(component, '/ws/src/button/button.stories.tsx')).toBe('')
    expect(read(component, '/ws/src/button/button.spec.tsx')).toBe('')
    expect(read(component, '/ws/node_modules/other/index.tsx')).toBe('')
    expect(read(component, '/ws/src/button/button.ts'), 'and anything that is not TSX').toBe('')
  })
})
