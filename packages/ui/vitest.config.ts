import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

/**
 * UI-package Vitest config.
 *
 * - `environment: 'jsdom'` so TSX render tests can mount real DOM trees via
 *   `@testing-library/react`. The base config uses 'node' (faster) but UI
 *   components need a document to render into.
 * - Includes `.test.tsx` files in addition to the base's `.test.ts` glob.
 * - Coverage threshold is 70% per CLAUDE.md §6 for the UI layer.
 *
 * ## `react-native` → `react-native-web` alias
 *
 * The `.native.tsx` platform variants (`modal.native.tsx`,
 * `share.native.ts`, etc.) import from `'react-native'`. The real RN
 * package ships its `index.js` with Flow syntax (`import typeof * as
 * ...`), which Rollup / Vite can't parse. The mobile build uses
 * Metro's RN preset to handle that — but Vitest runs on Vite, so we
 * alias `react-native` to `react-native-web` (which exports the same
 * surface in plain JS, including `KeyboardAvoidingView`, `Platform`,
 * `Share`, etc.). The aliased modules behave like web shims under
 * jsdom, which is what the `.native.tsx` test files expect — they
 * exercise structure / wiring, not platform-native APIs.
 */
export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: {
        'react-native': 'react-native-web',
      },
    },
    test: {
      environment: 'jsdom',
      include: [
        'tests/**/*.test.ts',
        'tests/**/*.test.tsx',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
      ],
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        // Broaden from the base's `src/**/*.ts` glob to pick up `.tsx`
        // components. Tamagui config is infrastructure, not a component —
        // its branches are covered implicitly when any component renders.
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          // Storybook story files are catalog surfaces, not runtime code —
          // covered instead by Playwright visual snapshots (see ADR-017).
          'src/**/*.stories.ts',
          'src/**/*.stories.tsx',
          'src/**/*.stories.mdx',
          'src/index.ts',
          'src/components/index.ts',
          'src/components/**/index.ts',
          'src/tamagui.config.ts',
          'src/**/*.d.ts',
        ],
        thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
      },
    },
  }),
);
