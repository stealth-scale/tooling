import { type StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', 'storybook-addon-pseudo-states'],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
}

export default config
