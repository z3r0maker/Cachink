import { defineConfig } from 'vitest/config';

/**
 * Base Vitest config consumed by all pure-TS packages.
 *
 * Coverage thresholds are enforced per CLAUDE.md §6. Individual packages may
 * override these (e.g. domain requires ≥ 95% while ui only requires ≥ 70%) by
 * spreading this config and tightening the numbers in their local
 * vitest.config.ts.
 *
 * NODE_ENV: forced to `development` so React 19 resolves its dev bundle
 * and exposes `React.act` (used by @testing-library/react 16+). Without
 * this, the production-mode React CJS bundle loads and every render call
 * crashes with `React.act is not a function`. We set it on both the host
 * process (so bundlers observe it during config evaluation) and on the
 * Vitest `test.env` (so the value reaches every worker thread).
 */
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'test') {
  process.env.NODE_ENV = 'development';
}

export default defineConfig({
  resolve: {
    alias: {
      // React Native ships its index.js with Flow syntax (`import typeof`),
      // which Rollup/Vite can't parse. Any package that transitively depends
      // on @cachink/ui (which imports from 'react-native' in .native.tsx
      // variants) needs this alias so Vitest resolves the web shim instead.
      'react-native': 'react-native-web',
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
    env: { NODE_ENV: 'development' },
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      // Only exclude the TOP-LEVEL package barrel (src/index.ts). Nested
      // barrel-style files like src/money/index.ts ARE the implementation
      // in this repo — excluding all index.ts would nullify coverage.
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
