/**
 * @fileoverview Draws the tokens that are read rather than looked at: each edge as the thing
 * it edges, and the syntax colours as code on the one surface they are solved for.
 */

import { type CSSProperties, type JSX } from 'react'

import { CODE_TOKENS, OUTLINE_TOKENS, type TokenName } from '@stealthscale/core-theme'

import { CAPTION, CORNER, GRID, HAIRLINE, MONO } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Names one syntax role's token.
 */
type CodeToken = (typeof CODE_TOKENS)[number]

/**
 * Names one outline token.
 */
type OutlineToken = (typeof OUTLINE_TOKENS)[number]

/**
 * Describes one edge to draw.
 */
interface EdgeProps {
  /**
   * Names the token.
   */
  token: OutlineToken

  /**
   * Carries every token of the theme, for the surfaces the edge sits on.
   */
  tokens: Readonly<Record<TokenName, string>>
}

/**
 * Draws one edge token as the thing it edges: a card, a field, or a focused control.
 *
 * @param {EdgeProps} props - The token and the theme. `EdgeProps` documents every member.
 * @returns {JSX.Element} The edge, labelled.
 */
function Edge({ token, tokens }: EdgeProps): JSX.Element {
  const box: CSSProperties = { blockSize: '2.5rem', borderRadius: CORNER, inlineSize: '100%' }

  // Total over the outline tokens, so an edge added to the contract has to say how it is drawn.
  const drawn: Readonly<Record<OutlineToken, CSSProperties>> = {
    border: { ...box, background: tokens.card, border: `1px solid ${tokens.border}` },
    input: { ...box, background: 'transparent', border: `1px solid ${tokens.input}` },
    ring: {
      ...box,
      background: tokens.card,
      boxShadow: `0 0 0 2px ${tokens.background}, 0 0 0 4px ${tokens.ring}`,
    },
  }

  return (
    <div data-slot="edge" style={{ display: 'grid', gap: '0.5rem' }}>
      <div style={{ padding: '0.25rem' }}>
        <div style={drawn[token]} />
      </div>
      <div style={{ display: 'grid', gap: '0.125rem' }}>
        <code style={{ ...MONO, fontSize: '0.8125rem' }}>{token}</code>
        <span style={CAPTION}>{tokens[token]}</span>
      </div>
    </div>
  )
}

/**
 * Draws the outline tokens, each as the edge it draws.
 *
 * @returns {JSX.Element} A border on a card, a field's outline, and a focus ring.
 */
export function Edges(): JSX.Element {
  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <div style={{ ...GRID, gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))' }}>
          {OUTLINE_TOKENS.map((token) => (
            <Edge key={token} token={token} tokens={tokens} />
          ))}
        </div>
      )}
    </Themed>
  )
}

/**
 * Describes one token of the syntax sample.
 */
interface TokenProps {
  /**
   * Names the role's token.
   */
  role: CodeToken

  /**
   * Carries the text drawn in the role's colour.
   */
  text: string

  /**
   * Carries every token of the theme.
   */
  tokens: Readonly<Record<TokenName, string>>
}

/**
 * Draws one span of code in the colour its role takes.
 *
 * @param {TokenProps} props - The role and the text. `TokenProps` documents every member.
 * @returns {JSX.Element} The span.
 */
function Token({ role, text, tokens }: TokenProps): JSX.Element {
  return <span style={{ color: tokens[role] }}>{text}</span>
}

/**
 * Draws the syntax colours on `muted`, which is the only surface they are solved for.
 *
 * One line per role rather than a swatch: a syntax colour is read, not looked at, and the
 * question is whether it reads at code size on that surface.
 *
 * @returns {JSX.Element} A code block using every role the contract names.
 */
export function Syntax(): JSX.Element {
  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <pre
          data-roles={CODE_TOKENS.length}
          data-slot="syntax"
          style={{
            background: tokens.muted,
            border: HAIRLINE,
            borderRadius: CORNER,
            color: tokens.foreground,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            lineHeight: 1.7,
            margin: '1.5rem 0',
            padding: '1rem',
          }}
        >
          <Token
            role="code-comment"
            text="// refused at the border, retry tomorrow"
            tokens={tokens}
          />
          {'\n'}
          <Token role="code-keyword" text="const" tokens={tokens} />{' '}
          <Token role="code-function" text="retry" tokens={tokens} />
          {' = ('}
          <Token role="code-type" text="Shipment" tokens={tokens} />
          {') => '}
          <Token role="code-function" text="schedule" tokens={tokens} />
          {'('}
          <Token role="code-string" text="'tomorrow'" tokens={tokens} />
          {', '}
          <Token role="code-number" text="3" tokens={tokens} />
          {')\n'}
          <Token
            role="code-inserted"
            text="+ parcels.filter((parcel) => parcel.refused)"
            tokens={tokens}
          />
          {'\n'}
          <Token role="code-deleted" text="- parcels" tokens={tokens} />
        </pre>
      )}
    </Themed>
  )
}
