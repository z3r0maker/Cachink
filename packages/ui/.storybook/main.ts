/**
 * Storybook 10 config for `@cachink/ui`.
 *
 * Uses the `@storybook/react-native-web-vite` framework preset so Tamagui
 * primitives render via react-native-web in a Vite-powered preview server.
 * The same stories render in apps/desktop (Vite) and apps/mobile
 * (Metro + react-native-web) without any extra wiring. See ADR-017.
 *
 * ## Why `viteFinal` exists (audit 2026-09)
 *
 * The framework preset alone is not enough to render this package. Both other
 * Vite consumers of `packages/ui` — `apps/desktop/vite.config.ts` and
 * `vitest.config.ts` — carry resolve, define and optimizeDeps settings that
 * Tamagui and the `.native.*` platform variants require. Storybook had none
 * of them, and the result was silent: `build-storybook` exited 0 while every
 * one of the 46 story families threw at runtime, and `storybook dev` crashed
 * outright in dependency optimization.
 *
 * The settings below mirror the desktop app deliberately. When that config
 * changes, this one usually needs the same change.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const here = dirname(fileURLToPath(import.meta.url));
/** See `./expo-stub.ts` — Expo native modules have no place in a web preview. */
const EXPO_STUB = resolve(here, 'expo-stub.ts');

/** Tamagui reads these at module-eval time; browsers have no `process`. */
const TAMAGUI_ENV: Readonly<Record<string, string>> = {
  'process.env.NODE_ENV': JSON.stringify('development'),
  'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
  'process.env.TEST_NATIVE_PLATFORM': 'undefined',
  'process.env.DEBUG': 'undefined',
  'process.env.IS_STATIC': 'undefined',
  'process.env.TAMAGUI_DISABLE_WARN_DYNAMIC_THEME': 'undefined',
  'process.env.TAMAGUI_ANIMATED_PRESENCE_SHORT_CIRCUIT': 'undefined',
};

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

  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      /*
       * Without this, the workspace root's `@tamagui/core` and the copy
       * resolved through `packages/ui`'s peer dependency both load. Two copies
       * means two React contexts: `TamaguiProvider` publishes to one and the
       * primitives read the other, so every component renders as an invalid
       * element type (React error #130) — which is exactly what every story
       * did. Matches `apps/desktop/vite.config.ts`.
       */
      dedupe: ['react', 'react-dom', '@tamagui/core', '@tamagui/web'],
      alias: {
        ...viteConfig.resolve?.alias,
        // `.native.tsx` variants import from 'react-native', whose index.js
        // ships Flow syntax that Vite cannot parse.
        'react-native': 'react-native-web',
        // Expo native modules are unreachable from a web story, but Vite still
        // walks into them and chokes on their type-only re-exports.
        'expo-modules-core': EXPO_STUB,
        'expo-camera': EXPO_STUB,
        'expo-sqlite': EXPO_STUB,
        'expo-notifications': EXPO_STUB,
        'expo-file-system': EXPO_STUB,
        'expo-haptics': EXPO_STUB,
      },
    },
    define: { ...viteConfig.define, ...TAMAGUI_ENV },
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [
        ...(viteConfig.optimizeDeps?.include ?? []),
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-native-web',
        '@tamagui/core',
        '@tamagui/web',
        // `echarts-for-react` is CommonJS. Without pre-bundling, its default
        // export arrives as a module namespace object rather than a component,
        // and every chart story dies with "Element type is invalid ... got:
        // object". Pre-bundling applies the CJS→ESM interop that fixes it.
        'echarts',
        'echarts-for-react',
        'echarts-for-react/esm/core',
      ],
      /*
       * The dep scanner statically reads every `.tsx` under the package,
       * including `.native.*` variants that never run on web. Those reach
       * `expo-modules-core`, whose `ts-declarations/*` modules export types
       * only — Rolldown reports them as MISSING_EXPORT and aborts the whole
       * optimize pass, taking `storybook dev` down with it. None of these are
       * reachable from a web story. See ADR-029 for the desktop equivalent.
       */
      exclude: [
        ...(viteConfig.optimizeDeps?.exclude ?? []),
        'react-native',
        'expo-modules-core',
        'expo-camera',
        'expo-sqlite',
        'expo-notifications',
        'expo-file-system',
        '@cachink/sync-lan',
        '@cachink/sync-cloud',
        '@powersync/web',
        '@powersync/common',
      ],
      esbuildOptions: {
        ...viteConfig.optimizeDeps?.esbuildOptions,
        define: {
          ...viteConfig.optimizeDeps?.esbuildOptions?.define,
          ...TAMAGUI_ENV,
        },
      },
    },
  }),
};

export default config;
