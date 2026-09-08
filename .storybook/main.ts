// By package name, as every repository writes it. Storybook loads this file in Node, where
// the workspace's source condition is off, so the kit resolves to what `vp run -r build`
// packed. Loading the kit's source here instead reads half the workspace through Storybook's
// own loader, which corrupts the coverage of every file it touches.
import { storybookConfig } from '@stealthscale/tool-storybook/config'

export default storybookConfig({ sourceCondition: 'tooling-source' })
