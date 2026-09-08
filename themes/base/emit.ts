/**
 * @fileoverview Writes what this package ships. The palette is solved here, once, where the
 * theme is built: a consumer reads a stylesheet or a table and carries no solver, and a
 * recipe that cannot be drawn fails this build rather than a catalogue at boot or an app in
 * front of a person.
 */

import { writeTheme } from '@stealthscale/core-theme/write'

import { recipe } from './src/recipe.ts'

writeTheme(recipe, import.meta.url)
