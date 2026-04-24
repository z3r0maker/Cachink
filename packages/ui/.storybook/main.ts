/**
 * Storybook 10 config for `@cachink/ui`.
 *
 * Uses the `@storybook/react-native-web-vite` framework preset so Tamagui
 * primitives render via react-native-web in a Vite-powered preview server.
 * The same stories render in apps/desktop (Vite) and apps/mobile
 * (Metro + react-native-web) without any extra wiring. See ADR-017.
 */
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {},
    },
  },
  typescript: { check: false, reactDocgen: false },
  docs: { autodocs: 'tag' },
};

export default config;
