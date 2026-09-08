/**
 * @fileoverview Draws the three families the current theme names, each in itself and named.
 * A theme is the only thing that decides a family, and the rest of this page holds the family
 * still while a scale varies, so without this a reader cannot tell which face they are looking
 * at or that the theme on the toolbar changed it.
 */

import { type CSSProperties, type JSX } from 'react'

import { CAPTION, HAIRLINE } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Sets the sentence each family is drawn with, which carries the letters a face is told apart
 * by: a double-storey a and g, a tailed y, and figures.
 */
const SAMPLE = 'Almost every large jackdaw quietly bathes; 0123456789'

/**
 * Sets one row: the role and the family on the start side, the face after it.
 */
const ROW: CSSProperties = {
  borderTop: HAIRLINE,
  display: 'grid',
  gap: '0.375rem',
  padding: '0.875rem 0',
}

/**
 * Names the three roles a theme sets a family for, and what each is drawn for.
 */
const ROLES = [
  { token: 'font-display', what: 'a heading' },
  { token: 'font-sans', what: 'body text' },
  { token: 'font-mono', what: 'code' },
] as const

/**
 * Reads the family a stack opens with, which is the face a browser draws where it has it.
 *
 * @param {string} stack - The families, as CSS lists them.
 * @returns {string} The first family, without its quotes.
 */
export function firstFamily(stack: string): string {
  const [first] = stack.split(',')
  return String(first)
    .trim()
    .replaceAll(/^['"]|['"]$/gu, '')
}

/**
 * Draws each family the theme names, set in itself.
 *
 * The specimen reads `var(--font-*)` rather than the name beside it, so a family the browser
 * failed to load shows here as the fallback it fell back to rather than as a name that lies.
 *
 * @returns {JSX.Element} One row per role: what it is for, the family, and the face.
 */
export function Families(): JSX.Element {
  return (
    <Themed>
      {({ title, tokens }: CurrentTheme) => (
        <div style={{ borderBottom: HAIRLINE, margin: '1.5rem 0' }}>
          <p style={{ ...CAPTION, fontSize: '0.8125rem', margin: '0 0 0.5rem' }}>
            <strong data-slot="theme">{title}</strong> names these. Move the <strong>Theme</strong>{' '}
            toolbar and every specimen on this page is reset in its faces.
          </p>
          {ROLES.map(({ token, what }) => (
            <div data-slot="family" key={token} style={ROW}>
              <div style={CAPTION}>
                <span data-slot="role">{token}</span> <span style={{ opacity: 0.7 }}>{what}</span>
                <br />
                <span data-slot="named">{firstFamily(tokens[token])}</span>
              </div>
              <span
                style={{
                  color: 'var(--foreground)',
                  fontFamily: `var(--${token})`,
                  fontSize: '1.5rem',
                }}
              >
                {SAMPLE}
              </span>
            </div>
          ))}
        </div>
      )}
    </Themed>
  )
}
