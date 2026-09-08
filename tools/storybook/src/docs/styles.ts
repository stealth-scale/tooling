/**
 * @fileoverview Holds the few styles every page block shares. A block is drawn with inline
 * styles that read the theme's own variables, because a page sits in whatever design system
 * the workspace registered and cannot count on any utility class being there.
 */

import { type CSSProperties } from 'react'

/**
 * Sets the monospace caption a block writes a token's name or value in.
 */
export const MONO: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }

/**
 * Sets the caption under a specimen: monospace, small, in the muted ink.
 */
export const CAPTION: CSSProperties = { ...MONO, color: 'var(--muted-foreground)' }

/**
 * Sets the grid a family of specimens is laid out in.
 */
export const GRID: CSSProperties = { display: 'grid', gap: '1rem', margin: '1.5rem 0' }

/**
 * Sets the hairline a specimen sits on, drawn in the theme's border.
 */
export const HAIRLINE = '1px solid var(--border)'

/**
 * Sets the corner a specimen takes, which is the theme's own.
 */
export const CORNER = 'var(--radius)'

/**
 * Sets the badge a block prints a measurement in.
 *
 * The badge restates the page's own surface and ink rather than inheriting the specimen's, so
 * the words keep their contrast on whatever colour they are printed over. Every theme holds
 * `foreground` and `destructive-ink` to AAA against `background`, and the badge puts that
 * background back under them.
 */
export const BADGE: CSSProperties = {
  background: 'var(--background)',
  border: HAIRLINE,
  borderRadius: CORNER,
  color: 'var(--foreground)',
  display: 'inline-block',
  padding: '0.125rem 0.375rem',
}
