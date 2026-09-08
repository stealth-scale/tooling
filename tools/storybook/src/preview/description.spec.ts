import { describe, expect, it } from 'vite-plus/test'

import { extractComponentDescription, prose, tagOf } from './description.ts'

/** A docblock as docgen hands it over: the sentences, then the tags. */
const DOCBLOCK = [
  'Draws a button that submits, cancels or opens.',
  '',
  'It keeps the tone’s contrast in both modes.',
  '',
  '@param {ButtonProps} props - The props. `ButtonProps` documents',
  '    every member.',
  '@returns {JSX.Element} The button element.',
].join('\n')

describe('tagOf', () => {
  it('reads what follows a tag on its own line', () => {
    expect(tagOf('Sets the size.\n\n@category Appearance\n@default default', 'category')).toBe(
      'Appearance',
    )
    expect(tagOf('Sets the size.\n\n@category Appearance\n@default default', 'default')).toBe(
      'default',
    )
  })

  it('reads nothing for a tag the docblock does not carry', () => {
    expect(tagOf('Sets the size.', 'default')).toBeUndefined()
  })
})

describe('prose', () => {
  it('keeps the sentences and drops every tag with its continuation lines', () => {
    expect(prose(DOCBLOCK)).toBe(
      'Draws a button that submits, cancels or opens.\n\nIt keeps the tone’s contrast in both modes.',
    )
  })

  it('keeps a paragraph that follows a tag after a blank line', () => {
    expect(prose('@category Appearance\n\nSets the size.')).toBe('Sets the size.')
  })

  it('leaves a docblock with no tags as it was', () => {
    expect(prose('Sets the size.')).toBe('Sets the size.')
  })
})

describe('extractComponentDescription', () => {
  it('reads the prose off a component the docgen plugin annotated', () => {
    const component = { __docgenInfo: { description: DOCBLOCK } }

    expect(extractComponentDescription(component)).toBe(
      'Draws a button that submits, cancels or opens.\n\nIt keeps the tone’s contrast in both modes.',
    )
  })

  it('reads nothing off a component with no docgen, or with a docblock of tags alone', () => {
    expect(extractComponentDescription()).toBeNull()
    expect(extractComponentDescription(null)).toBeNull()
    expect(extractComponentDescription({})).toBeNull()
    expect(extractComponentDescription({ __docgenInfo: {} })).toBeNull()
    expect(extractComponentDescription({ __docgenInfo: { description: '@component' } })).toBeNull()
  })
})
