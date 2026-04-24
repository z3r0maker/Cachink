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
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
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
