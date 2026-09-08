/**
 * @fileoverview Draws Storybook's own chrome in the theme the story is drawn in, so the frame
 * around a component is not a different product from the component. The manager is a separate
 * document from the preview and cannot read its stylesheet, so the values are read here and
 * sent across as plain colours.
 */

import { create, type ThemeVars } from 'storybook/theming'

import { type Appearance } from '@stealthscale/core-appearance'
import {
  hex,
  parseColor,
  type ThemeMode,
  type ThemeValues,
  type TokenName,
} from '@stealthscale/core-theme'

import { type Themes } from './appearance.ts'

/**
 * Names what the manager is told: the theme it should draw itself in.
 */
export const CHROME_EVENT = 'stealth/chrome'

/**
 * Sets how much smaller an input's corner is than the theme's own radius, in pixels.
 */
const INPUT_RADIUS_INSET = 2

/**
 * Sets how many pixels one rem is, for a radius written in rem.
 */
const ROOT_FONT_SIZE = 16

/**
 * Reads a radius as a theme writes it: a number, then `px` or `rem`.
 */
const RADIUS = /^(?<length>\d*\.?\d+)(?<unit>px|rem)$/u

/**
 * Reads a theme's token as a hex colour the manager's colour library can parse.
 *
 * Every colour is a hex triplet, because Storybook runs each through a colour library that
 * predates `oklch()`.
 *
 * @param {Readonly<Record<TokenName, string>>} values - One mode of a theme's tokens.
 * @param {TokenName} token - The token to read.
 * @returns {string} The colour as `#rrggbb`, or black where the token is no colour at all.
 */
function colour(values: Readonly<Record<TokenName, string>>, token: TokenName): string {
  const read = parseColor(values[token])
  return read === undefined ? '#000000' : hex(read)
}

/**
 * Reads the theme's corner radius in the pixels Storybook wants.
 *
 * @param {Readonly<Record<TokenName, string>>} values - One mode of a theme's tokens.
 * @returns {number} The radius in pixels, and 0 where the theme writes it in anything but
 *     `px` or `rem`: a word, a `calc()`, another unit.
 */
function radius(values: Readonly<Record<TokenName, string>>): number {
  const read = RADIUS.exec(values['radius'])
  if (read?.groups === undefined) return 0

  const pixels = read.groups['unit'] === 'rem' ? ROOT_FONT_SIZE : 1
  return Math.round(Number(read.groups['length']) * pixels)
}

/**
 * Builds the chrome Storybook draws its frame with, from the theme the story is drawn in.
 *
 * @param {ThemeValues} values - Every token of the theme, in both modes.
 * @param {ThemeMode} mode - The mode the story is drawn in.
 * @param {string} title - The name shown in the sidebar's corner.
 * @returns {ThemeVars} The theme, complete, for `api.setOptions` and the docs container.
 */
export function chromeFrom(values: ThemeValues, mode: ThemeMode, title: string): ThemeVars {
  const tokens = values[mode]
  const corner = radius(tokens)

  return create({
    appBg: colour(tokens, 'background'),
    appBorderColor: colour(tokens, 'border'),
    appBorderRadius: corner,
    appContentBg: colour(tokens, 'background'),
    appPreviewBg: colour(tokens, 'background'),
    barBg: colour(tokens, 'card'),
    barHoverColor: colour(tokens, 'primary'),
    barSelectedColor: colour(tokens, 'primary'),
    barTextColor: colour(tokens, 'muted-foreground'),
    base: mode,
    booleanBg: colour(tokens, 'muted'),
    booleanSelectedBg: colour(tokens, 'card'),
    brandTitle: title,
    brandUrl: '/',
    buttonBg: colour(tokens, 'muted'),
    buttonBorder: colour(tokens, 'border'),
    colorPrimary: colour(tokens, 'primary'),
    colorSecondary: colour(tokens, 'primary'),
    fontBase: tokens['font-sans'],
    fontCode: tokens['font-mono'],
    inputBg: colour(tokens, 'background'),
    inputBorder: colour(tokens, 'input'),
    inputBorderRadius: Math.max(corner - INPUT_RADIUS_INSET, 0),
    inputTextColor: colour(tokens, 'foreground'),
    textColor: colour(tokens, 'foreground'),
    textInverseColor: colour(tokens, 'background'),
    textMutedColor: colour(tokens, 'muted-foreground'),
  })
}

/**
 * Reads the chrome the frame should draw itself in, for the appearance a story is in.
 *
 * @param {Appearance} appearance - The appearance the toolbars settled on.
 * @param {Themes} themes - The themes the workspace registered.
 * @returns {ThemeVars | undefined} The theme, or nothing where the theme on is one the
 *     workspace does not have, which leaves the frame as it was.
 */
export function chromeFor(appearance: Appearance, themes: Themes): ThemeVars | undefined {
  const theme = themes[appearance.theme]
  if (theme === undefined) return undefined
  return chromeFrom(theme.values, appearance.mode, theme.title)
}
