/**
 * @fileoverview Draws the frame around a story in the theme the story is drawn in. The
 * manager is its own document and cannot read the preview's stylesheet, so it takes the
 * colours over the channel and re-reads them every time a toolbar moves. `api.setOptions`
 * rather than `addons.setConfig`, which is read once while the manager boots.
 */

import { addons } from 'storybook/manager-api'
import { type ThemeVars } from 'storybook/theming'

import { CHROME_EVENT } from './preview/chrome.ts'

addons.register('stealth/chrome', (api) => {
  addons.getChannel().on(CHROME_EVENT, (theme: ThemeVars | undefined) => {
    if (theme !== undefined) api.setOptions({ theme })
  })
})
