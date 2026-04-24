/**
 * Storybook preview for `@cachink/ui`.
 *
 * Wraps every story in `<TamaguiProvider>` so Tamagui primitives resolve
 * tokens, and seeds the neobrutalist background palette (offwhite / yellow /
 * black) so designers can verify contrast on the three canonical surfaces.
 */
import type { Preview } from '@storybook/react-vite';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../src/tamagui.config';
import { colors } from '../src/theme';

// Tamagui's web runtime reads `process.env.TAMAGUI_TARGET` at module-eval
// time. Browsers don't have `process`, so shim a minimal stand-in — matches
// the same shim we install in apps/desktop/index.html.
if (typeof window !== 'undefined') {
  // @ts-expect-error — shim Node process.env for Tamagui in browsers
  window.process = window.process ?? {
    env: { TAMAGUI_TARGET: 'web', NODE_ENV: 'development' },
  };
}

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'offwhite',
      values: [
        { name: 'offwhite', value: colors.offwhite },
        { name: 'yellow', value: colors.yellow },
        { name: 'black', value: colors.black },
      ],
    },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <Story />
      </TamaguiProvider>
    ),
  ],
};

export default preview;
