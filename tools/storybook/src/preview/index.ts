/**
 * @fileoverview The preview a repository's Storybook draws every story in, built from what
 * its own workspace registered. This is the one module that reaches for the virtual modules,
 * which exist only inside the bundler Storybook runs, and for the channel between a story and
 * the frame around it. Everything it calls is beside it and takes what it needs as an
 * argument, which is where the behaviour is specified.
 */

import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { addons } from 'storybook/preview-api'
import { offered } from 'virtual:stealth/offered'
import Provider from 'virtual:stealth/provider'
import { themes as registered } from 'virtual:stealth/themes'

import { appearanceFrom, solveThemes, writeThemes } from './appearance.ts'
import { follower } from './follow.ts'
import { storybookPreview } from './preview.tsx'
import { preview } from './store.ts'

/**
 * Holds every theme the workspace registered, solved once at boot.
 */
const themes = solveThemes(registered)

/**
 * Holds the channel the frame around a story listens on.
 */
const channel = addons.getChannel()

/**
 * Follows the toolbars: onto the document, into the store, and across to the frame.
 */
const follow = follower({
  frame: channel,
  offered,
  root: document.documentElement,
  store: preview,
  themes,
})

channel.on(GLOBALS_UPDATED, follow)
channel.on(SET_GLOBALS, follow)

writeThemes(themes, document)
preview.set({ appearance: appearanceFrom({}, offered), themes })

export default storybookPreview({ offered, provider: Provider, themes })
